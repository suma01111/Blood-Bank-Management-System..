import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api, errorMessage } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { Alert, Field } from '../components.jsx';

const initial = { username: '', email: '', phoneNumber: '', address: '', userType: 'donor', password: '', passwordConfirm: '' };
export function Login() {
  const { user, authenticate } = useAuth(); const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' }); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/dashboard" replace />;
  const submit = async event => { event.preventDefault(); setBusy(true); setError(''); try { const { data } = await api.post('/auth/login', form); authenticate(data); navigate('/dashboard'); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); } };
  return <AuthCard title="Login"><Alert>{error}</Alert><form onSubmit={submit}><Field label="Username" name="username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required autoComplete="username" /><Field label="Password" name="password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required autoComplete="current-password" /><div className="d-grid"><button className="btn btn-primary" disabled={busy}>{busy ? 'Logging in…' : 'Login'}</button></div></form><div className="text-center mt-3"><p>Don't have an account? <Link to="/signup">Sign up</Link></p></div></AuthCard>;
}
export function Signup() {
  const { user, authenticate } = useAuth(); const navigate = useNavigate();
  const [form, setForm] = useState(initial); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/dashboard" replace />;
  const update = e => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = async event => { event.preventDefault(); setBusy(true); setError(''); try { const { data } = await api.post('/auth/signup', form); authenticate(data); navigate('/dashboard'); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); } };
  return <AuthCard title="Create Account" wide><Alert>{error}</Alert><form onSubmit={submit}><Field label="Username" name="username" value={form.username} onChange={update} required /><Field label="Email" name="email" type="email" value={form.email} onChange={update} required /><Field label="Phone number" name="phoneNumber" value={form.phoneNumber} onChange={update} required /><Field label="Address" as="textarea" name="address" rows="3" value={form.address} onChange={update} required /><Field label="User type" as="select" name="userType" value={form.userType} onChange={update} required><option value="donor">Donor</option><option value="recipient">Recipient</option></Field><Field label="Password" name="password" type="password" minLength="8" value={form.password} onChange={update} required /><Field label="Password confirmation" name="passwordConfirm" type="password" minLength="8" value={form.passwordConfirm} onChange={update} required /><div className="d-grid"><button className="btn btn-primary" disabled={busy}>{busy ? 'Creating account…' : 'Sign Up'}</button></div></form><div className="text-center mt-3"><p>Already have an account? <Link to="/login">Login</Link></p></div></AuthCard>;
}
function AuthCard({ title, wide, children }) { return <div className="row justify-content-center"><div className={wide ? 'col-md-8 col-lg-6' : 'col-md-6 col-lg-4'}><div className="card shadow"><div className="card-body p-5"><h2 className="text-center mb-4">{title}</h2>{children}</div></div></div></div>; }
