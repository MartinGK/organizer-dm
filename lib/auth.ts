import { getServerSession, type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { redirect } from 'next/navigation';

import { allowedEmails, env } from '@/lib/env';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    signIn({ user }) {
      const email = user.email?.toLowerCase();
      if (!email || !allowedEmails.has(email)) {
        return '/access-denied';
      }
      return true;
    },
    session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = token.email;
      }
      return session;
    },
  },
  pages: {
    signIn: '/sign-in',
  },
  secret: env.NEXTAUTH_SECRET,
};

export async function getAuthSession() {
  return getServerSession(authOptions);
}

export async function requireAllowedUser() {
  const session = await getAuthSession();
  const email = session?.user?.email?.toLowerCase();

  if (!session || !email) {
    redirect('/sign-in');
  }

  if (!allowedEmails.has(email)) {
    redirect('/access-denied');
  }

  return session;
}

export async function assertApiAllowedUser() {
  const session = await getAuthSession();
  const email = session?.user?.email?.toLowerCase();

  if (!session || !email) {
    return { ok: false as const, status: 401, code: 'UNAUTHORIZED' };
  }

  if (!allowedEmails.has(email)) {
    return { ok: false as const, status: 403, code: 'FORBIDDEN' };
  }

  return { ok: true as const, session };
}
