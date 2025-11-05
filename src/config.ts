// Network configurations
import { hardhat } from "viem/chains";
import { createPublicClient, http } from "viem";

// Custom hardhat configuration
const hardhatConfig = {
  ...hardhat,
  id: 31337,
  name: 'Hardhat',
  network: 'hardhat',
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
    public: {
      http: ['http://127.0.0.1:8545'],
    },
  },
};

export const supportedChains = {
  coreTestnet2: {
    id: 1114,
    name: 'Core Testnet2',
    network: 'core-testnet2',
    nativeCurrency: {
      name: 'Core',
      symbol: 'CORE',
      decimals: 18,
    },
    rpcUrls: {
      default: {
        http: ['https://rpc.test2.btcs.network'],
      },
      public: {
        http: ['https://rpc.test2.btcs.network'],
      },
    },
    blockExplorers: {
      default: {
        name: 'CoreScan',
        url: 'https://scan.test2.btcs.network',
      },
    },
    testnet: true,
  },
  hardhat: hardhatConfig,
};

// Update the interfaces
interface BaseAddresses {
  USDC: string;
  stCORE: string;
  CUSD: string;
  sCUSD: string;
  Operator: string;
  Eigen: string;
  LoanManager: string;
}

// Remove empty interfaces and use type aliases instead
type HardhatAddresses = BaseAddresses;
type CoreTestnet2Addresses = BaseAddresses;

export const contractAddresses: {
  hardhat: HardhatAddresses;
  coreTestnet2: CoreTestnet2Addresses;
} = {
  hardhat: {
    USDC: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    CUSD: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0', // Changed from PUSDC to CUSD
    stCORE: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    sCUSD: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    Eigen: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
    Operator: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
    LoanManager: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
  },
  coreTestnet2: {
    USDC: '0x3eCA9205a5A8b602067B2a58F60C30EA020FeCeb',
    stCORE: '0x58f4BBC38d592F253fB98C53A4D2f55B8DBF51a7',
    CUSD: '0x71E00C10F924355453bCF8fe86F6B63980f859DD',
    sCUSD: '0x5BC5C3A0F7ee4465DFCC1ad9526d9Bf107361AD1',
    Operator: '0x025f719646013A8b69b8568F105c67e60D14d8ab',
    Eigen: '0x6C2ba32a3ADBA2D61a02F5EAe3bd86F59B6a7B18',
    LoanManager: '0x0b3827aE16a73887F3C5c25d13CF5Ea4a2772c3C'
  }
};

// Update the getContractAddress function to use BaseAddresses
export const getContractAddress = (
  contractName: keyof BaseAddresses,
  chainId: number
): string => {
  // Core Testnet2
  if (chainId === supportedChains.coreTestnet2.id) {
    return contractAddresses.coreTestnet2[contractName];
  }

  // Hardhat
  if (chainId === supportedChains.hardhat.id) {
    return contractAddresses.hardhat[contractName];
  }

  return '0x0000000000000000000000000000000000000000';
};

// ABIs
export const ABIs = {
  operatorRegistry: [
    // Add ABI here
  ],
  restakingstCORE: [
    // Add ABI here
  ],
};

// RPC URLs
export const getRpcUrl = (chainId: number): string => {
  if (chainId === supportedChains.coreTestnet2.id) {
    return supportedChains.coreTestnet2.rpcUrls.default.http[0];
  }

  if (chainId === supportedChains.hardhat.id) {
    return supportedChains.hardhat.rpcUrls.default.http[0];
  }

  // Default to Core Testnet2
  return supportedChains.coreTestnet2.rpcUrls.default.http[0];
};

// Explorer URLs
export const getExplorerUrl = (chainId: number): string => {
  if (chainId === supportedChains.coreTestnet2.id) {
    return supportedChains.coreTestnet2.blockExplorers.default.url;
  }

  if (chainId === supportedChains.hardhat.id) {
    return '';
  }

  // Default to Core Testnet2
  return supportedChains.coreTestnet2.blockExplorers.default.url;
};

// Helper to format transaction URL
export const getTransactionUrl = (chainId: number, txHash: string): string => {
  const explorerUrl = getExplorerUrl(chainId);
  if (!explorerUrl) return '';
  return `${explorerUrl}/tx/${txHash}`;
};

// Helper to format address URL
export const getAddressUrl = (chainId: number, address: string): string => {
  const explorerUrl = getExplorerUrl(chainId);
  if (!explorerUrl) return '';
  return `${explorerUrl}/address/${address}`;
};

// Add more configuration options as needed

// Add to wagmi config
export const chains = [supportedChains.coreTestnet2, supportedChains.hardhat] as const;

// Add timeout and retry configuration
export const rpcConfig = {
  pollingInterval: 4_000,
  timeout: 30_000, // Increase timeout to 30 seconds
  retryCount: 3,
  retryDelay: 1000,
};

// Update the client configuration
export const publicClient = createPublicClient({
  chain: supportedChains.coreTestnet2,
  transport: http(supportedChains.coreTestnet2.rpcUrls.default.http[0], {
    timeout: rpcConfig.timeout,
    retryCount: rpcConfig.retryCount,
    retryDelay: rpcConfig.retryDelay,
  }),
});