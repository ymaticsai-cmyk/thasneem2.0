/** @param {number | undefined} chainId */
export function blockExplorerTxUrl(chainId, txHash) {
  if (!txHash || chainId == null) return null;
  const bases = {
    1: 'https://etherscan.io/tx/',
    11155111: 'https://sepolia.etherscan.io/tx/',
    17000: 'https://holesky.etherscan.io/tx/',
  };
  const base = bases[chainId] || null;
  if (!base) return null;
  return `${base}${txHash}`;
}

/** @param {number | undefined} chainId */
export function chainDisplayName(chainId) {
  if (chainId == null) return null;
  const names = { 1: 'Ethereum Mainnet', 11155111: 'Sepolia', 17000: 'Holesky' };
  return names[chainId] || `Chain ${chainId}`;
}
