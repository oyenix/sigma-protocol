'use client';

import { useState } from 'react';
import { X, CheckCircle2, Loader2, AlertCircle, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { MultiSig } from '@/hooks/use-factory'; // Ensure type import is correct
import { confirmTransactionsBatch } from '@/lib/web3';
import { formatAmount } from '@/lib/format';
import { StatusModal, StatusType } from '@/components/modals/status-modal';

interface BatchConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  multisig: MultiSig;
}

export function BatchConfirmModal({ isOpen, onClose, multisig }: BatchConfirmModalProps) {
  const [selected, setSelected] = useState<number[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [statusState, setStatusState] = useState<{
    isOpen: boolean; type: StatusType; title: string; description: string; txHash?: string;
  }>({ isOpen: false, type: null, title: '', description: '' });

  if (!isOpen) return null;

  const pendingTransactions = multisig.transactions.filter(tx => !tx.executed);

  const toggleSelect = (id: number) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    setSelected(selected.length === pendingTransactions.length ? [] : pendingTransactions.map((t) => t.id));
  };
  
  const handleBatchConfirm = async () => {
    setError(null);
    setIsPending(true);
    try {
      const txResponse = await confirmTransactionsBatch(multisig.controller, selected);
      
      setStatusState({
        isOpen: true,
        type: 'success',
        title: 'BATCH CONFIRMED',
        description: `Successfully signed ${selected.length} transactions.`,
        txHash: txResponse?.hash
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Batch confirm failed');
    } finally {
      setIsPending(false);
    }
  };

  const handleStatusClose = () => {
    setStatusState(prev => ({ ...prev, isOpen: false }));
    if (statusState.type === 'success') onClose();
  };

  return (
    <>
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <Card className="w-full max-w-md border-2 border-black dark:border-white bg-white dark:bg-[#080808] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] rounded-none">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-black dark:border-white">
          <div className="flex items-center gap-3">
             <div className="bg-black dark:bg-white text-white dark:text-black p-1">
                <Layers className="h-5 w-5" />
             </div>
             <h2 className="text-xl font-black italic uppercase tracking-tighter">Batch Operation</h2>
          </div>
          <button onClick={onClose} className="border-2 border-transparent hover:border-black dark:hover:border-white p-1 transition-all">
            <X className="h-6 w-6" />
          </button>
        </div>

        <CardContent className="p-6 space-y-6">
          {pendingTransactions.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-black/20 dark:border-white/20">
              <p className="font-bold uppercase opacity-50">No pending transactions</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 bg-black/5 dark:bg-white/5 border-2 border-black dark:border-white">
                <Checkbox
                  checked={selected.length === pendingTransactions.length && pendingTransactions.length > 0}
                  onCheckedChange={toggleAll}
                  className="rounded-none h-5 w-5 border-2 border-black dark:border-white data-[state=checked]:bg-black dark:data-[state=checked]:bg-white data-[state=checked]:text-white dark:data-[state=checked]:text-black"
                />
                <label className="text-xs font-black uppercase tracking-wider flex-1 cursor-pointer" onClick={toggleAll}>
                  Select All ({selected.length}/{pendingTransactions.length})
                </label>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {pendingTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className={`flex items-center gap-3 p-3 border-2 transition-all ${
                        selected.includes(tx.id) 
                        ? 'border-black dark:border-white bg-primary/10' 
                        : 'border-transparent hover:border-black/20 dark:hover:border-white/20 bg-muted/20'
                    }`}
                  >
                    <Checkbox
                      checked={selected.includes(tx.id)}
                      onCheckedChange={() => toggleSelect(tx.id)}
                      className="rounded-none border-2 border-black dark:border-white"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black uppercase">Tx #{tx.id}</p>
                      <p className="text-[10px] font-mono opacity-60 truncate">To: {tx.to}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold font-mono">{formatAmount(tx.value)} ETH</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {error && (
              <div className="p-4 border-2 border-red-500 bg-red-500/10 text-red-600 font-bold text-xs uppercase flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5"/>
                <span>{error}</span>
              </div>
            )}

          <div className="flex gap-4 pt-4 border-t-2 border-black dark:border-white">
              <Button 
                variant="outline" 
                className="flex-1 h-12 rounded-none border-2 border-black dark:border-white font-bold uppercase hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black" 
                onClick={onClose} 
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 h-12 rounded-none border-2 border-black dark:border-white font-black uppercase italic shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all" 
                disabled={selected.length === 0 || isPending} 
                onClick={handleBatchConfirm}
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Confirm ({selected.length})
              </Button>
            </div>
          </CardContent>
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