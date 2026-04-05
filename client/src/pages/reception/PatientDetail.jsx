import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';

const emptyForm = {
  name: '',
  age: '',
  gender: 'Male',
  bloodGroup: '',
  allergies: '',
  chronicDiseases: '',
  ecName: '',
  ecPhone: '',
  ecRelation: '',
  patientEmail: '',
  patientPhone: '',
};

export default function ReceptionPatientDetail() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [err, setErr] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saveMsg, setSaveMsg] = useState('');
  const [saveErr, setSaveErr] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setErr('');
    return api
      .get(`/patients/${id}`)
      .then(({ data }) => {
        setP(data);
        const u = data.userId;
        setForm({
          name: data.name || '',
          age: data.age != null ? String(data.age) : '',
          gender: data.gender || 'Male',
          bloodGroup: data.bloodGroup || '',
          allergies: (data.allergies || []).join(', '),
          chronicDiseases: (data.chronicDiseases || []).join(', '),
          ecName: data.emergencyContact?.name || '',
          ecPhone: data.emergencyContact?.phone || '',
          ecRelation: data.emergencyContact?.relation || '',
          patientEmail: typeof u === 'object' && u?.email ? u.email : '',
          patientPhone: typeof u === 'object' && u?.phone ? u.phone : '',
        });
      })
      .catch((e) => setErr(e.response?.data?.message || 'Failed'));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const startEdit = () => {
    setSaveMsg('');
    setSaveErr('');
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setSaveErr('');
    if (p) load();
  };

  const save = async (e) => {
    e.preventDefault();
    setSaveErr('');
    setSaveMsg('');
    setSaving(true);
    try {
      const { data } = await api.patch(`/patients/${id}`, {
        name: form.name,
        age: Number(form.age),
        gender: form.gender,
        bloodGroup: form.bloodGroup,
        allergies: form.allergies.split(',').map((s) => s.trim()).filter(Boolean),
        chronicDiseases: form.chronicDiseases.split(',').map((s) => s.trim()).filter(Boolean),
        emergencyContact: {
          name: form.ecName,
          phone: form.ecPhone,
          relation: form.ecRelation,
        },
        patientEmail: form.patientEmail.trim() || undefined,
        patientPhone: form.patientPhone.trim() || undefined,
      });
      setP(data);
      setEditing(false);
      setSaveMsg('Patient details saved. QR updated if name or blood group changed.');
    } catch (e2) {
      setSaveErr(e2.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (err && !p) return <div className="text-red-600">{err}</div>;
  if (!p) return <div className="text-slate-500">Loading…</div>;

  return (
    <div className="space-y-4">
      <Link to="/dashboard/receptionist/patients" className="text-sm text-primary">
        ← Back to list
      </Link>

      {saveMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {saveMsg}
        </div>
      )}

      {!editing ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-800">{p.name}</h2>
              <p className="text-sm text-slate-500">{p.patientId}</p>
            </div>
            <button
              type="button"
              onClick={startEdit}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Edit details
            </button>
          </div>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Age / Gender</dt>
              <dd>
                {p.age} / {p.gender}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Blood</dt>
              <dd>{p.bloodGroup}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Allergies</dt>
              <dd>{(p.allergies || []).join(', ') || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Chronic conditions</dt>
              <dd>{(p.chronicDiseases || []).join(', ') || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Emergency</dt>
              <dd>
                {p.emergencyContact?.name} — {p.emergencyContact?.phone} ({p.emergencyContact?.relation})
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Login email</dt>
              <dd>{typeof p.userId === 'object' ? p.userId?.email : '—'}</dd>
            </div>
          </dl>
          {p.qrCodeUrl && (
            <div className="mt-6 flex flex-wrap items-end gap-4">
              <img src={p.qrCodeUrl} alt="QR" className="max-w-[200px]" />
              <a
                href={p.qrCodeUrl}
                download
                className="rounded-lg bg-primary px-4 py-2 text-sm text-white"
              >
                Reprint QR
              </a>
            </div>
          )}
        </div>
      ) : (
        <form
          onSubmit={save}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Edit patient · {p.patientId}</h2>
            <button
              type="button"
              onClick={cancelEdit}
              className="text-sm text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-2 sm:col-span-2"
            />
            <input
              required
              type="number"
              placeholder="Age"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-2"
            />
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-2"
            >
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
            <input
              required
              placeholder="Blood group"
              value={form.bloodGroup}
              onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-2"
            />
            <input
              placeholder="Allergies (comma-separated)"
              value={form.allergies}
              onChange={(e) => setForm({ ...form, allergies: e.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-2 sm:col-span-2"
            />
            <input
              placeholder="Chronic diseases (comma-separated)"
              value={form.chronicDiseases}
              onChange={(e) => setForm({ ...form, chronicDiseases: e.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-2 sm:col-span-2"
            />
            <input
              required
              placeholder="Emergency contact name"
              value={form.ecName}
              onChange={(e) => setForm({ ...form, ecName: e.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-2"
            />
            <input
              required
              placeholder="Emergency phone"
              value={form.ecPhone}
              onChange={(e) => setForm({ ...form, ecPhone: e.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-2"
            />
            <input
              required
              placeholder="Relation"
              value={form.ecRelation}
              onChange={(e) => setForm({ ...form, ecRelation: e.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-2 sm:col-span-2"
            />
            <input
              type="email"
              placeholder="Patient login email"
              value={form.patientEmail}
              onChange={(e) => setForm({ ...form, patientEmail: e.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-2"
            />
            <input
              placeholder="Patient phone"
              value={form.patientPhone}
              onChange={(e) => setForm({ ...form, patientPhone: e.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-2"
            />
          </div>

          {saveErr && <p className="text-sm text-red-600">{saveErr}</p>}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-primary px-4 py-2 font-semibold text-white disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-xl border border-slate-200 px-4 py-2 text-slate-700"
            >
              Discard
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Saving updates the patient file and regenerates the QR code when name or blood group
            changes. Patient ID stays the same.
          </p>
        </form>
      )}
    </div>
  );
}
