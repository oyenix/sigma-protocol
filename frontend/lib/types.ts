// Contract and app data types

export interface MultiSigOwner {
  address: string;
  name: string;
  percentage: number;
  removable: boolean;
}

// Alias for backward compat if anything imports Owner directly
export type Owner = MultiSigOwner;

export interface Transaction {
  id: number;
  initiator: string;
  to: string;
  value: string;
  data: string;
  isTokenTransfer: boolean;
  tokenAddress: string;
  executed: boolean;
  confirmationCount: string;
  confirmations: string[];
  timestamp: string;
  timelockEnd: string;
}

export interface MultisigConfig {
  requiredPercentage: number;
  timelockPeriod: number;
  expiryPeriod: number;
  minOwners: number;
  paused: boolean;
}

export interface MultiSig {
  controller: string;
  wallet: string;
  name: string;
  owners: MultiSigOwner[];
  balance: string;
  config: MultisigConfig;
  transactions: Transaction[];
  deployed?: number;
  isCreator?: boolean;
}