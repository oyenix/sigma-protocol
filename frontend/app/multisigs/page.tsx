'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Wallet, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { MultisigCard } from '@/components/multisig-card';
import Link from 'next/link';
import { useWallets, usePrivy } from '@privy-io/react-auth';
import { initializeProvider, getUserMultiSigs } from '@/lib/web3';

export default function MultisigsPage() {
  const { ready, authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [userMultisigs, setUserMultisigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMyMultisigs = async () => {
      if (ready && authenticated && wallets && wallets.length > 0) {
        try {
          setLoading(true);
          setError(null);
          
          await initializeProvider(wallets[0]);
          const address = wallets[0].address;
          const rawData = await getUserMultiSigs(address);
          
          const formattedData = rawData.map((m: any) => ({
            name: m.name || 'Unnamed Treasury',
            controller: m.controllerAddress,
            wallet: m.walletAddress,
            balance: m.balance || '0',
            isCreator: m.isOwner,
            owners: m.owners || [],
            config: m.config || {
              paused: false,
              requiredPercentage: 0,
              timelockPeriod: 0,
              expiryPeriod: 0,
              minOwners: 0
            }
          }));
          
          setUserMultisigs(formattedData);
        } catch (err: any) {
          console.error("Fetch Error:", err);
          setError(err.message || "Failed to load multisigs");
        } finally {
          setLoading(false);
        }
      } else if (ready && !authenticated) {
        setLoading(false);
      }
    };

    fetchMyMultisigs();
  }, [ready, wallets, authenticated]);

  const filteredMultisigs = userMultisigs.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.controller.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.wallet.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!ready || (loading && userMultisigs.length === 0)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-[#080808]">
        <div className="h-12 w-12 border-4 border-black dark:border-white border-b-transparent animate-spin rounded-full mb-4" />
        <p className="font-black italic uppercase tracking-widest animate-pulse">Scanning Network...</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center text-center bg-white dark:bg-[#080808]">
        <div className="max-w-md w-full border-2 border-black dark:border-white p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
            <Wallet className="h-12 w-12 mx-auto mb-6 text-black dark:text-white" />
            <h2 className="text-3xl font-black italic uppercase mb-2">Restricted Access</h2>
            <p className="text-muted-foreground mb-8 font-medium">Connect your wallet to access the Treasury Terminal.</p>
            <Button onClick={login} size="lg" className="w-full rounded-none border-2 border-black dark:border-white font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">
              Connect Wallet
            </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-white dark:bg-[#080808] text-black dark:text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row justify-between items-end md:items-center gap-6 border-b-2 border-black dark:border-white pb-8">
          <div>
            <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter mb-2">
              My Treasuries
            </h1>
            <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">
              / Index / Managed_Vaults
            </p>
          </div>
          <Link href="/create">
            <Button size="lg" className="h-14 px-8 rounded-none border-2 border-black dark:border-white font-black uppercase italic shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">
              <Plus className="h-5 w-5 mr-2" /> 
              Initialize New
            </Button>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="mb-10 relative max-w-lg">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <Search className="h-5 w-5 text-black dark:text-white" />
          </div>
          <Input
            placeholder="SEARCH PROTOCOLS..."
            className="pl-12 h-14 rounded-none border-2 border-black dark:border-white bg-transparent font-bold uppercase placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary text-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {error && (
          <div className="mb-8 p-6 border-2 border-red-500 bg-red-500/5 text-red-600 font-bold uppercase">
            <span className="underline decoration-2 underline-offset-4 mr-2">Error:</span> {error}
          </div>
        )}

        {/* Grid */}
        {filteredMultisigs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredMultisigs.map((multisig) => (
              // Ensure MultisigCard accepts className or is styled internally to match
              <MultisigCard key={multisig.controller} multisig={multisig} />
            ))}
          </div>
        ) : (
          <div className="border-2 border-dashed border-black/20 dark:border-white/20 py-32 text-center">
            <p className="text-2xl font-black italic uppercase text-muted-foreground mb-4">No Data Found</p>
            <Link href="/create" className="text-primary font-bold uppercase hover:underline decoration-2 underline-offset-4">
              Initialize a new Treasury to begin
            </Link>
          </div>
        )}
      </div>
      
    </div>
  );
}