export default function AccessDeniedPage() {
  return (
    <main className="app-shell grid place-items-center">
      <section className="panel w-full max-w-xl p-10 text-center">
        <p className="text-xs uppercase tracking-[0.16em] muted">Access Control</p>
        <h1 className="mt-3 text-3xl font-semibold">Access denied</h1>
        <p className="mt-3 text-sm muted">
          Your Google account is not in the allowlist for this internal dashboard.
        </p>
      </section>
    </main>
  );
}
