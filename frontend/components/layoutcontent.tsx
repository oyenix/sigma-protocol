// components/layoutcontent.tsx (or wherever ClientProviders is located)
'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { Web3Provider } from '@/components/providers/web3provider';
import { NetworkSwitchModal } from '@/components/modals/network-switch-modal';
import { Navbar } from '@/components/Navbar';
// 1. IMPORT ALL CHAINS FROM VIEM
import { 
  baseSepolia, 
  arbitrumSepolia, 
  liskSepolia, 
  bscTestnet, 
  celoSepolia, 
  avalancheFuji, 
  optimismGoerli, 
  polygonAmoy,
  tempoTestnet // Keeping testnet just in case
} from 'viem/chains';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  // Safe fallback if env var is missing during build
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "placeholder-for-build";

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ['wallet', 'email', 'google', 'github'],
        appearance: {
          theme: 'dark',
          accentColor: '#7B2CBF',
          logo: '/logo.png',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        // 2. PASS CHAINS TO PRIVY
        supportedChains: [
          baseSepolia, 
          arbitrumSepolia, 
          liskSepolia, 
          bscTestnet, 
          celoSepolia, 
          avalancheFuji, 
          optimismGoerli, 
          polygonAmoy,
          tempoTestnet
        ],
        defaultChain: baseSepolia, // Base Sepolia is a great default for low fees
      }}
    >
      <Web3Provider>
        <NetworkSwitchModal />
        <Navbar />
        {children}
      </Web3Provider>
    </PrivyProvider>
  );
}

export function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}