// lib/chains.ts

export const SUPPORTED_CHAINS = {
  // --- L2s & Rollups (Testnets) ---
  84532: {
    id: 84532,
    name: 'Base Sepolia',
    symbol: 'ETH',
    explorer: 'https://sepolia.basescan.org',
    factoryAddress: process.env.NEXT_PUBLIC_FACTORY_ADDRESS,
  },
  421614: {
    id: 421614,
    name: 'Arbitrum',
    symbol: 'ETH',
    explorer: 'https://sepolia.arbiscan.io',
    factoryAddress: process.env.NEXT_PUBLIC_FACTORY_ADDRESS,
  },
  4202: {
    id: 4202,
    name: 'Lisk',
    symbol: 'ETH',
    explorer: 'https://sepolia-blockscout.lisk.com',
    factoryAddress: process.env.NEXT_PUBLIC_FACTORY_ADDRESS,
  },
  11155420: { // Already OP Sepolia
    id: 11155420,
    name: 'OP',
    symbol: 'ETH',
    explorer: 'https://sepolia-optimism.etherscan.io',
    factoryAddress: process.env.NEXT_PUBLIC_FACTORY_ADDRESS,
  },
  
  // --- Alt L1s / Sidechains (Testnets) ---
  97: { // Already BNB Testnet
    id: 97,
    name: 'BNB',
    symbol: 'tBNB',
    explorer: 'https://testnet.bscscan.com',
    factoryAddress: process.env.NEXT_PUBLIC_FACTORY_ADDRESS,
  },
  11142220: {
    id: 11142220,
    name: 'Celo',
    symbol: 'CELO',
    explorer: 'https://sepolia.celoscan.io',
    factoryAddress: process.env.NEXT_PUBLIC_FACTORY_ADDRESS,
  },
  43113: {
    id: 43113,
    name: 'Avalanche',
    symbol: 'AVAX',
    explorer: 'https://testnet.snowtrace.io',
    factoryAddress: process.env.NEXT_PUBLIC_FACTORY_ADDRESS,
  },
  80002: {
    id: 80002,
    name: 'Polygon', 
    symbol: 'POL', 
    explorer: 'https://amoy.polygonscan.com',
    factoryAddress: process.env.NEXT_PUBLIC_FACTORY_ADDRESS,
  },
  11155111: { // Already Ethereum Sepolia
    id: 11155111,
    name: 'Ethereum',
    symbol: 'ETH',
    explorer: 'https://sepolia.etherscan.io',
    factoryAddress: process.env.NEXT_PUBLIC_FACTORY_ADDRESS,
  },
  42431: {
    id: 42431,
    name: 'Tempo',
    symbol: 'TEM',
    explorer: 'https://explore.tempo.xyz/',
    factoryAddress: process.env.NEXT_PUBLIC_FACTORY_ADDRESS,
  },
} as const;

export type SupportedChainId = keyof typeof SUPPORTED_CHAINS;

export const getChainConfig = (chainId: number) => {
  // Cast to SupportedChainId to satisfy TypeScript, fallback to Base Sepolia (84532) if unknown
  return SUPPORTED_CHAINS[chainId as SupportedChainId] || SUPPORTED_CHAINS[84532];
};