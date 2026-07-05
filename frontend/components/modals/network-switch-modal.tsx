'use client';

import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useWallet } from '@/components/providers/wallet-context'; // adjust path
import { SUPPORTED_CHAINS, getChainConfig } from '@/lib/chains';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export function NetworkSwitchModal() {
  const { isConnected, chainId, switchChain } = useWallet();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isConnected || !chainId) { setIsOpen(false); return; }
    setIsOpen(!Object.keys(SUPPORTED_CHAINS).includes(String(chainId)));
  }, [isConnected, chainId]);

  const handleSwitch = async () => {
    await switchChain(968); // Botchain
    setIsOpen(false);
  };

  if (!isConnected || !isOpen) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="rounded-none border-2 border-black dark:border-white bg-white dark:bg-[#080808] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <AlertDialogTitle className="font-black uppercase tracking-widest text-lg">Unsupported Network</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2 font-mono text-sm">
            You are on an unsupported network. Please switch to Botchain to continue.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="bg-muted/10 p-3 border-2 border-black dark:border-white mt-4 text-sm">
          <div className="flex justify-between">
            <span className="font-bold uppercase text-[10px] opacity-60 tracking-widest">Supported:</span>
            <span className="font-mono font-bold text-xs">Botchain (968)</span>
          </div>
          <div className="flex justify-between pt-2 border-t-2 border-black/10 dark:border-white/10 mt-2">
            <span className="font-bold uppercase text-[10px] opacity-60 tracking-widest">Your Chain:</span>
            <span className="font-mono text-xs text-red-500 font-bold">Chain ID: {chainId ?? 'Unknown'}</span>
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <AlertDialogAction onClick={handleSwitch}
            className="rounded-none border-2 border-black dark:border-white bg-primary text-primary-foreground font-black uppercase text-xs hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all"
          >
            Switch to Botchain
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}