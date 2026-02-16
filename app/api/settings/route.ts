import { NextResponse } from 'next/server';

import { assertApiAllowedUser } from '@/lib/auth';
import { getSettings, upsertSettings } from '@/lib/sheets/settings';
import { settingsInputSchema } from '@/types/settings';

export async function GET() {
  const auth = await assertApiAllowedUser();
  if (!auth.ok) {
    return NextResponse.json({ data: null, error: { code: auth.code, message: 'Access denied.' } }, { status: auth.status });
  }

  const settings = await getSettings();
  return NextResponse.json({ data: settings, error: null });
}

export async function PATCH(request: Request) {
  const auth = await assertApiAllowedUser();
  if (!auth.ok) {
    return NextResponse.json({ data: null, error: { code: auth.code, message: 'Access denied.' } }, { status: auth.status });
  }

  try {
    const payload = await request.json();
    const parsed = settingsInputSchema.parse(payload);
    const settings = await upsertSettings(parsed);

    return NextResponse.json({ data: settings, error: null });
  } catch (error) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid settings payload.',
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 400 },
    );
  }
}
