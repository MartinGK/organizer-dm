import { z } from 'zod';

export const relationshipTargetTypeSchema = z.enum(['entry', 'label']);

export const relationshipLabelSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  created_at: z.string().min(1),
  updated_at: z.string().min(1),
});

export const entryRelationshipSchema = z.object({
  id: z.string().min(1),
  entry_id: z.string().min(1),
  target_type: relationshipTargetTypeSchema,
  target_id: z.string().min(1),
  created_at: z.string().min(1),
});

export const relationshipTargetInputSchema = z.discriminatedUnion('target_type', [
  z.object({
    target_type: z.literal('entry'),
    target_id: z.string().min(1),
    source_entry_id: z.string().min(1).optional(),
  }),
  z.object({
    target_type: z.literal('label'),
    target_id: z.string().min(1),
    source_entry_id: z.string().min(1).optional(),
  }),
  z.object({
    target_type: z.literal('new_label'),
    name: z.string().min(1).max(80),
    source_entry_id: z.string().min(1).optional(),
  }),
]);

export const createRelationshipsInputSchema = z.object({
  targets: z.array(relationshipTargetInputSchema).min(1),
});

export const labelRelationshipInputSchema = z.object({
  name: z.string().min(1).max(80),
});

export type RelationshipTargetType = z.infer<typeof relationshipTargetTypeSchema>;
export type RelationshipLabel = z.infer<typeof relationshipLabelSchema>;
export type EntryRelationship = z.infer<typeof entryRelationshipSchema>;
export type RelationshipTargetInput = z.infer<typeof relationshipTargetInputSchema>;
export type CreateRelationshipsInput = z.infer<typeof createRelationshipsInputSchema>;
export type LabelRelationshipInput = z.infer<typeof labelRelationshipInputSchema>;
