import { env } from '@/lib/env';
import { ensureSheetHeaders, getSheetsClient } from '@/lib/sheets/client';
import { settingsSchema, type AppSettings, type SettingsInput } from '@/types/settings';

const SETTINGS_HEADERS = ['key', 'value'];
const tabName = env.GOOGLE_SHEETS_SETTINGS_TAB;

export async function getSettings(): Promise<AppSettings> {
  await ensureSheetHeaders(tabName, SETTINGS_HEADERS);
  const sheets = getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID,
    range: `${tabName}!A2:B`,
  });

  const rows = response.data.values ?? [];

  const settingsMap = new Map<string, string>();
  for (const [key = '', value = ''] of rows) {
    if (key) settingsMap.set(key, value);
  }

  const currency = settingsMap.get('currency') ?? env.DEFAULT_CURRENCY;
  const cashRaw = settingsMap.get('cashOnHand');
  const cashValue = cashRaw ? Number(cashRaw) : null;

  return settingsSchema.parse({
    currency,
    cashOnHand: Number.isFinite(cashValue) ? cashValue : null,
  });
}

export async function upsertSettings(input: SettingsInput): Promise<AppSettings> {
  const current = await getSettings();
  const next = settingsSchema.parse({
    ...current,
    ...input,
  });

  const rows = [
    ['currency', next.currency],
    ['cashOnHand', next.cashOnHand === null ? '' : String(next.cashOnHand)],
  ];

  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID,
    range: `${tabName}!A2:B`,
    valueInputOption: 'RAW',
    requestBody: {
      values: rows,
    },
  });

  return next;
}
