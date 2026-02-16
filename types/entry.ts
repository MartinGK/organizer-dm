import { z } from 'zod';

export const entryTypeSchema = z.enum(['income', 'expense']);
export const frequencySchema = z.enum(['monthly', 'annual', 'one_time']);
const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export type EntryType = z.infer<typeof entryTypeSchema>;
export type Frequency = z.infer<typeof frequencySchema>;

const entryBaseSchema = z.object({
  id: z.string().min(1),
  concept: z.string().min(1).max(120),
  type: entryTypeSchema,
  frequency: frequencySchema,
  amount: z.number().positive(),
  start_date: isoDateSchema,
  end_date: isoDateSchema.nullable().optional().default(null),
  notes: z.string().max(500).optional().default(''),
});

function hasValidDateRange(entry: { start_date: string; end_date: string | null }) {
  if (!entry.end_date) return true;
  return entry.end_date >= entry.start_date;
}

export const entrySchema = entryBaseSchema.refine((entry) => hasValidDateRange(entry), {
  path: ['end_date'],
  message: 'End date must be on or after start date.',
});

const entryInputBaseSchema = entryBaseSchema.omit({ id: true });

export const entryInputSchema = entryInputBaseSchema.refine((entry) => hasValidDateRange(entry), {
  path: ['end_date'],
  message: 'End date must be on or after start date.',
});
export const entryUpdateSchema = entryInputBaseSchema.partial();

export type Entry = z.infer<typeof entrySchema>;
export type EntryInput = z.infer<typeof entryInputSchema>;
export type EntryUpdate = z.infer<typeof entryUpdateSchema>;
