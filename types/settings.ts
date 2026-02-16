import { z } from 'zod';

export const currencySchema = z.enum(['USD', 'ARS']);

export const settingsSchema = z.object({
  currency: currencySchema.default('USD'),
  cashOnHand: z.number().nullable().default(null),
});

export const settingsInputSchema = settingsSchema.partial();

export type Currency = z.infer<typeof currencySchema>;
export type AppSettings = z.infer<typeof settingsSchema>;
export type SettingsInput = z.infer<typeof settingsInputSchema>;
