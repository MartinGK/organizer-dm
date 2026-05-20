import { NextResponse } from 'next/server';

import { assertApiAllowedUser } from '@/lib/auth';
import { listEntries } from '@/lib/sheets/entries';
import { deleteRelationship, listRelationships } from '@/lib/sheets/relationships';

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; relationshipId: string }> },
) {
  const auth = await assertApiAllowedUser();
  if (!auth.ok) {
    return NextResponse.json({ data: null, error: { code: auth.code, message: 'Access denied.' } }, { status: auth.status });
  }

  const { id, relationshipId } = await context.params;
  const [entries, relationships] = await Promise.all([listEntries(), listRelationships()]);

  if (!entries.some((entry) => entry.id === id)) {
    return NextResponse.json(
      { data: null, error: { code: 'NOT_FOUND', message: 'Entry not found.' } },
      { status: 404 },
    );
  }

  const relationship = relationships.find((candidate) => candidate.id === relationshipId);

  if (!relationship || !relationshipBelongsToEntry(relationship, id)) {
    return NextResponse.json(
      { data: null, error: { code: 'NOT_FOUND', message: 'Relationship not found.' } },
      { status: 404 },
    );
  }

  await deleteRelationship(relationshipId);

  return NextResponse.json({ data: { id: relationshipId }, error: null });
}

function relationshipBelongsToEntry(
  relationship: { entry_id: string; target_type: string; target_id: string },
  entryId: string,
) {
  if (relationship.entry_id === entryId) return true;
  return relationship.target_type === 'entry' && relationship.target_id === entryId;
}
