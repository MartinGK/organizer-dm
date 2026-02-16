import type { SelectHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-10 w-full rounded-lg border bg-[var(--surface-elevated)] px-3 text-sm outline-none ring-[var(--accent)] focus:ring-2',
        className,
      )}
      {...props}
    />
  );
}
