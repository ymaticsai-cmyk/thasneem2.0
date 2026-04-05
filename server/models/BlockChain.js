const mongoose = require('mongoose');

const blockChainSchema = new mongoose.Schema({
  recordId: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicalRecord', required: true },
  hash: { type: String, required: true },
  previousHash: { type: String, default: '0' },
  blockIndex: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  verified: { type: Boolean, default: true },
  txHash: { type: String, default: null },
  chainId: { type: Number, default: null },
});

blockChainSchema.index({ recordId: 1 });
blockChainSchema.index({ blockIndex: -1 });

module.exports = mongoose.model('BlockChain', blockChainSchema);
