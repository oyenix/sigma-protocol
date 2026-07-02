'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MultiSig, Transaction } from '@/lib/types';
import { confirmTransaction, revokeConfirmation, executeTransactionManual, getTransaction } from '@/lib/web3';
import { Play, Loader2, Check, X, RefreshCw, FileSearch, ArrowRight, Clock, Hourglass, AlertTriangle } from 'lucide-react';
import { ethers } from 'ethers';
import { TransactionDetailModal } from '@/components/modals/transaction-detail-modal';
import { formatAmount } from '@/lib/format';
import { StatusModal, StatusType } from '@/components/modals/status-modal';

interface TransactionsTabProps {
  multisig: MultiSig;
}

export function TransactionsTab({ multisig }: TransactionsTabProps) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [transactions, setTransactions] = useState<Transaction[]>(multisig.transactions || []);
  const [isLoading, setIsLoading] = useState(false);
  const [processingTxId, setProcessingTxId] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now() / 1000); // Current timestamp in seconds
  
  // Detail Modal State
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [modalStatus, setModalStatus] = useState<{
    isOpen: boolean;
    type: StatusType;
    title: string;
    description: string;
    txHash?: string;
  }>({ isOpen: false, type: null, title: '', description: '' });
  // Live Timer for Countdowns
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now() / 1000), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchTransactions = async () => {
    setIsLoading(true);
    const fetchedTxs: Transaction[] = [];
    try {
      for (let i = 0; i < 20; i++) {
        try {
          const tx = await getTransaction(multisig.controller, i);
          if (tx.initiator === ethers.ZeroAddress) break; 
          fetchedTxs.push({ id: i, ...tx, confirmations: [] });
        } catch (e) { break; }
      }
      setTransactions(fetchedTxs.sort((a, b) => b.id - a.id));
    } catch (err) {
      console.error("Error fetching txs", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (transactions.length === 0) fetchTransactions();
  }, [multisig.controller]);

  // Helper: Format seconds into readable string (e.g. "2d 14h" or "04:30")
  const formatCountdown = (seconds: number) => {
    if (seconds <= 0) return "0s";
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${s}s`;
  };

  const handleAction = async (action: 'confirm' | 'revoke' | 'execute', txId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (processingTxId !== null) return;
    
    setProcessingTxId(txId);

    // 2. USE TRY/CATCH TO TRIGGER MODALS
    try {
      let txResponse;
      
      if (action === 'confirm') txResponse = await confirmTransaction(multisig.controller, txId);
      if (action === 'revoke') txResponse = await revokeConfirmation(multisig.controller, txId);
      if (action === 'execute') txResponse = await executeTransactionManual(multisig.controller, txId);
      
      await fetchTransactions(); 
      
      // SUCCESS MODAL
      setModalStatus({
        isOpen: true,
        type: 'success',
        title: action === 'confirm' ? 'Confirmed!' : action === 'execute' ? 'Executed!' : 'Revoked!',
        description: `Transaction #${txId} has been successfully ${action}ed.`,
        txHash: txResponse?.hash // Ensure your web3 functions return the tx object
      });

    } catch (err: any) {
      console.error(err);
      
      // ERROR MODAL
      setModalStatus({
        isOpen: true,
        type: 'error',
        title: 'Action Failed',
        description: err.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setProcessingTxId(null);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
     if (statusFilter === 'all') return true;
     if (statusFilter === 'executed') return tx.executed;
     if (statusFilter === 'pending') return !tx.executed;
     return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Toolbar */}
      <div className="flex justify-between items-center bg-card p-2 rounded-lg border">
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 border-none shadow-none bg-transparent focus:ring-0">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Transactions</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="executed">Executed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchTransactions} disabled={isLoading}>
             <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredTransactions.length === 0 && !isLoading && (
           <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/10">
              <FileSearch className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No transactions found.</p>
           </div>
        )}

        {filteredTransactions.map((tx) => {
          const confirmationCount = Number(tx.confirmationCount);
          const percent = (confirmationCount / multisig.owners.length) * 100;
          const isProcessing = processingTxId === tx.id;
          const required = (multisig.config.requiredPercentage / 100) * multisig.owners.length;
          
          // Logic checks
          const isConfirmed = confirmationCount >= required;
          const timelockEnd = Number(tx.timelockEnd);
          
          // 1. Expiry Logic
          const expiryTime = Number(tx.timestamp) + Number(multisig.config.expiryPeriod);
          const secondsToExpiry = expiryTime - now;
          const isExpired = !tx.executed && secondsToExpiry <= 0;

          // 2. Timelock Logic (Only relevant if confirmed)
          const isTimelockActive = !tx.executed && isConfirmed && timelockEnd > 0 && now < timelockEnd;
          const secondsToUnlock = timelockEnd - now;

          const isReadyToExecute = !tx.executed && isConfirmed && !isTimelockActive && !isExpired;

          return (
            <Card 
               key={tx.id} 
               className={`border-border bg-card transition-all cursor-pointer group shadow-sm hover:shadow-md ${isExpired ? 'opacity-60 grayscale' : ''}`}
               onClick={() => setSelectedTx(tx)}
            >
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* Left Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs font-bold bg-muted px-2 py-1 rounded text-foreground">#{tx.id}</span>
                      
                      {/* STATUS BADGES */}
                      {tx.executed ? (
                         <Badge className="bg-emerald-500 hover:bg-emerald-600">Executed</Badge>
                      ) : isExpired ? (
                         <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Expired
                         </Badge>
                      ) : isReadyToExecute ? (
                         <Badge className="bg-blue-500 hover:bg-blue-600 animate-pulse">Ready to Execute</Badge>
                      ) : (
                         <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border-orange-200">Pending</Badge>
                      )}

                      {/* 1. TIMELOCK COUNTDOWN (Shows when confirmed but waiting) */}
                      {isTimelockActive && (
                         <Badge variant="outline" className="text-orange-500 border-orange-500 text-[10px] gap-1.5 h-6">
                            <Hourglass className="h-3 w-3 animate-spin-slow" /> 
                            <span className="font-mono">Execute in {formatCountdown(secondsToUnlock)}</span>
                         </Badge>
                      )}

                      {/* 2. EXPIRY COUNTDOWN (Always visible if pending & not expired) */}
                      {!tx.executed && !isExpired && (
                         <Badge variant="outline" className="text-muted-foreground border-border text-[10px] gap-1.5 h-6">
                            <Clock className="h-3 w-3" /> 
                            <span className="font-mono">Expires in {formatCountdown(secondsToExpiry)}</span>
                         </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                       <span className="text-muted-foreground w-12 text-xs uppercase tracking-wide">To</span>
                       <code className="bg-muted/50 px-1.5 py-0.5 rounded text-xs font-mono">{tx.to.slice(0,8)}...{tx.to.slice(-6)}</code>
                    </div>
                    <div className="flex items-center gap-2 text-sm mt-1">
                       <span className="text-muted-foreground w-12 text-xs uppercase tracking-wide">Value</span>
                       <p className="text-sm font-semibold">{formatAmount(tx.value)} <span className="text-xs font-normal text-muted-foreground">ETH</span></p>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-6">
                    
                    {/* Progress Bar */}
                    <div className="text-right hidden sm:block min-w-75
                    ">
                      <div className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Approvals</div>
                      <div className="flex items-center justify-end gap-2">
                         <span className="font-bold text-sm">{confirmationCount}/{multisig.owners.length}</span>
                         <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full ${tx.executed ? 'bg-emerald-500' : 'bg-primary'}`} style={{width: `${percent}%`}}/>
                         </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                       {!tx.executed && !isExpired && (
                         <>
                            {/* Confirm Button */}
                            {!isReadyToExecute && !isTimelockActive && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-8 px-3"
                                  onClick={(e) => handleAction('confirm', tx.id, e)} 
                                  disabled={isProcessing}
                                >
                                   {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <Check className="h-3.5 w-3.5 mr-1.5"/>} 
                                   <span className="hidden sm:inline">Confirm</span>
                                </Button>
                            )}
                            
                            {/* Execute / Revoke */}
                            {isReadyToExecute ? (
                               <Button 
                                  size="sm" 
                                  className="h-8 px-3 bg-primary hover:bg-primary/90 shadow-sm"
                                  onClick={(e) => handleAction('execute', tx.id, e)} 
                                  disabled={isProcessing}
                               >
                                  <Play className="h-3.5 w-3.5 mr-1.5"/> 
                                  <span className="hidden sm:inline">Execute</span>
                               </Button>
                            ) : (
                               <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10" 
                                  onClick={(e) => handleAction('revoke', tx.id, e)} 
                                  disabled={isProcessing || confirmationCount === 0 || isTimelockActive}
                                  title="Revoke Confirmation"
                               >
                                  <X className="h-4 w-4"/>
                               </Button>
                            )}
                         </>
                       )}
                       
                       <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hidden md:flex opacity-50 group-hover:opacity-100">
                          <ArrowRight className="h-4 w-4" />
                       </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
        <StatusModal 
        isOpen={modalStatus.isOpen}
        onClose={() => setModalStatus(prev => ({ ...prev, isOpen: false }))}
        status={modalStatus.type}
        title={modalStatus.title}
        description={modalStatus.description}
        txHash={modalStatus.txHash}
      />
      {/* Details Modal */}
      {selectedTx && (
        <TransactionDetailModal 
           isOpen={!!selectedTx}
           transaction={selectedTx}
           controllerAddress={multisig.controller}
           owners={multisig.owners}
           onClose={() => setSelectedTx(null)}
        />
      )}
    </div>
  );
}