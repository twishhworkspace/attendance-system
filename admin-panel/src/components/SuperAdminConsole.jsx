import React, { useState, useEffect } from 'react';

const API_ROOT = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function SuperAdminConsole({ token, view }) {
  const [metrics, setMetrics] = useState({ total:0, active:0, trial:0, expired:0 });
  const [companies, setCompanies] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (view === 'super-metrics') fetchMetrics();
    if (view === 'super-companies') fetchCompanies();
    if (view === 'super-audit') fetchLogs();
  }, [view]);

  const fetchMetrics = () => {
    fetch(`${API_ROOT}/super/dashboard`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json()).then(setMetrics);
  };

  const fetchCompanies = () => {
    fetch(`${API_ROOT}/super/companies`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json()).then(setCompanies);
  };

  const fetchLogs = () => {
     fetch(`${API_ROOT}/super/audit-logs`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json()).then(setLogs);
  };

  const handleActivate = async (e) => {
    e.preventDefault();
    const plan = e.target.plan.value;
    const duration = parseInt(e.target.duration.value);
    const note = e.target.note.value;

    const res = await fetch(`${API_ROOT}/super/companies/${selectedCompany.id}/activate`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, durationMonths: duration, adminNote: note })
    });
    if (res.ok) {
        setShowModal(false);
        fetchCompanies();
    } else {
        alert("Activation Protocol Failed.");
    }
  };

  return (
    <div style={{color:'white'}}>
      {view === 'super-metrics' && (
        <div className="metrics-grid" style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'1.5rem'}}>
            <div className="glass-panel" style={{textAlign:'center'}}>
                <h4 style={{color:'gray', fontSize:'12px'}}>TOTAL ORGANIZATIONS</h4>
                <h1 style={{fontSize:'3rem'}}>{metrics.total}</h1>
            </div>
            <div className="glass-panel" style={{textAlign:'center', borderLeft:'4px solid green'}}>
                <h4 style={{color:'gray', fontSize:'12px'}}>ACTIVE SUBSCRIPTIONS</h4>
                <h1 style={{fontSize:'3rem', color:'green'}}>{metrics.active}</h1>
            </div>
            <div className="glass-panel" style={{textAlign:'center', borderLeft:'4px solid orange'}}>
                <h4 style={{color:'gray', fontSize:'12px'}}>STEALTH TRIAL USERS</h4>
                <h1 style={{fontSize:'3rem', color:'orange'}}>{metrics.trial}</h1>
            </div>
            <div className="glass-panel" style={{textAlign:'center', borderLeft:'4px solid red'}}>
                <h4 style={{color:'gray', fontSize:'12px'}}>RESTRICTED (EXPIRED)</h4>
                <h1 style={{fontSize:'3rem', color:'red'}}>{metrics.expired}</h1>
            </div>
        </div>
      )}

      {view === 'super-companies' && (
        <div className="glass-panel">
            <h3 className="mb-6">CLIENT DIRECTORY</h3>
            <table style={{width:'100%', textAlign:'left', borderCollapse:'collapse'}}>
                <thead>
                    <tr style={{borderBottom:'1px solid #333', color:'var(--accent-color)', fontSize:'12px'}}>
                        <th style={{padding:'1rem'}}>NAME / EMAIL</th>
                        <th>STATUS</th>
                        <th>PLAN</th>
                        <th>UNITS/USERS</th>
                        <th>EXPIRY</th>
                        <th>ACTIONS</th>
                    </tr>
                </thead>
                <tbody>
                    {companies.map(c => (
                        <tr key={c.id} style={{borderBottom:'1px solid #222', fontSize:'14px'}}>
                            <td style={{padding:'1rem'}}>
                                <strong>{c.name}</strong><br/>
                                <span style={{fontSize:'12px', color:'gray'}}>{c.email}</span>
                            </td>
                            <td>
                                <span className={`badge badge-${c.subscriptionStatus.toLowerCase()}`}>
                                    {c.subscriptionStatus}
                                </span>
                            </td>
                            <td>{c.plan}</td>
                            <td>{c._count.users} Units</td>
                            <td>{new Date(c.expiryDate).toLocaleDateString()}</td>
                            <td>
                                <button className="btn-primary" style={{fontSize:'10px', padding:'0.4rem 0.8rem'}} onClick={() => { setSelectedCompany(c); setShowModal(true); }}>
                                    ACTIVATE PLAN
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}

      {view === 'super-audit' && (
        <div className="glass-panel">
            <h3 className="mb-6">SYSTEM AUDIT TRAIL</h3>
            <div className="log-list">
                {logs.map(log => (
                    <div key={log.id} style={{padding:'0.75rem', borderBottom:'1px solid #222', fontSize:'13px', display:'flex', gap:'1rem'}}>
                        <span style={{color:'gray', minWidth:'150px'}}>{new Date(log.timestamp).toLocaleString()}</span>
                        <span style={{color:'var(--accent-color)', fontWeight:'bold', minWidth:'150px'}}>{log.action}</span>
                        <span>{log.details}</span>
                        <span style={{marginLeft:'auto', color:'gray'}}>{log.targetCompany?.name || 'SYSTEM'}</span>
                    </div>
                ))}
            </div>
        </div>
      )}

      {showModal && selectedCompany && (
        <div className="modal-overlay" style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.8)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}>
            <div className="glass-panel" style={{width:'450px'}}>
                <h3>ACTIVATE PROTOCOL: {selectedCompany.name}</h3>
                <form onSubmit={handleActivate} style={{marginTop:'1.5rem'}}>
                    <div className="form-group mb-4">
                        <label className="label-proto">SELECT PLAN TIER</label>
                        <select name="plan" required style={{width:'100%', background:'#111', color:'white', padding:'0.75rem', border:'1px solid #333', borderRadius:'4px'}}>
                            <option value="6M">BASIC GATEWAY (6 MONTHS)</option>
                            <option value="1Y">ENTERPRISE CORE (1 YEAR)</option>
                            <option value="2Y">ENTERPRISE PLUS (2 YEARS)</option>
                            <option value="3Y">CORPORATE INFINITY (3 YEARS)</option>
                            <option value="5Y">ULTIMATE DECADE (5 YEARS)</option>
                        </select>
                    </div>
                    <div className="form-group mb-4">
                        <label className="label-proto">DURATION (IN MONTHS)</label>
                        <input name="duration" type="number" defaultValue="12" required />
                    </div>
                    <div className="form-group mb-6">
                        <label className="label-proto">ADMINISTRATIVE NOTES</label>
                        <textarea name="note" placeholder="e.g. Paid via UPI on 2 April" style={{width:'100%', height:'80px', background:'#111', color:'white', padding:'0.75rem', border:'1px solid #333', borderRadius:'4px'}} />
                    </div>
                    <div style={{display:'flex', gap:'1rem'}}>
                        <button className="btn-primary" type="submit" style={{flex:1}}>EXECUTE ACTIVATION</button>
                        <button className="btn-secondary" type="button" onClick={() => setShowModal(false)} style={{flex:1}}>ABORT</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
