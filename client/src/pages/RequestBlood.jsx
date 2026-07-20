import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, errorMessage } from '../api.js';
import { Alert, Field, InventoryTable, Spinner, bloodGroups } from '../components.jsx';

export default function RequestBlood() {
  const navigate = useNavigate(); const [hospitals, setHospitals] = useState(); const [inventory, setInventory] = useState([]); const [form, setForm] = useState({ bloodGroup: 'O+', hospital: '', unitsRequired: 1, urgencyLevel: 'high' }); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { Promise.all([api.get('/hospitals'), api.get('/public/inventory'), api.get('/dashboard')]).then(([h,i,d]) => {
    const availableHospitals = h.data.hospitals || [];
    const recipient = d.data.recipient;
    setHospitals(availableHospitals);
    setInventory(i.data.inventory || []);
    setForm(value => ({
      ...value,
      bloodGroup: recipient?.bloodGroup || value.bloodGroup,
      hospital: recipient?.hospital?._id || availableHospitals[0]?._id || '',
      unitsRequired: recipient?.unitsRequired || value.unitsRequired,
      urgencyLevel: recipient?.urgencyLevel || value.urgencyLevel
    }));
  }).catch(e => setError(errorMessage(e))); }, []);
  const update = e => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = async e => { e.preventDefault(); setBusy(true); setError(''); try { await api.post('/requests', { ...form, unitsRequired: Number(form.unitsRequired) }); navigate('/dashboard'); } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); } };
  if (!hospitals && !error) return <Spinner />;
  return <><div className="row justify-content-center"><div className="col-md-8"><div className="card shadow"><div className="card-body p-5"><h2 className="text-center mb-4">Blood Request Form</h2><Alert>{error}</Alert>{hospitals?.length ? <form onSubmit={submit}><Field label="Blood group" as="select" name="bloodGroup" value={form.bloodGroup} onChange={update}>{bloodGroups.map(group => <option key={group}>{group}</option>)}</Field><Field label="Hospital" as="select" name="hospital" value={form.hospital} onChange={update} required>{hospitals.map(h => <option value={h._id} key={h._id}>{h.name}</option>)}</Field><Field label="Units required" name="unitsRequired" type="number" min="1" max="10" value={form.unitsRequired} onChange={update} required /><Field label="Urgency level" as="select" name="urgencyLevel" value={form.urgencyLevel} onChange={update}><option value="high">High (Within 24 hours)</option><option value="medium">Medium (Within 48 hours)</option><option value="low">Low (Within 72 hours)</option></Field><div className="d-grid"><button className="btn btn-primary" disabled={busy}>{busy ? 'Submitting…' : 'Submit Request'}</button></div></form> : <Alert type="warning">No hospitals are registered yet. Please contact an administrator.</Alert>}</div></div></div></div><div className="row mt-4"><div className="col-md-6"><div className="card bg-light h-100"><div className="card-body"><h5>Current Blood Inventory</h5><InventoryTable inventory={inventory} /></div></div></div><div className="col-md-6"><div className="card bg-light h-100"><div className="card-body"><h5>Important Information</h5><ul className="list-unstyled">{['Please provide accurate information','Keep your contact information updated','Have your hospital records ready','You will be notified when a donor is found','Emergency cases will be prioritized'].map(item => <li key={item}><i className="fas fa-info-circle text-primary me-2" />{item}</li>)}</ul></div></div></div></div></>;
}
