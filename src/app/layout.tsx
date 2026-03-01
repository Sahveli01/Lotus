import type { Metadata } from 'next';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/providers/AppProviders';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LOTUS — No-Loss Savings on Stellar',
  description: 'Deposit USDC. Keep your principal. Win the yield. Built on Stellar.',
  openGraph: {
    title: 'LOTUS Protocol',
    description: 'No-Loss Savings. Your principal is always safe.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${cormorant.variable} ${dmSans.variable}`}>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
