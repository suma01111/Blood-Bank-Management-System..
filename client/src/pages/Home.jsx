import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export default function Home() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  useEffect(() => { api.get('/public/inventory').then(({ data }) => setInventory(Array.isArray(data.inventory) ? data.inventory : [])).catch(() => setInventory([])); }, []);
  return <>
    <div className="row align-items-center mb-5 hero"><div className="col-md-6"><h1 className="display-4 fw-bold mb-4">Save Lives, Donate Blood</h1><p className="lead mb-4">Join our community of blood donors and help make a difference in someone's life. Every donation counts!</p>{!user && <div className="d-grid gap-2 d-md-flex justify-content-md-start"><Link to="/signup" className="btn btn-primary btn-lg px-4 me-md-2">Get Started</Link><Link to="/login" className="btn btn-outline-primary btn-lg px-4">Login</Link></div>}</div><div className="col-md-6"><div className="hero-art rounded shadow"><i className="fas fa-hand-holding-heart" aria-hidden="true" /><span>Give blood. Give hope.</span></div></div></div>
    <section className="row mb-5"><div className="col-12 text-center"><h2 className="mb-4">Why Donate Blood?</h2><div className="row g-4">{[['fa-heartbeat','Save Lives','Your donation can help save up to three lives. Every drop counts!'],['fa-hand-holding-heart','Make a Difference',"Be part of a community that makes a real impact in people's lives."],['fa-users','Join Our Community','Connect with other donors and healthcare professionals.']].map(([icon,title,text]) => <div className="col-md-4" key={title}><div className="card h-100"><div className="card-body text-center"><i className={`fas ${icon} fa-3x text-primary mb-3`} /><h5>{title}</h5><p>{text}</p></div></div></div>)}</div></div></section>
    <section className="row mb-5"><div className="col-12"><div className="card bg-light"><div className="card-body"><h3 className="text-center mb-4">Blood Donation Process</h3><div className="row">{[['Register','Sign up as a donor or recipient'],['Eligibility','Complete the eligibility form'],['Donate','Schedule and complete donation'],['Save Lives','Your blood helps save lives']].map(([title,text], index) => <div className="col-md-3 text-center" key={title}><div className="process-number">{index + 1}</div><h5>{title}</h5><p>{text}</p></div>)}</div></div></div></div></section>
    <section className="row"><div className="col-12 text-center"><h2 className="mb-4">Current Blood Inventory</h2><div className="row g-4">{inventory.map(item => <div className="col-6 col-md-3" key={item.bloodGroup}><div className="card"><div className="card-body"><h5>{item.bloodGroup}</h5><p className="display-6 mb-0">{item.unitsAvailable}</p><p>units available</p></div></div></div>)}</div></div></section>
  </>;
}
