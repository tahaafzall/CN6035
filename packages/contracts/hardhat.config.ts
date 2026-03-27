import { config as loadEnv } from 'dotenv';
import type { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import path from 'node:path';

loadEnv({ path: path.resolve(__dirname, '.env') });

const { RPC_URL, PRIVATE_KEY, ETHERSCAN_API_KEY } = process.env;
const hasValidPrivateKey = Boolean(PRIVATE_KEY && /^0x[a-fA-F0-9]{64}$/.test(PRIVATE_KEY));
const hasValidRpcUrl = Boolean(RPC_URL && !RPC_URL.includes('YOUR_KEY'));

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 31337
    },
    localhost: {
      url: 'http://127.0.0.1:8545',
      chainId: 31337
    },
    ...(hasValidRpcUrl && hasValidPrivateKey
      ? {
          sepolia: {
            url: RPC_URL!,
            accounts: [PRIVATE_KEY!],
            chainId: 11155111
          }
        }
      : {})
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY ?? ''
  },
  paths: {
    sources: './contracts',
    tests: './test',
    artifacts: './artifacts',
    cache: './cache'
  }
};

export default config;
