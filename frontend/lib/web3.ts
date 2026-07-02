import { ethers, BrowserProvider, Contract, Signer } from 'ethers';
import {
  MULTISIG_CONTROLLER_ABI,
  COMPANY_WALLET_ABI,
  MULTISIG_FACTORY_ABI,
} from '@/lib/abi';

let provider: BrowserProvider;
let signer: Signer;

export async function initializeProvider(privyWallet: any): Promise<{ provider: BrowserProvider; signer: Signer }> {
  if (!privyWallet) {
    throw new Error('No wallet provided for initialization');
  }

  try {
    // 1. Get the EIP-1193 provider from Privy
    const ethereumProvider = await privyWallet.getEthereumProvider();
    
    // 2. Initialize Ethers v6 Provider
    provider = new BrowserProvider(ethereumProvider);
    
    // 3. Get the Signer
    signer = await provider.getSigner();
    
    return { provider, signer };
  } catch (error) {
    console.error("Failed to initialize provider:", error);
    throw new Error("Wallet initialization failed");
  }
}
export const MULTISIG_FACTORY_ADDRESS = '0x79798892210059Ec0253ADC3Ccb5fC0AFbB228CC' as const;

export function getProvider() {
  if (!provider) throw new Error('Provider not initialized');
  return provider;  
}

export function getSigner(): Signer {
  if (!signer) throw new Error("Signer not initialized. Call initializeProvider first.");
  return signer;
}

// Internal helper for write transactions
const getContractWithSigner = async (address: string, abi: any) => {
  const s = await getSigner();
  return new ethers.Contract(address, abi, s);
};

export async function initializeProviderWithPrivy(privyWallet: any) {
  if (!privyWallet) throw new Error('No Privy wallet connected');

  // Get the EIP-1193 provider from the Privy wallet
  const ethereumProvider = await privyWallet.getEthereumProvider();
  
  // Initialize Ethers BrowserProvider with Privy's provider
  provider = new BrowserProvider(ethereumProvider);
  signer = await provider.getSigner();
  
  return { provider, signer };
}

// web3.ts

export const getSignedContract = async (contractAddress: string, abi: any) => {
  // 1. Get the current signer (which we initialized via Privy)
  const signer = getSigner(); 
  
  // 2. Attach the signer to the contract
  // In Ethers v6, the third argument MUST be a signer to send transactions
  return new ethers.Contract(contractAddress, abi, signer);
};

// ============================================================================
// NEW: USER MEMBERSHIP FUNCTIONS
// ============================================================================

/**
 * Returns a unique list of all MultiSigs the user created OR is a signer in
 */
export async function getUserMultiSigs(userAddress: string) {
  try {
    const factory = new Contract(MULTISIG_FACTORY_ADDRESS, MULTISIG_FACTORY_ABI, getProvider());
    
    // Fetch both lists in parallel
    const [created, partOf] = await Promise.all([
      factory.getControllersByOwner(userAddress),
      factory.getControllersBySigner(userAddress)
    ]);

    // Merge and remove duplicates
    const allUniqueControllers = Array.from(new Set([...created, ...partOf]));
    
    // Fetch info (Name/Wallet) for each controller
    const detailedList = await Promise.all(
      allUniqueControllers.map(async (address) => {
        const info = await factory.getMultiSigInfo(address);
        return {
          controllerAddress: address,
          name: info.name,
          walletAddress: info.wallet,
          isOwner: created.includes(address)
        };
      })
    );

    return detailedList;
  } catch (err) {
    console.error("Error fetching user multisigs:", err);
    return [];
  }
}

// ============================================================================
// CORE TRANSACTION FUNCTIONS
// ============================================================================

export const submitBatchTransferEqual = async (
  controllerAddress: string,
  token: string,
  recipients: string[],
  amountPer: string
) => {
  const contract = await getContractWithSigner(controllerAddress, MULTISIG_CONTROLLER_ABI);
  const amountWei = ethers.parseEther(amountPer || '0');
  const targetToken = ethers.isAddress(token) ? token : ethers.ZeroAddress;

  const tx = await contract.submitBatchTransferEqual(targetToken, recipients, amountWei);
  return await tx.wait();
};

