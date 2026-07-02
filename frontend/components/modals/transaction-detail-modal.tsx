'use client';

import { useState, useEffect } from 'react';
import { X, Copy, CheckCircle, Clock, Loader2, Play, User, FileSignature, AlertCircle, ShieldCheck, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Transaction, MultiSigOwner } from '@/lib/types';
import { confirmTransaction, revokeConfirmation, executeTransactionManual, getSignedContract } from '@/lib/web3';
import { formatAmount } from '@/lib/format';
import { MULTISIG_CONTROLLER_ABI } from '@/lib/abi'; 
import { StatusModal, StatusType } from '@/components/modals/status-modal';
// 1. IMPORT USEWALLETS
import { useWallets } from '@privy-io/react-auth';

interface TransactionDetailModalProps {
  isOpen: boolean;
  transaction?: Transaction;
  controllerAddress: string;
  owners: MultiSigOwner[];
  onClose: () => void;
}

export function TransactionDetailModal({
  isOpen,
  transaction,
  controllerAddress,
  owners = [], 
  onClose,
}: TransactionDetailModalProps) {
  // 2. GET CURRENT USER ADDRESS
  const { wallets } = useWallets();
  const currentUserAddress = wallets[0]?.address?.toLowerCase();

  const [isPending, setIsPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmers, setConfirmers] = useState<string[]>([]);
  const [loadingSigners, setLoadingSigners] = useState(false);

  // STATUS STATE
  const [statusState, setStatusState] = useState<{
    isOpen: boolean;
    type: StatusType;
    title: string;
    description: string;
    txHash?: string;
  }>({ isOpen: false, type: null, title: '', description: '' });

  const getOwnerDetails = (address: string) => {
    if (!address) return { name: 'Unknown', percentage: 0, isOwner: false };
    const owner = owners.find(o => o.address.toLowerCase() === address.toLowerCase());
    return {
      name: owner ? owner.name : 'Unknown (Non-Owner)',
      percentage: owner ? Number(owner.percentage) : 0,
      isOwner: !!owner
    };
  };

  useEffect(() => {
    const fetchSigners = async () => {
      if (!transaction || !controllerAddress) return;
      
      try {
        setLoadingSigners(true);
        const contract = await getSignedContract(controllerAddress, MULTISIG_CONTROLLER_ABI);
        
        const confirmFilter = contract.filters.TransactionConfirmed(transaction.id);
        const revokeFilter = contract.filters.TransactionRevoked(transaction.id);

        const [confirms, revokes] = await Promise.all([
          contract.queryFilter(confirmFilter),
          contract.queryFilter(revokeFilter)
        ]);

        const allEvents = [
          ...confirms.map(e => ({ type: 'confirm', owner: (e as any).args[1], block: e.blockNumber, idx: e.index })),
          ...revokes.map(e => ({ type: 'revoke', owner: (e as any).args[1], block: e.blockNumber, idx: e.index }))
        ].sort((a, b) => (a.block - b.block) || (a.idx - b.idx));

        const signerSet = new Set<string>();
        allEvents.forEach(e => {
          if (e.type === 'confirm') signerSet.add(e.owner.toLowerCase()); // Normalize to lowercase
          if (e.type === 'revoke') signerSet.delete(e.owner.toLowerCase());
        });

        setConfirmers(Array.from(signerSet));
      } catch (e) {
        console.error("Failed to fetch signers", e);
      } finally {
        setLoadingSigners(false);
      }
    };

    if (isOpen) fetchSigners();
  }, [isOpen, transaction, controllerAddress]);

  if (!isOpen || !transaction) return null;

  // 3. CHECK IF USER HAS SIGNED
  const hasUserSigned = confirmers.includes(currentUserAddress || '');
  const initiator = getOwnerDetails(transaction.initiator);

  const handleCopy = (text: string) => {
     navigator.clipboard.writeText(text);
     setCopied(true);
     setTimeout(() => setCopied(false), 1000);
  };

  const handleAction = async (action: 'confirm' | 'revoke' | 'execute') => {
    setIsPending(true);
    try {
      let txResponse;
      if (action === 'confirm') txResponse = await confirmTransaction(controllerAddress, transaction.id);
      if (action === 'revoke') txResponse = await revokeConfirmation(controllerAddress, transaction.id);
      if (action === 'execute') txResponse = await executeTransactionManual(controllerAddress, transaction.id);
      
      setStatusState({
        isOpen: true,
        type: 'success',
        title: action === 'confirm' ? 'Confirmed!' : action === 'execute' ? 'Executed!' : 'Revoked!',
        description: `Transaction #${transaction.id} processed successfully.`,
        txHash: txResponse?.hash
      });
      
    } catch (err: any) {
      setStatusState({
        isOpen: true,
        type: 'error',
        title: 'Transaction Failed',
        description: err.message || "Something went wrong.",
      });
    } finally {
      setIsPending(false);
    }
  };

  const handleStatusClose = () => {
    setStatusState(prev => ({ ...prev, isOpen: false }));
    if (statusState.type === 'success') {
       onClose(); 
       window.location.reload(); // Optional: Refresh to update UI state immediately
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
        <Card className="w-full max-w-lg border-border bg-card max-h-[90vh] flex flex-col shadow-2xl">
          
          <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
            <div>
               <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold">Transaction #{transaction.id}</h2>
                  <Badge variant={transaction.executed ? 'default' : 'secondary'} className={transaction.executed ? 'bg-emerald-500' : 'bg-orange-500/10 text-orange-500'}>
                     {transaction.executed ? 'Executed' : 'Pending'}
                  </Badge>
               </div>
               <p className="text-xs text-muted-foreground flex items-center gap-1">
                 <Clock className="h-3 w-3" />
                 Created {new Date(Number(transaction.timestamp) * 1000).toLocaleString()}
               </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <ScrollArea className="flex-1">
            <CardContent className="p-6 space-y-6">
              
              <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                 <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-semibold flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" /> Initiated By
                 </p>
                 <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {initiator.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm truncate">{initiator.name}</p>
                          {initiator.isOwner && (
                             <Badge variant="outline" className="text-[10px] h-4 px-1 text-emerald-600 border-emerald-200 bg-emerald-50">
                                {initiator.percentage}% Equity
                             </Badge>
                          )}
                       </div>
                       <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                          <code className="font-mono bg-background px-1 py-0.5 rounded border">{transaction.initiator.slice(0, 6)}...{transaction.initiator.slice(-4)}</code>
                          <button onClick={() => handleCopy(transaction.initiator)} className="hover:text-primary transition-colors">
                             {copied ? <CheckCircle className="h-3 w-3 text-emerald-500"/> : <Copy className="h-3 w-3"/>}
                          </button>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border rounded-lg bg-card shadow-sm">
                     <p className="text-xs text-muted-foreground mb-1">Value</p>
                     <p className="font-bold text-sm">{formatAmount(transaction.value)} ETH</p>
                  </div>
                  <div className="p-3 border rounded-lg bg-card shadow-sm">
                     <p className="text-xs text-muted-foreground mb-1">Target</p>
                     <div className="flex items-center justify-between">
                        <code className="text-sm font-mono truncate mr-2">{transaction.to.slice(0,8)}...{transaction.to.slice(-6)}</code>
                        <button onClick={() => handleCopy(transaction.to)}><Copy className="h-3 w-3 text-muted-foreground"/></button>
                     </div>
                  </div>
              </div>

              <div>
                 <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                       <FileSignature className="h-4 w-4 text-primary" />
                       Confirmed By
                    </h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                       {loadingSigners ? 'Loading...' : `${confirmers.length} / ${owners.length}`}
                    </span>
                 </div>
                 
                 {loadingSigners ? (
                   <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                 ) : confirmers.length > 0 ? (
                   <div className="grid grid-cols-1 gap-2">
                      {confirmers.map((addr) => {
                         const details = getOwnerDetails(addr);
                         return (
                            <div key={addr} className="flex items-center justify-between p-2.5 rounded-md bg-muted/40 border border-transparent hover:border-border transition-colors group">
                               <div className="flex items-center gap-3 min-w-0">
                                  <div className={`h-2 w-2 rounded-full ${details.isOwner ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                  <div>
                                     <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium truncate leading-none">{details.name}</p>
                                     </div>
                                     <p className="text-[10px] text-muted-foreground font-mono mt-1">{addr.slice(0,8)}...{addr.slice(-6)}</p>
                                  </div>
                               </div>

                               {details.isOwner && (
                                  <div className="flex items-center gap-1.5 bg-background border px-2 py-1 rounded text-xs font-mono text-muted-foreground shrink-0">
                                     <ShieldCheck className="h-3 w-3 text-primary" />
                                     {details.percentage}%
                                  </div>
                                )}
                            </div>
                         );
                      })}
                   </div>
                 ) : (
                   <div className="text-center py-6 bg-muted/10 border border-dashed rounded-lg">
                      <AlertCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No signatures collected yet.</p>
                   </div>
                 )}
              </div>

            </CardContent>
          </ScrollArea>

          {/* 4. CONDITIONAL FOOTER ACTIONS */}
          {!transaction.executed && (
             <div className="p-4 border-t bg-muted/20 shrink-0 grid grid-cols-2 gap-3">
                {hasUserSigned ? (
                   // SHOW REVOKE IF SIGNED
                   <Button 
                      variant="destructive" 
                      onClick={() => handleAction('revoke')} 
                      disabled={isPending}
                      className="bg-red-500/10 text-red-600 hover:bg-red-500/20 hover:text-red-700 border border-red-200/50 shadow-none"
                   >
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <RotateCcw className="h-4 w-4 mr-2"/>} 
                      Revoke
                   </Button>
                ) : (
                   // SHOW CONFIRM IF NOT SIGNED
                   <Button 
                      variant="outline" 
                      onClick={() => handleAction('confirm')} 
                      disabled={isPending}
                      className="border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-600 text-emerald-600"
                   >
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <CheckCircle className="h-4 w-4 mr-2"/>} 
                      Confirm
                   </Button>
                )}
                
                <Button onClick={() => handleAction('execute')} disabled={isPending}>
                   <Play className="h-4 w-4 mr-2"/> Execute
                </Button>
             </div>
          )}
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