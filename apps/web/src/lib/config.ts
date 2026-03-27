export const appConfig = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}` | undefined,
  localRpcUrl: import.meta.env.VITE_LOCAL_RPC_URL || 'http://127.0.0.1:8545',
  sepoliaRpcUrl:
    import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'
};
