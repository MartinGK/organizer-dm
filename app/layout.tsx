import type { Metadata } from 'next';
import localFont from 'next/font/local';
import type { ReactNode } from 'react';

import { Providers } from '@/components/providers';

import './globals.css';

const executiveSans = localFont({
  src: './fonts/geist-latin.woff2',
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DreamMakers Finance',
  description: 'Executive-grade internal financial dashboard.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body className={`${executiveSans.variable} font-[var(--font-manrope)]`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
