import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, errorMessage } from '../api.js';
import { Alert, Field, Spinner } from '../components.jsx';

const emptyForm = {
  name: '', address: '', mainDoctor: '', contactNumber: '', email: '', mainDomain: 'General Medicine'
};

export default function Hospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  const loadHospitals = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/hospitals');
      setHospitals(Array.isArray(data.hospitals) ? data.hospitals : []);
    } catch (error) {
      setNotice({ type: 'danger', text: errorMessage(error) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadHospitals(); }, [loadHospitals]);

  const filteredHospitals = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return hospitals;
    return hospitals.filter(hospital =>
      [hospital.name, hospital.mainDoctor, hospital.mainDomain, hospital.address]
        .some(value => value?.toLowerCase().includes(term))
    );
  }, [hospitals, search]);

  const domains = new Set(hospitals.map(hospital => hospital.mainDomain).filter(Boolean)).size;

  const updateForm = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const submit = async event => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const response = editingId
        ? await api.put(`/admin/hospitals/${editingId}`, form)
        : await api.post('/admin/hospitals', form);
      setNotice({ type: 'success', text: response.data.message });
      resetForm();
      await loadHospitals();
    } catch (error) {
      setNotice({ type: 'danger', text: errorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  const startEditing = hospital => {
    setEditingId(hospital._id);
    setForm({
      name: hospital.name || '',
      address: hospital.address || '',
      mainDoctor: hospital.mainDoctor || '',
      contactNumber: hospital.contactNumber || '',
      email: hospital.email || '',
      mainDomain: hospital.mainDomain || 'General Medicine'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeHospital = async hospital => {
    if (!window.confirm(`Delete ${hospital.name}? This action cannot be undone.`)) return;
    try {
      const { data } = await api.delete(`/admin/hospitals/${hospital._id}`);
      setNotice({ type: 'success', text: data.message });
      await loadHospitals();
    } catch (error) {
      setNotice({ type: 'danger', text: errorMessage(error) });
    }
  };

  if (loading && hospitals.length === 0) return <Spinner />;

  return <>
    <div className="admin-page-header">
      <div><p className="eyebrow">ADMINISTRATION</p><h2>Manage Hospitals</h2><p className="text-muted mb-0">Maintain verified hospital partners and their emergency contacts.</p></div>
      <button className="btn btn-outline-primary" onClick={loadHospitals} disabled={loading}><i className="fas fa-rotate me-2" />Refresh</button>
    </div>

    <Alert type={notice?.type || 'danger'} onClose={() => setNotice(null)}>{notice?.text}</Alert>

    <div className="row g-3 mb-4">
      <SummaryCard icon="fa-hospital" label="Registered Hospitals" value={hospitals.length} />
      <SummaryCard icon="fa-stethoscope" label="Medical Domains" value={domains} />
      <SummaryCard icon="fa-address-book" label="Emergency Contacts" value={hospitals.filter(h => h.contactNumber).length} />
    </div>

    <div className="row g-4">
      <div className="col-lg-4">
        <div className="card shadow admin-sticky-card"><div className="card-body p-4">
          <h3 className="h4 mb-1">{editingId ? 'Edit Hospital' : 'Add New Hospital'}</h3>
          <p className="text-muted small mb-4">All fields are required for recipient coordination.</p>
          <form onSubmit={submit}>
            <Field label="Hospital name" name="name" value={form.name} onChange={updateForm} required />
            <Field label="Medical domain" name="mainDomain" value={form.mainDomain} onChange={updateForm} required />
            <Field label="Main doctor" name="mainDoctor" value={form.mainDoctor} onChange={updateForm} required />
            <Field label="Contact number" name="contactNumber" type="tel" value={form.contactNumber} onChange={updateForm} required />
            <Field label="Email" name="email" type="email" value={form.email} onChange={updateForm} required />
            <Field label="Address" as="textarea" rows="3" name="address" value={form.address} onChange={updateForm} required />
            <div className="d-grid gap-2"><button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Hospital'}</button>{editingId && <button type="button" className="btn btn-light" onClick={resetForm}>Cancel Editing</button>}</div>
          </form>
        </div></div>
      </div>

      <div className="col-lg-8">
        <div className="card shadow"><div className="card-body p-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <div><h3 className="h4 mb-1">Hospital Directory</h3><span className="text-muted small">{filteredHospitals.length} of {hospitals.length} hospitals</span></div>
            <div className="search-box"><i className="fas fa-search" /><input aria-label="Search hospitals" placeholder="Search hospital, doctor or domain" value={search} onChange={event => setSearch(event.target.value)} /></div>
          </div>
          {filteredHospitals.length > 0 ? <div className="table-responsive"><table className="table table-hover align-middle">
            <thead><tr><th>Hospital</th><th>Medical Contact</th><th>Communication</th><th className="text-end">Actions</th></tr></thead>
            <tbody>{filteredHospitals.map(hospital => <tr key={hospital._id}>
              <td><strong>{hospital.name}</strong><div className="small text-muted"><i className="fas fa-location-dot me-1" />{hospital.address}</div></td>
              <td><span className="domain-chip">{hospital.mainDomain || 'General Medicine'}</span><div className="small mt-1">{hospital.mainDoctor}</div></td>
              <td><a href={`tel:${hospital.contactNumber}`} className="contact-link">{hospital.contactNumber}</a><div><a href={`mailto:${hospital.email}`} className="small contact-link">{hospital.email}</a></div></td>
              <td className="text-end text-nowrap"><button className="btn btn-sm btn-outline-primary me-1" aria-label={`Edit ${hospital.name}`} onClick={() => startEditing(hospital)}><i className="fas fa-edit" /></button><button className="btn btn-sm btn-outline-danger" aria-label={`Delete ${hospital.name}`} onClick={() => removeHospital(hospital)}><i className="fas fa-trash" /></button></td>
            </tr>)}</tbody>
          </table></div> : <EmptyState search={search} />}
        </div></div>
      </div>
    </div>
  </>;
}

function SummaryCard({ icon, label, value }) {
  return <div className="col-md-4"><div className="card admin-summary-card h-100"><div className="card-body"><div className="summary-icon"><i className={`fas ${icon}`} /></div><div><div className="summary-value">{value}</div><div className="text-muted">{label}</div></div></div></div></div>;
}

function EmptyState({ search }) {
  return <div className="admin-empty-state"><i className="fas fa-hospital-user" /><h4>{search ? 'No matching hospitals' : 'No hospitals registered'}</h4><p>{search ? 'Try a different search term.' : 'Use the form to add your first hospital partner.'}</p></div>;
}
