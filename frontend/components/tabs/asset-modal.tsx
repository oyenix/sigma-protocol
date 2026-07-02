'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Coins, ArrowUpRight, Wallet, RefreshCw } from 'lucide-react';
import { ethers, BrowserProvider, Contract } from 'ethers';
import { useWallets } from '@privy-io/react-auth';
import { MultiSig } from '@/lib/types';
import { formatAmount } from '@/lib/format';

interface AssetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  multisig: MultiSig;
}

interface TokenAsset {
  address: string;
  symbol: string;
  balance: string;
  decimals: number;
  name?: string;
}

// Minimal ERC20 ABI
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)"
];

// Your predefined list to ensure they always appear
const KNOWN_TOKENS = [
   { name: 'Mento Dollar', symbol: 'USDm', address: '0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b', coingeckoId: 'celo-dollar' },
  { name: 'Mento USDC (Testnet)', symbol: 'USDC', address: '0xBD63e46Be8eF8D89dFde3054E7b9ECAEb8Ad83e9', coingeckoId: 'celo-euro' },
  { name: 'WETH', symbol: 'WETH', address: '0x4200000000000000000000000000000000000006', coingeckoId: 'weth' },
];

export function AssetsModal({ isOpen, onClose, multisig }: AssetsModalProps) {
  const { wallets } = useWallets();
  const [tokens, setTokens] = useState<TokenAsset[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAssets = async () => {
    if (!wallets[0] || !isOpen) return;
    
    setLoading(true);
    try {
      const provider = await wallets[0].getEthereumProvider();
      const ethersProvider = new BrowserProvider(provider);

      // 1. Merge Known Tokens with Transaction History
      const tokenSet = new Set<string>();
      
      // Add known tokens
      KNOWN_TOKENS.forEach(t => tokenSet.add(t.address.toLowerCase()));
      
      // Add tokens found in history
      multisig.transactions.forEach(tx => {
        if (tx.isTokenTransfer && tx.tokenAddress && tx.tokenAddress !== ethers.ZeroAddress) {
          tokenSet.add(tx.tokenAddress.toLowerCase());
        }
      });
      
      // 2. Fetch Details
      const loadedTokens: TokenAsset[] = [];
      
      for (const tokenAddr of Array.from(tokenSet)) {
        try {
          const contract = new Contract(tokenAddr, ERC20_ABI, ethersProvider);
          const [symbol, decimals, balance, name] = await Promise.all([
             contract.symbol(),
             contract.decimals(),
             contract.balanceOf(multisig.wallet),
             contract.name().catch(() => 'Unknown Token')
          ]);

          const formattedBalance = ethers.formatUnits(balance, decimals);

          // Show if it's in our known list OR has a balance
          const isKnown = KNOWN_TOKENS.some(t => t.address.toLowerCase() === tokenAddr);
          
          if (isKnown || parseFloat(formattedBalance) > 0) {
            loadedTokens.push({
                address: tokenAddr,
                symbol,
                name,
                decimals: Number(decimals),
                balance: formattedBalance
            });
          }
        } catch (e) {
          console.warn(`Failed to load token ${tokenAddr}`, e);
        }
      }

      setTokens(loadedTokens);
    } catch (err) {
      console.error("Asset fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchAssets();
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" /> Treasury Assets
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Native Balance */}
          <Card className="bg-primary/5 border-primary/20">
             <CardContent className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Wallet className="h-5 w-5 text-primary" />
                   </div>
                   <div>
                      <p className="font-bold">CELO</p>
                      <p className="text-xs text-muted-foreground">Native Token</p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-xl font-bold">{parseFloat(multisig.balance).toFixed(4)}</p>
                   <p className="text-xs text-muted-foreground">Native</p>
                </div>
             </CardContent>
          </Card>

          {/* Token List */}
          <div className="flex items-center justify-between px-1 mt-4">
             <h4 className="text-sm font-medium text-muted-foreground">ERC20 Tokens</h4>
             <Button variant="ghost" size="icon" onClick={fetchAssets} className="h-6 w-6" disabled={loading}>
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
             </Button>
          </div>

          <div className="space-y-2 max-h-75 overflow-y-auto pr-1">
             {loading && tokens.length === 0 ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/></div>
             ) : tokens.length > 0 ? (
                tokens.map((t) => (
                   <div key={t.address} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                         <div className="h-9 w-9 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600 font-bold text-xs border border-orange-200">
                            {t.symbol.slice(0,2)}
                         </div>
                         <div>
                            <p className="font-medium text-sm">{t.name}</p>
                            <a href={`https://sepolia.celoscan.io/token/${t.address}?a=${multisig.wallet}`} target="_blank" className="text-[10px] text-muted-foreground flex items-center gap-1 hover:text-primary">
                               {t.symbol} <ArrowUpRight className="h-2.5 w-2.5" />
                            </a>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="font-mono font-medium text-sm">{formatAmount(t.balance)}</p>
                      </div>
                   </div>
                ))
             ) : (
                <div className="text-center py-6 border-2 border-dashed rounded-lg bg-muted/10">
                   <p className="text-sm text-muted-foreground">No tokens found.</p>
                </div>
             )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}