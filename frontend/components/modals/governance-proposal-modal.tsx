'use client';

import { useState, useEffect } from 'react';
import { X, Send, Loader2, AlertCircle, Clock, Users, Percent, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { StatusModal, StatusType } from '@/components/modals/status-modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  submitChangeRequiredPct, 
  submitChangeTimelock, 
  submitChangeExpiry, 
  submitChangeMinOwners 
} from '@/lib/web3';

export type GovernanceType = 'percentage' | 'timelock' | 'expiry' | 'minOwners' | null;

interface GovernanceProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: GovernanceType;
  controllerAddress: string;
  currentValue?: string | number;
}

const TIME_UNITS = [
  { label: 'Minutes', value: 60 },
  { label: 'Hours', value: 3600 },
  { label: 'Days', value: 86400 },
];

export function GovernanceProposalModal({ 
  isOpen, 
  onClose, 
  type, 
  controllerAddress,
  currentValue 
}: GovernanceProposalModalProps) {
  const [value, setValue] = useState('');
  const [timeUnit, setTimeUnit] = useState('3600'); 
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusState, setStatusState] = useState<{
    isOpen: boolean; type: StatusType; title: string; description: string; txHash?: string;
  }>({ isOpen: false, type: null, title: '', description: '' });

  useEffect(() => {
    if (isOpen) {
      setValue('');
      setError(null);
    }
  }, [isOpen, type]);

  if (!isOpen || !type) return null;

  const getTitle = () => {
    switch (type) {
      case 'percentage': return 'MODIFY THRESHOLD';
      case 'timelock': return 'MODIFY TIMELOCK';
      case 'expiry': return 'MODIFY EXPIRY';
      case 'minOwners': return 'MODIFY MIN OWNERS';
      default: return 'GOVERNANCE CHANGE';
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'percentage': return 'New required voting power % to pass proposals.';
      case 'timelock': return 'New mandatory delay period before execution.';
      case 'expiry': return 'New validity duration for pending proposals.';
      case 'minOwners': return 'New absolute minimum number of signers.';
      default: return '';
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setIsPending(true);

    try {
      const numValue = Number(value);
      if (isNaN(numValue) || numValue < 0) throw new Error("Invalid number");

      let txResponse;
      if (type === 'percentage') {
        if (numValue > 100) throw new Error("Percentage cannot exceed 100");
        txResponse = await submitChangeRequiredPct(controllerAddress, numValue);
      } 
      else if (type === 'minOwners') {
        if (numValue < 1) throw new Error("Minimum owners must be at least 1");
        txResponse = await submitChangeMinOwners(controllerAddress, numValue);
      } 
      else if (type === 'timelock') {
        const totalSeconds = numValue * Number(timeUnit);
        txResponse = await submitChangeTimelock(controllerAddress, totalSeconds);
      } 
      else if (type === 'expiry') {
        const totalSeconds = numValue * Number(timeUnit);
        txResponse = await submitChangeExpiry(controllerAddress, totalSeconds);
      }

      setStatusState({
        isOpen: true,
        type: 'success',
        title: 'PROPOSAL SUBMITTED',
        description: 'Governance change initialized.',
        txHash: txResponse?.hash
      });

    } catch (err: any) {
      setError(err.message || 'Transaction failed');
    } finally {
      setIsPending(false);
    }
  };

  const handleStatusClose = () => {
    setStatusState(prev => ({ ...prev, isOpen: false }));
    if (statusState.type === 'success') onClose();
  };

  const isTimeBased = type === 'timelock' || type === 'expiry';

  return (
    <>
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <Card className="w-full max-w-md border-2 border-black dark:border-white bg-white dark:bg-[#080808] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] rounded-none">
        
        <div className="flex items-center justify-between p-6 border-b-2 border-black dark:border-white">
          <div className="flex items-center gap-3">
             <div className="bg-black dark:bg-white text-white dark:text-black p-1">
                <Settings2 className="h-5 w-5" />
             </div>
             <h2 className="text-xl font-black italic uppercase tracking-tighter">{getTitle()}</h2>
          </div>
          <button onClick={onClose} className="border-2 border-transparent hover:border-black dark:hover:border-white p-1 transition-all">
            <X className="h-6 w-6" />
          </button>
        </div>

        <CardContent className="p-6 space-y-8">
          <div className="border-l-4 border-black dark:border-white pl-4 py-1">
             <p className="font-bold uppercase text-xs opacity-60 mb-1">Objective</p>
             <p className="text-sm font-medium">{getDescription()}</p>
          </div>
          
          {currentValue !== undefined && (
             <div className="flex justify-between items-center p-3 border-2 border-black/10 dark:border-white/10">
                <span className="text-xs font-black uppercase opacity-50">Current Setting</span>
                <span className="font-mono font-bold text-lg">{currentValue}</span>
             </div>
          )}

          <div className="space-y-3">
            <Label className="font-black uppercase text-xs">New Parameter Value</Label>
            <div className="flex gap-0">
              <div className="relative flex-1">
                <Input 
                  type="number" 
                  placeholder="VALUE" 
                  value={value} 
                  onChange={(e) => setValue(e.target.value)}
                  className={`h-12 rounded-none border-2 border-black dark:border-white text-lg font-mono placeholder:text-muted-foreground/30 focus-visible:ring-0 ${isTimeBased ? 'border-r-0' : ''}`}
                />
              </div>

              {isTimeBased && (
                <Select value={timeUnit} onValueChange={setTimeUnit}>
                  <SelectTrigger className="w-32 h-12 rounded-none border-2 border-black dark:border-white font-bold uppercase bg-muted/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-2 border-black dark:border-white">
                    {TIME_UNITS.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value.toString()} className="font-mono text-xs uppercase">
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {error && (
            <div className="p-4 border-2 border-red-500 bg-red-500/10 text-red-600 font-bold text-xs uppercase flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5"/>
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-4 pt-4">
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
                  onClick={handleSubmit} 
                  disabled={isPending || !value}
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Submit Proposal
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