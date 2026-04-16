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
import { Alert, Badge, Card, EmptyState } from '../../components/ui';

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
      <Card className="text-text-muted">
        Select a patient from Scan / Search first.
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {err && <Alert tone="danger">{err}</Alert>}
      <Card className="p-4">
        <div className="mb-2 text-sm font-medium text-text">Vitals trend</div>
        <div
          ref={chartWrapRef}
          className="w-full min-w-0"
          style={{ height: CHART_H, minHeight: CHART_H }}
        >
          {chartW > 0 ? (
            <ResponsiveContainer width={chartW} height={CHART_H}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="t" hide />
                <YAxis stroke="var(--color-text-muted)" />
                <Tooltip />
                <Line type="monotone" dataKey="pulse" stroke="var(--color-info)" name="Pulse" dot={false} />
                <Line type="monotone" dataKey="bp" stroke="var(--color-success)" name="BP systolic" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-text-muted">
              Loading chart…
            </div>
          )}
        </div>
      </Card>

      <div className="space-y-4">
        {records.map((r) => (
          <Card key={r._id} className="p-4">
            <div className="text-xs text-text-muted">{new Date(r.date).toLocaleString()}</div>
            <div className="font-semibold text-text">{r.diagnosis}</div>
            <Badge tone={r.blockchainVerified ? 'success' : 'danger'} className="mt-2">
              {r.blockchainVerified ? 'Verified' : 'Tampered'}
            </Badge>
            <pre className="mt-2 max-h-40 overflow-auto text-xs text-text-muted">
              {JSON.stringify(r.prescription, null, 2)}
            </pre>
          </Card>
        ))}
        {!records.length && (
          <EmptyState
            title="No records"
            description="No medical records are available for the selected patient yet."
          />
        )}
      </div>
    </div>
  );
}
