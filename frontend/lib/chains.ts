// lib/chains.ts

export const SUPPORTED_CHAINS = {
  // --- L2s & Rollups (Testnets) --
  968: {
    id: 968,
    name: 'Bot Chain ',
    symbol: 'BOT',
    explorer: 'https://rpc.bohr.life',
    factoryAddress: process.env.NEXT_PUBLIC_FACTORY_ADDRESS,
  },
 
} as const;

export type SupportedChainId = keyof typeof SUPPORTED_CHAINS;

export const getChainConfig = (chainId: number) => {
  // Cast to SupportedChainId to satisfy TypeScript, fallback to Bot Chain (968) if unknown
  return SUPPORTED_CHAINS[chainId as SupportedChainId] || SUPPORTED_CHAINS[968];
};
import { type Chain, defineChain } from "viem"
import { arbitrum, base, lisk, celo, bsc } from "viem/chains"

export const botchain = defineChain({
  id: 677,
  name: "Botchain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_BOTCHAIN_URL ?? "https://rpc.botchain.ai"] },
  },
  blockExplorers: {
    default: { name: "Botchain Explorer", url: "https://scan.botchain.ai" },
  },
  testnet: true,
})

export const supportedChains: [Chain, ...Chain[]] = [botchain]

export const CHAIN_RPC: Record<number, string> = {
  
  [botchain.id]: process.env.NEXT_PUBLIC_BOTCHAIN_URL ?? "https://rpc.botchain.ai",


}

export const CHAIN_EXPLORERS: Record<number, { name: string; url: string }> = {
  
  [botchain.id]: { name: "Botchain Explorer", url: "https://scan.botchain.ai" },
}

export const DEFAULT_CHAIN_ID = botchain.id
export const DEFAULT_CHAIN    = botchain

