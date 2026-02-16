import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger';
};

export function Button({ className, variant = 'primary', ...props }: Props) {
  return (
    <button
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-medium transition-colors',
        variant === 'primary' &&
          'border-transparent text-white bg-[linear-gradient(90deg,var(--accent),var(--accent-alt),var(--accent-violet))] hover:brightness-110',
        variant === 'ghost' && 'bg-transparent hover:bg-white/5',
        variant === 'danger' && 'bg-[var(--danger)]/12 text-[var(--danger)] border-[var(--danger)]/20 hover:bg-[var(--danger)]/20',
        className,
      )}
      {...props}
    />
  );
}
