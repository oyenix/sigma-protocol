import { ethers, BrowserProvider, Contract, type Signer } from 'ethers';
import {
  MULTISIG_CONTROLLER_ABI,
  COMPANY_WALLET_ABI,
  MULTISIG_FACTORY_ABI,
} from '@/lib/abi';
import { getActiveSigner } from '@/lib/get-signer'; // your existing helper
import { DEFAULT_CHAIN_ID } from '@/lib/chains';
export const MULTISIG_FACTORY_ADDRESS = '0x76cA6fbc8711Ff31315F0dFd713Be4f9e5ED6E44' as const;

// ── Internal helpers ─────────────────────────────────────────────────────────

async function getSigner(chainId: number = DEFAULT_CHAIN_ID
): Promise<Signer> {
  const s = await getActiveSigner(chainId);
  if (!s) throw new Error('Wallet not connected');
  return s;
}

function getReadProvider() {
  // Fallback read-only provider using Botchain RPC
  return new ethers.JsonRpcProvider(
    process.env.NEXT_PUBLIC_BOTCHAIN_URL ?? 'https://rpc.bohr.life'
  );
}
export function getProvider() {
  return getReadProvider();
}
export async function initializeProvider(_wallet?: unknown) {
  return;
}

export async function getConnectedWalletAddress(controllerAddress: string) {
  const info = await getMultiSigInfo(controllerAddress);
  return info.wallet;
}
async function getContractWithSigner(address: string, abi: any, chainId: number = DEFAULT_CHAIN_ID
) {
  const s = await getSigner(chainId);
  return new ethers.Contract(address, abi, s);
}

function getReadContract(address: string, abi: any) {
  return new Contract(address, abi, getReadProvider());
}

// ── Public signer contract helper (used by modals) ───────────────────────────
export const getSignedContract = async (address: string, abi: any, chainId: number = DEFAULT_CHAIN_ID
) => {
  const s = await getSigner(chainId);
  return new ethers.Contract(address, abi, s);
};

// ── User membership ──────────────────────────────────────────────────────────
export async function getUserMultiSigs(userAddress: string) {
  try {
    const factory = getReadContract(MULTISIG_FACTORY_ADDRESS, MULTISIG_FACTORY_ABI);
    const partOf: string[] = await factory.getControllersBySigner(userAddress);
    const created: string[] = await factory.getControllersByOwner(userAddress);

    // No getControllersByOwner on-chain yet — determine "isOwner" by reading
    // each controller's public `deployer` var instead.
    return await Promise.all(
      partOf.map(async (address: string) => {
        const info = await factory.getMultiSigInfo(address);
        const controller = getReadContract(address, MULTISIG_CONTROLLER_ABI);
        const deployer: string = await controller.deployer();
        return {
          controllerAddress: address,
          name: info.name,
          walletAddress: info.wallet,
          isOwner: deployer.toLowerCase() === userAddress.toLowerCase(),
        };
      })
    );
  } catch (err) {
    console.error('Error fetching user multisigs:', err);
    return [];
  }
}

// ── Core transaction functions ───────────────────────────────────────────────
export const submitTransaction = async (
  controllerAddress: string,
  to: string,
  value: string,
  isToken: boolean,
  tokenAddress: string,
  data: string,
  chainId: number = DEFAULT_CHAIN_ID

) => {
  const contract = await getContractWithSigner(controllerAddress, MULTISIG_CONTROLLER_ABI, chainId);
  const valueWei = ethers.parseEther(value || '0');
  const hexData = data.startsWith('0x') ? data : `0x${data}`;
  const targetToken = ethers.isAddress(tokenAddress) ? tokenAddress : ethers.ZeroAddress;
  const tx = await contract.submitTransaction(to, valueWei, isToken, targetToken, hexData);
  return await tx.wait();
};

export const submitBatchTransferEqual = async (
  controllerAddress: string,
  token: string,
  recipients: string[],
  amountPer: string,
  chainId: number = DEFAULT_CHAIN_ID

) => {
  const contract = await getContractWithSigner(controllerAddress, MULTISIG_CONTROLLER_ABI, chainId);
  const amountWei = ethers.parseEther(amountPer || '0');
  const targetToken = ethers.isAddress(token) ? token : ethers.ZeroAddress;
  const tx = await contract.submitBatchTransferEqual(targetToken, recipients, amountWei);
  return await tx.wait();
};

