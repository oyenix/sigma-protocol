// components/connectwallet.tsx
'use client';

import { useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { 
  Wallet, 
  Loader2, 
  Copy, 
  Check, 
  ExternalLink, 
  ChevronDown,
  Power
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getChainConfig } from '@/lib/chains';

const formatAddress = (addr: string, len = 4) => {
  if (!addr) return '';
  return `${addr.substring(0, len + 2)}...${addr.substring(addr.length - len)}`;
};

export function ConnectWallet() {
  const { login, logout, ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const connectedWallet = wallets[0]; 

  const activeChainId = Number(connectedWallet?.chainId?.split(':')[1] || 8453);
  const chainData = getChainConfig(activeChainId);

  const handleCopy = () => {
    if (connectedWallet?.address) {
      navigator.clipboard.writeText(connectedWallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!ready) {
    return (
      <div className="h-10 px-4 flex items-center gap-2 border-2 border-black/20 dark:border-white/20 bg-muted/10">
        <Loader2 className="h-4 w-4 animate-spin opacity-50" />
        <span className="text-xs font-bold uppercase tracking-widest opacity-50">Loading...</span>
      </div>
    );
  }

  if (authenticated && connectedWallet) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        {/* FIX: Removed asChild and <Button>. Styled the Trigger directly. */}
        <PopoverTrigger className={cn(
          "flex items-center justify-center h-10 px-4 gap-2 rounded-none border-2 border-black dark:border-white bg-white dark:bg-[#080808] font-mono text-sm transition-all focus:outline-none",
          "hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black",
          isOpen 
            ? "bg-black text-white dark:bg-white dark:text-black translate-x-0.5 translate-y-0.5 shadow-none" 
            : "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
        )}>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-emerald-500 border border-black dark:border-white animate-pulse" />
            <span className="font-bold">
              {formatAddress(connectedWallet.address, 4)}
            </span>
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </PopoverTrigger>

        {/* FIX: Added z-[100] to punch through the navbar z-index */}
        <PopoverContent 
          className="z-100 w-80 p-0 mr-4 rounded-none border-2 border-black dark:border-white bg-white dark:bg-[#080808] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]" 
          align="end"
          sideOffset={8}
        >
          <div className="p-4 border-b-2 border-black dark:border-white bg-black/5 dark:bg-white/5">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 border-2 border-black dark:border-white flex items-center justify-center bg-primary text-primary-foreground">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="font-black italic uppercase text-sm tracking-tight">Connected</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                   <div className="h-1.5 w-1.5 bg-emerald-500" />
                   <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                     {chainData.name}
                   </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Wallet Address</label>
              <div className="flex items-center justify-between p-2 border-2 border-black dark:border-white bg-muted/10 group hover:bg-primary/5 transition-colors">
                <code className="text-xs font-mono font-bold truncate max-w-45">
                  {connectedWallet.address}
                </code>
                <button 
                  onClick={handleCopy}
                  className="p-1 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                  title="Copy Address"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500"/> : <Copy className="h-3.5 w-3.5"/>}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <Button 
                 variant="outline" 
                 size="sm" 
                 className="w-full h-10 rounded-none border-2 border-black dark:border-white font-bold uppercase text-[10px] hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
                 onClick={() => window.open(`${chainData.explorer}/address/${connectedWallet.address}`, '_blank')}
               >
                 <ExternalLink className="h-3 w-3 mr-2" />
                 Explorer
               </Button>
               
               <Button 
                 variant="ghost" 
                 size="sm" 
                 className="w-full h-10 rounded-none border-2 border-red-500 text-red-600 hover:bg-red-500 hover:text-white font-bold uppercase text-[10px]"
                 onClick={logout}
               >
                 <Power className="h-3 w-3 mr-2" />
                 Disconnect
               </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Button
      onClick={login}
      className="h-10 px-6 gap-2 rounded-none border-2 border-black dark:border-white bg-primary text-primary-foreground font-black uppercase italic shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
    >
      <Wallet className="h-4 w-4" />
      Connect Wallet
    </Button>
  );
}