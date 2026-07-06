'use client';

import { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Clock,
  Save,
  RotateCcw,
  ArrowRight,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/components/providers/wallet-context';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { createMultiSig } from '@/lib/web3';
import { Interface } from 'ethers';
import { MULTISIG_FACTORY_ABI } from '@/lib/abi';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Owner {
  address: string;
  name: string;
  percentage: number;
  removable: boolean;
}

const TIME_UNITS = [
  { label: 'Minutes', value: 60 },
  { label: 'Hours', value: 3600 },
  { label: 'Days', value: 86400 },
  { label: 'Weeks', value: 604800 },
];

const STORAGE_KEY = 'sigma_multisig_draft_v2';

export default function CreateMultisigPage() {
   const { isInitialized, isConnected, address, setShowModal } = useWallet();
    const userAddress = address ?? '';

  // --- STATE ---
  const [isLoaded, setIsLoaded] = useState(false);
  const [step, setStep] = useState(1);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Form States
  const [multisigName, setMultisigName] = useState('');
  const [daoId, setDaoId] = useState(''); // NEW: Cross-chain salt
  const [owners, setOwners] = useState<Owner[]>([
    { address: '', name: '', percentage: 60, removable: false },
    { address: '', name: '', percentage: 40, removable: true },
  ]);
  const [requiredPercentage, setRequiredPercentage] = useState(0);
  const [minOwners, setMinOwners] = useState(2);
  const [timelockVal, setTimelockVal] = useState(24);
  const [timelockUnit, setTimelockUnit] = useState(3600);
  const [expiryVal, setExpiryVal] = useState(7);
  const [expiryUnit, setExpiryUnit] = useState(86400);
  const [deployedAddress, setDeployedAddress] = useState<string>('');
  
  // --- PERSISTENCE LOGIC ---
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setStep(data.step || 1);
        setMultisigName(data.multisigName || '');
        setDaoId(data.daoId || '');
        if (data.owners && data.owners.length > 0) setOwners(data.owners);
        if (data.requiredPercentage) setRequiredPercentage(data.requiredPercentage);
        if (data.minOwners) setMinOwners(data.minOwners);
        if (data.timelockVal) setTimelockVal(data.timelockVal);
        if (data.timelockUnit) setTimelockUnit(data.timelockUnit);
        if (data.expiryVal) setExpiryVal(data.expiryVal);
        if (data.expiryUnit) setExpiryUnit(data.expiryUnit);
      } catch (e) {
        console.error("Failed to load draft", e);
      }
    }
    setIsLoaded(true);
  }, []);

  

  useEffect(() => {
    if (!isLoaded) return;
    const data = {
      step, multisigName, daoId, owners, requiredPercentage, minOwners, timelockVal, timelockUnit, expiryVal, expiryUnit
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [step, multisigName, daoId, owners, requiredPercentage, minOwners, timelockVal, timelockUnit, expiryVal, expiryUnit, isLoaded]);

  const resetForm = () => {
    if (confirm("Are you sure you want to clear this form?")) {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    }
  };

  // --- VALIDATION LOGIC ---
  const totalPercentage = owners.reduce((sum, o) => sum + o.percentage, 0);
  const ownersWithValidFields = owners.filter(
    (o) => o.address && o.address.startsWith('0x') && o.address.length === 42 && o.name.trim() !== ''
  );
  const isCreatorInOwners = owners.some(o => o.address.toLowerCase() === userAddress.toLowerCase());
  const effectiveThreshold = requiredPercentage || totalPercentage;
  const isStep1Valid =
    multisigName.trim().length > 0 &&
    daoId.trim().length > 0 &&
    owners.length >= 2 &&
    ownersWithValidFields.length === owners.length &&
    totalPercentage <= 100 &&
    totalPercentage > 0 &&
    !isCreatorInOwners;

  // Auto-generate slugified DAO ID based on Name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMultisigName(val);
    if (!daoId || daoId === multisigName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) {
      setDaoId(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  };
useEffect(() => {
  if (requiredPercentage > totalPercentage) {
    setRequiredPercentage(0); // resets to totalPercentage default
  }
}, [totalPercentage]);
  // --- ACTIONS ---
  const addOwner = () => {
    const remaining = 100 - totalPercentage;
    const defaultPct = remaining >= 10 ? 10 : remaining > 0 ? remaining : 0;
    setOwners([...owners, { address: '', name: '', percentage: defaultPct, removable: true }]);
  };

  const removeOwner = (index: number) => {
    if (owners.length <= 2) return;
    setOwners(owners.filter((_, i) => i !== index));
  };

  const updateOwner = (index: number, field: keyof Owner, value: any) => {
    const updated = [...owners];
    if (field === 'percentage') {
      let num = Number(value) || 0;
      num = Math.min(100, Math.max(0, num));
      const othersTotal = totalPercentage - owners[index].percentage;
      if (othersTotal + num > 100) num = 100 - othersTotal;
      updated[index].percentage = num;
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setOwners(updated);
  };

  const deployMultisig = async () => {
    if (!isStep1Valid) return;

    setError(null);
    setIsPending(true);

    const finalTimelock = timelockVal * timelockUnit;
    const finalExpiry = expiryVal * expiryUnit;

    try {
      const receipt = await createMultiSig(
        multisigName,
        owners.map((o) => o.address),
        owners.map((o) => o.name),
        owners.map((o) => o.percentage),
        owners.map((o) => o.removable),
        effectiveThreshold,  // ← was requiredPercentage
        finalTimelock,
        finalExpiry,
        minOwners,
        968
      );

      const iface = new Interface(MULTISIG_FACTORY_ABI);
      let newController = '';
      
      for (const log of receipt.logs) {
        try {
          const parsedLog = iface.parseLog(log);
          if (parsedLog && parsedLog.name === 'MultiSigCreated') {
            newController = parsedLog.args[0];
            break;
          }
        } catch (e) {}
      }

      setTxHash(receipt.hash);
      if (newController) {
        setDeployedAddress(newController);
      }
      setIsSuccess(true);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to deploy multisig. (Note: If using same DAO ID, it may already exist on this chain).');
    } finally {
      setIsPending(false);
    }
  };

  if (!isLoaded || !isInitialized) {
  return (
    <div className="min-h-screen bg-white dark:bg-[#080808] p-6 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-black dark:text-white" />
        <p className="font-bold uppercase tracking-widest">Loading Workspace...</p>
      </div>
    </div>
  );
}
if (!isConnected) {
  return (
    <div className="min-h-screen bg-white dark:bg-[#080808] p-6 flex items-center justify-center">
      <div className="max-w-md w-full text-center border-2 border-black dark:border-white p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
        <h2 className="text-2xl font-black italic uppercase mb-4">Connect to Deploy</h2>
        <Button onClick={() => setShowModal(true)} size="lg" className="w-full rounded-none border-2 border-black dark:border-white font-bold uppercase hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
          Connect Wallet
        </Button>
      </div>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-white dark:bg-[#080808] p-6 md:p-12 text-black dark:text-white">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
            <div>
                <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter mb-2">
                    Initialize Treasury
                </h1>
                <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">
                    / Create / New_Instance
                </p>
            </div>
            {!isSuccess && (
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground bg-muted/20 px-3 py-1 border-2 border-transparent">
                        <Save className="h-3 w-3" /> Auto-Saving
                    </div>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={resetForm}
                        className="text-xs hover:text-red-500 hover:bg-red-500/10"
                    >
                        <RotateCcw className="h-3 w-3 mr-1" /> Reset
                    </Button>
                </div>
            )}
        </div>

        {/* Progress Bar */}
        {!isSuccess && (
          <div className="mb-12">
            <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-3">
              <span className={step >= 1 ? 'text-primary underline decoration-2 underline-offset-4' : 'opacity-30'}>01. Structure</span>
              <span className={step >= 2 ? 'text-primary underline decoration-2 underline-offset-4' : 'opacity-30'}>02. Governance</span>
              <span className={step >= 3 ? 'text-primary underline decoration-2 underline-offset-4' : 'opacity-30'}>03. Deploy</span>
            </div>
            <div className="h-4 border-2 border-black dark:border-white p-0.5">
              <div 
                  className="h-full bg-black dark:bg-white transition-all duration-500 ease-out" 
                  style={{ width: `${(step / 3) * 100}%` }} 
              />
            </div>
          </div>
        )}

        {error && (
          <div className="mb-8 p-6 border-2 border-red-500 bg-red-500/5 text-red-600 shadow-[8px_8px_0px_0px_rgba(239,68,68,1)]">
             <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="h-6 w-6"/>
                <span className="font-black uppercase text-lg">System Error</span>
             </div>
             <p className="font-mono text-sm">{error}</p>
          </div>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <Card className="border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] rounded-none bg-transparent">
            <CardHeader className="border-b-2 border-black dark:border-white pb-6">
              <CardTitle className="text-2xl font-black italic uppercase">Company Structure</CardTitle>
              <CardDescription className="font-medium uppercase tracking-wide text-xs">
                Define Identity & Equity Distribution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-8">
              
              <div className="grid md:grid-cols-2 gap-6">
                 {/* Name Input */}
                 <div className="space-y-2">
                    <Label className="text-xs font-black uppercase">Company Name</Label>
                    <Input 
                        placeholder="E.G. ACME CORP TREASURY" 
                        value={multisigName}
                        onChange={handleNameChange}
                        className="h-14 text-lg font-bold uppercase rounded-none border-2 border-black dark:border-white focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
                    />
                 </div>
                 {/* DAO ID / SALT Input */}
                 <div className="space-y-2">
                    <Label className="text-xs font-black uppercase flex items-center gap-2">
                      Cross-Chain ID <Globe className="h-3 w-3 text-muted-foreground" />
                    </Label>
                    <Input 
                        placeholder="acme-corp-vault" 
                        value={daoId}
                        onChange={(e) => setDaoId(e.target.value)}
                        className="h-14 text-lg font-bold font-mono rounded-none border-2 border-black dark:border-white focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
                    />
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-1">
                      Use this exact ID on other networks to get an identical treasury address.
                    </p>
                 </div>
              </div>

              <div className="space-y-4">
                <Label className="text-xs font-black uppercase">Owners List</Label>
                {owners.map((owner, idx) => (
                  <div key={idx} className="p-6 border-2 border-black dark:border-white bg-muted/5 relative group">
                     {owner.address.toLowerCase() === userAddress.toLowerCase() && owner.address !== '' && (
                        <div className="absolute -top-3 right-4 bg-red-500 text-white text-[10px] font-bold uppercase px-2 py-1 border-2 border-black dark:border-white flex items-center">
                           Creator Restricted
                        </div>
                     )}

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-5 space-y-2">
                        <Label className="text-[10px] font-black uppercase opacity-60">Wallet Address</Label>
                        <Input
                          placeholder="0x..."
                          value={owner.address}
                          onChange={(e) => updateOwner(idx, 'address', e.target.value)}
                          className={cn(
                             "font-mono text-sm rounded-none border-2 border-black dark:border-white",
                             owner.address.toLowerCase() === userAddress.toLowerCase() ? "border-red-500 text-red-500 bg-red-500/5" : ""
                          )}
                        />
                      </div>

                      <div className="md:col-span-3 space-y-2">
                        <Label className="text-[10px] font-black uppercase opacity-60">Name / Role</Label>
                        <Input
                          placeholder="NAME"
                          value={owner.name}
                          onChange={(e) => updateOwner(idx, 'name', e.target.value)}
                          className="font-bold uppercase rounded-none border-2 border-black dark:border-white"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-2">
                         <Label className="text-[10px] font-black uppercase opacity-60">Equity %</Label>
                         <div className="relative">
                          <Input
                            type="number"
                            value={owner.percentage}
                            onChange={(e) => updateOwner(idx, 'percentage', e.target.value)}
                            className="pr-8 rounded-none border-2 border-black dark:border-white font-mono"
                          />
                          <span className="absolute right-3 top-2.5 text-xs font-bold">%</span>
                        </div>
                      </div>

                      <div className="md:col-span-2 flex items-end pb-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={owner.removable}
                            onCheckedChange={(c) => updateOwner(idx, 'removable', !!c)}
                            id={`removable-${idx}`}
                            className="rounded-none border-2 border-black dark:border-white h-5 w-5 data-[state=checked]:bg-black dark:data-[state=checked]:bg-white data-[state=checked]:text-white dark:data-[state=checked]:text-black"
                          />
                          <Label htmlFor={`removable-${idx}`} className="text-xs font-bold uppercase cursor-pointer">Removable</Label>
                        </div>
                      </div>
                    </div>

                    {owners.length > 2 && (
                        <Button 
                           size="icon" 
                           variant="ghost" 
                           onClick={() => removeOwner(idx)} 
                           className="absolute -right-3 -top-3 h-8 w-8 bg-white dark:bg-black border-2 border-black dark:border-white hover:bg-red-500 hover:border-red-500 hover:text-white rounded-none shadow-sm transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                  </div>
                ))}
              </div>

              {/* Equity Total Bar */}
              <div className={cn(
                  "p-4 border-2 border-black dark:border-white flex justify-between items-center",
                  totalPercentage > 100 ? "bg-red-500/10 border-red-500" : "bg-black/5 dark:bg-white/5"
              )}>
                <span className="text-sm font-black uppercase">Total Allocation</span>
                <span className={cn("text-3xl font-black tabular-nums", totalPercentage > 100 ? "text-red-500" : "")}>
                  {totalPercentage}%
                </span>
              </div>

              {totalPercentage <= 100 && (
                <Button 
                    onClick={addOwner} 
                    disabled={totalPercentage >= 100}
                    variant="outline"
                    className="w-full h-12 rounded-none border-2 border-black dark:border-white border-dashed hover:border-solid hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black font-bold uppercase transition-all"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Owner
                </Button>
              )}

              {/* Validation Warning */}
              {(!isStep1Valid && owners.length >= 2) && (
                <div className="p-4 bg-orange-500/10 border-2 border-orange-500 text-orange-600">
                   <h4 className="font-black uppercase text-sm mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4"/> Attention Required
                   </h4>
                   <ul className="list-disc list-inside text-xs font-medium space-y-1">
                    {!multisigName && <li>Company name is required</li>}
                    {!daoId && <li>Cross-Chain ID is required</li>}
                    {isCreatorInOwners && <li>Creator wallet cannot be listed as an owner</li>}
                    {totalPercentage > 100 && <li>Equity allocation exceeds 100%</li>}
                    {ownersWithValidFields.length !== owners.length && <li>Invalid wallet addresses or missing names</li>}
                   </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <Card className="border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] rounded-none bg-transparent">
            <CardHeader className="border-b-2 border-black dark:border-white pb-6">
              <CardTitle className="text-2xl font-black italic uppercase">Governance Logic</CardTitle>
              <CardDescription className="font-medium uppercase tracking-wide text-xs">
                Thresholds & Timing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-10 pt-8">
              
              <div className="text-center">
                <p className="text-xs font-black uppercase opacity-60 mb-4">Approval Threshold Required</p>
                <div className="text-8xl font-black italic text-black dark:text-white mb-2">
                  {effectiveThreshold}%
                </div>

                <Slider
                  value={[effectiveThreshold]}
                  onValueChange={([v]) => setRequiredPercentage(Math.min(v, totalPercentage))}
                  min={1}
                  max={totalPercentage || 100}
                  step={1}
                  className="max-w-lg mx-auto py-6"
                />
                <p className="text-xs text-muted-foreground uppercase font-medium">
                  Of total equity voting power to execute
                </p>
                <p className="text-[10px] text-muted-foreground uppercase font-medium mt-1 opacity-60">
                  Max: {totalPercentage}% (total allocated equity)
                </p>
              </div>

              <div className="h-px bg-black/10 dark:bg-white/10 w-full" />

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Label className="flex items-center gap-2 font-black uppercase text-sm">
                     <Clock className="w-4 h-4"/> Timelock Delay
                  </Label>
                  <p className="text-xs text-muted-foreground">Mandatory wait time before execution.</p>
                  
                  <div className="flex gap-0">
                     <Input 
                        type="number" 
                        min="0"
                        value={timelockVal}
                        onChange={(e) => setTimelockVal(Math.max(0, Number(e.target.value)))}
                        className="w-24 text-center rounded-none border-2 border-black dark:border-white border-r-0 font-mono text-lg"
                     />
                     <Select 
                        value={timelockUnit.toString()} 
                        onValueChange={(v) => setTimelockUnit(Number(v))}
                     >
                        <SelectTrigger className="flex-1 rounded-none border-2 border-black dark:border-white font-bold uppercase">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           {TIME_UNITS.map((u) => (
                              <SelectItem key={u.label} value={u.value.toString()}>{u.label}</SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="flex items-center gap-2 font-black uppercase text-sm">
                     <AlertCircle className="w-4 h-4"/> Expiry Window
                  </Label>
                  <p className="text-xs text-muted-foreground">Time until pending proposals invalidate.</p>
                  
                  <div className="flex gap-0">
                     <Input 
                        type="number" 
                        min="1"
                        value={expiryVal}
                        onChange={(e) => setExpiryVal(Math.max(1, Number(e.target.value)))}
                        className="w-24 text-center rounded-none border-2 border-black dark:border-white border-r-0 font-mono text-lg"
                     />
                     <Select 
                        value={expiryUnit.toString()} 
                        onValueChange={(v) => setExpiryUnit(Number(v))}
                     >
                        <SelectTrigger className="flex-1 rounded-none border-2 border-black dark:border-white font-bold uppercase">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           {TIME_UNITS.map((u) => (
                              <SelectItem key={u.label} value={u.value.toString()}>{u.label}</SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t-2 border-black/10 dark:border-white/10">
                  <Label className="font-black uppercase text-sm">Minimum Signers Override</Label>
                  <div className="flex items-center gap-4 mt-4">
                     <Input
                        type="number"
                        value={minOwners}
                        onChange={(e) => setMinOwners(Math.max(1, Number(e.target.value) || 1))}
                        min="1"
                        max={owners.length}
                        className="w-24 rounded-none border-2 border-black dark:border-white font-mono text-lg text-center"
                     />
                     <span className="text-xs font-bold uppercase text-muted-foreground max-w-xs">
                        Absolute minimum number of unique wallets that must sign, regardless of equity percentage.
                     </span>
                  </div>
                </div>
            </CardContent>
          </Card>
        )}

       {/* STEP 3 */}
       {step === 3 && (
          <Card className="border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] rounded-none bg-transparent">
            <CardHeader className="border-b-2 border-black dark:border-white pb-6">
              <CardTitle className="text-2xl font-black italic uppercase">Manifest & Deploy</CardTitle>
              <CardDescription className="font-medium uppercase tracking-wide text-xs">
                Final Confirmation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-8">
              {isSuccess ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center p-4 border-2 border-emerald-500 rounded-full mb-6">
                    <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                  </div>
                  <h2 className="text-4xl font-black italic uppercase mb-2">Protocol Deployed</h2>
                  <p className="text-xl font-bold mb-6">{multisigName}</p>
                  
                  <div className="bg-black/5 dark:bg-white/5 p-4 border-2 border-black dark:border-white font-mono text-xs break-all mb-8">
                    TX: {txHash}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href={deployedAddress ? `/multisigs/${deployedAddress}` : '/multisigs'}>
                      <Button 
                        className="w-full sm:w-auto h-14 px-8 rounded-none border-2 border-black dark:border-white font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                      >
                         Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>

                    <Button 
                      variant="outline"
                      className="w-full sm:w-auto h-14 px-8 rounded-none border-2 border-black dark:border-white font-black uppercase hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
                      onClick={() => window.location.reload()}
                    >
                       Initialize Another
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid gap-8 md:grid-cols-2">
                     <div className="space-y-4">
                        <h3 className="font-black uppercase text-sm border-b-2 border-black dark:border-white pb-2">Structure</h3>
                        <div className="flex justify-between">
                           <span className="text-sm font-bold opacity-60">NAME</span>
                           <p className="font-mono font-bold uppercase">{multisigName}</p>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-sm font-bold opacity-60">CROSS-CHAIN ID</span>
                           <p className="font-mono font-bold text-primary">{daoId}</p>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-sm font-bold opacity-60">OWNERS</span>
                           <p className="font-mono font-bold">{owners.length}</p>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-sm font-bold opacity-60">TOTAL EQUITY</span>
                           <p className="font-mono font-bold">{totalPercentage}%</p>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <h3 className="font-black uppercase text-sm border-b-2 border-black dark:border-white pb-2">Governance Rules</h3>
                        <div className="flex justify-between">
                           <span className="text-sm font-bold opacity-60">THRESHOLD</span>
                           <p className="font-mono font-bold">{effectiveThreshold}%</p>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-sm font-bold opacity-60">TIMELOCK</span>
                           <p className="font-mono font-bold">{timelockVal} {TIME_UNITS.find(u => u.value === timelockUnit)?.label}</p>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-sm font-bold opacity-60">EXPIRY</span>
                           <p className="font-mono font-bold">{expiryVal} {TIME_UNITS.find(u => u.value === expiryUnit)?.label}</p>
                        </div>
                     </div>
                  </div>

                  <div className="border-2 border-black dark:border-white p-4">
                     <h4 className="text-xs font-black uppercase mb-4">Capital Table Preview</h4>
                     {owners.map((o, i) => (
                        <div key={i} className="flex justify-between text-sm mb-2 font-mono border-b border-dashed border-black/20 dark:border-white/20 pb-1 last:border-0">
                           <span className="uppercase">{o.name} <span className="opacity-50 text-[10px]">({o.address.slice(0,6)}...)</span></span>
                           <span className="font-bold">{o.percentage}%</span>
                        </div>
                     ))}
                  </div>

                  <Button
                    size="lg"
                    className="w-full h-16 text-xl rounded-none border-2 border-black dark:border-white font-black uppercase italic shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                    onClick={deployMultisig}
                    disabled={isPending || !isStep1Valid}
                  >
                    {isPending ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        Deploying Protocol...
                      </span>
                    ) : (
                      'Initialize Protocol'
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        {!isSuccess && (
           <div className="flex gap-4 mt-8">
            <Button
               variant="outline"
               onClick={() => setStep(Math.max(1, step - 1))}
               disabled={step === 1}
               className="flex-1 h-14 rounded-none border-2 border-black dark:border-white font-black uppercase"
            >
               <ChevronLeft className="h-5 w-5 mr-2" /> Previous
            </Button>

            {step < 3 && (
               <Button
               onClick={() => setStep(step + 1)}
               disabled={step === 1 && !isStep1Valid}
               className="flex-1 h-14 rounded-none border-2 border-black dark:border-white font-black uppercase hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
               >
               Continue <ChevronRight className="h-5 w-5 ml-2" />
               </Button>
            )}
           </div>
        )}
      </div>
    </div>
  );
}