export const submitBatchTransferDifferent = async (
  controllerAddress: string,
  token: string,
  recipients: string[],
  amounts: string[],
  chainId: number = DEFAULT_CHAIN_ID

) => {
  const contract = await getContractWithSigner(controllerAddress, MULTISIG_CONTROLLER_ABI, chainId);
  const amountsWei = amounts.map(a => ethers.parseEther(a || '0'));
  const targetToken = ethers.isAddress(token) ? token : ethers.ZeroAddress;
  const tx = await contract.submitBatchTransferDifferent(targetToken, recipients, amountsWei);
  return await tx.wait();
};

export const submitAddOwner = async (
  controllerAddress: string,
  newOwner: string,
  ownerName: string,
  pct: number,
  removable: boolean,
  chainId: number = DEFAULT_CHAIN_ID

) => {
  const contract = await getContractWithSigner(controllerAddress, MULTISIG_CONTROLLER_ABI, chainId);
  const tx = await contract.submitAddOwner(newOwner, ownerName, BigInt(pct), removable);
  return await tx.wait();
};

export async function confirmTransaction(controllerAddress: string, transactionId: number, chainId: number = DEFAULT_CHAIN_ID
) {
  const contract = await getContractWithSigner(controllerAddress, MULTISIG_CONTROLLER_ABI, chainId);
  const tx = await contract.confirmTransaction(transactionId);
  return await tx.wait();
}

export async function revokeConfirmation(controllerAddress: string, transactionId: number, chainId: number = DEFAULT_CHAIN_ID
) {
  const contract = await getContractWithSigner(controllerAddress, MULTISIG_CONTROLLER_ABI, chainId);
  const tx = await contract.revokeConfirmation(transactionId);
  return await tx.wait();
}

export async function executeTransactionManual(controllerAddress: string, transactionId: number, chainId: number = DEFAULT_CHAIN_ID) {
  // Debug reads FIRST
  const contract_r = getReadContract(controllerAddress, MULTISIG_CONTROLLER_ABI);
  const txData = await contract_r.transactions(transactionId);
  const now = Math.floor(Date.now() / 1000);
  console.log({
    executed: txData.executed,
    timelockEnd: txData.timelockEnd.toString(),
    now,
    timelockPassed: now >= Number(txData.timelockEnd),
    confirmed: await contract_r.isConfirmed(transactionId),
  });

  const contract = await getContractWithSigner(controllerAddress, MULTISIG_CONTROLLER_ABI, chainId);
  let gasLimit: bigint;
  try {
    const estimate = await contract.executeTransactionManual.estimateGas(transactionId);
    gasLimit = (estimate * BigInt(120)) / BigInt(100);
  } catch {
    gasLimit = BigInt(2_000_000);
  }
  const tx = await contract.executeTransactionManual(transactionId, { gasLimit });
  return await tx.wait();
}
// ── Factory functions ────────────────────────────────────────────────────────
export async function createMultiSig(
  name: string, initialOwners: string[], initialNames: string[],
  initialPercentages: number[], initialRemovable: boolean[],
  requiredPercentage: number, timelockPeriod: number, expiryPeriod: number,
  minOwners: number, chainId: number = DEFAULT_CHAIN_ID
) {
  const contract = await getContractWithSigner(MULTISIG_FACTORY_ADDRESS, MULTISIG_FACTORY_ABI, chainId);
  const pcts = initialPercentages.map(p => BigInt(p));
  const tx = await contract.createMultiSig(
    name, initialOwners, initialNames, pcts, initialRemovable,
    BigInt(requiredPercentage), BigInt(timelockPeriod), BigInt(expiryPeriod), BigInt(minOwners)
  );
  return await tx.wait();
}

export async function getAllControllers(factoryAddress: string = MULTISIG_FACTORY_ADDRESS) {
  const factory = getReadContract(factoryAddress, MULTISIG_FACTORY_ABI);
  return (await factory.getAllControllers()) || [];
}

export async function getMultiSigInfo(controllerAddress: string, factoryAddress: string = MULTISIG_FACTORY_ADDRESS) {
  const factory = getReadContract(factoryAddress, MULTISIG_FACTORY_ABI);
  const data = await factory.getMultiSigInfo(controllerAddress);
  return {
    name: data.name,
    controller: data.controller,
    wallet: data.wallet,
    ownerCount: Number(data.ownerCount),
    requiredPercentage: Number(data.requiredPercentage),
    minOwners: Number(data.minOwners),
    balance: ethers.formatEther(data.balance),
    isPaused: data.isPaused,
  };
}


export async function getWalletBalance(walletAddress: string) {
  return ethers.formatEther(await getReadProvider().getBalance(walletAddress));
}

