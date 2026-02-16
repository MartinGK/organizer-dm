'use client';

import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { entryInputSchema, type Entry, type EntryInput } from '@/types/entry';

type EntryFormProps = {
  initial?: Entry;
  onSubmit: (payload: EntryInput) => Promise<void>;
  onCancel: () => void;
};

export function EntryForm({ initial, onSubmit, onCancel }: EntryFormProps) {
  const [concept, setConcept] = useState(initial?.concept ?? '');
  const [type, setType] = useState<EntryInput['type']>(initial?.type ?? 'expense');
  const [frequency, setFrequency] = useState<EntryInput['frequency']>(initial?.frequency ?? 'monthly');
  const [amount, setAmount] = useState(String(initial?.amount ?? ''));
  const [startDate, setStartDate] = useState(initial?.start_date ?? new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(initial?.end_date ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const payload = useMemo(
    () => ({
      concept,
      type,
      frequency,
      amount: Number(amount),
      start_date: startDate,
      end_date: frequency === 'one_time' ? null : endDate.trim() === '' ? null : endDate,
      notes,
    }),
    [amount, concept, endDate, frequency, notes, startDate, type],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = entryInputSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid form values.');
      return;
    }

    try {
      setSaving(true);
      await onSubmit(parsed.data);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save entry.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="mb-1 block text-xs uppercase tracking-[0.12em] muted">Concept</label>
        <Input value={concept} onChange={(event) => setConcept(event.target.value)} required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.12em] muted">Type</label>
          <Select value={type} onChange={(event) => setType(event.target.value as EntryInput['type'])}>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.12em] muted">Frequency</label>
          <Select
            value={frequency}
            onChange={(event) => {
              const nextFrequency = event.target.value as EntryInput['frequency'];
              setFrequency(nextFrequency);
              if (nextFrequency === 'one_time') {
                setEndDate('');
              }
            }}
          >
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
            <option value="one_time">One-time</option>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.12em] muted">Amount</label>
          <Input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            type="number"
            min="0"
            step="0.01"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.12em] muted">Start date</label>
          <Input value={startDate} onChange={(event) => setStartDate(event.target.value)} type="date" required />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.12em] muted">End date (optional)</label>
          <Input
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            type="date"
            disabled={frequency === 'one_time'}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs uppercase tracking-[0.12em] muted">Notes</label>
        <Input value={notes} onChange={(event) => setNotes(event.target.value)} />
      </div>

      {error ? <p className="text-sm metric-negative">{error}</p> : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button disabled={saving} type="submit">
          {saving ? 'Saving...' : 'Save entry'}
        </Button>
      </div>
    </form>
  );
}
