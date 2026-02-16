export function DashboardSkeleton() {
  return (
    <main className="app-shell space-y-6">
      <div className="skeleton h-20 rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="skeleton h-32 rounded-2xl" />
        ))}
      </div>
      <div className="skeleton h-72 rounded-2xl" />
      <div className="skeleton h-96 rounded-2xl" />
    </main>
  );
}
