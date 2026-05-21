'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { addMonths, addYears, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  Position,
  applyNodeChanges,
  type Edge,
  type Node,
} from 'reactflow';

import { EntryForm } from '@/components/entry-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { formatCurrency } from '@/lib/format/currency';
import { monthKey } from '@/lib/format/date';
import type { Entry, EntryInput } from '@/types/entry';
import type { EntryRelationship, RelationshipLabel, RelationshipTargetInput } from '@/types/relationship';
import type { Currency } from '@/types/settings';

type Props = {
  entry: Entry;
  entries: Entry[];
  labels: RelationshipLabel[];
  relationships: EntryRelationship[];
  currency: Currency;
};

type GraphNodeData = {
  label: ReactNode;
  title: string;
  subtitle: string;
  kind: 'entry' | 'label';
  entryId?: string;
  labelId?: string;
};

export function EntryRelationshipGraph({ entry, entries, labels, relationships, currency }: Props) {
  const router = useRouter();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [balanceOpen, setBalanceOpen] = useState(true);
  const [graphOpen, setGraphOpen] = useState(false);
  const [selectedRelationship, setSelectedRelationship] = useState<EntryRelationship | null>(null);
  const [labelName, setLabelName] = useState('');
  const [savingLabel, setSavingLabel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entriesById = useMemo(() => new Map(entries.map((candidate) => [candidate.id, candidate])), [entries]);
  const labelsById = useMemo(() => new Map(labels.map((label) => [label.id, label])), [labels]);
  const directRelationships = useMemo(
    () => relationships.filter((relationship) => relationshipBelongsToEntry(relationship, entry.id)),
    [entry.id, relationships],
  );
  const visibleBalanceEntries = useMemo(
    () => getVisibleBalanceEntries(entry, directRelationships, entriesById),
    [directRelationships, entriesById, entry],
  );

  const { nodes, edges } = useMemo(
    () => buildGraph(entry, directRelationships, entriesById, labelsById, currency),
    [currency, directRelationships, entriesById, entry, labelsById],
  );
  const [flowNodes, setFlowNodes] = useState(nodes);
  const [hasStoredLayout, setHasStoredLayout] = useState(false);
  const graphKey = useMemo(
    () => `${nodes.map((node) => node.id).join('|')}::${edges.map((edge) => `${edge.source}-${edge.target}`).join('|')}`,
    [edges, nodes],
  );
  const layoutStorageKey = `dreammakers:entry-graph-layout:${entry.id}`;

  useEffect(() => {
    const storedPositions = readStoredGraphPositions(layoutStorageKey);
    setHasStoredLayout(storedPositions.size > 0);
    setFlowNodes(applyStoredGraphPositions(nodes, storedPositions));
  }, [layoutStorageKey, nodes]);

  useEffect(() => {
    if (flowNodes.length === 0) return;

    const timeout = window.setTimeout(() => {
      writeStoredGraphPositions(layoutStorageKey, flowNodes);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [flowNodes, layoutStorageKey]);

  useForceLayout(!hasStoredLayout, graphKey, edges, setFlowNodes);

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

  async function createRelations(targets: RelationshipTargetInput[]) {
    setError(null);
    await requestJson(`/api/entries/${entry.id}/relationships`, {
      method: 'POST',
      body: JSON.stringify({ targets }),
    });
    setPickerOpen(false);
    router.refresh();
  }

  async function editEntry(payload: EntryInput) {
    try {
      setError(null);
      await requestJson(`/api/entries/${entry.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setEditOpen(false);
      router.refresh();
    } catch (editError) {
      setError(editError instanceof Error ? editError.message : 'Unable to update entry.');
      throw editError;
    }
  }

  async function removeRelationship(relationshipId: string) {
    setError(null);
    await requestJson(`/api/entries/${entry.id}/relationships/${relationshipId}`, { method: 'DELETE' });
    setSelectedRelationship(null);
    router.refresh();
  }

  async function labelRelationship() {
    if (!selectedRelationship || labelName.trim().length === 0) return;

    try {
      setSavingLabel(true);
      setError(null);
      await requestJson(`/api/entries/${entry.id}/relationships/${selectedRelationship.id}/label`, {
        method: 'PATCH',
        body: JSON.stringify({ name: labelName }),
      });
      setSelectedRelationship(null);
      setLabelName('');
      router.refresh();
    } catch (labelError) {
      setError(labelError instanceof Error ? labelError.message : 'Unable to label relationship.');
    } finally {
      setSavingLabel(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Relationship map</h2>
          <p className="mt-1 text-sm muted">Direct financial ecosystem for this entry.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => setEditOpen(true)}>
            Edit entry
          </Button>
          <Button variant="ghost" onClick={() => setBalanceOpen((current) => !current)}>
            Balance
          </Button>
          <Button variant="ghost" onClick={() => setGraphOpen((current) => !current)}>
            {graphOpen ? 'Hide graph' : 'Show graph'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              window.localStorage.removeItem(layoutStorageKey);
              setHasStoredLayout(false);
              setFlowNodes(nodes);
            }}
          >
            Reset layout
          </Button>
          <Button onClick={() => setPickerOpen(true)}>Add relation</Button>
        </div>
      </div>

      {error ? <p className="text-sm metric-negative">{error}</p> : null}

      {balanceOpen ? <EntryBalancePanel entries={visibleBalanceEntries} currency={currency} /> : null}

      {selectedRelationship?.target_type === 'entry' ? (
        <article className="panel p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-[0.12em] muted">Selected direct relationship</p>
              <p className="mt-1 text-sm">
                Convert this direct relation into a label node shared by both entries.
              </p>
              <Input
                className="mt-3 max-w-md"
                value={labelName}
                onChange={(event) => setLabelName(event.target.value)}
                placeholder="e.g. Growth stack"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button disabled={savingLabel || labelName.trim().length === 0} onClick={labelRelationship}>
                {savingLabel ? 'Saving...' : 'Apply label'}
              </Button>
              <Button variant="danger" onClick={() => removeRelationship(selectedRelationship.id)}>
                Remove
              </Button>
              <Button variant="ghost" onClick={() => setSelectedRelationship(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </article>
      ) : null}

      {graphOpen ? (
        <div className="panel h-[620px] overflow-hidden p-2">
          <ReactFlow
            nodes={flowNodes}
            edges={edges}
            fitView
            minZoom={0.35}
            nodesDraggable
            defaultEdgeOptions={{
              type: 'smoothstep',
            }}
            onNodesChange={(changes) => {
              setHasStoredLayout(true);
              setFlowNodes((current) => applyNodeChanges(changes, current));
            }}
            onEdgeClick={(_event, edge) => {
              const relationship = directRelationships.find((candidate) => candidate.id === edge.id);
              setSelectedRelationship(relationship ?? null);
              setLabelName('');
            }}
            onNodeClick={(_event, node) => {
              const data = node.data as GraphNodeData;
              if (data.entryId && data.entryId !== entry.id) {
                router.push(`/entries/${data.entryId}`);
                return;
              }

              if (data.labelId) {
                const destination = bestEntryForLabel(data.labelId, relationships, entriesById);
                if (destination) router.push(`/entries/${destination.id}`);
              }
            }}
          >
            <Background color="rgba(248,250,252,0.16)" gap={20} />
            <Controls />
          </ReactFlow>
        </div>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2">
        {directRelationships.length === 0 ? (
          <article className="rounded-xl border p-4">
            <p className="font-medium">No relationships yet</p>
            <p className="mt-1 text-sm muted">Add entries or labels to map this financial ecosystem.</p>
          </article>
        ) : (
          directRelationships.map((relationship) => {
            const target = describeRelationshipTarget(relationship, entry.id, entriesById, labelsById, currency);
            return (
              <article key={relationship.id} className="rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{target.title}</p>
                    <p className="mt-1 text-sm muted">{target.subtitle}</p>
                  </div>
                  <Badge tone={target.kind === 'label' ? 'neutral' : 'success'}>{target.kind}</Badge>
                </div>
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  {relationship.target_type === 'entry' ? (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSelectedRelationship(relationship);
                        setLabelName('');
                      }}
                    >
                      Label
                    </Button>
                  ) : null}
                  <Button variant="danger" onClick={() => removeRelationship(relationship.id)}>
                    Remove
                  </Button>
                </div>
              </article>
            );
          })
        )}
      </div>

      <RelationshipPicker
        open={pickerOpen}
        entry={entry}
        entries={entries}
        labels={labels}
        relationships={relationships}
        onClose={() => setPickerOpen(false)}
        onSubmit={createRelations}
      />

      <EntryEditDialog
        entry={entry}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={editEntry}
      />
    </section>
  );
}

function EntryEditDialog({
  entry,
  open,
  onClose,
  onSubmit,
}: {
  entry: Entry;
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: EntryInput) => Promise<void>;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/60 p-0 sm:items-center sm:justify-center sm:p-4">
      <div className="panel max-h-[90vh] w-full overflow-y-auto rounded-b-none p-5 sm:max-w-2xl sm:rounded-b-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit entry</h3>
          <button className="muted text-sm" onClick={onClose} type="button">
            Close
          </button>
        </div>
        <EntryForm initial={entry} onSubmit={onSubmit} onCancel={onClose} />
      </div>
    </div>
  );
}

function RelationshipPicker({
  open,
  entry,
  entries,
  labels,
  relationships,
  onClose,
  onSubmit,
}: {
  open: boolean;
  entry: Entry;
  entries: Entry[];
  labels: RelationshipLabel[];
  relationships: EntryRelationship[];
  onClose: () => void;
  onSubmit: (targets: RelationshipTargetInput[]) => Promise<void>;
}) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [selected, setSelected] = useState<RelationshipTargetInput[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existingEntryIds = useMemo(() => {
    const ids = new Set<string>([entry.id]);
    for (const relationship of relationships) {
      if (!relationshipBelongsToEntry(relationship, entry.id) || relationship.target_type !== 'entry') continue;
      ids.add(relationship.entry_id === entry.id ? relationship.target_id : relationship.entry_id);
    }
    return ids;
  }, [entry.id, relationships]);

  const existingLabelIds = useMemo(() => {
    const ids = new Set<string>();
    for (const relationship of relationships) {
      if (relationship.entry_id === entry.id && relationship.target_type === 'label') {
        ids.add(relationship.target_id);
      }
    }
    return ids;
  }, [entry.id, relationships]);

  const selectedKeys = useMemo(() => new Set(selected.map(targetKey)), [selected]);
  const normalizedQuery = query.trim().toLowerCase();
  const entryCandidates = entries
    .filter((candidate) => !existingEntryIds.has(candidate.id))
    .filter((candidate) => !selectedKeys.has(`entry:${candidate.id}`))
    .filter((candidate) => candidate.concept.toLowerCase().includes(normalizedQuery))
    .slice(0, 8);
  const labelCandidates = labels
    .filter((label) => !existingLabelIds.has(label.id))
    .filter((label) => !selectedKeys.has(`label:${label.id}`))
    .filter((label) => label.name.toLowerCase().includes(normalizedQuery))
    .slice(0, 8);
  const canCreateLabel =
    query.trim().length > 0 &&
    !labels.some((label) => label.name.toLowerCase() === normalizedQuery) &&
    !selectedKeys.has(`new_label:${query.trim().toLowerCase()}`);

  if (!open) return null;

  async function save() {
    try {
      setSaving(true);
      setError(null);
      await onSubmit(selected);
      setSelected([]);
      setQuery('');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to add relationships.');
    } finally {
      setSaving(false);
    }
  }

  async function createEntryAndRelate(payload: EntryInput) {
    try {
      setSaving(true);
      setError(null);
      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error?.message ?? 'Unable to create entry.');
      }

      await onSubmit([{ target_type: 'entry', target_id: result.data.id }]);
      setSelected([]);
      setQuery('');
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to create and relate entry.');
      throw createError;
    } finally {
      setSaving(false);
    }
  }

  function addTarget(target: RelationshipTargetInput) {
    setSelected((current) => [...current, target]);
    setQuery('');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/60 p-0 sm:items-center sm:justify-center sm:p-4">
      <div className="panel max-h-[90vh] w-full overflow-hidden rounded-b-none p-5 sm:max-w-2xl sm:rounded-b-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Add relationships</h3>
          <button className="muted text-sm" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <div className="mb-4 flex rounded-lg border p-1">
          <button
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${mode === 'existing' ? 'bg-[var(--surface-elevated)]' : 'muted'}`}
            onClick={() => setMode('existing')}
            type="button"
          >
            Existing
          </button>
          <button
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${mode === 'new' ? 'bg-[var(--surface-elevated)]' : 'muted'}`}
            onClick={() => setMode('new')}
            type="button"
          >
            New entry
          </button>
        </div>

        {mode === 'existing' ? (
          <>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search entries or labels"
            />

            <div className="mt-4 max-h-[34vh] space-y-2 overflow-y-auto pr-1">
              {entryCandidates.map((candidate) => (
                <button
                  key={candidate.id}
                  className="block w-full rounded-lg border p-3 text-left transition-colors hover:bg-white/5"
                  onClick={() => addTarget({ target_type: 'entry', target_id: candidate.id })}
                  type="button"
                >
                  <span className="font-medium">{candidate.concept}</span>
                  <span className="ml-2 text-xs muted">
                    {candidate.type} · {candidate.frequency}
                  </span>
                </button>
              ))}
              {labelCandidates.map((label) => (
                <button
                  key={label.id}
                  className="block w-full rounded-lg border p-3 text-left transition-colors hover:bg-white/5"
                  onClick={() => addTarget({ target_type: 'label', target_id: label.id })}
                  type="button"
                >
                  <span className="font-medium">{label.name}</span>
                  <span className="ml-2 text-xs muted">label</span>
                </button>
              ))}
              {canCreateLabel ? (
                <button
                  className="block w-full rounded-lg border border-[var(--accent)]/40 p-3 text-left transition-colors hover:bg-white/5"
                  onClick={() => addTarget({ target_type: 'new_label', name: query.trim() })}
                  type="button"
                >
                  Create label &quot;{query.trim()}&quot;
                </button>
              ) : null}
            </div>
          </>
        ) : (
          <div className="max-h-[62vh] overflow-y-auto pr-1">
            <EntryForm onSubmit={createEntryAndRelate} onCancel={onClose} submitLabel="Create and relate" />
          </div>
        )}

        {mode === 'existing' ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {selected.map((target) => (
              <button
                key={targetKey(target)}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-white/5"
                onClick={() => setSelected((current) => current.filter((candidate) => targetKey(candidate) !== targetKey(target)))}
                type="button"
              >
                {targetLabel(target, entries, labels)} x
              </button>
            ))}
          </div>
        ) : null}

        {error ? <p className="mt-3 text-sm metric-negative">{error}</p> : null}

        {mode === 'existing' ? (
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={saving || selected.length === 0} onClick={save}>
              {saving ? 'Saving...' : 'Add selected'}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

type BalanceOccurrence = {
  entry: Entry;
  month: string;
  amount: number;
};

type BalanceMonthGroup = {
  month: string;
  label: string;
  incomes: BalanceOccurrence[];
  expenses: BalanceOccurrence[];
  totalIncome: number;
  totalExpenses: number;
  net: number;
};

function EntryBalancePanel({ entries, currency }: { entries: Entry[]; currency: Currency }) {
  const [horizonYears, setHorizonYears] = useState(1);
  const balanceGroups = useMemo(() => buildBalanceMonthGroups(entries, horizonYears), [entries, horizonYears]);
  const totalIncome = balanceGroups.reduce((sum, group) => sum + group.totalIncome, 0);
  const totalExpenses = balanceGroups.reduce((sum, group) => sum + group.totalExpenses, 0);
  const result = totalIncome - totalExpenses;

  return (
    <article className="panel p-4">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold">Balance</h3>
          <p className="mt-1 text-sm muted">Debe y haber por mes.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.12em] muted">Horizon</label>
            <Select value={String(horizonYears)} onChange={(event) => setHorizonYears(Number(event.target.value))}>
              <option value="1">1 year</option>
              <option value="2">2 years</option>
              <option value="5">5 years</option>
            </Select>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs uppercase tracking-[0.12em] muted">Resultado</p>
            <p className={`mt-1 text-2xl font-semibold ${result < 0 ? 'metric-negative' : 'metric-positive'}`}>
              {formatCurrency(result, currency)}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-5 grid gap-3 text-sm sm:grid-cols-3">
        <p>
          <span className="muted">Haber</span> <span className="font-medium">{formatCurrency(totalIncome, currency)}</span>
        </p>
        <p>
          <span className="muted">Debe</span> <span className="font-medium">{formatCurrency(totalExpenses, currency)}</span>
        </p>
        <p>
          <span className="muted">Resultado</span>{' '}
          <span className={`font-medium ${result < 0 ? 'metric-negative' : 'metric-positive'}`}>
            {formatCurrency(result, currency)}
          </span>
        </p>
      </div>

      <div className="mb-3 grid gap-4 px-3 text-xs uppercase tracking-[0.12em] muted lg:grid-cols-2">
        <div>Haber</div>
        <div>Debe</div>
      </div>

      <div className="space-y-5">
        {balanceGroups.map((group) => (
          <section key={group.month}>
            <div className="mb-2 flex items-center gap-3">
              <h4 className="shrink-0 text-sm font-semibold">{group.label}</h4>
              <div className="h-px flex-1 bg-[var(--border)]" />
              <p className={`shrink-0 text-sm font-medium ${group.net < 0 ? 'metric-negative' : 'metric-positive'}`}>
                {formatCurrency(group.net, currency)}
              </p>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              <BalanceColumn occurrences={group.incomes} total={group.totalIncome} currency={currency} />
              <BalanceColumn occurrences={group.expenses} total={group.totalExpenses} currency={currency} />
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}

function BalanceColumn({
  occurrences,
  total,
  currency,
}: {
  occurrences: BalanceOccurrence[];
  total: number;
  currency: Currency;
}) {
  const showTotal = total !== 0;

  return (
    <section>
      <div className="space-y-2">
        {occurrences.map((occurrence) => (
          <Link
            key={`${occurrence.entry.id}:${occurrence.month}`}
            className="flex items-start justify-between gap-3 rounded-lg px-3 py-1.5 transition-colors hover:bg-white/5"
            href={`/entries/${occurrence.entry.id}`}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {occurrence.entry.concept}{' '}
                <span className="text-xs font-normal muted">{occurrence.entry.frequency}</span>
              </p>
            </div>
            <p className="shrink-0 text-sm font-medium">{formatCurrency(occurrence.amount, currency)}</p>
          </Link>
        ))}
      </div>
      {showTotal ? (
        <div className="mt-2 flex justify-end px-3">
          <div className="w-1/2 border-t pt-2 text-right text-sm font-medium">
            {formatCurrency(total, currency)}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function buildBalanceMonthGroups(entries: Entry[], horizonYears: number): BalanceMonthGroup[] {
  const baseMonth = startOfMonth(new Date());
  const endMonth = startOfMonth(addMonths(addYears(baseMonth, horizonYears), -1));
  const groups = new Map<string, BalanceMonthGroup>();

  for (let current = baseMonth; monthKey(current) <= monthKey(endMonth); current = addMonths(current, 1)) {
    const currentKey = monthKey(current);
    groups.set(currentKey, {
      month: currentKey,
      label: monthLabelEs(current),
      incomes: [],
      expenses: [],
      totalIncome: 0,
      totalExpenses: 0,
      net: 0,
    });
  }

  for (const entry of entries) {
    for (const month of monthsForEntryInRange(entry, baseMonth, endMonth)) {
      const group = groups.get(monthKey(month));
      if (!group) continue;

      const occurrence = { entry, month: group.month, amount: entry.amount };

      if (entry.type === 'income') {
        group.incomes.push(occurrence);
        group.totalIncome += occurrence.amount;
      } else {
        group.expenses.push(occurrence);
        group.totalExpenses += occurrence.amount;
      }
      group.net = group.totalIncome - group.totalExpenses;
    }
  }

  return Array.from(groups.values())
    .filter((group) => group.incomes.length > 0 || group.expenses.length > 0)
    .map((group) => ({
      ...group,
      incomes: group.incomes.sort((a, b) => b.amount - a.amount),
      expenses: group.expenses.sort((a, b) => b.amount - a.amount),
    }));
}

function monthsForEntryInRange(entry: Entry, baseMonth: Date, endMonth: Date) {
  const months: Date[] = [];
  const startMonth = startOfMonth(parseISO(entry.start_date));
  const entryEndMonth = entry.end_date ? startOfMonth(parseISO(entry.end_date)) : endMonth;
  const firstMonth = maxMonth(startMonth, baseMonth);
  const lastMonth = minMonth(entryEndMonth, endMonth);

  if (monthKey(lastMonth) < monthKey(firstMonth)) {
    return months;
  }

  if (entry.frequency === 'one_time') {
    const startKey = monthKey(startMonth);
    if (startKey >= monthKey(baseMonth) && startKey <= monthKey(endMonth)) {
      months.push(startMonth);
    }
    return months;
  }

  if (entry.frequency === 'monthly') {
    const lastKey = monthKey(lastMonth);
    for (let current = firstMonth; monthKey(current) <= lastKey; current = addMonths(current, 1)) {
      months.push(current);
    }
    return months;
  }

  const baseKey = monthKey(baseMonth);
  const lastKey = monthKey(lastMonth);
  for (let current = startMonth; monthKey(current) <= monthKey(endMonth); current = addYears(current, 1)) {
    const currentKey = monthKey(current);
    if (currentKey >= baseKey && currentKey <= lastKey) {
      months.push(current);
    }
  }

  return months;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function minMonth(left: Date, right: Date) {
  return monthKey(left) <= monthKey(right) ? left : right;
}

function maxMonth(left: Date, right: Date) {
  return monthKey(left) >= monthKey(right) ? left : right;
}

function monthLabelEs(date: Date) {
  const label = format(date, 'MMMM yyyy', { locale: es });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function useForceLayout(
  enabled: boolean,
  graphKey: string,
  edges: Edge[],
  setNodes: (updater: (nodes: Node<GraphNodeData>[]) => Node<GraphNodeData>[]) => void,
) {
  const frameRef = useRef<number | null>(null);
  const velocityRef = useRef(new Map<string, { x: number; y: number }>());

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let ticks = 0;
    velocityRef.current = new Map();

    function step() {
      ticks += 1;
      setNodes((currentNodes) => {
        const nodeById = new Map(currentNodes.map((node) => [node.id, node]));
        const forces = new Map(currentNodes.map((node) => [node.id, { x: 0, y: 0 }]));

        for (let i = 0; i < currentNodes.length; i += 1) {
          for (let j = i + 1; j < currentNodes.length; j += 1) {
            const a = currentNodes[i];
            const b = currentNodes[j];
            const dx = b.position.x - a.position.x;
            const dy = b.position.y - a.position.y;
            const distanceSquared = Math.max(dx * dx + dy * dy, 1200);
            const distance = Math.sqrt(distanceSquared);
            const strength = 140000 / distanceSquared;
            const fx = (dx / distance) * strength;
            const fy = (dy / distance) * strength;

            forces.get(a.id)!.x -= fx;
            forces.get(a.id)!.y -= fy;
            forces.get(b.id)!.x += fx;
            forces.get(b.id)!.y += fy;
          }
        }

        for (const edge of edges) {
          const source = nodeById.get(edge.source);
          const target = nodeById.get(edge.target);
          if (!source || !target) continue;

          const dx = target.position.x - source.position.x;
          const dy = target.position.y - source.position.y;
          const distance = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const stretch = distance - 260;
          const strength = stretch * 0.018;
          const fx = (dx / distance) * strength;
          const fy = (dy / distance) * strength;

          forces.get(source.id)!.x += fx;
          forces.get(source.id)!.y += fy;
          forces.get(target.id)!.x -= fx;
          forces.get(target.id)!.y -= fy;
        }

        return currentNodes.map((node) => {
          const isCentral = node.id === currentNodes[0]?.id;
          const force = forces.get(node.id) ?? { x: 0, y: 0 };
          const gravity = node.id === currentNodes[0]?.id ? 0.08 : 0.012;
          force.x += -node.position.x * gravity;
          force.y += -node.position.y * gravity;

          const velocity = velocityRef.current.get(node.id) ?? { x: 0, y: 0 };
          velocity.x = (velocity.x + force.x) * 0.82;
          velocity.y = (velocity.y + force.y) * 0.82;
          velocityRef.current.set(node.id, velocity);

          if (isCentral) {
            return { ...node, position: { x: node.position.x + velocity.x * 0.25, y: node.position.y + velocity.y * 0.25 } };
          }

          return {
            ...node,
            position: {
              x: node.position.x + velocity.x,
              y: node.position.y + velocity.y,
            },
          };
        });
      });

      if (!cancelled && ticks < 240) {
        frameRef.current = window.requestAnimationFrame(step);
      }
    }

    frameRef.current = window.requestAnimationFrame(step);

    return () => {
      cancelled = true;
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [edges, enabled, graphKey, setNodes]);
}

function getVisibleBalanceEntries(
  entry: Entry,
  directRelationships: EntryRelationship[],
  entriesById: Map<string, Entry>,
) {
  const balanceEntries = new Map<string, Entry>([[entry.id, entry]]);

  for (const relationship of directRelationships) {
    if (relationship.target_type !== 'entry') continue;
    const relatedEntryId = relationship.entry_id === entry.id ? relationship.target_id : relationship.entry_id;
    const relatedEntry = entriesById.get(relatedEntryId);
    if (relatedEntry) {
      balanceEntries.set(relatedEntry.id, relatedEntry);
    }
  }

  return Array.from(balanceEntries.values()).sort((a, b) => {
    if (a.type !== b.type) return a.type === 'income' ? -1 : 1;
    return b.amount - a.amount;
  });
}

function buildGraph(
  entry: Entry,
  directRelationships: EntryRelationship[],
  entriesById: Map<string, Entry>,
  labelsById: Map<string, RelationshipLabel>,
  currency: Currency,
): { nodes: Node<GraphNodeData>[]; edges: Edge[] } {
  const nodes: Node<GraphNodeData>[] = [
    {
      id: `entry:${entry.id}`,
      position: { x: 0, y: 0 },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      data: {
        label: <NodeLabel title={entry.concept} subtitle={`${entry.type} · ${formatCurrency(entry.amount, currency)}`} />,
        title: entry.concept,
        subtitle: `${entry.type} · ${formatCurrency(entry.amount, currency)}`,
        kind: 'entry',
        entryId: entry.id,
      },
      style: nodeStyle('central'),
    },
  ];
  const edges: Edge[] = [];
  const radius = 300;

  directRelationships.forEach((relationship, index) => {
    const angle = (index / Math.max(directRelationships.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const target = describeRelationshipTarget(relationship, entry.id, entriesById, labelsById, currency);
    const targetId = `${target.kind}:${target.id}`;
    const targetPosition = positionForAngle(angle + Math.PI);

    nodes.push({
      id: targetId,
      position: {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      },
      sourcePosition: targetPosition,
      targetPosition,
      data: {
        label: <NodeLabel title={target.title} subtitle={target.subtitle} />,
        title: target.title,
        subtitle: target.subtitle,
        kind: target.kind,
        entryId: target.kind === 'entry' ? target.id : undefined,
        labelId: target.kind === 'label' ? target.id : undefined,
      },
      style: nodeStyle(target.kind),
    });

    edges.push({
      id: relationship.id,
      source: `entry:${entry.id}`,
      target: targetId,
      type: 'smoothstep',
      pathOptions: { borderRadius: 24, offset: 44 },
      markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(248,250,252,0.35)' },
      style: { stroke: 'rgba(248,250,252,0.35)', strokeWidth: 2 },
    });
  });

  return { nodes, edges };
}

function readStoredGraphPositions(storageKey: string) {
  if (typeof window === 'undefined') return new Map<string, { x: number; y: number }>();

  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? '{}') as Record<string, { x: number; y: number }>;
    return new Map(
      Object.entries(parsed).filter(([, position]) => Number.isFinite(position.x) && Number.isFinite(position.y)),
    );
  } catch {
    return new Map<string, { x: number; y: number }>();
  }
}

function writeStoredGraphPositions(storageKey: string, nodes: Node<GraphNodeData>[]) {
  if (typeof window === 'undefined') return;

  const positions = Object.fromEntries(nodes.map((node) => [node.id, node.position]));
  window.localStorage.setItem(storageKey, JSON.stringify(positions));
}

function applyStoredGraphPositions(nodes: Node<GraphNodeData>[], storedPositions: Map<string, { x: number; y: number }>) {
  if (storedPositions.size === 0) return nodes;

  return nodes.map((node) => {
    const stored = storedPositions.get(node.id);
    return stored ? { ...node, position: stored } : node;
  });
}

function positionForAngle(angle: number) {
  const normalized = Math.atan2(Math.sin(angle), Math.cos(angle));
  const absX = Math.abs(Math.cos(normalized));
  const absY = Math.abs(Math.sin(normalized));

  if (absX > absY) {
    return Math.cos(normalized) >= 0 ? Position.Right : Position.Left;
  }

  return Math.sin(normalized) >= 0 ? Position.Bottom : Position.Top;
}

function NodeLabel({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-left">
      <p className="truncate text-sm font-semibold">{title}</p>
      <p className="mt-1 truncate text-xs text-[var(--text-muted)]">{subtitle}</p>
    </div>
  );
}

function describeRelationshipTarget(
  relationship: EntryRelationship,
  entryId: string,
  entriesById: Map<string, Entry>,
  labelsById: Map<string, RelationshipLabel>,
  currency: Currency,
) {
  if (relationship.target_type === 'label') {
    const label = labelsById.get(relationship.target_id);
    return {
      id: relationship.target_id,
      kind: 'label' as const,
      title: label?.name ?? 'Missing label',
      subtitle: 'Relationship label',
    };
  }

  const relatedEntryId = relationship.entry_id === entryId ? relationship.target_id : relationship.entry_id;
  const relatedEntry = entriesById.get(relatedEntryId);
  return {
    id: relatedEntryId,
    kind: 'entry' as const,
    title: relatedEntry?.concept ?? 'Missing entry',
    subtitle: relatedEntry ? `${relatedEntry.type} · ${formatCurrency(relatedEntry.amount, currency)}` : 'Entry not found',
  };
}

function bestEntryForLabel(labelId: string, relationships: EntryRelationship[], entriesById: Map<string, Entry>) {
  const connectedEntries = relationships
    .filter((relationship) => relationship.target_type === 'label' && relationship.target_id === labelId)
    .map((relationship) => entriesById.get(relationship.entry_id))
    .filter((candidate): candidate is Entry => !!candidate);
  const incomes = connectedEntries.filter((candidate) => candidate.type === 'income').sort((a, b) => b.amount - a.amount);

  if (incomes[0]) return incomes[0];

  return connectedEntries.filter((candidate) => candidate.type === 'expense').sort((a, b) => b.amount - a.amount)[0] ?? null;
}

function relationshipBelongsToEntry(relationship: EntryRelationship, entryId: string) {
  if (relationship.entry_id === entryId) return true;
  return relationship.target_type === 'entry' && relationship.target_id === entryId;
}

function targetKey(target: RelationshipTargetInput) {
  if (target.target_type === 'new_label') return `new_label:${target.name.trim().toLowerCase()}`;
  return `${target.target_type}:${target.target_id}`;
}

function targetLabel(target: RelationshipTargetInput, entries: Entry[], labels: RelationshipLabel[]) {
  if (target.target_type === 'new_label') return target.name;
  if (target.target_type === 'entry') return entries.find((entry) => entry.id === target.target_id)?.concept ?? 'Entry';
  return labels.find((label) => label.id === target.target_id)?.name ?? 'Label';
}

function nodeStyle(kind: 'central' | 'entry' | 'label') {
  const base = {
    border: '1px solid var(--border)',
    borderRadius: 12,
    color: 'var(--text-primary)',
    padding: 14,
    width: 210,
    boxShadow: 'var(--shadow)',
  };

  if (kind === 'central') {
    return {
      ...base,
      background: 'linear-gradient(135deg, rgba(123,215,198,0.26), rgba(77,126,255,0.2)), var(--surface-elevated)',
      border: '1px solid rgba(123,215,198,0.5)',
    };
  }

  if (kind === 'label') {
    return {
      ...base,
      background: 'linear-gradient(135deg, rgba(125,77,255,0.22), rgba(123,215,198,0.12)), var(--surface)',
      border: '1px solid rgba(125,77,255,0.45)',
    };
  }

  return {
    ...base,
    background: 'var(--surface)',
  };
}
