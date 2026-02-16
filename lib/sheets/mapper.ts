import { z } from 'zod';

import { entrySchema, type Entry } from '@/types/entry';

const sheetRowSchema = z.object({
  id: z.string(),
  concept: z.string(),
  type: z.string(),
  frequency: z.string(),
  amount: z.string(),
  start_date: z.string(),
  end_date: z.string().optional(),
  notes: z.string().optional(),
});

export const FINANCIAL_HEADERS = ['id', 'concept', 'type', 'frequency', 'amount', 'start_date', 'end_date', 'notes'];

export function mapRowToEntry(row: string[]): Entry {
  const hasEndDateColumn = row.length >= 8;

  const parsedRow = sheetRowSchema.parse({
    id: (row[0] ?? '').trim(),
    concept: (row[1] ?? '').trim(),
    type: (row[2] ?? '').trim().toLowerCase(),
    frequency: normalizeFrequency((row[3] ?? '').trim().toLowerCase()),
    amount: (row[4] ?? '0').trim(),
    start_date: (row[5] ?? '').trim(),
    end_date: hasEndDateColumn ? (row[6] ?? '').trim() : '',
    notes: hasEndDateColumn ? (row[7] ?? '').trim() : (row[6] ?? '').trim(),
  });

  return entrySchema.parse({
    id: parsedRow.id,
    concept: parsedRow.concept,
    type: parsedRow.type,
    frequency: parsedRow.frequency,
    amount: Number(parsedRow.amount),
    start_date: parsedRow.start_date,
    end_date: parsedRow.end_date ? parsedRow.end_date : null,
    notes: parsedRow.notes ?? '',
  });
}

function normalizeFrequency(frequency: string) {
  if (frequency === 'yearly') {
    return 'annual';
  }

  return frequency;
}

export function mapEntryToRow(entry: Entry): string[] {
  return [
    entry.id,
    entry.concept,
    entry.type,
    entry.frequency,
    String(entry.amount),
    entry.start_date,
    entry.end_date ?? '',
    entry.notes ?? '',
  ];
}
