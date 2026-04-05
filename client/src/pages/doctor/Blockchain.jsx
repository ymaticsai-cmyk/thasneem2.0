import { useEffect, useState } from 'react';
import api from '../../services/api';
import { getDoctorPatientId } from '../../lib/doctorPatient';
import { blockExplorerTxUrl, chainDisplayName } from '../../lib/blockExplorer';

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
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-1 font-bold text-slate-800">On-chain integrity</h2>
      <p className="mb-4 text-sm text-slate-500">
        Verifies the medical record hash. With Ethereum configured, each new record is anchored by a
        real transaction (see tx hash below).
      </p>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="mb-4 w-full rounded-xl border border-slate-200 px-3 py-2"
      >
        <option value="">Select record</option>
        {records.map((r) => (
          <option key={r._id} value={r._id}>
            {new Date(r.date).toLocaleString()} — {r.diagnosis}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={verify}
        className="rounded-xl bg-primary px-4 py-2 text-white"
      >
        Verify
      </button>
      {err && <p className="mt-3 text-red-600">{err}</p>}
      {result && (
        <div className="mt-4 space-y-3 rounded-xl border border-slate-200 p-4">
          <p
            className={`font-semibold ${
              result.verified ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {result.message}
          </p>
          {result.block && (
            <>
              <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                <p>
                  <span className="font-medium text-slate-600">Block index:</span>{' '}
                  {result.block.blockIndex}
                </p>
                <p className="mt-1 break-all font-mono text-xs">
                  <span className="font-medium text-slate-600">Record hash:</span> {result.block.hash}
                </p>
                <p className="mt-1 break-all font-mono text-xs">
                  <span className="font-medium text-slate-600">Previous hash:</span>{' '}
                  {result.block.previousHash}
                </p>
              </div>
              {result.block.txHash ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-3 text-sm">
                  <p className="font-medium text-emerald-900">Ethereum anchor</p>
                  {result.block.chainId != null && (
                    <p className="mt-1 text-emerald-800">
                      {chainDisplayName(result.block.chainId) || `Chain ID ${result.block.chainId}`}
                    </p>
                  )}
                  <p className="mt-2 break-all font-mono text-xs text-emerald-900">
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
                <p className="text-sm text-slate-500">
                  No Ethereum transaction for this block (server has no <code className="text-xs">ETHEREUM_*</code>{' '}
                  env or anchor predates on-chain setup).
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
