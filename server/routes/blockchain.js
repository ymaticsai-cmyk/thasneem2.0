const express = require('express');
const MedicalRecord = require('../models/MedicalRecord');
const BlockChain = require('../models/BlockChain');
const Patient = require('../models/Patient');
const { verifyRecordIntegrity } = require('../blockchain/chain');
const { authGuard } = require('../middleware/authGuard');
const { roleGuard } = require('../middleware/roleGuard');
const { doctorHasAccess } = require('../helpers/access');

const router = express.Router();

router.get(
  '/verify/:recordId',
  authGuard,
  roleGuard(['doctor']),
  async (req, res) => {
    try {
      const record = await MedicalRecord.findById(req.params.recordId).populate('patientId');
      if (!record) return res.status(404).json({ message: 'Not found' });
      const pid = record.patientId?._id || record.patientId;
      const has = await doctorHasAccess(pid, req.user.userId);
      if (!has) return res.status(403).json({ message: 'Access not granted' });

      const block = await BlockChain.findById(record.blockchainId).lean();
      const v = await verifyRecordIntegrity(record.toObject(), block);
      res.json({
        verified: v.verified,
        message: v.verified ? 'Data Verified — Untampered' : 'WARNING: Data Mismatch Detected',
        storedHash: v.storedHash,
        recomputedHash: v.recomputedHash,
        block: block
          ? {
              hash: block.hash,
              previousHash: block.previousHash,
              blockIndex: block.blockIndex,
              timestamp: block.timestamp,
              txHash: block.txHash,
              chainId: block.chainId,
            }
          : null,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
