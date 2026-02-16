'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';

function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark';
  const stored = window.localStorage.getItem('dm_theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return 'dark';
}

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    const theme = getInitialTheme();
    document.documentElement.dataset.theme = theme;
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}
