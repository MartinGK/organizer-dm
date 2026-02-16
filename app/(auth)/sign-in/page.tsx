import { redirect } from 'next/navigation';

import { SignInButton } from '@/components/auth-buttons';
import { getAuthSession } from '@/lib/auth';

export default async function SignInPage() {
  const session = await getAuthSession();

  if (session?.user?.email) {
    redirect('/dashboard');
  }

  return (
    <main className="app-shell grid place-items-center">
      <section className="panel w-full max-w-md p-10 text-center">
        <p className="mb-3 text-xs uppercase tracking-[0.16em] muted">DreamMakers</p>
        <h1 className="text-3xl font-semibold tracking-tight">Finance Console</h1>
        <p className="mt-3 text-sm muted">
          Secure internal access for financial visibility, recurring costs, and monthly projections.
        </p>
        <div className="mt-8 flex justify-center">
          <SignInButton />
        </div>
      </section>
    </main>
  );
}
