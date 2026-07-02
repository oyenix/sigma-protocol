import { useState, useEffect, useCallback } from 'react';
import {
  getAllControllers,
  getMultisigOwners,
  getMultisigConfig,
  getWalletBalance,
  getTransaction,
  initializeProvider,
  getProvider,
  getMultiSigInfo, // <--- Using the new optimized function
} from '@/lib/web3';

export type Owner = {
  address: string;
  name: string;
  percentage: string;
  removable: boolean;
};

export type Transaction = {
  id: number;
  initiator: string;
  to: string;
  value: string;
  data: string;
  isTokenTransfer: boolean;
  tokenAddress: string;
  executed: boolean;
  confirmationCount: string;
  timestamp: string;
  timelockEnd: string;
};

export type MultiSig = {
  controller: string;
  wallet: string;
  name: string; // <--- Added Name
  owners: Owner[];
  config: { 
    requiredPercentage: number; 
    paused: boolean;
    timelockPeriod: number;
    expiryPeriod: number;
    minOwners: number;
  };
  balance: string;
  transactions: Transaction[];
  deployed: number;
};

export type FetchStatus = {
  total: number;
  valid: number;
  invalid: number;
  processing: number;
  details: Array<{
    address: string;
    status: 'valid' | 'invalid' | 'processing';
    reason?: string;
  }>;
};

export function useFactoryMultisigs(factoryAddress: string) {
  const [multisigs, setMultisigs] = useState<MultiSig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>({
    total: 0,
    valid: 0,
    invalid: 0,
    processing: 0,
    details: [],
  });

  const fetchMultisigs = useCallback(async () => {
    if (!factoryAddress || factoryAddress === '0x' || factoryAddress.length !== 42) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // 1. Initialize Provider
      await initializeProvider();
      const provider = getProvider();

      // 2. Verify Factory
      const factoryCode = await provider.getCode(factoryAddress);
      if (factoryCode === '0x') throw new Error(`No contract at factory address`);

      // 3. Get Controllers
      const controllers = await getAllControllers(factoryAddress);
      
      if (!controllers || controllers.length === 0) {
        setMultisigs([]);
        setLoading(false);
        return;
      }

      // Initialize status tracking
      const statusDetails: FetchStatus['details'] = controllers.map(addr => ({
        address: addr,
        status: 'processing' as const,
      }));

      setFetchStatus({
        total: controllers.length,
        valid: 0,
        invalid: 0,
        processing: controllers.length,
        details: statusDetails,
      });

      // 4. Process Controllers
      const results = await Promise.allSettled(
        controllers.map(async (controllerAddress: string, index: number) => {
          try {
            // A. Get Basic Info from Factory (Name & Wallet) - NEW OPTIMIZATION
            // This prevents us from having to call the controller just to get the wallet address
            const info = await getMultiSigInfo(factoryAddress, controllerAddress);
            
            if (!info.exists) throw new Error('Multisig does not exist in factory registry');

            // B. Get Owners & Config (Logic on Controller)
            // We run these in parallel for speed
            const [owners, config, balance] = await Promise.all([
              getMultisigOwners(controllerAddress),
              getMultisigConfig(controllerAddress),
              getWalletBalance(info.wallet) // Use wallet address from factory
            ]);

            // C. Format Data
            const ownerList: Owner[] = owners.addresses.map((addr: string, i: number) => ({
              address: addr,
              name: owners.names[i] || `Owner ${i + 1}`,
              percentage: owners.percentages[i],
              removable: owners.removables[i],
            }));

            statusDetails[index] = { address: controllerAddress, status: 'valid' };

            return {
              controller: controllerAddress,
              wallet: info.wallet,
              name: info.name,
              owners: ownerList,
              config, // Now includes timelock, expiry, minOwners
              balance,
              transactions: [], // We don't fetch txs initially to keep it fast
              deployed: Date.now(),
            };

          } catch (err: any) {
            console.error(`Error fetching ${controllerAddress}:`, err);
            statusDetails[index] = {
              address: controllerAddress,
              status: 'invalid',
              reason: err.message,
            };
            throw err;
          }
        })
      );

      // 5. Filter Valid Results
      const validMultisigs: MultiSig[] = [];
      let validCount = 0;
      let invalidCount = 0;

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          validMultisigs.push(result.value);
          validCount++;
        } else {
          invalidCount++;
        }
      });

      setFetchStatus({
        total: controllers.length,
        valid: validCount,
        invalid: invalidCount,
        processing: 0,
        details: statusDetails,
      });

      setMultisigs(validMultisigs);

    } catch (err: any) {
      console.error('Fatal error fetching multisigs:', err);
      setError(err.message || 'Failed to load multisigs');
      setMultisigs([]);
    } finally {
      setLoading(false);
    }
  }, [factoryAddress]);

  useEffect(() => {
    fetchMultisigs();
  }, [fetchMultisigs]);

  const fetchTransaction = useCallback(
    async (controllerAddress: string, transactionId: number) => {
      try {
        const tx = await getTransaction(controllerAddress, transactionId);
        return {
          id: transactionId,
          ...tx,
        };
      } catch (err) {
        console.error('Error fetching transaction:', err);
        throw err;
      }
    },
    []
  );

  return {
    multisigs,
    loading,
    error,
    fetchStatus,
    refetch: fetchMultisigs,
    fetchTransaction,
  };
}