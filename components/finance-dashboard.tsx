'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { DashboardHeader } from '@/components/dashboard-header';
import { EmptyState } from '@/components/empty-state';
import { EntriesTable } from '@/components/entries-table';
import { EntryModal } from '@/components/entry-modal';
import { InsightsDashboard } from '@/components/insights-dashboard';
import { KpiCard } from '@/components/kpi-card';
import { ProjectionTable } from '@/components/projection-table';
import { StrategicOutlook } from '@/components/strategic-outlook';
import { useFinancialProjections } from '@/hooks/use-financial-projections';
import { Button } from '@/components/ui/button';
import { buildMonthlyProjection, calculateKpis, monthlyEquivalentForMonth } from '@/lib/finance/calculations';
import type { EntryWithMonthlyEquivalent } from '@/lib/finance/types';
import type { Entry, EntryInput } from '@/types/entry';
import type { AppSettings } from '@/types/settings';

type DashboardProps = {
  email: string;
  initialEntries: Entry[];
  settings: AppSettings;
};

type DashboardTab = 'operations' | 'projections' | 'insights';

export function FinanceDashboard({ email, initialEntries, settings }: DashboardProps) {
  const router = useRouter();
  const [baseMonth] = useState(() => new Date());
  const [activeTab, setActiveTab] = useState<DashboardTab>('operations');
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<EntryWithMonthlyEquivalent | undefined>();
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entriesWithMonthlyEquivalent = useMemo(
    () =>
      initialEntries.map((entry) => ({
        ...entry,
        monthly_equivalent: monthlyEquivalentForMonth(entry, baseMonth),
      })),
    [baseMonth, initialEntries],
  );

  const kpis = useMemo(
    () => calculateKpis(initialEntries, baseMonth, settings.cashOnHand),
    [baseMonth, initialEntries, settings.cashOnHand],
  );

  const projection = useMemo(
    () => buildMonthlyProjection(initialEntries, baseMonth, 12),
    [baseMonth, initialEntries],
  );
  const strategicProjection = useFinancialProjections(initialEntries, baseMonth, settings.cashOnHand);

  async function requestJson(input: RequestInfo, init?: RequestInit) {
    const response = await fetch(input, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.error?.message ?? 'Unexpected request error.');
    }

    return payload;
  }

  async function createEntry(payload: EntryInput) {
    try {
      setIsMutating(true);
      setError(null);
      await requestJson('/api/entries', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setEntryModalOpen(false);
      router.refresh();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to add entry.');
      throw createError;
    } finally {
      setIsMutating(false);
    }
  }

  async function editEntry(payload: EntryInput) {
    if (!editingEntry) return;

    try {
      setIsMutating(true);
      setError(null);
      await requestJson(`/api/entries/${editingEntry.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setEditingEntry(undefined);
      setEntryModalOpen(false);
      router.refresh();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to update entry.');
      throw updateError;
    } finally {
      setIsMutating(false);
    }
  }

  async function deleteEntry(entry: EntryWithMonthlyEquivalent) {
    if (!window.confirm(`Delete entry \"${entry.concept}\"?`)) return;

    try {
      setIsMutating(true);
      setError(null);
      await requestJson(`/api/entries/${entry.id}`, { method: 'DELETE' });
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete entry.');
    } finally {
      setIsMutating(false);
    }
  }

  async function finishEntry(entry: EntryWithMonthlyEquivalent) {
    if (!window.confirm(`Mark entry \"${entry.concept}\" as finished today?`)) return;

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const endDate = `${yyyy}-${mm}-${dd}`;

    try {
      setIsMutating(true);
      setError(null);
      await requestJson(`/api/entries/${entry.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ end_date: endDate }),
      });
      router.refresh();
    } catch (finishError) {
      setError(finishError instanceof Error ? finishError.message : 'Failed to finish entry.');
    } finally {
      setIsMutating(false);
    }
  }

  return (
    <main className="app-shell">
      <div className="mx-auto max-w-[1400px]">
        <DashboardHeader email={email} />

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div>
            <p className="text-sm muted">Operational snapshot for recurring finance decisions.</p>
            {error ? <p className="mt-1 text-sm metric-negative">{error}</p> : null}
          </div>
          <Button
            className="w-full sm:w-auto"
            disabled={isMutating}
            onClick={() => {
              setEditingEntry(undefined);
              setEntryModalOpen(true);
            }}
          >
            Add entry
          </Button>
        </div>

        <section className="mb-6 panel p-2">
          <nav className="flex flex-wrap gap-2" aria-label="Dashboard sections">
            <button
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'operations'
                  ? 'border-[var(--text-primary)]/20 bg-[var(--surface-elevated)]'
                  : 'border-transparent hover:border-[var(--border)]'
              }`}
              onClick={() => setActiveTab('operations')}
              type="button"
            >
              Operations
            </button>
            <button
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'projections'
                  ? 'border-[var(--text-primary)]/20 bg-[var(--surface-elevated)]'
                  : 'border-transparent hover:border-[var(--border)]'
              }`}
              onClick={() => setActiveTab('projections')}
              type="button"
            >
              Projections
            </button>
            <button
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'insights'
                  ? 'border-[var(--text-primary)]/20 bg-[var(--surface-elevated)]'
                  : 'border-transparent hover:border-[var(--border)]'
              }`}
              onClick={() => setActiveTab('insights')}
              type="button"
            >
              Insights
            </button>
          </nav>
        </section>

        {activeTab === 'operations' ? (
          <>
            <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <KpiCard label="Monthly recurring income" value={kpis.monthlyRecurringIncome} currency={settings.currency} />
              <KpiCard
                label="Monthly recurring expenses"
                value={kpis.monthlyRecurringExpenses}
                currency={settings.currency}
              />
              <KpiCard
                label="Net monthly result"
                value={kpis.netMonthlyResult}
                currency={settings.currency}
                tone={kpis.netMonthlyResult < 0 ? 'negative' : 'positive'}
              />
              <KpiCard
                label="Burn rate"
                value={kpis.burnRate}
                currency={settings.currency}
                hint={kpis.burnRate === 0 ? 'Not burning' : undefined}
              />
              {settings.cashOnHand !== null && kpis.runwayMonths !== null ? (
                <article className="panel p-5 sm:col-span-2 xl:col-span-1">
                  <p className="text-xs uppercase tracking-[0.13em] muted">Runway</p>
                  <p className="mt-3 text-2xl font-semibold">{kpis.runwayMonths.toFixed(1)} months</p>
                  <p className="mt-2 text-sm muted">Based on current burn and cash on hand.</p>
                </article>
              ) : null}
            </section>

            <section>
              {entriesWithMonthlyEquivalent.length === 0 ? (
                <EmptyState
                  title="No financial entries yet"
                  description="Start by adding recurring revenue or expenses to activate KPI tracking and projection."
                />
              ) : (
                <EntriesTable
                  entries={entriesWithMonthlyEquivalent}
                  currency={settings.currency}
                  onEdit={(entry) => {
                    setEditingEntry(entry);
                    setEntryModalOpen(true);
                  }}
                  onFinish={finishEntry}
                  onDelete={deleteEntry}
                />
              )}
            </section>
          </>
        ) : null}

        {activeTab === 'projections' ? (
          <section className="space-y-6">
            <ProjectionTable rows={projection} currency={settings.currency} />
            <StrategicOutlook projection={strategicProjection} currency={settings.currency} />
          </section>
        ) : null}

        {activeTab === 'insights' ? (
          <InsightsDashboard entries={initialEntries} currency={settings.currency} baseMonth={baseMonth} />
        ) : null}
      </div>

      <EntryModal
        open={entryModalOpen}
        initial={editingEntry}
        onClose={() => {
          setEntryModalOpen(false);
          setEditingEntry(undefined);
        }}
        onSubmit={editingEntry ? editEntry : createEntry}
      />
    </main>
  );
}