export const submitBatchTransferDifferent = async (
  controllerAddress: string,
  token: string,
  recipients: string[],
  amounts: string[]
) => {
  const contract = await getContractWithSigner(controllerAddress, MULTISIG_CONTROLLER_ABI);
  const amountsWei = amounts.map((amt) => ethers.parseEther(amt || '0'));
  const targetToken = ethers.isAddress(token) ? token : ethers.ZeroAddress;

  const tx = await contract.submitBatchTransferDifferent(targetToken, recipients, amountsWei);
  return await tx.wait();
};
/**
 * 1. Submit Single Transaction
 */
export const submitTransaction = async (
  controllerAddress: string,
  to: string,
  value: string, // "1.5" ETH
  isToken: boolean,
  tokenAddress: string,
  data: string,
  signer: any
) => {
  try {
    const contract = new ethers.Contract(controllerAddress, MULTISIG_CONTROLLER_ABI, signer);
    // Convert string "1.5" to Wei BigInt
    const valueWei = ethers.parseEther(value || '0');
    
    // Ensure data is formatted correctly
    const hexData = data.startsWith('0x') ? data : `0x${data}`;
    const targetToken = ethers.isAddress(tokenAddress) ? tokenAddress : ethers.ZeroAddress;

    const tx = await contract.submitTransaction(
      to,
      valueWei,
      isToken,
      targetToken,
      hexData
    );

    return await tx.wait();
  } catch (error) {
    console.error("submitTransaction Error:", error);
    throw error;
  }
};


/**
 * 4. Submit Add Owner
 */
export const submitAddOwner = async (
  controllerAddress: string,
  newOwner: string,
  ownerName: string,
  pct: number,
  removable: boolean
) => {
  try {
    const contract = await getSignedContract(controllerAddress, MULTISIG_CONTROLLER_ABI);
    
    // Ensure percentage is BigInt (assuming contract uses basis points or integer percentage)
    // If your contract expects 20% as "20", pass 20. 
    // If it expects basis points (2000 for 20%), adjust accordingly. 
    // Based on your ABI type "uint256", simple casting is safe here.
    const pctBigInt = BigInt(pct); 

    const tx = await contract.submitAddOwner(
      newOwner,
      ownerName,
      pctBigInt,
      removable
    );

    return await tx.wait();
  } catch (error) {
    console.error("submitAddOwner Error:", error);
    throw error;
  }
};




export async function getConnectedWalletAddress(controllerAddress: string) {
  try {
    const controller = new Contract(
      controllerAddress,
      MULTISIG_CONTROLLER_ABI,
      getProvider()
    );
    const walletAddress = await controller.companyWallet();
    return walletAddress;
  } catch (err) {
    console.error(`Error fetching wallet for controller ${controllerAddress}:`, err);
    return controllerAddress; 
  }
}



// ============================================================================
// MULTISIG FACTORY FUNCTIONS
// ============================================================================

export async function createMultiSig(
  name: string,
  initialOwners: string[],
  initialNames: string[],
  initialPercentages: number[],
  initialRemovable: boolean[],
  requiredPercentage: number,
  timelockPeriod: number,
  expiryPeriod: number,
  minOwners: number,
  saltString?: string 
) {
  const factory = new Contract(
    MULTISIG_FACTORY_ADDRESS,
    MULTISIG_FACTORY_ABI,
    signer
  );

  // Convert numbers to BigInt for Solidity uint256 compatibility
  const pcts = initialPercentages.map(p => BigInt(p));

  const rawSalt = saltString || `sigma-dao-${name}-${Date.now()}`;
  const saltBytes32 = ethers.id(rawSalt); 

  const tx = await factory.createMultiSig(
    name,
    initialOwners,
    initialNames,
    pcts,
    initialRemovable,
    BigInt(requiredPercentage),
    BigInt(timelockPeriod),
    BigInt(expiryPeriod),
    BigInt(minOwners),
    saltBytes32 // <-- NEW: Pass the hashed salt to the contract
  );

  const receipt = await tx.wait();
  return receipt;
}

