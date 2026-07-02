'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// FIX: Use shared type
import { MultiSig } from '@/lib/types';
import { Loader2, PauseCircle, PlayCircle, Settings, ShieldAlert } from 'lucide-react';
import { pauseMultisig, unpauseMultisig } from '@/lib/web3';
// Ensure this import path is correct for your project
import { GovernanceProposalModal, GovernanceType } from '@/components/modals/governance-proposal-modal';

interface SettingsTabProps {
  multisig: MultiSig;
}

export function SettingsTab({ multisig }: SettingsTabProps) {
  const [isPausePending, setIsPausePending] = useState(false);
  const [modalType, setModalType] = useState<GovernanceType | null>(null);
  const [modalCurrentValue, setModalCurrentValue] = useState<string | number>('');

  // IMPROVED TIME FORMATTER
  const formatDuration = (totalSeconds: number) => {
    if (totalSeconds === 0) return "0 Minutes";

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);

    return parts.join(' ') || `${totalSeconds}s`;
  };

  const handlePauseToggle = async () => {
    setIsPausePending(true);
    try {
      if (multisig.config.paused) {
        await unpauseMultisig(multisig.controller);
      } else {
        await pauseMultisig(multisig.controller);
      }
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      alert('Error: ' + (err.message || 'Failed to toggle pause state'));
    } finally {
      setIsPausePending(false);
    }
  };

  const openModal = (type: GovernanceType, currentVal: number | string) => {
    setModalType(type);
    setModalCurrentValue(currentVal);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Governance Settings */}
      <Card className="border-border bg-card">
        <CardHeader>
           <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary"/> 
              <CardTitle>Governance Parameters</CardTitle>
           </div>
           <CardDescription>Configure operational rules. Changes require a proposal and vote.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border/50">
           {/* Percentage */}
           <div className="flex items-center justify-between py-4 first:pt-0">
              <div>
                 <p className="font-medium text-sm">Required Approval</p>
                 <p className="text-xs text-muted-foreground">Percentage of total voting power needed to pass.</p>
              </div>
              <div className="flex items-center gap-3">
                 <span className="font-mono font-bold bg-muted px-2 py-1 rounded">{multisig.config.requiredPercentage}%</span>
                 <Button variant="outline" size="sm" onClick={() => openModal('percentage', multisig.config.requiredPercentage)}>Edit</Button>
              </div>
           </div>

           {/* Timelock */}
           <div className="flex items-center justify-between py-4">
              <div>
                 <p className="font-medium text-sm">Timelock Period</p>
                 <p className="text-xs text-muted-foreground">Mandatory delay between approval and execution.</p>
              </div>
              <div className="flex items-center gap-3">
                 <span className="font-mono font-bold bg-muted px-2 py-1 rounded">
                    {formatDuration(Number(multisig.config.timelockPeriod))}
                 </span>
                 <Button variant="outline" size="sm" onClick={() => openModal('timelock', Number(multisig.config.timelockPeriod))}>Edit</Button>
              </div>
           </div>

           {/* Expiry */}
           <div className="flex items-center justify-between py-4">
              <div>
                 <p className="font-medium text-sm">Proposal Expiry</p>
                 <p className="text-xs text-muted-foreground">Time window before an unexecuted proposal expires.</p>
              </div>
              <div className="flex items-center gap-3">
                 <span className="font-mono font-bold bg-muted px-2 py-1 rounded">
                    {formatDuration(Number(multisig.config.expiryPeriod))}
                 </span>
                 <Button variant="outline" size="sm" onClick={() => openModal('expiry', Number(multisig.config.expiryPeriod))}>Edit</Button>
              </div>
           </div>

           {/* Min Owners */}
           <div className="flex items-center justify-between py-4 last:pb-0">
              <div>
                 <p className="font-medium text-sm">Minimum Signers</p>
                 <p className="text-xs text-muted-foreground">Absolute floor for owner count (safety check).</p>
              </div>
              <div className="flex items-center gap-3">
                 <span className="font-mono font-bold bg-muted px-2 py-1 rounded">{multisig.config.minOwners} Owners</span>
                 <Button variant="outline" size="sm" onClick={() => openModal('minOwners', multisig.config.minOwners)}>Edit</Button>
              </div>
           </div>
        </CardContent>
      </Card>

      {/* Emergency Zone */}
      <Card className={`border-2 ${multisig.config.paused ? 'border-emerald-500 bg-emerald-500/5' : 'border-destructive/30 bg-destructive/5'}`}>
        <CardHeader>
           <CardTitle className="flex items-center gap-2 text-foreground">
              <ShieldAlert className={`h-5 w-5 ${multisig.config.paused ? 'text-emerald-600' : 'text-destructive'}`} /> 
              Emergency Controls
           </CardTitle>
        </CardHeader>
        <CardContent>
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                 <p className="font-medium text-sm flex items-center gap-2">
                    Contract Status: 
                    <span className={`uppercase font-bold text-xs px-2 py-0.5 rounded ${multisig.config.paused ? 'bg-emerald-200 text-emerald-800' : 'bg-green-100 text-green-700'}`}>
                        {multisig.config.paused ? 'Paused' : 'Active'}
                    </span>
                 </p>
                 <p className="text-xs text-muted-foreground max-w-md mt-1">
                    {multisig.config.paused 
                      ? 'Contract is currently paused. Only owners can unpause to resume operations.' 
                      : 'Pausing prevents all transactions. Use this if you suspect a compromise.'}
                 </p>
              </div>
              
              <Button 
                 variant={multisig.config.paused ? 'default' : 'destructive'} 
                 onClick={handlePauseToggle}
                 disabled={isPausePending}
                 className={multisig.config.paused ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              >
                 {isPausePending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                    <>
                       {multisig.config.paused ? <PlayCircle className="h-4 w-4 mr-2"/> : <PauseCircle className="h-4 w-4 mr-2"/>}
                       {multisig.config.paused ? 'Unpause Contract' : 'Pause Contract'}
                    </>
                 )}
              </Button>
           </div>
        </CardContent>
      </Card>

      {/* Proposal Modal */}
      {modalType && (
        <GovernanceProposalModal 
            isOpen={!!modalType}
            onClose={() => setModalType(null)}
            type={modalType}
            controllerAddress={multisig.controller}
            // Pass the RAW value (seconds) to the modal so logic works correctly
            currentValue={modalCurrentValue} 
        />
      )}
    </div>
  );
}