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
    id: row[0] ?? '',
    concept: row[1] ?? '',
    type: row[2] ?? '',
    frequency: row[3] ?? '',
    amount: row[4] ?? '0',
    start_date: row[5] ?? '',
    end_date: hasEndDateColumn ? row[6] ?? '' : '',
    notes: hasEndDateColumn ? row[7] ?? '' : row[6] ?? '',
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
