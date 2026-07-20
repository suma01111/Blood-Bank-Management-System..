import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errorMessage } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { Alert, InventoryTable, Spinner } from '../components.jsx';

export default function Dashboard() {
  const { user } = useAuth(); const [data, setData] = useState(); const [error, setError] = useState('');
  useEffect(() => { api.get('/dashboard').then(response => setData(response.data)).catch(e => setError(errorMessage(e))); }, []);
  if (error) return <Alert>{error}</Alert>; if (!data) return <Spinner />;
  return <><div className="row mb-4"><div className="col-12"><h2>Welcome, {user.username}!</h2><p className="text-muted">Here's your dashboard overview</p></div></div>
    {user.userType === 'donor' && <><StatCards items={[['Your Blood Group', data.donor?.bloodGroup || 'Not set'], ['Last Donation', formatDate(data.donor?.lastDonationDate) || 'Never'], ['Next Checkup', formatDate(data.donor?.medicalCheckupDate) || 'Not set']]} /><Action title="Donate Blood" text="Ready to make a difference? Schedule your next blood donation." href="/donate" label="Donate Now" /></>}
    {user.userType === 'recipient' && <RecipientDashboard data={data} />}
    {user.userType === 'admin' && <>
      <StatCards items={[['Total Donors', data.stats.donors], ['Total Recipients', data.stats.recipients], ['Total Hospitals', data.stats.hospitals], ['Pending Requests', data.stats.pendingRequests]]} cols="col-md-3" />
      <div className="row g-3 mb-4"><MiniMetric icon="fa-database" label="Managed Records" value={data.stats.totalRecords} /><MiniMetric icon="fa-droplet" label="Units Available" value={data.stats.unitsAvailable} /><MiniMetric icon="fa-clipboard-check" label="Completed Requests" value={data.stats.completedRequests} /><MiniMetric icon="fa-chart-line" label="Fulfillment Rate" value={`${data.stats.fulfillmentRate}%`} /></div>
      <div className="row mb-4 g-4"><div className="col-lg-7"><div className="card h-100"><div className="card-body"><h5>Blood Inventory</h5><p className="text-muted small">Live availability across all supported blood groups.</p><InventoryTable inventory={data.inventory} /></div></div></div><div className="col-lg-5"><div className="card h-100"><div className="card-body"><h5>Quick Actions</h5><p className="text-muted small">Review operational data and respond to emergencies.</p><div className="d-grid gap-2"><Link className="btn btn-primary" to="/manage-hospitals">Manage Hospitals</Link><Link className="btn btn-primary" to="/manage-requests">Manage Blood Requests</Link></div><hr /><h6 className="mt-3">Platform Capabilities</h6><ul className="dashboard-capabilities"><li>Structured and validated donor-recipient records</li><li>Indexed compatibility-based donor matching</li><li>Atomic inventory updates during approvals</li><li>Responsive emergency request workflow</li></ul></div></div></div></div>
    </>}
  </>;
}
const formatDate = value => value && new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date(value));
function StatCards({ items, cols = 'col-md-4' }) { return <div className="row mb-4 g-3">{items.map(([title,value]) => <div className={cols} key={title}><div className="card h-100"><div className="card-body"><h5>{title}</h5><p className="display-6">{value}</p></div></div></div>)}</div>; }
function Action({ title, text, href, label }) { return <div className="row"><div className="col-12"><div className="card"><div className="card-body"><h5>{title}</h5><p>{text}</p><Link className="btn btn-primary" to={href}>{label}</Link></div></div></div></div>; }
function MiniMetric({ icon, label, value }) { return <div className="col-6 col-lg-3"><div className="card mini-metric h-100"><div className="card-body"><i className={`fas ${icon}`} /><div><strong>{value}</strong><span>{label}</span></div></div></div></div>; }
function RecipientDashboard({ data }) {
  const recipient = data.recipient;
  const requests = data.requests || [];
  const available = data.inventory.find(item => item.bloodGroup === recipient?.bloodGroup)?.unitsAvailable || 0;
  const latest = requests[0];
  return <>
    <StatCards items={[['Your Blood Group', recipient?.bloodGroup || 'Not set'], ['Hospital', recipient?.hospital?.name || 'Not selected'], ['Units Required', recipient?.unitsRequired || 0]]} />
    <div className="row g-3 mb-4"><MiniMetric icon="fa-droplet" label={`${recipient?.bloodGroup || ''} Units Available`} value={available} /><MiniMetric icon="fa-clipboard-list" label="Total Requests" value={requests.length} /><MiniMetric icon="fa-bolt" label="Urgency" value={titleCase(recipient?.urgencyLevel || 'not set')} /><MiniMetric icon="fa-clock" label="Latest Status" value={titleCase(latest?.status || 'no request')} /></div>
    <div className="row g-4"><div className="col-lg-8"><div className="card h-100"><div className="card-body"><div className="d-flex justify-content-between align-items-center mb-3"><div><h5 className="mb-1">Your Blood Requests</h5><p className="text-muted small mb-0">Track every request submitted to the blood bank.</p></div><Link className="btn btn-primary" to="/request-blood">New Request</Link></div>{requests.length ? <div className="table-responsive"><table className="table align-middle"><thead><tr><th>Date</th><th>Blood Group</th><th>Units</th><th>Urgency</th><th>Status</th></tr></thead><tbody>{requests.map(request => <tr key={request._id}><td>{new Date(request.createdAt).toLocaleDateString()}</td><td><span className="blood-group-pill">{recipient?.bloodGroup}</span></td><td>{recipient?.unitsRequired}</td><td>{titleCase(recipient?.urgencyLevel)}</td><td><RequestStatus status={request.status} /></td></tr>)}</tbody></table></div> : <div className="recipient-empty"><i className="fas fa-file-medical" /><p>No requests submitted yet.</p><Link to="/request-blood">Create your first blood request</Link></div>}</div></div></div><div className="col-lg-4"><div className="card h-100"><div className="card-body"><h5>Assigned Hospital</h5>{recipient?.hospital ? <><h6 className="mt-3">{recipient.hospital.name}</h6><p className="text-muted small"><i className="fas fa-location-dot me-2" />{recipient.hospital.address}</p><p className="small"><strong>Doctor:</strong> {recipient.hospital.mainDoctor}<br /><strong>Phone:</strong> {recipient.hospital.contactNumber}<br /><strong>Email:</strong> {recipient.hospital.email}</p></> : <p className="text-muted">Choose a hospital when creating your request.</p>}<hr /><h6>Emergency guidance</h6><p className="small text-muted mb-0">For a life-threatening emergency, contact the hospital directly and use this system to coordinate blood availability.</p></div></div></div></div>
  </>;
}
function RequestStatus({ status }) { const color = { pending: 'warning', approved: 'success', rejected: 'danger', completed: 'info' }[status] || 'secondary'; return <span className={`badge bg-${color}`}>{titleCase(status)}</span>; }
function titleCase(value = '') { return value.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '); }
