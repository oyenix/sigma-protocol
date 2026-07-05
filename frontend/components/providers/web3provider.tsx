'use client';

import { ReactNode } from 'react';

interface Web3ProviderProps {
  children: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  return <>{children}</>;
}