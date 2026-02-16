'use client';

import { EntryForm } from '@/components/entry-form';
import { Modal } from '@/components/ui/modal';
import type { Entry, EntryInput } from '@/types/entry';

export function EntryModal({
  open,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  initial?: Entry;
  onClose: () => void;
  onSubmit: (payload: EntryInput) => Promise<void>;
}) {
  return (
    <Modal open={open} title={initial ? 'Edit entry' : 'Add entry'} onClose={onClose}>
      <EntryForm initial={initial} onSubmit={onSubmit} onCancel={onClose} />
    </Modal>
  );
}
