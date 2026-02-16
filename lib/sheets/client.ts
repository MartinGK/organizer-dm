import { google, sheets_v4 } from 'googleapis';

import { env } from '@/lib/env';

let sheetsClient: sheets_v4.Sheets | null = null;

export function getSheetsClient() {
  if (sheetsClient) {
    return sheetsClient;
  }

  const auth = new google.auth.JWT({
    email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

async function ensureSheetExists(tabName: string) {
  const sheets = getSheetsClient();
  const spreadsheetId = env.GOOGLE_SHEETS_SPREADSHEET_ID;

  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties',
  });

  const hasSheet = (spreadsheet.data.sheets ?? []).some(
    (sheet) => sheet.properties?.title === tabName,
  );

  if (hasSheet) {
    return;
  }

  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: tabName,
              },
            },
          },
        ],
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (!message.toLowerCase().includes('already exists')) {
      throw error;
    }
  }
}

export async function ensureSheetHeaders(tabName: string, headers: string[]) {
  await ensureSheetExists(tabName);

  const sheets = getSheetsClient();
  const spreadsheetId = env.GOOGLE_SHEETS_SPREADSHEET_ID;

  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tabName}!1:1`,
  });

  const currentHeaders = existing.data.values?.[0] ?? [];

  const needsHeaderInit = headers.some((header, idx) => currentHeaders[idx] !== header);

  if (!needsHeaderInit) return;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${tabName}!1:1`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [headers],
    },
  });
}
