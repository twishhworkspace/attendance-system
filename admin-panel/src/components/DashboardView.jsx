import React, { useState, useEffect, useCallback } from 'react';

const API_ROOT = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_ADMIN = `${API_ROOT}/admin`;

export default function DashboardView({ token, user }) {
  const [employees, setEmployees] = useState([]);
  const [depts, setDepts] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [empHistory, setEmpHistory] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const [viewArchived, setViewArchived] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  const authHeader = { 'Authorization': `Bearer ${token}` };

  const fetchEmployees = useCallback(() => {
    const endpoint = viewArchived ? `${API_ADMIN}/employees/archived` : `${API_ADMIN}/employees`;
    fetch(endpoint, { headers: authHeader })
      .then(res => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then(data => setEmployees(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error(err);
        alert("Sector Intelligence Link Interrupted: " + err.message);
      });
  }, [viewArchived, token]);

  useEffect(() => {
    fetchEmployees();
    fetch(`${API_ADMIN}/departments`, { headers: authHeader }).then(res=>res.json()).then(setDepts).catch(()=>{});

    const handleGlobalClick = () => setOpenMenuId(null);
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [fetchEmployees]);

  const viewHistory = (emp) => {
    setSelectedEmp(emp);
    fetch(`${API_ADMIN}/attendance/${emp._id}`, { headers: authHeader })
      .then(res => res.json())
      .then(data => setEmpHistory(data || []));
  };

  const handleNotify = (e) => {
    e.preventDefault();
    fetch(`${API_ADMIN}/notices`, {
      method: 'POST', 
      headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: e.target.notice.value })
    }).then(() => { alert("Notice Sent!"); e.target.reset(); });
  };

  const handleAddEmployee = (e) => {
    e.preventDefault();
    fetch(`${API_ROOT}/auth/register`, {
      method: 'POST', 
      headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: e.target.name.value,
        email: e.target.email.value,
        phoneNumber: e.target.phoneNumber.value,
        password: e.target.password.value,
        departmentId: e.target.departmentId.value
      })
    }).then(() => { setShowAddModal(false); fetchEmployees(); }).catch(() => alert("Registration failed."));
  };

  const handleEditEmployee = (e) => {
    e.preventDefault();
    fetch(`${API_ADMIN}/employees/${editEmp._id}`, {
      method: 'PUT', 
      headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: e.target.name.value,
        email: e.target.email.value,
        phoneNumber: e.target.phoneNumber.value,
        password: e.target.password.value,
        departmentId: e.target.departmentId.value
      })
    }).then(() => { setEditEmp(null); fetchEmployees(); }).catch(() => alert("Update failed."));
  };

  const archiveEmployee = (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Archive identity?")) return;
    fetch(`${API_ADMIN}/employees/${id}`, { method: 'DELETE', headers: authHeader })
      .then(() => { setOpenMenuId(null); fetchEmployees(); })
      .catch(err => console.error('Archive failed:', err));
  };

  const deleteEmployee = (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("PURGE PERMANENTLY?")) return;
    fetch(`${API_ADMIN}/employees/${id}/permanent`, { method: 'DELETE', headers: authHeader })
      .then(() => { setOpenMenuId(null); fetchEmployees(); })
      .catch(err => console.error('Erase failed:', err));
  };

  return (
    <>
      <div className="glass-panel flex-1">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h3>{viewArchived ? 'Graveyard' : 'Active Personnel'}</h3>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>+ Provision</button>
        </div>
        <table>
          <thead><tr><th>Name</th><th>Mail / Phone</th><th>Department</th><th>Active Hardware</th><th>Actions</th></tr></thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp._id} onClick={() => viewHistory(emp)} style={{cursor:'pointer'}}>
                <td>{emp.name}</td>
                <td style={{fontSize:'12px'}}>
                  {emp.email && <div>{emp.email}</div>}
                  {emp.phoneNumber && <div style={{color:'var(--primary-color)'}}>{emp.phoneNumber}</div>}
                </td>
                <td>{emp.department?.name || 'Protocol Offline'}</td>
                <td style={{fontSize:'10px', color: emp.deviceId ? 'lime' : 'gray'}}>
                  {emp.deviceId ? `LOCKED: ${emp.deviceId.substring(0,8)}...` : 'NOT BOUND'}
                </td>
                <td style={{position:'relative'}} onClick={e => e.stopPropagation()}>
                   <button className="action-dots-btn" onClick={() => setOpenMenuId(openMenuId === emp._id ? null : emp._id)}>⋮</button>
                    {openMenuId === emp._id && (
                      <div className="tactical-menu">
                        <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); setEditEmp(emp); }}>Edit</button>
                        <button onClick={(e) => archiveEmployee(emp._id, e)}>Archive</button>
                        <button onClick={(e) => deleteEmployee(emp._id, e)} style={{color:'var(--danger-color)'}}>Erase</button>
                      </div>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="glass-panel w-80">
        <h3>Broadcast</h3>
        <form onSubmit={handleNotify}>
          <input name="notice" placeholder="Message content..." required />
          <button className="btn-primary" type="submit">Broadside Notice</button>
        </form>

        {user?.subscriptionStatus === 'ACTIVE' && (
            <div className="mt-8 pt-8" style={{borderTop:'1px solid #333'}}>
                <h4 style={{fontSize:'11px', color:'var(--accent-color)', letterSpacing:'2px', marginBottom:'1rem'}}>SERVICE LICENSE</h4>
                <div style={{background:'rgba(255,255,255,0.05)', padding:'1rem', borderRadius:'8px', fontSize:'13px'}}>
                    <div className="flex justify-between mb-2">
                        <span style={{color:'gray'}}>Active Plan:</span>
                        <strong style={{color:'white'}}>{user.plan === 'NONE' ? 'TRIAL' : user.plan}</strong>
                    </div>
                    <div className="flex justify-between">
                        <span style={{color:'gray'}}>Valid Until:</span>
                        <strong style={{color:'white'}}>{new Date(user.expiryDate).toLocaleDateString()}</strong>
                    </div>
                </div>
            </div>
        )}
      </div>
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setShowAddModal(false)}>X</button>
            <h3 className="mb-4">Provision Identity</h3>
            <form onSubmit={handleAddEmployee}>
              <input name="name" placeholder="Full Name" required />
              <input name="phoneNumber" placeholder="Mobile Number (Login)" required />
              <input name="email" type="email" placeholder="Email ID (Optional)" />
              <input name="password" type="password" placeholder="Security Key" required />
              <select name="departmentId" required>
                <option value="">-- Sector Link --</option>
                {depts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
              <button className="btn-primary mt-4" type="submit">Complete Provisioning</button>
            </form>
          </div>
        </div>
      )}
      {editEmp && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setEditEmp(null)}>X</button>
            <h3 className="mb-4">Modify Protocol Details</h3>
            <form onSubmit={handleEditEmployee}>
              <input name="name" defaultValue={editEmp.name} placeholder="Full Name" required />
              <input name="phoneNumber" defaultValue={editEmp.phoneNumber} placeholder="Mobile Number (Login)" required />
              <input name="email" type="email" defaultValue={editEmp.email} placeholder="Email ID (Optional)" />
              <input name="password" type="password" placeholder="New Security Key (Optional)" />
              <select name="departmentId" defaultValue={editEmp.departmentId || ""} required>
                <option value="">-- Sector Link --</option>
                {depts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
              <button className="btn-primary mt-4" type="submit">Update Identity</button>
            </form>
          </div>
        </div>
      )}
      {selectedEmp && (
        <div className="modal-overlay">
          <div className="modal-content" style={{width:'800px'}}>
             <button className="close-btn" onClick={() => setSelectedEmp(null)}>X</button>
             <h3>Protocol History: {selectedEmp.name}</h3>
             <table>
               <thead><tr><th>Date</th><th>In</th><th>Out</th><th>Status/Remark</th></tr></thead>
               <tbody>
                 {empHistory.map(h => {
                    const formatTime = (t, reason) => {
                      if (!t) return '-';
                      if (t === 'OFF-SITE') return 'OFF-SITE';
                      if (t === 'AUTO_CHECKOUT' || reason === 'AUTO_CHECKOUT') return 'SYSTEM AUTO';
                      return new Date(t).toLocaleTimeString();
                    };
                    const statusColor = h.status === 'PENDING' ? 'goldenrod' : (h.status === 'APPROVED' ? 'lime' : 'inherit');
                    return (
                      <tr key={h._id}>
                        <td>{new Date(h.date).toLocaleDateString()}</td>
                        <td>{formatTime(h.checkIn, h.reason)}</td>
                        <td>{formatTime(h.checkOut, h.reason)}</td>
                        <td>
                          <div style={{color: statusColor, fontSize: '10px', fontWeight: 'bold'}}>{h.status}</div>
                          <div style={{fontSize: '11px', color: 'gray'}}>{h.reason || '-'}</div>
                        </td>
                      </tr>
                    );
                 })}
               </tbody>
             </table>
          </div>
        </div>
      )}
    </>
  );
}
