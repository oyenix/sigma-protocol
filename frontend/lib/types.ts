// Contract and app data types
export interface Owner {
  address: string;
  name: string;
  percentage: number;
  removable: boolean;
}

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
  confirmations: string[]; // Fixed: Changed from {} to string[]
  timestamp: string;
  timelockEnd: string;
}

export interface MultiSigOwner {
  address: string;
  name: string;
  percentage: number;
  removable: boolean;
}

export interface MultiSig {
  controller: string;
  wallet: string;
  name: string;
  owners: MultiSigOwner[];
  balance: string;
  config: {
    requiredPercentage: number;
    paused: boolean;
    timelockPeriod: number;
    expiryPeriod: number;
    minOwners: number;
  };
  transactions: Transaction[]; // Added this required property
  deployed?: number;
  isCreator?: boolean;
}

export interface MultisigConfig {
  requiredPercentage: number;
  timelockPeriod: number;
  expiryPeriod: number;
  minOwners: number;
  paused: boolean;
}

