import React, { useState, useEffect } from 'react';
import DashboardView from './components/DashboardView';
import DepartmentsView from './components/DepartmentsView';
import ReportsView from './components/ReportsView';
import HolidaysView from './components/HolidaysView';
import LocationsView from './components/LocationsView';
import PrivacyPolicyView from './components/PrivacyPolicyView';
import SignupCompany from './components/SignupCompany';
import SuperAdminConsole from './components/SuperAdminConsole';

const API_ROOT = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function App() {
  if (window.location.pathname === '/privacy-policy') {
    return <PrivacyPolicyView />;
  }
  const [token, setToken] = useState(localStorage.getItem('adminToken'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('adminUser') || 'null'));
  const [view, setView] = useState(localStorage.getItem('adminView') || 'dashboard');
  const [isSigningUp, setIsSigningUp] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    fetch(`${API_ROOT}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    .then(res => res.json())
    .then(data => {
      if (data.token) {
        if (data.user.role !== 'admin' && data.user.role !== 'superadmin') {
          alert("Access Denied: You do not have Executive Clearance.");
          return;
        }
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        if (data.user.role === 'superadmin') {
            setView('super-metrics');
            localStorage.setItem('adminView', 'super-metrics');
        }
      } else {
        alert(data.error || "Uplink Failed. Check credentials.");
      }
    })
    .catch(() => alert("Network Failure: Server is unreachable."));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminView');
    setIsSigningUp(false);
  };

  if (!token) {
    return (
      <div className="app-container" style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh'}}>
        {isSigningUp ? (
           <SignupCompany onBack={() => setIsSigningUp(false)} />
        ) : (
          <div className="glass-panel" style={{width:'400px', textAlign:'center'}}>
            <div className="brand mb-8">Twishh<span className="brand-accent">Sync</span></div>
            <h3 className="mb-6">ADMINISTRATOR UPLINK</h3>
            <form onSubmit={handleLogin} style={{textAlign:'left'}}>
              <label className="label-proto">IDENTITY EMAIL</label>
              <input name="email" type="email" placeholder="admin@workspace.com" required style={{marginBottom:'1.5rem'}} />
              <label className="label-proto">SECURITY KEY</label>
              <input name="password" type="password" placeholder="••••••••" required style={{marginBottom:'2rem'}} />
              <button className="btn-primary" type="submit" style={{width:'100%'}}>ESTABLISH LINK</button>
            </form>
            <div className="mt-8" style={{borderTop:'1px solid #333', paddingTop:'1.5rem'}}>
              <p style={{fontSize:'12px', color:'var(--accent-color)', cursor:'pointer', fontWeight:'bold'}} onClick={() => setIsSigningUp(true)}>
                CREATE NEW WORKSPACE →
              </p>
            </div>
            <p style={{fontSize:'10px', color:'gray', marginTop:'2rem', letterSpacing:'3px'}}>v2.0 // MULTI-TENANT ENGINE ACTIVE</p>
          </div>
        )}
      </div>
    );
  }

  if (user?.subscriptionStatus === 'EXPIRED' && user?.role !== 'superadmin') {
     return (
        <div className="app-container" style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', padding:'2rem', border:'1px solid var(--danger-color)'}}>
            <div className="glass-panel" style={{maxWidth:'600px', textAlign:'center', borderLeft:'4px solid var(--danger-color)'}}>
                <h1 style={{color:'var(--danger-color)', fontSize:'2.5rem', marginBottom:'1.5rem', letterSpacing:'4px'}}>ACCESS RESTRICTED</h1>
                <p style={{fontSize:'1.1rem', lineHeight:'1.7', marginBottom:'2.5rem', color:'var(--text-secondary)'}}>
                    The subscription for <strong>{user?.companyName}</strong> has expired. To restore organizational protocols, please uplink with our deployment team.
                </p>
                <div style={{background:'rgba(239, 68, 68, 0.05)', padding:'2rem', borderRadius:'12px', border:'1px solid rgba(239, 68, 68, 0.2)', marginBottom:'2.5rem'}}>
                    <p style={{marginBottom:'0.75rem', fontSize:'11px', letterSpacing:'2px', color:'gray', fontWeight:'bold'}}>SUPPORT UPLINK</p>
                    <a href="mailto:twishhworkspace@gmail.com" style={{color:'var(--danger-color)', fontSize:'1.4rem', textDecoration:'none', fontWeight:'bold', display:'block'}}>
                        twishhworkspace@gmail.com
                    </a>
                </div>
                <button className="btn-primary" onClick={logout} style={{background:'var(--danger-color)', border:'none'}}>SWITCH IDENTITY</button>
            </div>
        </div>
     );
  }

  const handleTabChange = (newView) => {
    setView(newView);
    localStorage.setItem('adminView', newView);
  };

  const isSuper = user?.role === 'superadmin';

  return (
    <div className="app-container">
      <div className="topbar">
        <div className="brand-group" style={{display:'flex', alignItems:'center', gap:'1rem'}}>
            <div className="brand">Twishh<span className="brand-accent">Sync</span></div>
            {user?.companyName && !isSuper && (
                <div style={{display:'flex', alignItems:'center', gap:'0.75rem', paddingLeft:'1rem', borderLeft:'1px solid var(--border-subtle)'}}>
                    {user.companyLogo && (
                        <div className="company-logo-frame">
                            <img src={user.companyLogo} style={{height:'100%', borderRadius:'2px'}} alt="Logo" />
                        </div>
                    )}
                    <span style={{fontSize:'12px', fontWeight:'800', letterSpacing:'2px', color:'var(--primary-color)'}}>{user.companyName.toUpperCase()}</span>
                </div>
            )}
        </div>
        
        <div className="nav-tabs">
          {!isSuper ? (
            <>
                <button className={`nav-item ${view === 'dashboard' ? 'active' : ''}`} onClick={() => handleTabChange('dashboard')}>Active Dashboard</button>
                <button className={`nav-item ${view === 'departments' ? 'active' : ''}`} onClick={() => handleTabChange('departments')}>Departments</button>
                <button className={`nav-item ${view === 'reports' ? 'active' : ''}`} onClick={() => handleTabChange('reports')}>Full Reports</button>
                <button className={`nav-item ${view === 'holidays' ? 'active' : ''}`} onClick={() => handleTabChange('holidays')}>Company Holidays</button>
                <button className={`nav-item ${view === 'locations' ? 'active' : ''}`} onClick={() => handleTabChange('locations')}>Authorized Zones</button>
            </>
          ) : (
            <>
                <button className={`nav-item ${view === 'super-metrics' ? 'active' : ''}`} onClick={() => handleTabChange('super-metrics')}>Master Metrics</button>
                <button className={`nav-item ${view === 'super-companies' ? 'active' : ''}`} onClick={() => handleTabChange('super-companies')}>Client Directory</button>
                <button className={`nav-item ${view === 'super-audit' ? 'active' : ''}`} onClick={() => handleTabChange('super-audit')}>System Logs</button>
            </>
          )}
        </div>
        <button className="btn-primary" onClick={logout} style={{background:'#333', fontSize:'10px', padding:'0.5rem 1rem'}}>TERMINATE SESSION</button>
      </div>
      
      <div className="main-content">
        {!isSuper ? (
            <>
                {view === 'dashboard' && <DashboardView token={token} user={user} />}
                {view === 'departments' && <DepartmentsView token={token} />}
                {view === 'reports' && <ReportsView token={token} />}
                {view === 'holidays' && <HolidaysView token={token} />}
                {view === 'locations' && <LocationsView token={token} />}
            </>
        ) : (
            <SuperAdminConsole token={token} view={view} setView={handleTabChange} />
        )}
      </div>
    </div>
  );
}