export async function getAllControllers(factoryAddress: string) {
  try {
    if (!factoryAddress || factoryAddress.length !== 42) return [];
    const factory = new Contract(factoryAddress, MULTISIG_FACTORY_ABI, provider);
    const controllers = await factory.getAllControllers();
    return controllers || [];
  } catch (err) {
    console.warn('Error fetching controllers:', err);
    return [];
  }
}

export async function getDeploymentCount(factoryAddress: string) {
  const factory = new Contract(factoryAddress, MULTISIG_FACTORY_ABI, provider);
  const { controllers, wallets } = await factory.getDeploymentCount();
  return { controllers, wallets };
}

// NEW: Helper to get name and wallet address in one call from Factory
export async function getMultiSigInfo(controllerAddress: string) {
  try {
    // Use provider for read-only calls to be faster/cheaper
    const factory = new Contract(MULTISIG_FACTORY_ADDRESS, MULTISIG_FACTORY_ABI, getProvider());
    
    // Call the updated Solidity function that returns the struct
    const data = await factory.getMultiSigInfo(controllerAddress);
    
    return {
      name: data.name,
      controller: data.controller,
      wallet: data.wallet,
      ownerCount: Number(data.ownerCount),
      requiredPercentage: Number(data.requiredPercentage),
      minOwners: Number(data.minOwners),
      balance: ethers.formatEther(data.balance), // Convert Wei to Eth string
      isPaused: data.isPaused
    };
  } catch (err) {
    console.error(`Error fetching info for ${controllerAddress}:`, err);
    throw err;
  }
}

export async function getWalletBalance(walletAddress: string) {
  const provider = getProvider();
  const balance = await provider.getBalance(walletAddress);
  return ethers.formatEther(balance);
}

export async function getMultisigOwners(controllerAddress: string) {
  const controller = new Contract(controllerAddress, MULTISIG_CONTROLLER_ABI, getProvider());
  const [addrs, names, percentages, removable] = await controller.getOwners();

  return addrs.map((addr: string, i: number) => ({
    address: addr,
    name: names[i],
    percentage: percentages[i].toString(),
    removable: removable[i]
  }));
}

// ============================================================================
// MULTISIG CONTROLLER FUNCTIONS (CORE)
// ============================================================================


export async function confirmTransaction(controllerAddress: string, transactionId: number) {
  const controller = new Contract(controllerAddress, MULTISIG_CONTROLLER_ABI, signer);
  const tx = await controller.confirmTransaction(transactionId);
  return await tx.wait();
}

export async function executeTransactionManual(
  controllerAddress: string, 
  transactionId: number
) {
  // Ensure you get the signer! 
  // (In your previous code you relied on a global signer, ensure it's passed or available)
  const controller = new Contract(controllerAddress, MULTISIG_CONTROLLER_ABI, signer);

  // 1. Manually estimate gas (or fallback to a high number if estimation fails)
  let gasLimit;
  try {
    const estimate = await controller.executeTransactionManual.estimateGas(transactionId);
    // Add 20% buffer
    gasLimit = (estimate * BigInt(120) / BigInt(100));
  } catch (error) {
    console.warn("Gas estimation failed, using fallback high limit", error);
    // Fallback: 2 million gas should cover most batch transfers
    gasLimit = BigInt(2000000); 
  }

  // 2. Send transaction with explicit gas limit
  const tx = await controller.executeTransactionManual(transactionId, { gasLimit });
  return await tx.wait();
}

export async function revokeConfirmation(controllerAddress: string, transactionId: number) {
  const controller = new Contract(controllerAddress, MULTISIG_CONTROLLER_ABI, signer);
  const tx = await controller.revokeConfirmation(transactionId);
  return await tx.wait();
}


// ============================================================================
// MULTISIG GOVERNANCE FUNCTIONS (NEW)
// ============================================================================



export async function submitChangeName(controllerAddress: string, newName: string) {
  const controller = new Contract(controllerAddress, MULTISIG_CONTROLLER_ABI, signer);
  const tx = await controller.submitChangeName(newName);
  return await tx.wait();
}

export async function submitChangeRequiredPct(controllerAddress: string, newPercentage: number) {
  const controller = new Contract(controllerAddress, MULTISIG_CONTROLLER_ABI, signer);
  const tx = await controller.submitChangeRequiredPct(newPercentage);
  return await tx.wait();
}

