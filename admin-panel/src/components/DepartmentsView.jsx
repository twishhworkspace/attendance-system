import React, { useState, useEffect, useCallback } from 'react';

const API_ROOT = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_ADMIN = `${API_ROOT}/admin`;

export default function DepartmentsView({ token }) {
  const [depts, setDepts] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const authHeader = { 'Authorization': `Bearer ${token}` };

  const fetchDepts = useCallback(() => {
    fetch(`${API_ADMIN}/departments`, { headers: authHeader }).then(res=>res.json()).then(setDepts).catch(()=>{});
  }, [token]);

  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  useEffect(() => {
    fetchDepts();
    
    const handleGlobalClick = () => setOpenMenuId(null);
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [fetchDepts]);

  const handleAdd = (e) => {
    e.preventDefault();
    fetch(`${API_ADMIN}/departments`, {
      method: 'POST', headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: e.target.dname.value,
        weeklyOff: e.target.woff.value
      })
    }).then(() => { e.target.reset(); fetchDepts(); });
  };

  const handleEdit = (dept, e) => {
    if (e) e.stopPropagation();
    const newName = prompt("New Sector Designation:", dept.name);
    if (newName === null) return;
    
    const offDayStr = prompt("Weekly Off (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat):", dept.weeklyOff);
    if (offDayStr === null) return;

    fetch(`${API_ADMIN}/departments/${dept._id}`, {
      method: 'PUT', headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, weeklyOff: parseInt(offDayStr) })
    })
      .then(() => { setOpenMenuId(null); fetchDepts(); })
      .catch(err => console.error('Update failed:', err));
  };

  const handleDelete = (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Decommission sector? Identity context for members will be severed.")) return;
    fetch(`${API_ADMIN}/departments/${id}`, { method: 'DELETE', headers: authHeader })
      .then(() => { setOpenMenuId(null); fetchDepts(); })
      .catch(err => console.error('Purge failed:', err));
  };

  return (
    <div className="glass-panel flex-1">
      <h3>Sectors (Departments)</h3>
      <form onSubmit={handleAdd} style={{display:'flex', gap:'1rem', marginBottom:'2rem', flexWrap:'wrap'}}>
        <input name="dname" placeholder="Sector Designation..." required style={{flex:2}} />
        <select name="woff" style={{flex:1, background:'#111', color:'white', border:'1px solid #333', borderRadius:'8px'}}>
          {DAYS.map((d, i) => <option key={i} value={i}>Off Day: {d}</option>)}
        </select>
        <button className="btn-primary" style={{width:'fit-content'}}>Register Sector</button>
      </form>
      <table>
        <thead><tr><th>Sector Name</th><th>Weekly Off</th><th>Intelligence ID</th><th>Actions</th></tr></thead>
        <tbody>
          {depts.map(d => (
            <tr key={d._id}>
              <td style={{fontWeight:'bold'}}>{d.name}</td>
              <td style={{color:'var(--primary-color)', fontSize:'12px'}}>{DAYS[d.weeklyOff]}</td>
              <td style={{fontFamily:'monospace', fontSize:'11px'}}>{String(d._id).padStart(3, '0')}</td>
              <td style={{position:'relative'}} onClick={e => e.stopPropagation()}>
                <button className="action-dots-btn" onClick={() => setOpenMenuId(openMenuId === d._id ? null : d._id)}>⋮</button>
                {openMenuId === d._id && (
                   <div className="tactical-menu">
                      <button onClick={(e) => handleEdit(d, e)}>Edit Sector</button>
                      <button onClick={(e) => handleDelete(d._id, e)} style={{color:'var(--danger-color)'}}>Purge</button>
                   </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
