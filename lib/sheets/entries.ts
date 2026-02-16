import { env } from '@/lib/env';
import { ensureSheetHeaders, getSheetsClient } from '@/lib/sheets/client';
import { FINANCIAL_HEADERS, mapEntryToRow, mapRowToEntry } from '@/lib/sheets/mapper';
import type { Entry } from '@/types/entry';

const tabName = env.GOOGLE_SHEETS_FINANCIAL_TAB;

async function readRows() {
  await ensureSheetHeaders(tabName, FINANCIAL_HEADERS);
  const sheets = getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID,
    range: `${tabName}!A2:H`,
  });

  return response.data.values ?? [];
}

export async function listEntries(): Promise<Entry[]> {
  const rows = await readRows();
  const entries: Entry[] = [];

  for (const row of rows) {
    if ((row[0] ?? '').trim().length === 0) {
      continue;
    }

    try {
      entries.push(mapRowToEntry(row));
    } catch (error) {
      console.error('Skipping invalid financial row', {
        id: row[0] ?? '',
        concept: row[1] ?? '',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return entries;
}

export async function createEntry(entry: Entry) {
  await ensureSheetHeaders(tabName, FINANCIAL_HEADERS);
  const sheets = getSheetsClient();

  await sheets.spreadsheets.values.append({
    spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID,
    range: `${tabName}!A:H`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [mapEntryToRow(entry)],
    },
  });

  return entry;
}

export async function updateEntry(id: string, next: Entry) {
  const entries = await listEntries();
  const index = entries.findIndex((entry) => entry.id === id);

  if (index < 0) {
    return null;
  }

  entries[index] = next;

  const sheets = getSheetsClient();

  await sheets.spreadsheets.values.update({
    spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID,
    range: `${tabName}!A2:H`,
    valueInputOption: 'RAW',
    requestBody: {
      values: entries.map((entry) => mapEntryToRow(entry)),
    },
  });

  return next;
}

export async function deleteEntry(id: string) {
  const entries = await listEntries();
  const nextEntries = entries.filter((entry) => entry.id !== id);

  if (entries.length === nextEntries.length) {
    return false;
  }

  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.clear({
    spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID,
    range: `${tabName}!A2:H`,
  });

  if (nextEntries.length > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID,
      range: `${tabName}!A2:H`,
      valueInputOption: 'RAW',
      requestBody: {
        values: nextEntries.map((entry) => mapEntryToRow(entry)),
      },
    });
  }

  return true;
}
