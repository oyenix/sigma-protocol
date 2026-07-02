'use client';

import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useWallets } from '@privy-io/react-auth';
import { SUPPORTED_CHAINS, getChainConfig } from '@/lib/chains';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function NetworkSwitchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { wallets } = useWallets();
  
  const primaryWallet = wallets[0];
  const activeChainId = Number(primaryWallet?.chainId?.split(':')[1] || 0);

  useEffect(() => {
    // If no wallet is connected, close the modal
    if (!primaryWallet) {
      setIsOpen(false);
      return;
    }

    // Check if the current chain ID exists in your lib/chains.ts configuration
    const isSupported = Object.keys(SUPPORTED_CHAINS).includes(String(activeChainId));

    // Open modal ONLY if the connected chain is not in your supported list
    setIsOpen(!isSupported);
  }, [primaryWallet, activeChainId]);

  const handleSwitchNetwork = async () => {
    if (primaryWallet) {
      try {
        // Fallback to Base Sepolia (84532) or your preferred default testnet
        await primaryWallet.switchChain(84532);
        setIsOpen(false);
      } catch (error) {
        console.error('Failed to switch network:', error);
      }
    }
  };

  // Render nothing if no wallet is connected or if they are on a supported chain
  if (!primaryWallet || isOpen === false) {
    return null;
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="rounded-none border-2 border-black dark:border-white bg-white dark:bg-[#080808] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <AlertDialogTitle className="font-black uppercase tracking-widest text-lg">Unsupported Network</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2 font-mono text-sm">
            You are currently connected to an unsupported network. Please switch to a supported testnet to continue managing your treasuries.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="bg-muted/10 p-3 rounded-none text-sm border-2 border-black dark:border-white mt-4">
          <div className="flex justify-between mb-2">
             <span className="font-bold uppercase text-[10px] opacity-60 tracking-widest">Supported Networks:</span>
             <span className="font-mono font-bold text-xs text-right">
                Base, Arbitrum, OP, Celo, etc.
             </span>
          </div>
          <div className="flex justify-between pt-2 border-t-2 border-black/10 dark:border-white/10">
             <span className="font-bold uppercase text-[10px] opacity-60 tracking-widest">Your Connection:</span>
             <span className="font-mono text-xs text-red-500 font-bold">
                Chain ID: {activeChainId || 'Unknown'}
             </span>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <AlertDialogAction 
            onClick={handleSwitchNetwork}
            className="rounded-none border-2 border-black dark:border-white bg-primary text-primary-foreground font-black uppercase text-xs hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all"
          >
            Switch to Base Sepolia
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}