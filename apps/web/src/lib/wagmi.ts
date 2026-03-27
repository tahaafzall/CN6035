import { createConfig, http } from 'wagmi';
import { hardhat, sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

import { appConfig } from './config';

export const wagmiConfig = createConfig({
  chains: [hardhat, sepolia],
  connectors: [injected()],
  transports: {
    [hardhat.id]: http(appConfig.localRpcUrl),
    [sepolia.id]: http(appConfig.sepoliaRpcUrl)
  }
});