export async function getMultisigOwners(controllerAddress: string) {
  const contract = getReadContract(controllerAddress, MULTISIG_CONTROLLER_ABI);
  const [addrs, names, percentages, removable] = await contract.getOwners();
  return addrs.map((addr: string, i: number) => ({
    address: addr,
    name: names[i],
    percentage: percentages[i].toString(),
    removable: removable[i],
  }));
}

export async function getMultisigConfig(controllerAddress: string) {
  const contract = getReadContract(controllerAddress, MULTISIG_CONTROLLER_ABI);
  const [requiredPercentage, paused, name, timelock, expiry, minOwners] = await Promise.all([
    contract.requiredPercentage(),
    contract.paused(),
    contract.name(),
    contract.timelockPeriod(),
    contract.expiryPeriod(),
    contract.minOwners(),
  ]);
  return {
    requiredPercentage: Number(requiredPercentage),
    paused, name,
    timelockPeriod: Number(timelock),
    expiryPeriod: Number(expiry),
    minOwners: Number(minOwners),
  };
}

export async function getTransaction(controllerAddress: string, transactionId: number) {
  const contract = getReadContract(controllerAddress, MULTISIG_CONTROLLER_ABI);
  const t = await contract.transactions(transactionId);
  return {
    initiator: t.initiator, to: t.to,
    value: ethers.formatEther(t.value),
    data: t.data, isTokenTransfer: t.isTokenTransfer,
    tokenAddress: t.tokenAddress, executed: t.executed,
    confirmationCount: t.confirmationCount.toString(),
    timestamp: t.timestamp.toString(),
    timelockEnd: t.timelockEnd.toString(),
  };
}
export async function isConfirmedBy(controllerAddress: string, txId: number, ownerAddress: string): Promise<boolean> {
  const contract = getReadContract(controllerAddress, MULTISIG_CONTROLLER_ABI);
  return await contract.isConfirmedBy(txId, ownerAddress);
}

// ── Governance ───────────────────────────────────────────────────────────────
export async function submitChangeName(controllerAddress: string, newName: string, chainId: number = DEFAULT_CHAIN_ID
) {
  const c = await getContractWithSigner(controllerAddress, MULTISIG_CONTROLLER_ABI, chainId);
  return (await c.submitChangeName(newName)).wait();
}
export async function submitChangeRequiredPct(controllerAddress: string, v: number, chainId: number = DEFAULT_CHAIN_ID
) {
  const c = await getContractWithSigner(controllerAddress, MULTISIG_CONTROLLER_ABI, chainId);
  return (await c.submitChangeRequiredPct(v)).wait();
}
export async function submitChangeTimelock(controllerAddress: string, v: number, chainId: number = DEFAULT_CHAIN_ID
) {
  const c = await getContractWithSigner(controllerAddress, MULTISIG_CONTROLLER_ABI, chainId);
  return (await c.submitChangeTimelock(v)).wait();
}
export async function submitChangeExpiry(controllerAddress: string, v: number, chainId: number = DEFAULT_CHAIN_ID
) {
  const c = await getContractWithSigner(controllerAddress, MULTISIG_CONTROLLER_ABI, chainId);
  return (await c.submitChangeExpiry(v)).wait();
}
export async function submitChangeMinOwners(controllerAddress: string, v: number, chainId: number = DEFAULT_CHAIN_ID
) {
  const c = await getContractWithSigner(controllerAddress, MULTISIG_CONTROLLER_ABI, chainId);
  return (await c.submitChangeMinOwners(v)).wait();
}
export async function pauseMultisig(controllerAddress: string, chainId: number = DEFAULT_CHAIN_ID
) {
  const c = await getContractWithSigner(controllerAddress, MULTISIG_CONTROLLER_ABI, chainId);
  return (await c.pause()).wait();
}
export async function unpauseMultisig(controllerAddress: string, chainId: number = DEFAULT_CHAIN_ID
) {
  const c = await getContractWithSigner(controllerAddress, MULTISIG_CONTROLLER_ABI, chainId);
  return (await c.unpause()).wait();
}
export async function confirmTransactionsBatch(controllerAddress: string, ids: number[], chainId: number = DEFAULT_CHAIN_ID
) {
  const contract = await getContractWithSigner(controllerAddress, MULTISIG_CONTROLLER_ABI, chainId);
  for (const id of ids) {
    try { await (await contract.confirmTransaction(id)).wait(); }
    catch (err) { console.error(`Failed to confirm tx ${id}`, err); }
  }
}