'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof document === 'undefined') {
      return 'dark';
    }
    const existing = document.documentElement.dataset.theme;
    if (existing === 'light' || existing === 'dark') {
      return existing;
    }
    return 'dark';
  });

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem('dm_theme', next);
  }

  return (
    <Button variant="ghost" onClick={toggle}>
      {theme === 'dark' ? 'Light mode' : 'Dark mode'}
    </Button>
  );
}
