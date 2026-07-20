import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './styles.css';
import { AuthProvider } from './AuthContext.jsx';
import { Layout, Protected } from './components.jsx';
import Home from './pages/Home.jsx';
import { Login, Signup } from './pages/AuthPages.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Donate from './pages/Donate.jsx';
import RequestBlood from './pages/RequestBlood.jsx';
import Hospitals from './pages/Hospitals.jsx';
import Requests from './pages/Requests.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><ErrorBoundary><BrowserRouter><AuthProvider><Routes><Route element={<Layout />}><Route index element={<Home />} /><Route path="login" element={<Login />} /><Route path="signup" element={<Signup />} /><Route element={<Protected />}><Route path="dashboard" element={<Dashboard />} /></Route><Route element={<Protected roles={['donor']} />}><Route path="donate" element={<Donate />} /></Route><Route element={<Protected roles={['recipient']} />}><Route path="request-blood" element={<RequestBlood />} /></Route><Route element={<Protected roles={['admin']} />}><Route path="manage-hospitals" element={<Hospitals />} /><Route path="manage-requests" element={<Requests />} /></Route><Route path="*" element={<Home />} /></Route></Routes></AuthProvider></BrowserRouter></ErrorBoundary></React.StrictMode>);
