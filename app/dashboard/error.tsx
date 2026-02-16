'use client';

import { signOut } from 'next-auth/react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  async function clearSessionAndRetryAuth() {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // Ignore storage clear failures.
    }

    try {
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
      }
    } catch {
      // Ignore cache clear failures.
    }

    try {
      const indexedDbWithDatabases = indexedDB as IDBFactory & {
        databases?: () => Promise<Array<{ name?: string }>>;
      };

      if (typeof indexedDbWithDatabases.databases === 'function') {
        const dbs = await indexedDbWithDatabases.databases();
        await Promise.all(
          dbs.map(
            (db) =>
              new Promise<void>((resolve) => {
                if (!db.name) {
                  resolve();
                  return;
                }

                const request = indexedDB.deleteDatabase(db.name);
                request.onsuccess = () => resolve();
                request.onerror = () => resolve();
                request.onblocked = () => resolve();
              }),
          ),
        );
      }
    } catch {
      // Ignore indexedDB clear failures.
    }

    try {
      await signOut({ redirect: false, callbackUrl: '/sign-in?sessionReset=1' });
    } catch {
      // Fallback below handles navigation even if signOut fails.
    }

    window.location.href = '/sign-in?sessionReset=1';
  }

  return (
    <main className="app-shell grid place-items-center">
      <section className="panel w-full max-w-xl p-8 text-center">
        <h2 className="text-xl font-semibold">Unable to load dashboard</h2>
        <p className="mt-2 text-sm muted">{error.message}</p>
        {error.digest ? <p className="mt-2 text-xs muted">Error reference: {error.digest}</p> : null}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button className="rounded-lg border px-4 py-2 text-sm" onClick={reset}>
            Retry
          </button>
          <button className="rounded-lg border px-4 py-2 text-sm" onClick={clearSessionAndRetryAuth}>
            Clear session data
          </button>
        </div>
      </section>
    </main>
  );
}
