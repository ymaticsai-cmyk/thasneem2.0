const { ethers } = require('ethers');

function isEthereumAnchorConfigured() {
  return !!(process.env.ETHEREUM_RPC_URL?.trim() && process.env.ETHEREUM_PRIVATE_KEY?.trim());
}

function normalizeHashHex(hashHex) {
  if (!hashHex || typeof hashHex !== 'string') return null;
  const h = hashHex.startsWith('0x') ? hashHex.slice(2) : hashHex;
  if (!/^[0-9a-f]{64}$/i.test(h)) return null;
  return `0x${h.toLowerCase()}`;
}

/**
 * If ETHEREUM_RPC_URL and ETHEREUM_PRIVATE_KEY are set, sends a self-tx with
 * the 32-byte record hash as calldata (cheap anchor). Otherwise returns null.
 * Mainnet uses real ETH; use a testnet RPC + faucet wallet for development.
 */
async function anchorHexHashIfConfigured(hashHex) {
  const rpc = process.env.ETHEREUM_RPC_URL?.trim();
  const pk = process.env.ETHEREUM_PRIVATE_KEY?.trim();
  if (!rpc || !pk) return null;

  const data = normalizeHashHex(hashHex);
  if (!data) {
    console.warn('[ethereum] anchor: expected 64-char hex SHA-256 hash');
    return null;
  }

  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(pk.startsWith('0x') ? pk : `0x${pk}`, provider);
  const tx = await wallet.sendTransaction({
    to: wallet.address,
    value: 0n,
    data,
  });
  const receipt = await tx.wait();
  if (!receipt) return null;
  const network = await provider.getNetwork();
  return {
    txHash: receipt.hash,
    chainId: Number(network.chainId),
  };
}

module.exports = { anchorHexHashIfConfigured, isEthereumAnchorConfigured };
