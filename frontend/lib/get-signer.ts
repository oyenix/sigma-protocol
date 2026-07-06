// lib/get-signer.ts
import { Wallet, type JsonRpcSigner } from "ethers"

type SignerGetter = (chainId?: number) => Promise<JsonRpcSigner | Wallet | null>

let _getActiveSigner: SignerGetter | null = null

export function registerSignerGetter(fn: SignerGetter) {
  _getActiveSigner = fn
}

export async function getActiveSigner(
  chainId?: number,
  { retries = 3, delayMs = 400 }: { retries?: number; delayMs?: number } = {}
): Promise<JsonRpcSigner | Wallet> {
  if (!_getActiveSigner) {
    throw new Error("Wallet not initialized — please connect your wallet first")
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    const s = await _getActiveSigner(chainId)
    if (s) return s

    if (attempt < retries - 1) {
      await new Promise(r => setTimeout(r, delayMs))
    }
  }

  throw new Error("Could not get signer — wallet not connected or session expired")
}
import { type Chain, defineChain } from "viem"

export const botchain = defineChain({
  id: 968,
  name: "Botchain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_BOTCHAIN_URL ?? "https://rpc.bohr.life"] },
  },
  blockExplorers: {
    default: { name: "Botchain Explorer", url: "https://scan.bohr.life" },
  },
  testnet: true,
})
// export const solana = defineChain({
//   id: 102,
//   name: "Solana Devnet",
//   nativeCurrency: { name: "Solana", symbol: "SOL", decimals: 9 },
//   rpcUrls: {
//     default: { http: [process.env.NEXT_PUBLIC_BOTCHAIN_URL ?? "https://api.devnet.solana.com"] },
//   },
//   blockExplorers: {
//     default: { name: "Solana Explorer", url: "https://solscan.io/?cluster=devnet" },
//   },
//   testnet: true,
// })
export const supportedChains: [Chain, ...Chain[]] = [botchain]

export const CHAIN_RPC: Record<number, string> = {
//   [arbitrum.id]: process.env.NEXT_PUBLIC_RPC_ARBITRUM ?? "https://arb1.llamarpc.com",
//   [base.id]:     process.env.NEXT_PUBLIC_RPC_BASE     ?? "https://mainnet.base.org",
//   [celo.id]:     process.env.NEXT_PUBLIC_RPC_CELO     ?? "https://forno.celo.org",
//   [lisk.id]:     process.env.NEXT_PUBLIC_RPC_LISK     ?? "https://rpc.api.lisk.com",
//   [bsc.id]:      process.env.NEXT_PUBLIC_RPC_BSC      ?? "https://bsc-dataseed.binance.org",
  [botchain.id]: process.env.NEXT_PUBLIC_BOTCHAIN_URL ?? "https://https://rpc.bohr.life",
//   [solana.id]: process.env.NEXT_PUBLIC_BOTCHAIN_URL ?? "https://api.devnet.solana.com",

}

export const CHAIN_EXPLORERS: Record<number, { name: string; url: string }> = {
//   [arbitrum.id]: { name: "Arbiscan",  url: "https://arbiscan.io"  },
//   [base.id]:     { name: "Basescan",  url: "https://basescan.org" },
//   [celo.id]:     { name: "Celoscan",  url: "https://celoscan.io"  },
//   [lisk.id]:     { name: "Lisk Scan", url: "https://liskscan.com" },
//   [bsc.id]:      { name: "BscScan",   url: "https://bscscan.com"  },
  [botchain.id]: { name: "Botchain Explorer", url: "https://scan.bohr.life" },
//   [solana.id]: { name: "Solana Explorer", url: "https://solscan.io/?cluster=devnet" },
}

export const DEFAULT_CHAIN_ID = botchain.id
export const DEFAULT_CHAIN    = botchain