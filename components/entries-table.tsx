'use client';

import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { FilterBar, type FilterState } from '@/components/filter-bar';
import { formatCurrency } from '@/lib/format/currency';
import type { EntryWithMonthlyEquivalent } from '@/lib/finance/types';
import type { Currency } from '@/types/settings';

type SortField = 'amount' | 'start_date';

export function EntriesTable({
  entries,
  currency,
  onEdit,
  onFinish,
  onDelete,
}: {
  entries: EntryWithMonthlyEquivalent[];
  currency: Currency;
  onEdit: (entry: EntryWithMonthlyEquivalent) => void;
  onFinish: (entry: EntryWithMonthlyEquivalent) => Promise<void>;
  onDelete: (entry: EntryWithMonthlyEquivalent) => Promise<void>;
}) {
  const [sortField, setSortField] = useState<SortField>('start_date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<FilterState>({ type: 'all', frequency: 'all' });

  const filteredEntries = useMemo(() => {
    return entries
      .filter((entry) => {
        const typeOk = filters.type === 'all' || entry.type === filters.type;
        const freqOk = filters.frequency === 'all' || entry.frequency === filters.frequency;
        return typeOk && freqOk;
      })
      .sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1;
        if (sortField === 'amount') {
          return (a.amount - b.amount) * dir;
        }
        return a.start_date.localeCompare(b.start_date) * dir;
      });
  }, [entries, filters, sortDir, sortField]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortField(field);
    setSortDir('desc');
  }

  return (
    <section className="panel p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">Entries</h2>
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[920px] text-sm">
          <thead>
            <tr className="border-b text-left muted">
              <th className="px-3 py-2 font-medium">Concept</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Frequency</th>
              <th className="px-3 py-2 font-medium">
                <button onClick={() => toggleSort('amount')}>Amount</button>
              </th>
              <th className="px-3 py-2 font-medium">
                <button onClick={() => toggleSort('start_date')}>Start date</button>
              </th>
              <th className="px-3 py-2 font-medium">End date</th>
              <th className="px-3 py-2 font-medium">Monthly equivalent</th>
              <th className="px-3 py-2 font-medium">Notes</th>
              <th className="px-3 py-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((entry) => (
              <tr key={entry.id} className="border-b border-[var(--border)]/60">
                <td className="px-3 py-2">{entry.concept}</td>
                <td className="px-3 py-2">
                  <Badge tone={entry.type === 'income' ? 'success' : 'danger'}>{entry.type}</Badge>
                </td>
                <td className="px-3 py-2">{entry.frequency}</td>
                <td className="px-3 py-2">{formatCurrency(entry.amount, currency)}</td>
                <td className="px-3 py-2">{entry.start_date}</td>
                <td className="px-3 py-2">{entry.end_date ?? 'Ongoing'}</td>
                <td className="px-3 py-2">{formatCurrency(entry.monthly_equivalent, currency)}</td>
                <td className="px-3 py-2 muted">{entry.notes || '—'}</td>
                <td className="px-3 py-2 text-right">
                  <ActionsMenu entry={entry} onDelete={onDelete} onEdit={onEdit} onFinish={onFinish} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 lg:hidden">
        {filteredEntries.map((entry) => (
          <article key={entry.id} className="rounded-xl border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{entry.concept}</h3>
                <p className="mt-1 text-xs muted">{entry.start_date}</p>
              </div>
              <Badge tone={entry.type === 'income' ? 'success' : 'danger'}>{entry.type}</Badge>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <p className="muted">Frequency</p>
              <p>{entry.frequency}</p>
              <p className="muted">Amount</p>
              <p>{formatCurrency(entry.amount, currency)}</p>
              <p className="muted">End date</p>
              <p>{entry.end_date ?? 'Ongoing'}</p>
              <p className="muted">Monthly eq.</p>
              <p>{formatCurrency(entry.monthly_equivalent, currency)}</p>
              <p className="muted">Notes</p>
              <p>{entry.notes || '—'}</p>
            </div>
            <div className="mt-4 flex justify-end">
              <ActionsMenu entry={entry} onDelete={onDelete} onEdit={onEdit} onFinish={onFinish} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ActionsMenu({
  entry,
  onEdit,
  onFinish,
  onDelete,
}: {
  entry: EntryWithMonthlyEquivalent;
  onEdit: (entry: EntryWithMonthlyEquivalent) => void;
  onFinish: (entry: EntryWithMonthlyEquivalent) => Promise<void>;
  onDelete: (entry: EntryWithMonthlyEquivalent) => Promise<void>;
}) {
  return (
    <details className="group relative inline-block text-left">
      <summary
        aria-label="Entry actions"
        className="inline-flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-lg border text-sm font-medium transition-colors hover:bg-white/5"
      >
        <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="2.5" r="1.5" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="8" cy="13.5" r="1.5" />
        </svg>
      </summary>
      <div className="absolute right-0 z-20 mt-1 min-w-36 overflow-hidden rounded-lg border bg-[var(--surface-elevated)] shadow-[var(--shadow)]">
        <button
          className="block w-full px-3 py-2 text-left text-sm hover:bg-white/5"
          onClick={(event) => {
            event.currentTarget.closest('details')?.removeAttribute('open');
            onEdit(entry);
          }}
          type="button"
        >
          Edit
        </button>
        <button
          className="block w-full px-3 py-2 text-left text-sm hover:bg-white/5"
          onClick={async (event) => {
            event.currentTarget.closest('details')?.removeAttribute('open');
            await onFinish(entry);
          }}
          type="button"
        >
          Finish
        </button>
        <button
          className="block w-full px-3 py-2 text-left text-sm text-[var(--danger)] hover:bg-[var(--danger)]/10"
          onClick={async (event) => {
            event.currentTarget.closest('details')?.removeAttribute('open');
            await onDelete(entry);
          }}
          type="button"
        >
          Delete
        </button>
      </div>
    </details>
  );
}
