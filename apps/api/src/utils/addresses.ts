import { getAddress } from 'viem';

export function normalizeWalletAddress(walletAddress: string) {
  return getAddress(walletAddress);
}
