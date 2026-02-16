import { redirect } from 'next/navigation';

import { getAuthSession } from '@/lib/auth';
import { allowedEmails } from '@/lib/env';

export default async function HomePage() {
  const session = await getAuthSession();
  const email = session?.user?.email?.toLowerCase();

  if (!email) {
    redirect('/sign-in');
  }

  if (!allowedEmails.has(email)) {
    redirect('/access-denied');
  }

  redirect('/dashboard');
}
