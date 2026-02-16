import Link from 'next/link';

import { SignOutButton } from '@/components/auth-buttons';
import { ThemeToggle } from '@/components/theme-toggle';

export function DashboardHeader({ email }: { email: string }) {
  return (
    <header className="panel mb-6 flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.14em] muted">DreamMakers</p>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Finance Dashboard</h1>
        <nav className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <Link className="rounded-lg border px-3 py-1.5 hover:bg-white/5" href="/dashboard">
            Dashboard
          </Link>
          <Link className="rounded-lg border px-3 py-1.5 hover:bg-white/5" href="/settings">
            Settings
          </Link>
        </nav>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <p className="max-w-full truncate rounded-lg border px-3 py-2 text-xs muted">{email}</p>
        <ThemeToggle />
        <SignOutButton />
      </div>
    </header>
  );
}
