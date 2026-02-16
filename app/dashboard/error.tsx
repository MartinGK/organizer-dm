'use client';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="app-shell grid place-items-center">
      <section className="panel w-full max-w-xl p-8 text-center">
        <h2 className="text-xl font-semibold">Unable to load dashboard</h2>
        <p className="mt-2 text-sm muted">{error.message}</p>
        {error.digest ? <p className="mt-2 text-xs muted">Error reference: {error.digest}</p> : null}
        <button className="mt-5 rounded-lg border px-4 py-2 text-sm" onClick={reset}>
          Retry
        </button>
      </section>
    </main>
  );
}
