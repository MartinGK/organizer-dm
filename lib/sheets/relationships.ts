import { v4 as uuidv4 } from 'uuid';

import { env } from '@/lib/env';
import { ensureSheetHeaders, getSheetsClient } from '@/lib/sheets/client';
import {
  entryRelationshipSchema,
  relationshipLabelSchema,
  type EntryRelationship,
  type RelationshipLabel,
  type RelationshipTargetInput,
} from '@/types/relationship';

const RELATIONSHIPS_TAB = 'entry_relations';
const LABELS_TAB = 'entry_relation_labels';

const RELATIONSHIP_HEADERS = ['id', 'entry_id', 'target_type', 'target_id', 'created_at'];
const LABEL_HEADERS = ['id', 'name', 'created_at', 'updated_at'];

async function readRelationshipRows() {
  await ensureSheetHeaders(RELATIONSHIPS_TAB, RELATIONSHIP_HEADERS);
  const sheets = getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID,
    range: `${RELATIONSHIPS_TAB}!A2:E`,
  });

  return response.data.values ?? [];
}

async function readLabelRows() {
  await ensureSheetHeaders(LABELS_TAB, LABEL_HEADERS);
  const sheets = getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID,
    range: `${LABELS_TAB}!A2:D`,
  });

  return response.data.values ?? [];
}

export async function listRelationshipLabels(): Promise<RelationshipLabel[]> {
  const rows = await readLabelRows();
  const labels: RelationshipLabel[] = [];

  for (const row of rows) {
    if ((row[0] ?? '').trim().length === 0) continue;

    try {
      labels.push(mapRowToLabel(row));
    } catch (error) {
      console.error('Skipping invalid relationship label row', {
        id: row[0] ?? '',
        name: row[1] ?? '',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return labels;
}

export async function listRelationships(): Promise<EntryRelationship[]> {
  const rows = await readRelationshipRows();
  const relationships: EntryRelationship[] = [];

  for (const row of rows) {
    if ((row[0] ?? '').trim().length === 0) continue;

    try {
      relationships.push(mapRowToRelationship(row));
    } catch (error) {
      console.error('Skipping invalid entry relationship row', {
        id: row[0] ?? '',
        entry_id: row[1] ?? '',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return relationships;
}

export async function createOrReuseRelationshipLabel(name: string) {
  const labels = await listRelationshipLabels();
  const normalizedName = name.trim();
  const existing = labels.find((label) => label.name.toLowerCase() === normalizedName.toLowerCase());

  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();
  const label = relationshipLabelSchema.parse({
    id: uuidv4(),
    name: normalizedName,
    created_at: now,
    updated_at: now,
  });

  await ensureSheetHeaders(LABELS_TAB, LABEL_HEADERS);
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID,
    range: `${LABELS_TAB}!A:D`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [mapLabelToRow(label)],
    },
  });

  return label;
}

export async function createRelationshipsForEntry(entryId: string, targets: RelationshipTargetInput[]) {
  const relationships = await listRelationships();
  const created: EntryRelationship[] = [];
  const nextRows = [...relationships];
  const now = new Date().toISOString();

  for (const target of targets) {
    const resolvedTarget =
      target.target_type === 'new_label'
        ? { target_type: 'label' as const, target_id: (await createOrReuseRelationshipLabel(target.name)).id }
        : target;

    if (resolvedTarget.target_type === 'entry') {
      if (resolvedTarget.target_id === entryId) continue;

      const [left, right] = canonicalEntryPair(entryId, resolvedTarget.target_id);
      const existing = nextRows.find(
        (relationship) =>
          relationship.target_type === 'entry' &&
          relationship.entry_id === left &&
          relationship.target_id === right,
      );

      if (existing) continue;

      const relationship = entryRelationshipSchema.parse({
        id: uuidv4(),
        entry_id: left,
        target_type: 'entry',
        target_id: right,
        created_at: now,
      });

      nextRows.push(relationship);
      created.push(relationship);
      continue;
    }

    const existing = nextRows.find(
      (relationship) =>
        relationship.target_type === 'label' &&
        relationship.entry_id === entryId &&
        relationship.target_id === resolvedTarget.target_id,
    );

    if (existing) continue;

    const relationship = entryRelationshipSchema.parse({
      id: uuidv4(),
      entry_id: entryId,
      target_type: 'label',
      target_id: resolvedTarget.target_id,
      created_at: now,
    });

    nextRows.push(relationship);
    created.push(relationship);
  }

  if (created.length > 0) {
    await writeRelationships(nextRows);
  }

  return created;
}

export async function deleteRelationship(id: string) {
  const relationships = await listRelationships();
  const nextRows = relationships.filter((relationship) => relationship.id !== id);

  if (nextRows.length === relationships.length) {
    return false;
  }

  await writeRelationships(nextRows);
  return true;
}

export async function deleteRelationshipsForEntry(entryId: string) {
  const relationships = await listRelationships();
  const nextRows = relationships.filter((relationship) => {
    if (relationship.entry_id === entryId) return false;
    if (relationship.target_type === 'entry' && relationship.target_id === entryId) return false;
    return true;
  });

  if (nextRows.length === relationships.length) {
    return;
  }

  await writeRelationships(nextRows);
}

export async function labelEntryRelationship(relationshipId: string, labelName: string) {
  const relationships = await listRelationships();
  const relationship = relationships.find((candidate) => candidate.id === relationshipId);

  if (!relationship || relationship.target_type !== 'entry') {
    return null;
  }

  const label = await createOrReuseRelationshipLabel(labelName);
  const nextRows = relationships.filter((candidate) => candidate.id !== relationshipId);
  await writeRelationships(nextRows);

  await createRelationshipsForEntry(relationship.entry_id, [{ target_type: 'label', target_id: label.id }]);
  await createRelationshipsForEntry(relationship.target_id, [{ target_type: 'label', target_id: label.id }]);

  return label;
}

function mapRowToRelationship(row: string[]) {
  return entryRelationshipSchema.parse({
    id: (row[0] ?? '').trim(),
    entry_id: (row[1] ?? '').trim(),
    target_type: (row[2] ?? '').trim(),
    target_id: (row[3] ?? '').trim(),
    created_at: (row[4] ?? '').trim(),
  });
}

function mapRelationshipToRow(relationship: EntryRelationship): string[] {
  return [
    relationship.id,
    relationship.entry_id,
    relationship.target_type,
    relationship.target_id,
    relationship.created_at,
  ];
}

function mapRowToLabel(row: string[]) {
  return relationshipLabelSchema.parse({
    id: (row[0] ?? '').trim(),
    name: (row[1] ?? '').trim(),
    created_at: (row[2] ?? '').trim(),
    updated_at: (row[3] ?? '').trim(),
  });
}

function mapLabelToRow(label: RelationshipLabel): string[] {
  return [label.id, label.name, label.created_at, label.updated_at];
}

async function writeRelationships(relationships: EntryRelationship[]) {
  await ensureSheetHeaders(RELATIONSHIPS_TAB, RELATIONSHIP_HEADERS);
  const sheets = getSheetsClient();

  await sheets.spreadsheets.values.clear({
    spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID,
    range: `${RELATIONSHIPS_TAB}!A2:E`,
  });

  if (relationships.length === 0) {
    return;
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID,
    range: `${RELATIONSHIPS_TAB}!A2:E`,
    valueInputOption: 'RAW',
    requestBody: {
      values: relationships.map((relationship) => mapRelationshipToRow(relationship)),
    },
  });
}

function canonicalEntryPair(left: string, right: string) {
  return [left, right].sort((a, b) => a.localeCompare(b));
}
