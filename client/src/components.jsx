import { useState } from 'react';
import { Link, NavLink, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

export const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
export function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return <div className="app-shell">
    <nav className="navbar navbar-expand-lg navbar-dark">
      <div className="container">
        <Link className="navbar-brand" to="/" onClick={close}><img className="brand-logo" src="/icon-192.png" alt="" />Blood Bank</Link>
        <button className="navbar-toggler" type="button" aria-label="Toggle navigation" aria-controls="mainNavigation" aria-expanded={open} onClick={() => setOpen(!open)}><span className="navbar-toggler-icon" /></button>
        <div id="mainNavigation" className={`collapse navbar-collapse ${open ? 'show' : ''}`}><ul className="navbar-nav ms-auto">
          <li className="nav-item"><NavLink className="nav-link" to="/" onClick={close}>Home</NavLink></li>
          {user ? <>
            <li className="nav-item"><NavLink className="nav-link" to="/dashboard" onClick={close}>Dashboard</NavLink></li>
            {user.userType === 'donor' && <li className="nav-item"><NavLink className="nav-link" to="/donate" onClick={close}>Donate</NavLink></li>}
            {user.userType === 'recipient' && <li className="nav-item"><NavLink className="nav-link" to="/request-blood" onClick={close}>Request Blood</NavLink></li>}
            {user.userType === 'admin' && <><li className="nav-item"><NavLink className="nav-link" to="/manage-hospitals" onClick={close}>Manage Hospitals</NavLink></li><li className="nav-item"><NavLink className="nav-link" to="/manage-requests" onClick={close}>Manage Requests</NavLink></li></>}
            <li className="nav-item"><button className="nav-link nav-button" onClick={() => { logout(); close(); }}>Logout</button></li>
          </> : <><li className="nav-item"><NavLink className="nav-link" to="/login" onClick={close}>Login</NavLink></li><li className="nav-item"><NavLink className="nav-link" to="/signup" onClick={close}>Sign Up</NavLink></li></>}
        </ul></div>
      </div>
    </nav>
    <main className="container mt-4"><Outlet /></main>
    <footer className="footer"><div className="container"><div className="row"><div className="col-md-6"><h5>Blood Bank Management System</h5><p>Connecting donors with recipients to save lives.</p></div><div className="col-md-6 text-md-end"><h5>Contact Us</h5><p>Email: support@bloodbank.com<br />Phone: (123) 456-7890</p></div></div></div></footer>
  </div>;
}

export function Protected({ roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.userType)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
export const Alert = ({ type = 'danger', children, onClose }) => children && <div className={`alert alert-${type} alert-dismissible fade show`} role="alert">{children}{onClose && <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />}</div>;
export const Spinner = () => <div className="text-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading</span></div></div>;
export const Field = ({ label, as = 'input', children, ...props }) => <div className="mb-3"><label className="form-label" htmlFor={props.id || props.name}>{label}</label>{as === 'select' ? <select className="form-select" id={props.id || props.name} {...props}>{children}</select> : as === 'textarea' ? <textarea className="form-control" id={props.id || props.name} {...props} /> : <input className="form-control" id={props.id || props.name} {...props} />}</div>;
export const InventoryTable = ({ inventory = [] }) => <div className="table-responsive"><table className="table inventory-table"><thead><tr><th>Blood Group</th><th>Units Available</th></tr></thead><tbody>{inventory.map(item => <tr key={item._id || item.bloodGroup}><td>{item.bloodGroup}</td><td>{item.unitsAvailable}</td></tr>)}</tbody></table></div>;
