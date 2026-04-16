import { useEffect, useState } from 'react';
import api from '../../services/api';
import { getDoctorPatientId } from '../../lib/doctorPatient';
import { blockExplorerTxUrl, chainDisplayName } from '../../lib/blockExplorer';
import { Alert, Badge, Button, Card } from '../../components/ui';

export default function DoctorBlockchain() {
  const [records, setRecords] = useState([]);
  const [selected, setSelected] = useState('');
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    const pid = getDoctorPatientId();
    if (!pid) return;
    api
      .get(`/records/${pid}`)
      .then(({ data }) => setRecords(data))
      .catch(() => {});
  }, []);

  const verify = async () => {
    if (!selected) return;
    setErr('');
    try {
      const { data } = await api.get(`/blockchain/verify/${selected}`);
      setResult(data);
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed');
    }
  };

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="mb-1 font-display text-2xl font-semibold text-text">On-chain integrity</h2>
        <p className="text-sm text-text-muted">
          Verifies the medical record hash. With Ethereum configured, each new record is anchored by a
          real transaction (see tx hash below).
        </p>
      </div>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className={`w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
          selected ? 'text-text' : 'text-text-soft'
        }`}
      >
        <option value="">Select record</option>
        {records.map((r) => (
          <option key={r._id} value={r._id}>
            {new Date(r.date).toLocaleString()} - {r.diagnosis}
          </option>
        ))}
      </select>
      <Button type="button" onClick={verify}>
        Verify
      </Button>
      {err && <Alert tone="danger">{err}</Alert>}
      {result && (
        <div className="space-y-3 rounded-lg border border-border bg-surface-muted p-4">
          <p className={`font-semibold ${result.verified ? 'text-success' : 'text-danger'}`}>
            {result.message}
          </p>
          {result.block && (
            <>
              <div className="rounded-lg border border-border bg-surface p-3 text-sm text-text">
                <p>
                  <span className="font-medium text-text-muted">Block index:</span>{' '}
                  {result.block.blockIndex}
                </p>
                <p className="mt-1 break-all font-mono text-xs">
                  <span className="font-medium text-text-muted">Record hash:</span> {result.block.hash}
                </p>
                <p className="mt-1 break-all font-mono text-xs">
                  <span className="font-medium text-text-muted">Previous hash:</span>{' '}
                  {result.block.previousHash}
                </p>
              </div>
              {result.block.txHash ? (
                <div className="rounded-lg border border-success/30 bg-success-soft p-3 text-sm">
                  <p className="font-medium text-success">Ethereum anchor</p>
                  {result.block.chainId != null && (
                    <p className="mt-1 text-success">
                      {chainDisplayName(result.block.chainId) || `Chain ID ${result.block.chainId}`}
                    </p>
                  )}
                  <p className="mt-2 break-all font-mono text-xs text-success">
                    {result.block.txHash}
                  </p>
                  {blockExplorerTxUrl(result.block.chainId, result.block.txHash) && (
                    <a
                      href={blockExplorerTxUrl(result.block.chainId, result.block.txHash)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-sm font-semibold text-primary underline"
                    >
                      View transaction on block explorer
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-sm text-text-muted">
                  No Ethereum transaction for this block (server has no <code className="text-xs">ETHEREUM_*</code>{' '}
                  env or anchor predates on-chain setup).
                </p>
              )}
            </>
          )}
        </div>
      )}
      {!result && records.length > 0 && <Badge tone="neutral">Pick a record and verify integrity status</Badge>}
    </Card>
  );
}
