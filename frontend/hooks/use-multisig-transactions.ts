'use client';

import { useCallback, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Transaction } from '@/lib/types';
import { getTransaction } from '@/lib/web3';

export function useMultisigTransactions(controllerAddress: string, maxToScan = 50) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTxs = useCallback(async () => {
    if (!controllerAddress) return;
    setLoading(true);
    setError(null);
    try {
      const txs: Transaction[] = [];
      for (let i = 0; i < maxToScan; i++) {
        try {
          const tx = await getTransaction(controllerAddress, i);
          if (tx.initiator === ethers.ZeroAddress) break;
          txs.push({ id: i, ...tx, confirmations: [] });
        } catch {
          break;
        }
      }
      setTransactions(txs.sort((a, b) => b.id - a.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [controllerAddress, maxToScan]);

  useEffect(() => { fetchTxs(); }, [fetchTxs]);

  return { transactions, loading, error, refetch: fetchTxs };
}