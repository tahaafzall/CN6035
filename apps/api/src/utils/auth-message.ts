export function buildAuthMessage(walletAddress: string, nonce: string) {
  return [
    'TraceChain Pharma Supply Network',
    'Sign this message to authenticate your wallet for the off-chain API.',
    `Wallet: ${walletAddress}`,
    `Nonce: ${nonce}`,
    `Issued At: ${new Date().toISOString()}`
  ].join('\n');
}
