import { NextResponse } from 'next/server';

import { assertApiAllowedUser } from '@/lib/auth';
import { listEntries } from '@/lib/sheets/entries';
import { labelEntryRelationship, listRelationships } from '@/lib/sheets/relationships';
import { labelRelationshipInputSchema } from '@/types/relationship';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; relationshipId: string }> },
) {
  const auth = await assertApiAllowedUser();
  if (!auth.ok) {
    return NextResponse.json({ data: null, error: { code: auth.code, message: 'Access denied.' } }, { status: auth.status });
  }

  const { id, relationshipId } = await context.params;

  try {
    const payload = await request.json();
    const parsed = labelRelationshipInputSchema.parse(payload);
    const [entries, relationships] = await Promise.all([listEntries(), listRelationships()]);

    if (!entries.some((entry) => entry.id === id)) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Entry not found.' } },
        { status: 404 },
      );
    }

    const relationship = relationships.find((candidate) => candidate.id === relationshipId);

    if (!relationship || relationship.target_type !== 'entry' || !relationshipBelongsToEntry(relationship, id)) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Direct entry relationship not found.' } },
        { status: 404 },
      );
    }

    const label = await labelEntryRelationship(relationshipId, parsed.name);

    return NextResponse.json({ data: label, error: null });
  } catch (error) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid relationship label payload.',
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 400 },
    );
  }
}

function relationshipBelongsToEntry(
  relationship: { entry_id: string; target_type: string; target_id: string },
  entryId: string,
) {
  if (relationship.entry_id === entryId) return true;
  return relationship.target_type === 'entry' && relationship.target_id === entryId;
}
