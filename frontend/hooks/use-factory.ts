// hooks/use-factory.ts
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import {
  getAllControllers,
  getMultisigOwners,
  getMultisigConfig,
  getWalletBalance,
  getTransaction,
  getProvider,
  getMultiSigInfo,
} from '@/lib/web3';
import type { MultiSig, Transaction, MultiSigOwner } from '@/lib/types';

export type FetchStatus = {
  total: number; valid: number; invalid: number; processing: number;
  details: Array<{ address: string; status: 'valid' | 'invalid' | 'processing'; reason?: string }>;
};

export function useFactoryMultisigs(factoryAddress: string) {
  const [multisigs, setMultisigs] = useState<MultiSig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>({ total: 0, valid: 0, invalid: 0, processing: 0, details: [] });

  const fetchMultisigs = useCallback(async () => {
    if (!factoryAddress || factoryAddress.length !== 42) { setLoading(false); return; }

    setLoading(true);
    setError(null);

    try {
      const provider = getProvider();
      const factoryCode = await provider.getCode(factoryAddress);
      if (factoryCode === '0x') throw new Error('No contract at factory address');

      const controllers: string[] = await getAllControllers(factoryAddress);
      if (!controllers || controllers.length === 0) {
        setMultisigs([]);
        setLoading(false);
        return;
      }

      const statusDetails: FetchStatus['details'] = controllers.map((addr: string) => ({ address: addr, status: 'processing' as const }));
      setFetchStatus({ total: controllers.length, valid: 0, invalid: 0, processing: controllers.length, details: statusDetails });

      const results = await Promise.allSettled(
        controllers.map(async (controllerAddress: string, index: number): Promise<MultiSig> => {
          try {
            const info = await getMultiSigInfo(controllerAddress, factoryAddress);
            const exists = info.wallet && info.wallet !== ethers.ZeroAddress;
            if (!exists) throw new Error('Multisig does not exist in factory registry');

            const [owners, config, balance] = await Promise.all([
              getMultisigOwners(controllerAddress),
              getMultisigConfig(controllerAddress),
              getWalletBalance(info.wallet),
            ]);

            statusDetails[index] = { address: controllerAddress, status: 'valid' };

            const ownerList: MultiSigOwner[] = (owners || []).map((o: any) => ({
              address: o.address,
              name: o.name,
              percentage: Number(o.percentage),
              removable: o.removable,
            }));

            return {
              controller: controllerAddress,
              wallet: info.wallet,
              name: info.name,
              owners: ownerList,
              config: {
                ...config,
                requiredPercentage: Number(config.requiredPercentage),
                timelockPeriod: Number(config.timelockPeriod),
                expiryPeriod: Number(config.expiryPeriod),
                minOwners: Number(config.minOwners),
              },
              balance,
              transactions: [],
              deployed: Date.now(),
            };
          } catch (err: any) {
            statusDetails[index] = { address: controllerAddress, status: 'invalid', reason: err.message };
            throw err;
          }
        })
      );

      const validMultisigs: MultiSig[] = [];
      let validCount = 0, invalidCount = 0;
      results.forEach(r => {
        if (r.status === 'fulfilled') { validMultisigs.push(r.value); validCount++; }
        else invalidCount++;
      });

      setFetchStatus({ total: controllers.length, valid: validCount, invalid: invalidCount, processing: 0, details: statusDetails });
      setMultisigs(validMultisigs);
    } catch (err: any) {
      setError(err.message || 'Failed to load multisigs');
      setMultisigs([]);
    } finally {
      setLoading(false);
    }
  }, [factoryAddress]);

  useEffect(() => { fetchMultisigs(); }, [fetchMultisigs]);

  const fetchTransaction = useCallback(async (controllerAddress: string, transactionId: number): Promise<Transaction> => {
    const tx = await getTransaction(controllerAddress, transactionId);
    return { id: transactionId, ...tx, confirmations: [] } as Transaction;
  }, []);

  return { multisigs, loading, error, fetchStatus, refetch: fetchMultisigs, fetchTransaction };
}