import type { Metadata } from 'next';
import './globals.css';
import { EthereumProvider } from '@/lib/ethereum';

export const metadata: Metadata = {
  title: 'ESCROW DApp - Secure Token Swaps',
  description: 'Decentralized application for secure peer-to-peer token swaps with escrow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <EthereumProvider>
          {children}
        </EthereumProvider>
      </body>
    </html>
  );
}
