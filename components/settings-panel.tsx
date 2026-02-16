'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { AppSettings, Currency } from '@/types/settings';

export function SettingsPanel({ settings }: { settings: AppSettings }) {
  const router = useRouter();
  const [currency, setCurrency] = useState<Currency>(settings.currency);
  const [cashOnHand, setCashOnHand] = useState(
    settings.cashOnHand === null ? '' : String(settings.cashOnHand),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    try {
      setSaving(true);
      setError(null);

      const payload = {
        currency,
        cashOnHand: cashOnHand.trim() === '' ? null : Number(cashOnHand),
      };

      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error?.message ?? 'Failed to update settings.');
      }

      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel p-4">
      <h2 className="mb-3 text-lg font-semibold">Settings</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.12em] muted">Display currency</label>
          <Select value={currency} onChange={(event) => setCurrency(event.target.value as Currency)}>
            <option value="USD">USD</option>
            <option value="ARS">ARS</option>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.12em] muted">Cash on hand (optional)</label>
          <Input
            value={cashOnHand}
            onChange={(event) => setCashOnHand(event.target.value)}
            type="number"
            min="0"
            step="0.01"
            placeholder="e.g. 250000"
          />
        </div>
      </div>
      {error ? <p className="mt-3 text-sm metric-negative">{error}</p> : null}
      <div className="mt-4 flex justify-end">
        <Button disabled={saving} onClick={save}>
          {saving ? 'Saving...' : 'Save settings'}
        </Button>
      </div>
    </section>
  );
}
