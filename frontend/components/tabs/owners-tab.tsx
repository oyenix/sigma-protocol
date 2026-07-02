'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MultiSig, MultiSigOwner } from '@/lib/types';
import { Plus, Trash2, User, ShieldCheck, Copy, Check, Loader2, RefreshCw } from 'lucide-react';
import { getMultisigOwners } from '@/lib/web3'; // Ensure this is imported
import { SubmitTransactionModal } from '@/components/modals/submit-transaction-modal';

interface OwnersTabProps {
  multisig: MultiSig;
}

export function OwnersTab({ multisig }: OwnersTabProps) {
  const [owners, setOwners] = useState<MultiSigOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // FETCH OWNERS DIRECTLY FROM CONTRACT
 const fetchOwners = async () => {
    try {
      setLoading(true);
      const data: any = await getMultisigOwners(multisig.controller);
      
      console.log("Raw Owner Data:", data);

      let formattedOwners: MultiSigOwner[] = [];

      // CASE 1: Data is ALREADY an array of objects (Matches your console logs)
      // e.g. [{ address: '0x...', name: 'CEO', ... }, ...]
      if (Array.isArray(data) && data.length > 0 && data[0].address) {
         formattedOwners = data.map((owner: any) => ({
            address: owner.address,
            name: owner.name,
            percentage: Number(owner.percentage), // Ensure number type
            removable: owner.removable
         }));
      } 
      // CASE 2: Data is Raw Tuple (Arrays of Arrays) - Fallback
      else {
         const rawAddresses = data.addrs || data[0] || [];
         const rawNames = data.ownerNames || data.names || data[1] || [];
         const rawPercentages = data.percentages || data[2] || [];
         const rawRemovables = data.removable || data.removables || data[3] || [];
         
         if (Array.isArray(rawAddresses)) {
            formattedOwners = rawAddresses.map((addr: string, i: number) => ({
               address: addr,
               name: rawNames[i] || `Owner ${i + 1}`,
               percentage: Number(rawPercentages[i]),
               removable: rawRemovables[i],
            }));
         }
      }

      setOwners(formattedOwners);
    } catch (err) {
      console.error("Failed to load owners", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, [multisig.controller]);

  // Calculate total equity based on FRESH data
  const totalPercentage = owners.reduce((acc, owner) => acc + Number(owner.percentage), 0);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1000);
  };

  if (loading) {
     return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
           <Loader2 className="h-8 w-8 animate-spin text-primary" />
           <p className="text-muted-foreground text-sm">Syncing owner list...</p>
        </div>
     );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
         <Card className="bg-card border shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
               <div className="bg-primary/10 p-3 rounded-full">
                  <User className="h-6 w-6 text-primary"/>
               </div>
               <div>
                  <p className="text-2xl font-bold">{owners.length}</p>
                  <p className="text-sm text-muted-foreground font-medium">Active Owners</p>
               </div>
            </CardContent>
         </Card>
         <Card className="bg-card border shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
               <div className="bg-emerald-500/10 p-3 rounded-full">
                  <ShieldCheck className="h-6 w-6 text-emerald-600"/>
               </div>
               <div>
                  <p className="text-2xl font-bold">{totalPercentage}%</p>
                  <p className="text-sm text-muted-foreground font-medium">Total Equity Distributed</p>
               </div>
            </CardContent>
         </Card>
      </div>

      {/* Main List */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
             <CardTitle>Owner List</CardTitle>
             <CardDescription className="mt-1">
                Manage signers and their voting power distribution.
             </CardDescription>
          </div>
          <div className="flex gap-2">
             <Button variant="ghost" size="icon" onClick={fetchOwners} title="Refresh List">
                <RefreshCw className="h-4 w-4" />
             </Button>
             <Button onClick={() => setIsModalOpen(true)} size="sm" className="h-9 shadow-sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Owner
             </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            {owners.length === 0 ? (
               <div className="text-center py-8 text-muted-foreground">No owners found.</div>
            ) : (
               owners.map((owner, idx) => (
              <div
                key={`${owner.address}-${idx}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/20 border border-transparent hover:border-border hover:bg-muted/40 transition-all rounded-xl gap-4 group"
              >
                {/* Avatar & Info */}
                <div className="flex items-center gap-4 min-w-0">
                  <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                    <AvatarFallback className="bg-linear-to-br from-primary to-indigo-600 text-white font-bold text-sm">
                      {owner.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold text-sm truncate">{owner.name}</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-muted-foreground font-mono bg-background px-1.5 py-0.5 rounded border">
                        {owner.address.slice(0, 6)}...{owner.address.slice(-4)}
                      </code>
                      <button 
                        onClick={() => handleCopy(owner.address)}
                        className="text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                        title="Copy Address"
                      >
                        {copied === owner.address ? <Check className="h-3 w-3 text-emerald-500"/> : <Copy className="h-3 w-3"/>}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Percentage & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                  <div className="text-right">
                    <p className="font-bold text-xl tabular-nums">{owner.percentage}%</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Voting Power</p>
                  </div>
                  
                  <div className="flex items-center gap-2 pl-4 border-l border-border/50 h-10">
                     {!owner.removable ? (
                        <Badge variant="outline" className="text-[10px] h-6 bg-muted/50 text-muted-foreground border-transparent">
                           Immutable
                        </Badge>
                     ) : (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 transition-colors"
                          title="Remove Owner"
                          onClick={() => alert("To remove this owner, create a transaction proposing their removal.")}
                        >
                           <Trash2 className="h-4 w-4" />
                        </Button>
                     )}
                  </div>
                </div>
              </div>
            )))}
          </div>
        </CardContent>
      </Card>

      <SubmitTransactionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        controllerAddress={multisig.controller}
        defaultTab="owner"
      />
    </div>
  );
}