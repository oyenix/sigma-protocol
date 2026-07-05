'use client';

import { WalletProvider } from '@/components/providers/wallet-context';
import { NetworkSwitchModal } from '@/components/modals/network-switch-modal';
import { ConnectWalletModal } from '@/components/modals/connect-wallet-modal';
import { Navbar } from '@/components/Navbar';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <ConnectWalletModal />
      <NetworkSwitchModal />
      <Navbar />
      {children}
    </WalletProvider>
  );
}

export function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}