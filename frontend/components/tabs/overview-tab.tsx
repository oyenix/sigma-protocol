'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MultiSig } from '@/lib/types'; 
import { Copy, Send, Check, ExternalLink, Wallet, Clock, ArrowRightLeft, Coins, RefreshCw, Loader2 } from 'lucide-react';
import { SubmitTransactionModal } from '@/components/modals/submit-transaction-modal';
import { AssetsModal } from '@/components/tabs/asset-modal';
import { formatAmount } from '@/lib/format';
import { useWallets } from '@privy-io/react-auth';
import { ethers, BrowserProvider, Contract } from 'ethers';

interface OverviewTabProps {
  multisig: MultiSig;
}

// 1. TOKEN CONFIG
const TOKEN_OPTIONS = [
  { name: 'Mento Dollar', symbol: 'USDm', address: '0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b', coingeckoId: 'celo-dollar' },
  { name: 'Mento USDC (Testnet)', symbol: 'USDC', address: '0xBD63e46Be8eF8D89dFde3054E7b9ECAEb8Ad83e9', coingeckoId: 'celo-euro' },
  { name: 'WETH', symbol: 'WETH', address: '0x4200000000000000000000000000000000000006', coingeckoId: 'weth' },
];

const ERC20_ABI = ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"];

export function OverviewTab({ multisig }: OverviewTabProps) {
  const { wallets } = useWallets();
  const [copied, setCopied] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isAssetsModalOpen, setIsAssetsModalOpen] = useState(false);

  // 2. VALUE STATE
  const [totalValueUsd, setTotalValueUsd] = useState<number | null>(null);
  const [isLoadingValue, setIsLoadingValue] = useState(false);
  const [assetBreakdown, setAssetBreakdown] = useState<{symbol: string, balance: string}[]>([]);

  // ... inside OverviewTab component

  const fetchTreasuryValue = async () => {
    if (!wallets[0] || !multisig.wallet) return;
    
    setIsLoadingValue(true);
    try {
      const provider = await wallets[0].getEthereumProvider();
      const ethersProvider = new BrowserProvider(provider);

      // A. Get Prices
      let prices: Record<string, number> = { 
         'celo': 0.60, 'celo-dollar': 1.00, 'celo-euro': 1.08, 'weth': 2500 
      };

      try {
         const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=celo,celo-dollar,celo-euro,weth&vs_currencies=usd');
         const data = await response.json();
         if(data.celo) prices['celo'] = data.celo.usd;
         if(data['celo-dollar']) prices['celo-dollar'] = data['celo-dollar'].usd;
         if(data['celo-euro']) prices['celo-euro'] = data['celo-euro'].usd;
         if(data.weth) prices['weth'] = data.weth.usd;
      } catch (e) {
         console.warn("Using default prices");
      }

      // B. Native Value
      const nativeBalance = parseFloat(multisig.balance);
      const nativeUsd = nativeBalance * prices['celo'];
      
      const breakdown = [{ symbol: 'CELO', balance: nativeBalance.toFixed(2) }];

      // C. Token Values
      let tokensUsd = 0;
      
      for (const token of TOKEN_OPTIONS) {
        if (token.address === 'custom') continue;

        try {
           const contract = new Contract(token.address, ERC20_ABI, ethersProvider);
           const [bal, decimals] = await Promise.all([
              contract.balanceOf(multisig.wallet),
              contract.decimals().catch(() => 18)
           ]);
           
           const formattedBal = parseFloat(ethers.formatUnits(bal, decimals));
           const price = prices[token.coingeckoId] || 0;
           
           // ALWAYS calculate value
           const val = formattedBal * price;
           tokensUsd += val;

           // CHANGED: Always push to breakdown, even if balance is 0
           breakdown.push({ 
             symbol: token.symbol, 
             balance: formattedBal.toFixed(2) 
           });
           
        } catch (e) {
           console.warn(`Failed to load ${token.symbol}`);
        }
      }

      setAssetBreakdown(breakdown);
      setTotalValueUsd(nativeUsd + tokensUsd);

    } catch (err) {
      console.error("Treasury calculation failed", err);
    } finally {
      setIsLoadingValue(false);
    }
  };

  useEffect(() => {
     fetchTreasuryValue();
  }, [multisig.wallet, wallets[0]]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pendingTxs = multisig.transactions.filter(tx => !tx.executed).length;
  const recentTransactions = [...multisig.transactions].slice(0, 3);
  const activeTimelocks = multisig.transactions.filter(tx => !tx.executed && Number(tx.timelockEnd) > Date.now() / 1000);
  const nextUnlockTime = activeTimelocks.length > 0 ? new Date(Number(activeTimelocks[0].timelockEnd) * 1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* TOTAL VALUE CARD */}
        <Card className="md:col-span-2 border-border bg-card shadow-sm relative overflow-hidden">
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4" /> Total Treasury Value
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-baseline gap-2">
              {isLoadingValue ? (
                 <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                    <span className="text-4xl font-bold bg-muted h-10 w-32 rounded"></span>
                 </div>
              ) : (
                 <>
                    <span className="text-4xl font-bold text-foreground">
                       ${(totalValueUsd || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </span>
                    <span className="text-xl font-medium text-muted-foreground">USD</span>
                 </>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded-lg w-fit">
               <span className="opacity-70 text-xs uppercase tracking-wider font-semibold">Wallet</span>
               <code className="font-mono bg-background px-1.5 py-0.5 rounded border text-xs">
                  {multisig.wallet.slice(0, 8)}...{multisig.wallet.slice(-6)}
               </code>
               <button onClick={() => handleCopy(multisig.wallet)} className="hover:text-primary ml-1 transition-colors">
                 {copied ? <Check className="h-3.5 w-3.5 text-emerald-500"/> : <Copy className="h-3.5 w-3.5"/>}
               </button>
               <button onClick={fetchTreasuryValue} disabled={isLoadingValue} className="ml-2 hover:text-primary">
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoadingValue ? 'animate-spin' : ''}`} />
               </button>
            </div>
            
            {!isLoadingValue && assetBreakdown.length > 0 && (
               <div className="mt-4 flex gap-2 flex-wrap">
                  {assetBreakdown.map((asset) => (
                     <div key={asset.symbol} className="text-[10px] bg-background border px-2 py-1 rounded-md whitespace-nowrap opacity-80">
                        <span className="font-bold">{asset.balance}</span> {asset.symbol}
                     </div>
                  ))}
               </div>
            )}
          </CardContent>
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        </Card>

        {/* STATUS CARD */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" /> Pending Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-3xl font-bold">{pendingTxs}</div>
              <p className="text-xs text-muted-foreground">Transactions awaiting approval</p>
            </div>
            <div className="pt-4 border-t border-border/50">
               <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Timelock:</span>
                  <span className="font-mono bg-muted px-1.5 rounded text-xs">{(Number(multisig.config.timelockPeriod) / 3600).toFixed(1)}h</span>
               </div>
               {nextUnlockTime && (
                 <div className="flex justify-between text-sm text-orange-500 font-medium">
                    <span>Next Unlock:</span>
                    <span>{nextUnlockTime}</span>
                 </div>
               )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
         <Button 
            variant="default" 
            size="lg" 
            className="h-auto py-6 flex flex-col items-center gap-2 shadow-sm hover:shadow-md transition-all border border-primary/20"
            onClick={() => setIsSubmitModalOpen(true)}
         >
            <Send className="h-6 w-6" />
            <span className="font-semibold">New Transaction</span>
         </Button>
         <Button 
            variant="outline" 
            size="lg" 
            className="h-auto py-6 flex flex-col items-center gap-2 hover:bg-muted/50 transition-all border-primary"
            onClick={() => setIsAssetsModalOpen(true)}
         >
            <Coins className="h-6 w-6 opacity-70 text-orange-500" />
            <span className="font-semibold">View All Assets</span>
         </Button>
      </div>

      {/* RECENT ACTIVITY */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" /> Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg bg-muted/10">
              No recent transactions found.
            </div>
          ) : (
            <div className="space-y-0 divide-y divide-border/50">
              {recentTransactions.map((tx) => {
                 const percent = (Number(tx.confirmationCount) / multisig.owners.length) * 100;
                 return (
                  <div key={tx.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0 px-2 -mx-2 hover:bg-muted/10 rounded transition-colors">
                    <div className="flex items-center gap-4">
                       <div className={`h-10 w-10 rounded-full flex items-center justify-center border ${tx.executed ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'}`}>
                          {tx.executed ? <Check className="h-5 w-5"/> : <Clock className="h-5 w-5"/>}
                       </div>
                       <div>
                          <p className="text-sm font-medium">Tx #{tx.id}</p>
                          <p className="text-xs text-muted-foreground font-mono bg-muted/50 px-1 rounded w-fit mt-0.5">
                            {tx.to.slice(0,6)}...{tx.to.slice(-4)}
                          </p>
                       </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{formatAmount(tx.value)} <span className="text-xs font-normal text-muted-foreground">{tx.isTokenTransfer ? 'Token' : 'CELO'}</span></p>
                      <div className="text-xs mt-1.5 flex items-center justify-end gap-2">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{tx.confirmationCount} Signed</span>
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                           <div className={`h-full rounded-full ${tx.executed ? 'bg-emerald-500' : 'bg-primary'}`} style={{width: `${percent}%`}}/>
                        </div>
                      </div>
                    </div>
                  </div>
                 );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <SubmitTransactionModal 
        isOpen={isSubmitModalOpen} 
        onClose={() => setIsSubmitModalOpen(false)}
        controllerAddress={multisig.controller}
      />
      
      <AssetsModal 
        isOpen={isAssetsModalOpen}
        onClose={() => setIsAssetsModalOpen(false)}
        multisig={multisig}
      />
    </div>
  );
}