export async function submitChangeTimelock(controllerAddress: string, newPeriod: number) {
  const controller = new Contract(controllerAddress, MULTISIG_CONTROLLER_ABI, signer);
  const tx = await controller.submitChangeTimelock(newPeriod);
  return await tx.wait();
}

export async function submitChangeExpiry(controllerAddress: string, newPeriod: number) {
  const controller = new Contract(controllerAddress, MULTISIG_CONTROLLER_ABI, signer);
  const tx = await controller.submitChangeExpiry(newPeriod);
  return await tx.wait();
}

export async function submitChangeMinOwners(controllerAddress: string, newMinOwners: number) {
  const controller = new Contract(controllerAddress, MULTISIG_CONTROLLER_ABI, signer);
  const tx = await controller.submitChangeMinOwners(newMinOwners);
  return await tx.wait();
}

export async function pauseMultisig(controllerAddress: string) {
  const controller = new Contract(controllerAddress, MULTISIG_CONTROLLER_ABI, signer);
  const tx = await controller.pause();
  return await tx.wait();
}

export async function unpauseMultisig(controllerAddress: string) {
  const controller = new Contract(controllerAddress, MULTISIG_CONTROLLER_ABI, signer);
  const tx = await controller.unpause();
  return await tx.wait();
}

// ============================================================================
// READ FUNCTIONS
// ============================================================================

export async function getTransaction(controllerAddress: string, transactionId: number) {
  const controller = new Contract(controllerAddress, MULTISIG_CONTROLLER_ABI, provider);
  const transaction = await controller.transactions(transactionId); // Accessed via public mapping

  return {
    initiator: transaction.initiator,
    to: transaction.to,
    value: ethers.formatEther(transaction.value),
    data: transaction.data,
    isTokenTransfer: transaction.isTokenTransfer,
    tokenAddress: transaction.tokenAddress,
    executed: transaction.executed,
    confirmationCount: transaction.confirmationCount.toString(),
    timestamp: transaction.timestamp.toString(),
    timelockEnd: transaction.timelockEnd.toString(),
  };
}



export async function getMultisigConfig(controllerAddress: string) {
  const controller = new Contract(controllerAddress, MULTISIG_CONTROLLER_ABI, provider);
  
  const [requiredPercentage, paused, name, timelock, expiry, minOwners] = await Promise.all([
    controller.requiredPercentage(),
    controller.paused(),
    controller.name(),
    controller.timelockPeriod(),
    controller.expiryPeriod(),
    controller.minOwners()
  ]);

  return {
    requiredPercentage: Number(requiredPercentage),
    paused,
    name,
    timelockPeriod: Number(timelock),
    expiryPeriod: Number(expiry),
    minOwners: Number(minOwners)
  };
}

export async function isMultisigPaused(controllerAddress: string) {
  const controller = new Contract(controllerAddress, MULTISIG_CONTROLLER_ABI, provider);
  return await controller.paused();
}

// ============================================================================
// COMPANY WALLET FUNCTIONS
// ============================================================================

export async function executeWalletTransaction(
  walletAddress: string,
  to: string,
  value: string,
  isTokenTransfer: boolean,
  tokenAddress: string,
  data: string = '0x'
) {
  const wallet = await getContractWithSigner(walletAddress, COMPANY_WALLET_ABI);
  // This bypasses the MultiSig and works ONLY if the caller is the 'owner'
  const tx = await wallet.executeTransaction(
    to,
    ethers.parseEther(value),
    isTokenTransfer,
    tokenAddress,
    data
  );
  return await tx.wait();
}
export async function confirmTransactionsBatch(
  controllerAddress: string,
  transactionIds: number[]
) {
  const controller = new Contract(
    controllerAddress,
    MULTISIG_CONTROLLER_ABI,
    getSigner() // Ensure this returns the connected signer
  );

  // FALLBACK: If contract doesn't have batch support, loop sequentially
  // NOTE: This is slow and requires N signatures.
  for (const id of transactionIds) {
    try {
      const tx = await controller.confirmTransaction(id);
      await tx.wait(); // Wait for each to finish before next popup
    } catch (err) {
      console.error(`Failed to confirm tx ${id}`, err);
      // Optional: throw error to stop the loop
    }
  }
}