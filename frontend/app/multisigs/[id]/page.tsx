'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Copy, Plus, Layers, Wallet, Check, AlertTriangle, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MultisigTabs } from '@/components/multisig-tabs';
import { useWallets, usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { 
  getMultisigOwners, 
  getMultisigConfig, 
  getWalletBalance, 
  initializeProvider,
  getConnectedWalletAddress,
  getTransaction
} from '@/lib/web3';
import { MultiSig, Transaction } from '@/lib/types';
import { cn } from '@/lib/utils';

// Modals
import { SubmitTransactionModal } from '@/components/modals/submit-transaction-modal';
import { BatchConfirmModal } from '@/components/modals/batch-confirm-modal';

export default function MultisigDetailPage() {
  const params = useParams();
  const controllerAddress = params.id as string;
  const { ready, authenticated, login } = usePrivy();
  const { wallets } = useWallets();

  const [multisig, setMultisig] = useState<MultiSig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Modal States
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  useEffect(() => {
    const fetchMultisigDetail = async () => {
      if (ready && authenticated && wallets && wallets.length > 0) {
        try {
          setLoading(true);
          setError(null);
          
          await initializeProvider(wallets[0]);

          const walletAddress = await getConnectedWalletAddress(controllerAddress);

          // Fetch basic data
          const [ownersData, configData, balance] = await Promise.all([
            getMultisigOwners(controllerAddress),
            getMultisigConfig(controllerAddress),
            getWalletBalance(walletAddress), 
          ]);

          // Fetch Transactions
          const recentTxs: Transaction[] = [];
          for (let i = 0; i < 20; i++) {
            try {
              const tx = await getTransaction(controllerAddress, i);
              if (tx.initiator !== '0x0000000000000000000000000000000000000000') {
                recentTxs.push({ 
                  id: i, 
                  ...tx,
                  confirmations: [] 
                });
              } else {
                break; 
              }
            } catch (e) { 
              break; 
            }
          }

          const rawAddresses = ownersData?.addresses || [];
          const rawNames = ownersData?.names || [];
          const rawPercentages = ownersData?.percentages || [];
          const rawRemovables = ownersData?.removables || [];

          const ownerList = rawAddresses.map((addr: string, i: number) => ({
            address: addr,
            name: rawNames[i] || `Owner ${i + 1}`,
            percentage: Number(rawPercentages[i]), 
            removable: rawRemovables[i] || false,
          }));

          const fullMultisig: MultiSig = {
            controller: controllerAddress,
            wallet: walletAddress,
            name: configData.name || 'Unnamed Treasury',
            owners: ownerList,
            config: {
              ...configData,
              requiredPercentage: Number(configData.requiredPercentage),
              timelockPeriod: Number(configData.timelockPeriod),
              expiryPeriod: Number(configData.expiryPeriod),
              minOwners: Number(configData.minOwners),
            },
            balance,
            transactions: recentTxs.sort((a, b) => b.id - a.id),
            deployed: Date.now(),
          };

          setMultisig(fullMultisig);
        } catch (err: any) {
          console.error("Error loading multisig:", err);
          setError(err.message || 'Failed to load multisig details');
        } finally {
          setLoading(false);
        }
      }
    };

    if (controllerAddress && ready) {
      fetchMultisigDetail();
    }
  }, [controllerAddress, ready, authenticated, wallets]);

  // --- RENDERING STATES ---

  if (ready && !authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-white dark:bg-[#080808]">
        <div className="max-w-md w-full text-center border-2 border-black dark:border-white p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
          <Wallet className="h-16 w-16 mx-auto mb-6 text-black dark:text-white" />
          <h2 className="text-2xl font-black italic uppercase mb-4">Access Denied</h2>
          <Button onClick={login} size="lg" className="w-full rounded-none border-2 border-black dark:border-white font-bold uppercase hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  if (loading || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#080808]">
         <div className="flex flex-col items-center">
            <div className="h-16 w-16 border-4 border-black dark:border-white border-t-transparent animate-spin rounded-full mb-6" />
            <p className="font-black italic uppercase tracking-widest text-xl animate-pulse">Initializing System...</p>
         </div>
      </div>
    );
  }

  if (error || !multisig) {
    return (
      <div className="min-h-screen p-8 flex flex-col items-center justify-center bg-white dark:bg-[#080808]">
        <div className="max-w-md w-full border-2 border-red-500 bg-red-500/5 p-8 text-center shadow-[8px_8px_0px_0px_rgba(239,68,68,1)]">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 font-black uppercase text-xl mb-2">System Error</p>
          <p className="font-mono text-sm text-red-500/80 mb-6">{error}</p>
          <Link href="/multisigs">
            <Button variant="outline" className="border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-none font-bold uppercase">
              Return to Base
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-white dark:bg-[#080808] text-black dark:text-white">
      <div className="max-w-7xl mx-auto">
        
        {/* Back Button */}
        <Link href="/multisigs" className="inline-block mb-8">
          <Button variant="ghost" size="sm" className="rounded-none border-2 border-transparent hover:border-black dark:hover:border-white font-bold uppercase tracking-wider pl-2 pr-4">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Dashboard
          </Button>
        </Link>

        {/* Header Section */}
        <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-8 border-b-2 border-black dark:border-white pb-8 mb-12">
          <div className="space-y-6 flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
               <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter">
                  {multisig.name}
               </h1>
               <div className={cn(
                 "px-4 py-1 border-2 text-sm font-black uppercase tracking-widest w-fit",
                 multisig.config.paused 
                   ? "border-red-500 text-red-500 bg-red-500/10" 
                   : "border-emerald-500 text-emerald-500 bg-emerald-500/10"
               )}>
                  {multisig.config.paused ? 'System Halted' : 'Operational'}
               </div>
            </div>
            
            {/* Address Blocks */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Controller Box */}
              <div className="group flex items-center gap-3 border-2 border-black dark:border-white p-3 bg-muted/10 hover:bg-primary/5 transition-colors cursor-pointer" onClick={() => handleCopy(multisig.controller, 'controller')}>
                 <div className="bg-black dark:bg-white text-white dark:text-black p-1">
                    <Terminal className="h-4 w-4" />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Controller</span>
                    <code className="text-sm font-mono font-bold">
                      {multisig.controller.slice(0,6)}...{multisig.controller.slice(-4)}
                    </code>
                 </div>
                 {copied === 'controller' ? <Check className="h-4 w-4 text-emerald-500 ml-2"/> : <Copy className="h-4 w-4 opacity-50 ml-2 group-hover:opacity-100"/>}
              </div>

              {/* Wallet Box */}
              <div className="group flex items-center gap-3 border-2 border-black dark:border-white p-3 bg-muted/10 hover:bg-primary/5 transition-colors cursor-pointer" onClick={() => handleCopy(multisig.wallet, 'wallet')}>
                 <div className="bg-primary text-primary-foreground p-1">
                    <Wallet className="h-4 w-4" />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Safe Vault</span>
                    <code className="text-sm font-mono font-bold">
                      {multisig.wallet.slice(0,6)}...{multisig.wallet.slice(-4)}
                    </code>
                 </div>
                 {copied === 'wallet' ? <Check className="h-4 w-4 text-emerald-500 ml-2"/> : <Copy className="h-4 w-4 opacity-50 ml-2 group-hover:opacity-100"/>}
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
             <Button 
                variant="outline" 
                onClick={() => setIsBatchModalOpen(true)} 
                className="h-14 px-6 rounded-none border-2 border-black dark:border-white font-black uppercase italic hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all"
             >
                <Layers className="h-5 w-5 mr-2" />
                Batch Op
             </Button>
             
             <Button 
                onClick={() => setIsSubmitModalOpen(true)} 
                className="h-14 px-8 rounded-none border-2 border-black dark:border-white font-black uppercase italic shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
             >
                <Plus className="h-5 w-5 mr-2" />
                New Proposal
             </Button>
          </div>
        </div>

        {/* Tabs Section */}
        <MultisigTabs multisig={multisig} />
      </div>

      <SubmitTransactionModal 
         isOpen={isSubmitModalOpen} 
         onClose={() => setIsSubmitModalOpen(false)} 
         controllerAddress={multisig.controller}
         defaultTab="transfer"
      />
      
      <BatchConfirmModal 
         isOpen={isBatchModalOpen} 
         onClose={() => setIsBatchModalOpen(false)} 
         multisig={multisig}
      />
      
    </div>
  );
}