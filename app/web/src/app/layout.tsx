import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'], weight: 'variable', display: 'swap', variable: '--font-inter' });
import { MockProvider } from '../lib/store';
import { NearAuthProvider } from '../lib/near/auth';
import '@near-wallet-selector/modal-ui/styles.css';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL("https://app.calis.scientivan.dev"),
  title: 'Kalis',
  description: 'Private methods, shared progress. Connected testnet workspace with a separate mock demo.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <NearAuthProvider><MockProvider>{children}</MockProvider></NearAuthProvider>
      </body>
    </html>
  );
}
