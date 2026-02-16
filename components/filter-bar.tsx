'use client';

import { Select } from '@/components/ui/select';

export type FilterState = {
  type: 'all' | 'income' | 'expense';
  frequency: 'all' | 'monthly' | 'annual' | 'one_time';
};

export function FilterBar({
  filters,
  onChange,
}: {
  filters: FilterState;
  onChange: (next: FilterState) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Select
        value={filters.type}
        onChange={(event) => onChange({ ...filters, type: event.target.value as FilterState['type'] })}
      >
        <option value="all">All types</option>
        <option value="income">Income</option>
        <option value="expense">Expense</option>
      </Select>
      <Select
        value={filters.frequency}
        onChange={(event) =>
          onChange({ ...filters, frequency: event.target.value as FilterState['frequency'] })
        }
      >
        <option value="all">All frequencies</option>
        <option value="monthly">Monthly</option>
        <option value="annual">Annual</option>
        <option value="one_time">One-time</option>
      </Select>
    </div>
  );
}
