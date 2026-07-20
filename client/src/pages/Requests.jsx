import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, errorMessage } from '../api.js';
import { Alert, InventoryTable, Spinner } from '../components.jsx';

const emptyData = { requests: [], counts: { pending: 0, approved: 0, rejected: 0, completed: 0 }, inventory: [] };

export default function Requests() {
  const [data, setData] = useState(emptyData);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState(null);
  const [notice, setNotice] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/requests');
      setData({
        ...emptyData,
        ...response.data,
        requests: Array.isArray(response.data.requests) ? response.data.requests : [],
        inventory: Array.isArray(response.data.inventory) ? response.data.inventory : [],
        counts: { ...emptyData.counts, ...(response.data.counts || {}) }
      });
    } catch (error) {
      setNotice({ type: 'danger', text: errorMessage(error) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const visibleRequests = useMemo(() => {
    const term = search.trim().toLowerCase();
    return data.requests.filter(request => {
      const statusMatches = filter === 'all' || request.status === filter;
      const textMatches = !term || [request.recipient?.user?.username, request.recipient?.bloodGroup, request.recipient?.hospital?.name]
        .some(value => value?.toLowerCase().includes(term));
      return statusMatches && textMatches;
    });
  }, [data.requests, filter, search]);

  const changeStatus = async (id, status) => {
    setWorkingId(id);
    setNotice(null);
    try {
      const response = await api.patch(`/admin/requests/${id}/status`, { status });
      setNotice({ type: 'success', text: response.data.message });
      await loadRequests();
    } catch (error) {
      setNotice({ type: 'danger', text: errorMessage(error) });
    } finally {
      setWorkingId(null);
    }
  };

  if (loading && data.requests.length === 0) return <Spinner />;

  return <>
    <div className="admin-page-header">
      <div><p className="eyebrow">REQUEST CONTROL</p><h2>Manage Blood Requests</h2><p className="text-muted mb-0">Prioritize urgent cases, verify stock, and track every request.</p></div>
      <button className="btn btn-outline-primary" onClick={loadRequests} disabled={loading}><i className="fas fa-rotate me-2" />Refresh</button>
    </div>

    <Alert type={notice?.type || 'danger'} onClose={() => setNotice(null)}>{notice?.text}</Alert>

    <div className="row g-3 mb-4">
      <RequestMetric label="Pending" value={data.counts.pending} icon="fa-clock" color="warning" />
      <RequestMetric label="Approved" value={data.counts.approved} icon="fa-circle-check" color="success" />
      <RequestMetric label="Rejected" value={data.counts.rejected} icon="fa-circle-xmark" color="danger" />
      <RequestMetric label="Completed" value={data.counts.completed} icon="fa-flag-checkered" color="info" />
    </div>

    <div className="card shadow mb-4"><div className="card-body p-4">
      <div className="request-toolbar mb-4">
        <div className="status-filters" aria-label="Filter requests by status">{['all', 'pending', 'approved', 'rejected', 'completed'].map(status => <button key={status} className={`btn btn-sm ${filter === status ? 'btn-primary' : 'btn-light'}`} onClick={() => setFilter(status)}>{titleCase(status)}{status !== 'all' && <span className="ms-1">({data.counts[status]})</span>}</button>)}</div>
        <div className="search-box"><i className="fas fa-search" /><input aria-label="Search requests" placeholder="Search recipient, group or hospital" value={search} onChange={event => setSearch(event.target.value)} /></div>
      </div>
      {visibleRequests.length > 0 ? <div className="table-responsive"><table className="table table-hover align-middle">
        <thead><tr><th>Request</th><th>Recipient</th><th>Blood Need</th><th>Hospital</th><th>Priority</th><th>Status</th><th className="text-end">Actions</th></tr></thead>
        <tbody>{visibleRequests.map(request => {
          const recipient = request.recipient;
          const stock = data.inventory.find(item => item.bloodGroup === recipient?.bloodGroup)?.unitsAvailable || 0;
          return <tr key={request._id} className={recipient?.urgencyLevel === 'high' && request.status === 'pending' ? 'urgent-row' : ''}>
            <td><strong>#{request._id.slice(-6).toUpperCase()}</strong><div className="small text-muted">{new Date(request.createdAt).toLocaleDateString()}</div></td>
            <td><strong>{recipient?.user?.username || 'Unknown'}</strong><div className="small text-muted">{recipient?.user?.phoneNumber || 'No phone'}</div></td>
            <td><span className="blood-group-pill">{recipient?.bloodGroup}</span><div className="small mt-1">{recipient?.unitsRequired} unit(s) · {stock} in stock</div></td>
            <td>{recipient?.hospital?.name || 'Not assigned'}</td>
            <td><StatusBadge value={recipient?.urgencyLevel || 'low'} /></td>
            <td><StatusBadge value={request.status} /></td>
            <td className="text-end text-nowrap">{request.status === 'pending' && <><button className="btn btn-sm btn-success me-1" disabled={workingId === request._id} onClick={() => changeStatus(request._id, 'approved')} title="Approve request"><i className="fas fa-check" /></button><button className="btn btn-sm btn-danger me-1" disabled={workingId === request._id} onClick={() => changeStatus(request._id, 'rejected')} title="Reject request"><i className="fas fa-times" /></button></>} {request.status === 'approved' && <button className="btn btn-sm btn-outline-info me-1" disabled={workingId === request._id} onClick={() => changeStatus(request._id, 'completed')} title="Mark completed"><i className="fas fa-flag-checkered" /></button>}<button className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedRequest(request)} title="View details"><i className="fas fa-eye" /></button></td>
          </tr>;
        })}</tbody>
      </table></div> : <RequestEmptyState filtered={filter !== 'all' || Boolean(search)} />}
    </div></div>

    <div className="row g-4">
      <div className="col-lg-7"><div className="card bg-light h-100"><div className="card-body p-4"><h5><i className="fas fa-droplet text-primary me-2" />Blood Inventory Availability</h5><p className="text-muted small">Approvals automatically deduct the requested units and are blocked when stock is insufficient.</p><InventoryTable inventory={data.inventory} /></div></div></div>
      <div className="col-lg-5"><div className="card bg-light h-100"><div className="card-body p-4"><h5><i className="fas fa-list-check text-primary me-2" />Review Checklist</h5><ul className="review-checklist"><li>Confirm the recipient’s blood group and units.</li><li>Prioritize high-urgency requests.</li><li>Verify hospital and contact information.</li><li>Check available inventory before approval.</li><li>Mark fulfilled requests as completed.</li></ul></div></div></div>
    </div>
    {selectedRequest && <RequestDetails request={selectedRequest} close={() => setSelectedRequest(null)} />}
  </>;
}

function RequestMetric({ label, value, icon, color }) {
  return <div className="col-6 col-lg-3"><div className="card request-metric h-100"><div className="card-body"><div className={`metric-icon text-${color}`}><i className={`fas ${icon}`} /></div><div><div className="summary-value">{value}</div><div className="text-muted">{label} Requests</div></div></div></div></div>;
}

function StatusBadge({ value }) {
  const color = { high: 'danger', medium: 'warning', low: 'success', pending: 'warning', approved: 'success', rejected: 'danger', completed: 'info' }[value] || 'secondary';
  return <span className={`badge bg-${color}`}>{titleCase(value)}</span>;
}

function titleCase(value = '') { return value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Unknown'; }

function RequestEmptyState({ filtered }) {
  return <div className="admin-empty-state"><i className="fas fa-clipboard-list" /><h4>{filtered ? 'No matching requests' : 'No blood requests yet'}</h4><p>{filtered ? 'Change the filter or search term.' : 'New recipient requests will appear here for review.'}</p></div>;
}

function RequestDetails({ request, close }) {
  const recipient = request.recipient;
  return <div className="modal-backdrop-custom" role="dialog" aria-modal="true" aria-label="Request details"><div className="modal-card">
    <div className="d-flex justify-content-between"><div><p className="eyebrow mb-1">REQUEST DETAILS</p><h5>#{request._id.slice(-6).toUpperCase()}</h5></div><button className="btn-close" onClick={close} aria-label="Close" /></div><hr />
    <h6>Recipient</h6><p><strong>{recipient?.user?.username}</strong><br />{recipient?.user?.phoneNumber}<br />{recipient?.user?.email}</p>
    <h6>Hospital</h6><p><strong>{recipient?.hospital?.name}</strong><br />Dr. {recipient?.hospital?.mainDoctor}<br />{recipient?.hospital?.address}</p>
    <h6>Requirement</h6><p><span className="blood-group-pill me-2">{recipient?.bloodGroup}</span>{recipient?.unitsRequired} unit(s) · {titleCase(recipient?.urgencyLevel)} urgency</p>
    <button className="btn btn-secondary w-100" onClick={close}>Close</button>
  </div></div>;
}
