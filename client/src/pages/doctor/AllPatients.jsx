import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { setDoctorPatientId } from '../../lib/doctorPatient';
import { Card, DataTable, Input } from '../../components/ui';

export default function DoctorAllPatients() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadPatients() {
      setLoading(true);
      try {
        const { data } = await api.get('/patients', { params: { q } });
        if (active) setList(Array.isArray(data) ? data : []);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadPatients();
    return () => {
      active = false;
    };
  }, [q]);

  return (
    <Card>
      <Input
        className="mb-4"
        placeholder="Search…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <DataTable
        columns={[
          { key: 'name', label: 'Patient' },
          { key: 'patientId', label: 'Patient ID', className: 'text-text-muted' },
          {
            key: 'actions',
            label: 'Action',
            render: (_, row) => (
              <div className="flex gap-3">
                <button
                  type="button"
                  className="text-sm text-primary transition-colors hover:text-primary-strong"
                  onClick={() => setDoctorPatientId(row._id)}
                >
                  Select
                </button>
                <Link className="text-sm text-accent transition-colors hover:brightness-110" to={`/dashboard/doctor/patients/${row._id}`}>
                  Open detail
                </Link>
              </div>
            ),
          },
        ]}
        rows={loading ? [] : list}
        emptyState={loading ? 'Loading patient list…' : 'No matching patients found.'}
      />
    </Card>
  );
}
