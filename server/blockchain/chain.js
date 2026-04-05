const BlockChain = require('../models/BlockChain');
const { sha256, buildMedicalRecordHashPayload } = require('../utils/hashGenerator');
const { anchorHexHashIfConfigured, isEthereumAnchorConfigured } = require('../utils/ethereumAnchor');

function wrapAnchorFailure(original) {
  const msg =
    original?.shortMessage ||
    original?.message ||
    'Ethereum anchor failed';
  const err = new Error(msg);
  err.code = 'ETHEREUM_ANCHOR_FAILED';
  err.cause = original;
  return err;
}

class Block {
  constructor(index, recordId, data, previousHash) {
    this.index = index;
    this.recordId = recordId;
    this.timestamp = new Date().toISOString();
    this.hash = this.calculateHash(data);
    this.previousHash = previousHash;
  }

  calculateHash(data) {
    return sha256(data);
  }
}

async function getNextBlockIndex() {
  const last = await BlockChain.findOne().sort({ blockIndex: -1 }).lean();
  return last ? last.blockIndex + 1 : 0;
}

async function getLastBlockHash() {
  const last = await BlockChain.findOne().sort({ blockIndex: -1 }).lean();
  return last ? last.hash : '0';
}

async function createBlockForRecord(medicalRecordDoc) {
  const data = buildMedicalRecordHashPayload(medicalRecordDoc);
  const previousHash = await getLastBlockHash();
  const index = await getNextBlockIndex();
  const block = new Block(index, medicalRecordDoc._id, data, previousHash);

  let doc = await BlockChain.create({
    recordId: medicalRecordDoc._id,
    hash: block.hash,
    previousHash,
    blockIndex: index,
    timestamp: new Date(),
    verified: true,
  });

  const ethRequired = isEthereumAnchorConfigured();

  try {
    const eth = await anchorHexHashIfConfigured(doc.hash);
    if (eth) {
      doc = await BlockChain.findByIdAndUpdate(
        doc._id,
        { txHash: eth.txHash, chainId: eth.chainId },
        { new: true }
      );
    } else if (ethRequired) {
      await BlockChain.findByIdAndDelete(doc._id);
      throw wrapAnchorFailure(
        new Error('Transaction was not completed (no receipt)')
      );
    }
  } catch (e) {
    if (ethRequired) {
      await BlockChain.findByIdAndDelete(doc._id);
      if (e.code === 'ETHEREUM_ANCHOR_FAILED') throw e;
      throw wrapAnchorFailure(e);
    }
    console.error('[ethereum] anchor failed (Mongo block kept):', e.message);
  }

  return doc;
}

async function verifyRecordIntegrity(medicalRecordDoc, blockDoc) {
  if (!blockDoc) return { verified: false, reason: 'no_block' };
  const data = buildMedicalRecordHashPayload(medicalRecordDoc);
  const recomputed = sha256(data);
  return {
    verified: recomputed === blockDoc.hash,
    storedHash: blockDoc.hash,
    recomputedHash: recomputed,
    block: blockDoc,
  };
}

module.exports = {
  Block,
  createBlockForRecord,
  verifyRecordIntegrity,
  getLastBlockHash,
};
