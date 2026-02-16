import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

import { assertApiAllowedUser } from '@/lib/auth';
import { monthlyEquivalentForMonth } from '@/lib/finance/calculations';
import { createEntry, listEntries } from '@/lib/sheets/entries';
import { entryInputSchema, entrySchema } from '@/types/entry';

function normalizeForFrequency<T extends { frequency: string; end_date?: string | null }>(entry: T) {
  if (entry.frequency === 'one_time') {
    return { ...entry, end_date: null };
  }

  return entry;
}

export async function GET() {
  const auth = await assertApiAllowedUser();
  if (!auth.ok) {
    return NextResponse.json({ data: null, error: { code: auth.code, message: 'Access denied.' } }, { status: auth.status });
  }

  const entries = await listEntries();
  const currentMonth = new Date();

  return NextResponse.json({
    data: entries.map((entry) => ({
      ...entry,
      monthly_equivalent: monthlyEquivalentForMonth(entry, currentMonth),
    })),
    error: null,
  });
}

export async function POST(request: Request) {
  const auth = await assertApiAllowedUser();
  if (!auth.ok) {
    return NextResponse.json({ data: null, error: { code: auth.code, message: 'Access denied.' } }, { status: auth.status });
  }

  try {
    const payload = await request.json();
    const parsed = entryInputSchema.parse(payload);
    const normalized = normalizeForFrequency(parsed);

    const entry = entrySchema.parse({
      id: uuidv4(),
      ...normalized,
    });

    await createEntry(entry);

    return NextResponse.json({ data: entry, error: null }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid entry payload.',
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 400 },
    );
  }
}
