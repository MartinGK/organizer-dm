import Link from 'next/link';
import { notFound } from 'next/navigation';

import { DashboardHeader } from '@/components/dashboard-header';
import { EntryRelationshipGraph } from '@/components/entry-relationship-graph';
import { Badge } from '@/components/ui/badge';
import { requireAllowedUser } from '@/lib/auth';
import { formatCurrency } from '@/lib/format/currency';
import { listEntries } from '@/lib/sheets/entries';
import { listRelationshipLabels, listRelationships } from '@/lib/sheets/relationships';
import { getSettings } from '@/lib/sheets/settings';

export default async function EntryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAllowedUser();
  const { id } = await params;
  const [entries, labels, relationships, settings] = await Promise.all([
    listEntries(),
    listRelationshipLabels(),
    listRelationships(),
    getSettings(),
  ]);
  const entry = entries.find((candidate) => candidate.id === id);

  if (!entry) {
    notFound();
  }

  return (
    <main className="app-shell">
      <div className="mx-auto max-w-[1400px]">
        <DashboardHeader email={session.user.email} />

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link className="text-sm muted hover:text-[var(--text-primary)]" href="/dashboard">
              Back to dashboard
            </Link>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold">{entry.concept}</h1>
              <Badge tone={entry.type === 'income' ? 'success' : 'danger'}>{entry.type}</Badge>
            </div>
            <p className="mt-2 text-sm muted">
              {entry.frequency} · {formatCurrency(entry.amount, settings.currency)} · starts {entry.start_date}
            </p>
          </div>
        </div>

        <EntryRelationshipGraph
          entry={entry}
          entries={entries}
          labels={labels}
          relationships={relationships}
          currency={settings.currency}
        />
      </div>
    </main>
  );
}
