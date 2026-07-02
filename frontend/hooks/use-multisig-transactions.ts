  'use client';

  import { usePublicClient } from 'wagmi';
  import { useCallback, useEffect, useState } from 'react';
  import { Transaction } from '@/lib/types';
  import { fetchTransactions } from '@/lib/web3';

  export function useMultisigTransactions(controllerAddress: string) {
    const publicClient = usePublicClient();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTxs = useCallback(async () => {
      if (!publicClient || !controllerAddress) return;

      setLoading(true);
      setError(null);

      try {
        const txs = await fetchTransactions(publicClient, controllerAddress);
        console.log('[v0] Fetched transactions:', txs.length);
        setTransactions(txs);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch transactions';
        console.error('[v0] Error fetching transactions:', message);
        setError(message);
      } finally {
        setLoading(false);
      }
    }, [publicClient, controllerAddress]);

    useEffect(() => {
      fetchTxs();
    }, [fetchTxs]);

    return { transactions, loading, error, refetch: fetchTxs };
  }
