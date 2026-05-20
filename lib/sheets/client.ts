import { google, sheets_v4 } from 'googleapis';

import { env } from '@/lib/env';

let sheetsClient: sheets_v4.Sheets | null = null;
let sheetTitlesCache: Set<string> | null = null;
let sheetTitlesPromise: Promise<Set<string>> | null = null;
const ensuredHeaderKeys = new Set<string>();
const headerEnsurePromises = new Map<string, Promise<void>>();

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

async function getSheetTitles() {
  const sheets = getSheetsClient();
  const spreadsheetId = env.GOOGLE_SHEETS_SPREADSHEET_ID;

  if (sheetTitlesCache) {
    return sheetTitlesCache;
  }

  if (sheetTitlesPromise) {
    return sheetTitlesPromise;
  }

  sheetTitlesPromise = sheets.spreadsheets
    .get({
      spreadsheetId,
      fields: 'sheets.properties.title',
    })
    .then((spreadsheet) => {
      const titles = new Set(
        (spreadsheet.data.sheets ?? [])
          .map((sheet) => sheet.properties?.title)
          .filter((title): title is string => !!title),
      );
      sheetTitlesCache = titles;
      return titles;
    })
    .finally(() => {
      sheetTitlesPromise = null;
    });

  return sheetTitlesPromise;
}

async function ensureSheetExists(tabName: string) {
  const sheets = getSheetsClient();
  const spreadsheetId = env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const sheetTitles = await getSheetTitles();

  if (sheetTitles.has(tabName)) {
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
    sheetTitles.add(tabName);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (!message.toLowerCase().includes('already exists')) {
      throw error;
    }

    sheetTitles.add(tabName);
  }
}

export async function ensureSheetHeaders(tabName: string, headers: string[]) {
  const headerKey = `${tabName}:${headers.join('|')}`;

  if (ensuredHeaderKeys.has(headerKey)) {
    return;
  }

  const existingPromise = headerEnsurePromises.get(headerKey);
  if (existingPromise) {
    await existingPromise;
    return;
  }

  const promise = ensureSheetHeadersUncached(tabName, headers)
    .then(() => {
      ensuredHeaderKeys.add(headerKey);
    })
    .finally(() => {
      headerEnsurePromises.delete(headerKey);
    });

  headerEnsurePromises.set(headerKey, promise);
  await promise;
}

async function ensureSheetHeadersUncached(tabName: string, headers: string[]) {
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
