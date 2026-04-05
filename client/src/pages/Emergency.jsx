import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function Emergency() {
  const { patientId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`/api/emergency/${encodeURIComponent(patientId)}`)
      .then(({ data: d }) => setData(d))
      .catch(() => setError('Could not load emergency information'))
      .finally(() => setLoading(false));
  }, [patientId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-red-600 p-6 text-white">Loading…</div>
    );
  }
  if (error || !data) {
    return (
      <div className="min-h-screen bg-red-700 p-6 text-white">{error || 'Not found'}</div>
    );
  }

  return (
    <div className="min-h-screen bg-red-600 p-4 text-white md:p-8">
      <div className="mx-auto max-w-lg">
        <h1 className="mb-6 text-center text-xl font-bold md:text-2xl">
          ⚠️ EMERGENCY MEDICAL INFORMATION
        </h1>
        <div className="space-y-4 rounded-2xl bg-white/10 p-6 backdrop-blur">
          <div>
            <div className="text-sm opacity-90">BLOOD GROUP</div>
            <div className="text-3xl font-bold">{data.bloodGroup}</div>
          </div>
          <div>
            <div className="text-sm opacity-90">ALLERGIES</div>
            <div className="text-xl font-semibold">
              {(data.allergies || []).join(', ') || 'None known'}
            </div>
          </div>
          <div>
            <div className="text-sm opacity-90">EMERGENCY CONTACT</div>
            <div className="text-xl font-semibold">
              {data.emergencyContact?.name} — {data.emergencyContact?.phone}
            </div>
            <div className="text-sm opacity-80">{data.emergencyContact?.relation}</div>
          </div>
        </div>
        <p className="mt-8 text-center text-sm opacity-80">
          This is a read-only emergency view for first responders.
        </p>
      </div>
    </div>
  );
}
