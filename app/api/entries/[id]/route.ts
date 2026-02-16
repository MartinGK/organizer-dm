import { NextResponse } from 'next/server';

import { assertApiAllowedUser } from '@/lib/auth';
import { deleteEntry, listEntries, updateEntry } from '@/lib/sheets/entries';
import { entrySchema, entryUpdateSchema } from '@/types/entry';

function normalizeForFrequency<T extends { frequency: string; end_date?: string | null }>(entry: T) {
  if (entry.frequency === 'one_time') {
    return { ...entry, end_date: null };
  }

  return entry;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await assertApiAllowedUser();
  if (!auth.ok) {
    return NextResponse.json({ data: null, error: { code: auth.code, message: 'Access denied.' } }, { status: auth.status });
  }

  const { id } = await context.params;

  try {
    const payload = await request.json();
    const patch = entryUpdateSchema.parse(payload);
    const entries = await listEntries();
    const existing = entries.find((entry) => entry.id === id);

    if (!existing) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Entry not found.' } },
        { status: 404 },
      );
    }

    const merged = entrySchema.parse(normalizeForFrequency({
      ...existing,
      ...patch,
      id,
    }));

    const updated = await updateEntry(id, merged);

    return NextResponse.json({ data: updated, error: null });
  } catch (error) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid entry update payload.',
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await assertApiAllowedUser();
  if (!auth.ok) {
    return NextResponse.json({ data: null, error: { code: auth.code, message: 'Access denied.' } }, { status: auth.status });
  }

  const { id } = await context.params;
  const removed = await deleteEntry(id);

  if (!removed) {
    return NextResponse.json(
      { data: null, error: { code: 'NOT_FOUND', message: 'Entry not found.' } },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: { id }, error: null });
}
