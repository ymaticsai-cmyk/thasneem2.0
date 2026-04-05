import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '../../services/api';
import { getDoctorPatientId } from '../../lib/doctorPatient';

const CHART_H = 224;

export default function DoctorRecords() {
  const [records, setRecords] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [pid, setPid] = useState(getDoctorPatientId);
  const [err, setErr] = useState('');
  const chartWrapRef = useRef(null);
  const [chartW, setChartW] = useState(0);

  useLayoutEffect(() => {
    const el = chartWrapRef.current;
    if (!el) return undefined;
    const measure = () => {
      const w = Math.floor(el.getBoundingClientRect().width);
      setChartW(w > 0 ? w : 0);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pid]);

  useEffect(() => {
    const id = getDoctorPatientId();
    setPid(id);
  }, []);

  useEffect(() => {
    if (!pid) return;
    setErr('');
    Promise.all([
      api.get(`/records/${pid}`),
      api.get(`/vitals/${pid}`),
    ])
      .then(([r, v]) => {
        setRecords(r.data);
        setVitals(v.data);
      })
      .catch((e) => setErr(e.response?.data?.message || 'Failed'));
  }, [pid]);

  const chartData = vitals
    .slice()
    .reverse()
    .map((x) => ({
      t: new Date(x.recordedAt).toLocaleString(),
      pulse: Number(x.pulseRate) || 0,
      bp: Number(String(x.bloodPressure).split('/')[0]) || 0,
    }));

  if (!pid) {
    return (
      <div className="rounded-2xl bg-white p-6 text-slate-600 shadow-sm">
        Select a patient from Scan / Search first.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {err && <div className="text-red-600">{err}</div>}
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-2 text-sm font-medium text-slate-700">Vitals trend</div>
        <div
          ref={chartWrapRef}
          className="w-full min-w-0"
          style={{ height: CHART_H, minHeight: CHART_H }}
        >
          {chartW > 0 ? (
            <ResponsiveContainer width={chartW} height={CHART_H}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="t" hide />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="pulse" stroke="#2563eb" name="Pulse" dot={false} />
                <Line type="monotone" dataKey="bp" stroke="#10b981" name="BP systolic" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Loading chart…
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {records.map((r) => (
          <div key={r._id} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="text-xs text-slate-500">{new Date(r.date).toLocaleString()}</div>
            <div className="font-semibold text-slate-800">{r.diagnosis}</div>
            <span
              className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs ${
                r.blockchainVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
              }`}
            >
              {r.blockchainVerified ? 'Verified' : 'Tampered'}
            </span>
            <pre className="mt-2 max-h-40 overflow-auto text-xs text-slate-600">
              {JSON.stringify(r.prescription, null, 2)}
            </pre>
          </div>
        ))}
        {!records.length && <p className="text-slate-500">No records</p>}
      </div>
    </div>
  );
}
