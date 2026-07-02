'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, Send, Loader2, AlertCircle, Upload, FileText, Trash2, 
  UserPlus, Coins, Wallet, Users, ArrowRight, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallets } from '@privy-io/react-auth';
import { BrowserProvider, ethers, Interface } from 'ethers';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { StatusModal, StatusType } from '@/components/modals/status-modal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  submitTransaction,
  submitBatchTransferEqual,
  submitBatchTransferDifferent,
  submitAddOwner
} from '@/lib/web3';

// --- DYNAMIC CONFIGURATION CONSTANTS ---

const CUSTOM_TOKEN_OPTION = { name: 'Custom Token', symbol: '???', address: 'custom' };

const STANDARD_ROUTER_ABI = [
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) returns (uint[] memory amounts)",
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) returns (uint[] memory amounts)"
];

// --- DYNAMIC TOKEN CONFIGURATION ---
export const CHAIN_TOKENS: Record<number, { name: string; symbol: string; address: string }[]> = {
  // Base Sepolia (84532)
  84532: [
    { name: 'USDC (Testnet)', symbol: 'USDC', address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' },
    { name: 'WETH', symbol: 'WETH', address: '0x4200000000000000000000000000000000000006' },
  ],
  // Arbitrum Sepolia (421614)
  421614: [
    { name: 'USDC (Testnet)', symbol: 'USDC', address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d' },
    { name: 'WETH', symbol: 'WETH', address: '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73' },
  ],
  // OP Sepolia (11155420)
  11155420: [
    { name: 'USDC (Testnet)', symbol: 'USDC', address: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7' },
    { name: 'WETH', symbol: 'WETH', address: '0x4200000000000000000000000000000000000006' },
  ],
  // Celo Alfajores (44787)
  44787: [
    { name: 'USDm (Testnet)', symbol: 'USDm', address: '0x874068565b93198084D1f6874E2f768E6B1516e8' },
    { name: 'cEUR (Testnet)', symbol: 'cEUR', address: '0x10c6609C0637B194e823A449b2c3a51D1415fF78' },
  ],
  // BNB Testnet (97)
  97: [
    { name: 'USDT (Mock)', symbol: 'USDT', address: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd' },
    { name: 'WBNB', symbol: 'WBNB', address: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd' },
  ],
  // Avalanche Fuji (43113)
  43113: [
    { name: 'USDC (Testnet)', symbol: 'USDC', address: '0x5425890298aed601595a70AB815c96711a31Bc65' },
    { name: 'WAVAX', symbol: 'WAVAX', address: '0xd00ae08403B9bbb9124bB305C09058E32C39A48c' },
  ],
  // Polygon Amoy (80002)
  80002: [
    { name: 'USDC (Testnet)', symbol: 'USDC', address: '0x41E94Eb019C0762f9Bfcf9Cb1EE62ce5169950B2' },
    { name: 'WPOL', symbol: 'WPOL', address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270' }, 
  ],
  // Ethereum Sepolia (11155111)
  11155111: [
    { name: 'USDC (Testnet)', symbol: 'USDC', address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' },
    { name: 'WETH', symbol: 'WETH', address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14' },
  ],
  // Lisk Sepolia (4202) - Placeholders
  4202: [
    { name: 'Mock USDC', symbol: 'USDC', address: '0x0000000000000000000000000000000000000001' },
    { name: 'WETH', symbol: 'WETH', address: '0x4200000000000000000000000000000000000006' },
  ],
  // Tempo Network (42431) - Placeholders
  42431: [
    { name: 'Mock Stable', symbol: 'pUSD', address: '0x0000000000000000000000000000000000000002' },
    { name: 'WTEM', symbol: 'WTEM', address: '0x0000000000000000000000000000000000000003' },
  ],
};

// --- DYNAMIC DEX CONFIGURATION ---
export const CHAIN_DEXES: Record<number, { name: string; address: string; abi: string[] }[]> = {
  // Base Sepolia
  84532: [
    { name: 'Uniswap (Base)', address: '0x327Df1E6de05895d2ab08513aaDD9313Fe505d86', abi: STANDARD_ROUTER_ABI },
  ],
  // Arbitrum Sepolia
  421614: [
    { name: 'Uniswap (Arbitrum)', address: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506', abi: STANDARD_ROUTER_ABI },
  ],
  // OP Sepolia
  11155420: [
    { name: 'Uniswap (OP)', address: '0x4f87A02C1fb7079201a083a21689363e803e4d9c', abi: STANDARD_ROUTER_ABI },
  ],
  // Celo Alfajores
  44787: [
    { name: 'Uniswap (Celo)', address: '0x62a8F0D03F66D6C655d81C9d3163E5d39A1e2226', abi: STANDARD_ROUTER_ABI },
    { name: 'Ubeswap (Celo)', address: '0x44760E45c711a37c4A462137F8E4d4d122245b63', abi: STANDARD_ROUTER_ABI },
  ],
  // BNB Testnet
  97: [
    { name: 'PancakeSwap', address: '0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3', abi: STANDARD_ROUTER_ABI },
  ],
  // Avalanche Fuji
  43113: [
    { name: 'Trader Joe', address: '0xd705230843258F31E8B62C10a30b2e81Ed259D4f', abi: STANDARD_ROUTER_ABI },
  ],
  // Polygon Amoy
  80002: [
    { name: 'QuickSwap (Mock)', address: '0x8954AfA98594b838bda56FE4C12a09D7739D179b', abi: STANDARD_ROUTER_ABI },
  ],
  // Ethereum Sepolia
  11155111: [
    { name: 'Uniswap V2', address: '0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008', abi: STANDARD_ROUTER_ABI },
  ],
  // Lisk Sepolia - Placeholder
  4202: [
    { name: 'LiskSwap (Mock)', address: '0x0000000000000000000000000000000000000004', abi: STANDARD_ROUTER_ABI },
  ],
  // Tempo Network - Placeholder
  42431: [
    { name: 'TempoSwap (Mock)', address: '0x0000000000000000000000000000000000000005', abi: STANDARD_ROUTER_ABI },
  ],
};

// --- INTERFACES & HELPERS ---

interface SubmitTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  controllerAddress: string;
  defaultTab?: 'transfer' | 'custom' | 'owner';
}

const generateSwapCalldata = (
    platform: { name: string; address: string; abi: string[] }, 
    tokenInAddress: string, 
    tokenOutAddress: string, 
    amountIn: string, 
    recipient: string
): string => {
    try {
        const routerInterface = new Interface(platform.abi);
        const path = [tokenInAddress, tokenOutAddress]; 
        const deadline = Math.floor(Date.now() / 1000) + (60 * 30); // 30 mins
        const amountOutMin = 0; // 0 for demo, should handle slippage

        return routerInterface.encodeFunctionData("swapExactTokensForTokens", [
            amountIn, amountOutMin, path, recipient, deadline,
        ]);
    } catch (e) {
        console.error("Calldata error:", e);
        throw new Error("Failed to generate swap calldata. Check addresses.");
    }
};

export function SubmitTransactionModal({ 
  isOpen, 
  onClose, 
  controllerAddress,
  defaultTab = 'transfer' 
}: SubmitTransactionModalProps) {
  const { wallets } = useWallets();
  const primaryWallet = wallets[0];
  
  // 1. Get active chain ID securely
  const activeChainId = Number(primaryWallet?.chainId?.split(':')[1] || 84532);

  // 2. Derive dynamic tokens and DEXes
  const activeTokens = CHAIN_TOKENS[activeChainId] 
    ? [...CHAIN_TOKENS[activeChainId], CUSTOM_TOKEN_OPTION] 
    : [CUSTOM_TOKEN_OPTION];
  const activeDexes = CHAIN_DEXES[activeChainId] || [];

  // --- State ---
  const [mode, setMode] = useState<'transfer' | 'custom' | 'owner'>(defaultTab);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Transfer States
  const [txScope, setTxScope] = useState<'single' | 'batch'>('single');
  const [batchType, setBatchType] = useState<'equal' | 'different'>('equal');
  const [assetType, setAssetType] = useState<'eth' | 'token'>('eth');
  const [selectedToken, setSelectedToken] = useState<string>('');
  const [customTokenAddress, setCustomTokenAddress] = useState('');
  const [recipients, setRecipients] = useState(''); 
  const [amounts, setAmounts] = useState('');       
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  
  // DeFi Swap States
  const [customTo, setCustomTo] = useState('');
  const [customValue, setCustomValue] = useState('0');
  const [customData, setCustomData] = useState('0x');
  const [defiPlatform, setDefiPlatform] = useState<string>('');
  const [tokenIn, setTokenIn] = useState<string>('');
  const [tokenOut, setTokenOut] = useState<string>('');
  const [swapAmount, setSwapAmount] = useState<string>('');

  // Add Owner States
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerAddress, setNewOwnerAddress] = useState('');
  const [newOwnerPct, setNewOwnerPct] = useState('');
  const [newOwnerRemovable, setNewOwnerRemovable] = useState(true);

  // Modal Control States
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusState, setStatusState] = useState<{
    isOpen: boolean; type: StatusType; title: string; description: string; txHash?: string;
  }>({ isOpen: false, type: null, title: '', description: '' });

  // --- Effects ---

  // Reset defaults on open
  useEffect(() => {
    if (isOpen) setMode(defaultTab);
  }, [isOpen, defaultTab]);

  // Handle Dynamic Network Switching defaults
  useEffect(() => {
    if (activeTokens.length > 0) {
      if (!activeTokens.find(t => t.address === selectedToken)) setSelectedToken(activeTokens[0].address);
      if (!activeTokens.find(t => t.address === tokenIn)) setTokenIn(activeTokens[0].address);
      if (!activeTokens.find(t => t.address === tokenOut)) {
        setTokenOut(activeTokens.length > 1 ? activeTokens[1].address : activeTokens[0].address);
      }
    }
    if (activeDexes.length > 0) {
      if (!activeDexes.find(d => d.address === defiPlatform)) setDefiPlatform(activeDexes[0].address);
    } else {
      setDefiPlatform(''); // Clear if chain has no DEXes mapped
    }
  }, [activeChainId, isOpen]);

  // Handle DeFi Swap Calldata Generation
  useEffect(() => {
    if (mode !== 'custom') return;
    setCustomTo('');
    setCustomValue('0');
    setCustomData('0x');
    
    if (!defiPlatform || !tokenIn || !tokenOut || !swapAmount || swapAmount === '0') {
        setError("Fill out all swap fields to generate the transaction.");
        return;
    }

    try {
        const platform = activeDexes.find(p => p.address === defiPlatform);
        if (!platform) throw new Error("Invalid platform selected.");
        
        const parsedAmount = ethers.parseEther(swapAmount).toString();
        const calldata = generateSwapCalldata(
            platform, tokenIn, tokenOut, parsedAmount, controllerAddress
        );

        setCustomTo(defiPlatform);
        setCustomValue('0'); 
        setCustomData(calldata);
        setError(null);
    } catch (e: any) {
        setError(e.message || "Could not auto-generate swap transaction. Check inputs.");
        setCustomData('0x');
    }
  }, [defiPlatform, tokenIn, tokenOut, swapAmount, mode, controllerAddress, activeDexes]);

  // --- Helpers ---
  const parseList = (str: string) => str.split(/[\n]+/).map(s => s.trim()).filter(s => s !== '');
  const getRecipientCount = () => parseList(recipients).length;
  const getTotalAmount = () => {
    const list = parseList(amounts);
    if (list.length === 0) return '0';
    if (txScope === 'batch' && batchType === 'equal') return (parseFloat(list[0]) * getRecipientCount()).toFixed(4);
    return list.reduce((acc, val) => acc + (parseFloat(val) || 0), 0).toFixed(4);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setError(null);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) throw new Error("Empty file");

        const lines = text.split(/\r?\n/);
        const addrList: string[] = [];
        const amtList: string[] = [];

        lines.forEach((line) => {
          const trimmed = line.trim();
          if (!trimmed || /^address/i.test(trimmed)) return;

          const parts = trimmed.split(/[,;\t|]+/);
          const rawAddr = parts[0]?.trim();
          const rawAmt = parts[1]?.trim();

          if (rawAddr && (rawAddr.startsWith('0x') || rawAddr.includes('.'))) {
             addrList.push(rawAddr);
             if (rawAmt && !isNaN(parseFloat(rawAmt))) amtList.push(rawAmt);
             else if (batchType === 'different') amtList.push('0'); 
          }
        });

        if (addrList.length === 0) {
           setError("No valid addresses found in file.");
           setUploadedFileName(null);
           return;
        }

        setRecipients(addrList.join('\n'));
        if (batchType === 'different') setAmounts(amtList.join('\n'));
        else if (batchType === 'equal' && amtList.length > 0) setAmounts(amtList[0]);
      } catch (err) {
        setError("Failed to parse file.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const clearFile = () => {
    setUploadedFileName(null);
    setRecipients('');
    setAmounts('');
    setError(null);
  };

  const handleSubmit = async () => {
    setError(null);
    setIsPending(true);

    try {
      if (!primaryWallet) throw new Error("Wallet not connected");
      const provider = await primaryWallet.getEthereumProvider();
      const ethersProvider = new BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      let txResponse;

      if (mode === 'owner') {
        if (!ethers.isAddress(newOwnerAddress)) throw new Error("Invalid Address");
        if (!newOwnerName) throw new Error("Name required");
        txResponse = await submitAddOwner(
            controllerAddress, newOwnerAddress, newOwnerName, Number(newOwnerPct), newOwnerRemovable
        );
      } 
      else if (mode === 'custom') {
        if (!customData || customData === '0x') throw new Error("Transaction data is incomplete.");
        txResponse = await submitTransaction(
            controllerAddress, customTo, customValue || '0', false, ethers.ZeroAddress, customData, signer
        );
      } 
      else {
        const recipientList = parseList(recipients);
        const amountList = parseList(amounts);
        const isToken = assetType === 'token';
        let targetToken = ethers.ZeroAddress;
        
        if (isToken) targetToken = selectedToken === 'custom' ? customTokenAddress : selectedToken;

        if (txScope === 'single') {
          txResponse = await submitTransaction(
              controllerAddress, recipientList[0], amountList[0], isToken, targetToken, '0x', signer
          );
        } else {
          if (batchType === 'equal') {
             txResponse = await submitBatchTransferEqual(controllerAddress, targetToken, recipientList, amountList[0]);
          } else {
             txResponse = await submitBatchTransferDifferent(controllerAddress, targetToken, recipientList, amountList);
          }
        }
      }

      setStatusState({
        isOpen: true,
        type: 'success',
        title: 'Proposal Submitted',
        description: 'Your transaction proposal has been created successfully.',
        txHash: txResponse?.hash
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to submit transaction');
    } finally {
      setIsPending(false);
    }
  };

  const handleStatusClose = () => {
    setStatusState(prev => ({ ...prev, isOpen: false }));
    onClose(); 
  };

  if (!isOpen) return null;

  // Filter token options for 'token out' to ensure they aren't the same as 'token in'
  const tokenOutOptions = activeTokens.filter(t => t.address !== tokenIn);
  const tokenInOptions = activeTokens.filter(t => t.address !== tokenOut);

  return (
    <>
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-xl border-border bg-card max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
          <div>
            <h2 className="text-xl font-bold">New Proposal</h2>
            <p className="text-xs text-muted-foreground mt-1">Create a new action for owners to approve</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-destructive/10 hover:text-destructive">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6">
          <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="transfer" className="gap-2"><Wallet className="h-4 w-4"/> Transfer</TabsTrigger>
              <TabsTrigger value="owner" className="gap-2"><Users className="h-4 w-4"/> Add Owner</TabsTrigger>
              <TabsTrigger value="custom" className="gap-2"><Zap className="h-4 w-4"/> DeFi Swap</TabsTrigger>
            </TabsList>

            {/* ================= TRANSFER TAB ================= */}
            <TabsContent value="transfer" className="space-y-6 animate-in slide-in-from-left-2 duration-300">
               <div className="grid grid-cols-2 gap-4">
                <div 
                  className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${assetType === 'eth' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                  onClick={() => setAssetType('eth')}
                >
                   <div className={`p-2 rounded-full ${assetType === 'eth' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <Coins className="h-5 w-5" />
                   </div>
                   <span className="font-medium text-sm">Native Gas Token</span>
                </div>
                
                <div 
                   className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${assetType === 'token' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                   onClick={() => setAssetType('token')}
                >
                   <div className={`p-2 rounded-full ${assetType === 'token' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <Wallet className="h-5 w-5" />
                   </div>
                   <span className="font-medium text-sm">ERC20 Token</span>
                </div>
              </div>

              {/* Dynamic Token Dropdown */}
              {assetType === 'token' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <Label>Select Token</Label>
                  <Select value={selectedToken} onValueChange={setSelectedToken}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select a token..." />
                    </SelectTrigger>
                    <SelectContent>
                      {activeTokens.map((t) => <SelectItem key={t.address} value={t.address}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {selectedToken === 'custom' && (
                    <Input placeholder="Contract Address (0x...)" value={customTokenAddress} onChange={(e) => setCustomTokenAddress(e.target.value)} className="mt-2"/>
                  )}
                </div>
              )}

              <div className="border-t border-border my-2"></div>

              <div className="space-y-3">
                <Label>Who are you sending to?</Label>
                <div className="flex gap-3">
                   <Button 
                      variant={txScope === 'single' ? 'default' : 'outline'} 
                      className="flex-1 h-auto py-3 flex-col gap-1"
                      onClick={() => setTxScope('single')}
                   >
                      <span className="font-semibold">Single Person</span>
                      <span className="text-[10px] font-normal opacity-80">One recipient</span>
                   </Button>
                   <Button 
                      variant={txScope === 'batch' ? 'default' : 'outline'} 
                      className="flex-1 h-auto py-3 flex-col gap-1"
                      onClick={() => setTxScope('batch')}
                   >
                      <span className="font-semibold">Send to Many</span>
                      <span className="text-[10px] font-normal opacity-80">Batch / List</span>
                   </Button>
                </div>
              </div>

              {txScope === 'single' ? (
                 <div className="grid gap-4">
                    <div className="space-y-2">
                        <Label>Recipient Address</Label>
                        <Input placeholder="0x..." value={recipients} onChange={(e) => setRecipients(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Amount</Label>
                        <div className="relative">
                            <Input type="number" placeholder="0.00" value={amounts} onChange={(e) => setAmounts(e.target.value)} className="pl-8 font-mono"/>
                            <span className="absolute left-3 top-2.5 text-muted-foreground text-xs">$</span>
                        </div>
                    </div>
                 </div>
              ) : (
                 <div className="space-y-4 animate-in fade-in">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <label className={`flex items-center gap-2 p-3 rounded border cursor-pointer ${batchType === 'equal' ? 'border-primary bg-primary/5' : 'bg-background'}`}>
                           <input type="radio" name="btype" checked={batchType === 'equal'} onChange={() => setBatchType('equal')} className="accent-primary"/>
                           <span>Same amount for everyone</span>
                        </label>
                        <label className={`flex items-center gap-2 p-3 rounded border cursor-pointer ${batchType === 'different' ? 'border-primary bg-primary/5' : 'bg-background'}`}>
                           <input type="radio" name="btype" checked={batchType === 'different'} onChange={() => setBatchType('different')} className="accent-primary"/>
                           <span>Different amounts</span>
                        </label>
                    </div>

                    {!uploadedFileName ? (
                       <div 
                          className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/30 transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                       >
                          <div className="bg-muted p-3 rounded-full mb-2">
                             <Upload className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <p className="text-sm font-medium">Click to upload CSV or Text file</p>
                          <p className="text-xs text-muted-foreground mt-1">Format: address, amount</p>
                          <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.txt,.doc,.docx" onChange={handleFileUpload}/>
                       </div>
                    ) : (
                       <div className="flex items-center justify-between bg-primary/10 border border-primary/20 p-3 rounded-lg">
                          <div className="flex items-center gap-3">
                             <FileText className="h-5 w-5 text-primary" />
                             <div>
                                <p className="text-sm font-medium text-primary">{uploadedFileName}</p>
                                <p className="text-xs text-muted-foreground">Loaded {getRecipientCount()} addresses</p>
                             </div>
                          </div>
                          <Button variant="ghost" size="icon" onClick={clearFile} className="text-destructive hover:bg-destructive/10">
                             <Trash2 className="h-4 w-4" />
                          </Button>
                       </div>
                    )}

                    <div className="space-y-2">
                       <div className="flex justify-between items-center">
                          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Or enter manually</Label>
                       </div>
                       <div className="grid grid-cols-3 gap-2">
                          <Textarea 
                             placeholder="0x123...&#10;0x456..." 
                             value={recipients} 
                             onChange={(e) => setRecipients(e.target.value)}
                             className="col-span-2 h-24 font-mono text-xs resize-none bg-muted/20"
                          />
                          <Textarea 
                             placeholder={batchType === 'equal' ? "1.5" : "1.5\n2.0"} 
                             value={amounts} 
                             onChange={(e) => setAmounts(e.target.value)}
                             className="col-span-1 h-24 font-mono text-xs resize-none bg-muted/20"
                          />
                       </div>
                    </div>
                 </div>
              )}
            </TabsContent>

            {/* ================= OWNER TAB ================= */}
            <TabsContent value="owner" className="space-y-5 animate-in slide-in-from-right-2 duration-300">
              <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                 <UserPlus className="h-5 w-5 text-blue-600 mt-0.5" />
                 <div className="text-sm text-blue-900 dark:text-blue-200">
                    <p className="font-semibold">Add New Signer</p>
                    <p className="opacity-90 text-xs mt-0.5">This creates a proposal. Other owners must approve it before the new signer is added.</p>
                 </div>
              </div>
              
              <div className="grid gap-4">
                <div className="space-y-2">
                   <Label>New Owner Address</Label>
                   <Input placeholder="0x..." value={newOwnerAddress} onChange={(e) => setNewOwnerAddress(e.target.value)} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <Label>Role / Name</Label>
                      <Input placeholder="e.g. CFO" value={newOwnerName} onChange={(e) => setNewOwnerName(e.target.value)} />
                   </div>
                   <div className="space-y-2">
                      <Label>Voting Power (%)</Label>
                      <Input type="number" value={newOwnerPct} onChange={(e) => setNewOwnerPct(e.target.value)} />
                   </div>
                </div>

                <div className="flex items-center space-x-2 border p-3 rounded-lg">
                   <Checkbox id="removable" checked={newOwnerRemovable} onCheckedChange={(c) => setNewOwnerRemovable(!!c)} />
                   <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="removable" className="cursor-pointer">Is Removable?</Label>
                      <p className="text-xs text-muted-foreground">If unchecked, this owner can never be removed.</p>
                   </div>
                </div>
              </div>
            </TabsContent>

            {/* ================= CUSTOM/DEFI SWAP TAB ================= */}
            <TabsContent value="custom" className="space-y-4 animate-in fade-in">
                
                <div className="space-y-4 p-4 border rounded-lg bg-primary/5 animate-in fade-in">
                    <p className="font-semibold flex items-center gap-2"><Zap className="h-5 w-5"/> Automated Token Swap</p>
                    
                    <div className="space-y-2">
                        <Label>Select Platform</Label>
                        <Select value={defiPlatform} onValueChange={setDefiPlatform} disabled={activeDexes.length === 0}>
                            <SelectTrigger>
                                <SelectValue placeholder={activeDexes.length > 0 ? "Select a DEX..." : "No DEX mapped for this network"} />
                            </SelectTrigger>
                            <SelectContent>
                                {activeDexes.map((p) => (
                                    <SelectItem key={p.address} value={p.address}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1 space-y-2">
                            <Label>Amount</Label>
                            <Input type="number" placeholder="10.00" value={swapAmount} onChange={(e) => setSwapAmount(e.target.value)} />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label>Token In (To Sell)</Label>
                            <Select value={tokenIn} onValueChange={setTokenIn}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Token In..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {tokenInOptions.map((t) => <SelectItem key={t.address} value={t.address}>{t.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center justify-center">
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Token Out (To Buy)</Label>
                        <Select value={tokenOut} onValueChange={setTokenOut}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Token Out..." />
                            </SelectTrigger>
                            <SelectContent>
                                {tokenOutOptions.map((t) => <SelectItem key={t.address} value={t.address}>{t.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-800 dark:text-yellow-300">
                        NOTE: This only generates the **swap call**. You must submit a separate **Approval** transaction if the contract isn't already approved to spend the **Token In** amount.
                    </div>
                </div>

                <div className="space-y-4 pt-2">
                    <div className="space-y-1">
                       <Label>Target Contract</Label>
                       <Input 
                          value={customTo} 
                          readOnly 
                          className="bg-muted font-mono text-sm"
                          placeholder="Platform Address (0x...)"
                       />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1 space-y-1">
                           <Label>Value</Label>
                           <Input 
                              type="text" 
                              value={customValue} 
                              readOnly 
                              className="bg-muted font-mono text-sm"
                           />
                        </div>
                        <div className="col-span-2 space-y-1">
                            <Label>Calldata Status</Label>
                            <div className={`p-2 rounded text-xs text-center font-semibold ${customData === '0x' ? 'bg-red-500/10 text-red-600 border border-red-500/20' : 'bg-green-500/10 text-green-600 border border-green-500/20'}`}>
                                {customData === '0x' ? 'Awaiting Input' : 'Calldata Generated'}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-1">
                       <Label>Calldata (Function Call)</Label>
                       <Textarea 
                          value={customData} 
                          readOnly 
                          className="font-mono text-xs min-h-25 bg-muted break-all"
                          placeholder="Generated calldata (0x...)"
                       />
                    </div>
                </div>

            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-muted/20 flex flex-col gap-4">
          
          {mode === 'transfer' && (
             <div className="flex items-center justify-between text-sm px-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                   <Users className="h-4 w-4" />
                   <span>Recipients: <span className="font-mono font-bold text-foreground">{getRecipientCount()}</span></span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                   <Coins className="h-4 w-4" />
                   <span>Total: <span className="font-mono font-bold text-foreground">{getTotalAmount()}</span></span>
                </div>
             </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-600 flex gap-2 items-start">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5"/>
              <span className="break-all">{error}</span>
            </div>
          )}

          <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>
                  Cancel
                </Button>
                <Button className="flex-2" onClick={handleSubmit} disabled={isPending}>
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Submit Proposal
                </Button>
              </div>
           </div>
        </Card>
      </div>

      <StatusModal 
        isOpen={statusState.isOpen}
        onClose={handleStatusClose}
        status={statusState.type}
        title={statusState.title}
        description={statusState.description}
        txHash={statusState.txHash}
      />
    </>
  );
}