import { NextResponse } from 'next/server';

import { assertApiAllowedUser } from '@/lib/auth';
import { listEntries } from '@/lib/sheets/entries';
import {
  createRelationshipsForEntry,
  listRelationshipLabels,
  listRelationships,
} from '@/lib/sheets/relationships';
import { createRelationshipsInputSchema } from '@/types/relationship';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await assertApiAllowedUser();
  if (!auth.ok) {
    return NextResponse.json({ data: null, error: { code: auth.code, message: 'Access denied.' } }, { status: auth.status });
  }

  const { id } = await context.params;
  const [entries, labels, relationships] = await Promise.all([
    listEntries(),
    listRelationshipLabels(),
    listRelationships(),
  ]);
  const entry = entries.find((candidate) => candidate.id === id);

  if (!entry) {
    return NextResponse.json(
      { data: null, error: { code: 'NOT_FOUND', message: 'Entry not found.' } },
      { status: 404 },
    );
  }

  return NextResponse.json({
    data: {
      entry,
      entries,
      labels,
      relationships,
    },
    error: null,
  });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await assertApiAllowedUser();
  if (!auth.ok) {
    return NextResponse.json({ data: null, error: { code: auth.code, message: 'Access denied.' } }, { status: auth.status });
  }

  const { id } = await context.params;

  try {
    const payload = await request.json();
    const parsed = createRelationshipsInputSchema.parse(payload);
    const [entries, labels] = await Promise.all([listEntries(), listRelationshipLabels()]);
    const currentEntry = entries.find((entry) => entry.id === id);

    if (!currentEntry) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Entry not found.' } },
        { status: 404 },
      );
    }

    const entryIds = new Set(entries.map((entry) => entry.id));
    const labelIds = new Set(labels.map((label) => label.id));

    for (const target of parsed.targets) {
      if (target.target_type === 'entry' && !entryIds.has(target.target_id)) {
        return NextResponse.json(
          { data: null, error: { code: 'VALIDATION_ERROR', message: 'Related entry not found.' } },
          { status: 400 },
        );
      }

      if (target.target_type === 'label' && !labelIds.has(target.target_id)) {
        return NextResponse.json(
          { data: null, error: { code: 'VALIDATION_ERROR', message: 'Relationship label not found.' } },
          { status: 400 },
        );
      }
    }

    const created = await createRelationshipsForEntry(id, parsed.targets);

    return NextResponse.json({ data: created, error: null }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid relationship payload.',
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 400 },
    );
  }
}
