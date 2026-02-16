'use client';

import { signIn, signOut } from 'next-auth/react';

import { Button } from '@/components/ui/button';

export function SignInButton() {
  return (
    <Button onClick={() => signIn('google', { callbackUrl: '/dashboard' })}>
      Continue with Google
    </Button>
  );
}

export function SignOutButton() {
  return (
    <Button variant="ghost" onClick={() => signOut({ callbackUrl: '/sign-in' })}>
      Sign out
    </Button>
  );
}
