import { z } from 'zod';

const envSchema = z.object({
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(12),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  ALLOWED_EMAILS: z.string().min(1),
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().email(),
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: z.string().min(1),
  GOOGLE_SHEETS_SPREADSHEET_ID: z.string().min(1),
  GOOGLE_SHEETS_FINANCIAL_TAB: z.string().default('financial_data'),
  GOOGLE_SHEETS_SETTINGS_TAB: z.string().default('settings'),
  DEFAULT_CURRENCY: z.enum(['USD', 'ARS']).default('USD'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables. Check .env configuration.');
}

export const env = {
  ...parsed.data,
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: normalizePrivateKey(parsed.data.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY),
};

export const allowedEmails = new Set(
  env.ALLOWED_EMAILS.split(',').map((email) => email.trim().toLowerCase()).filter(Boolean),
);

function normalizePrivateKey(rawKey: string) {
  let key = rawKey.trim();

  // Common case in Vercel: value pasted with surrounding quotes.
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }

  return key
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .trim();
}
