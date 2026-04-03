import React, { useState, useEffect, useCallback } from 'react';

const API_ROOT = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_ADMIN = `${API_ROOT}/admin`;

export default function RequestsView({ token }) {
  const [requests, setRequests] = useState([]);
  const authHeader = { 'Authorization': `Bearer ${token}` };

  const fetchRequests = useCallback(() => {
    fetch(`${API_ADMIN}/attendance/requests/pending`, { headers: authHeader })
      .then(res => res.json())
      .then(data => setRequests(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, [token]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleDecision = (id, action) => {
    fetch(`${API_ADMIN}/attendance/requests/${id}/${action}`, {
      method: 'PUT',
      headers: authHeader
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        fetchRequests();
      } else {
        alert(data.error || "Decision uplink failed.");
      }
    })
    .catch(() => alert("Network Error: Could not reach sector control."));
  };

  return (
    <div className="glass-panel flex-1">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem'}}>
        <h3>Pending Remote Entry Requests</h3>
        <button className="btn-primary" onClick={fetchRequests} style={{width:'fit-content', fontSize:'10px'}}>REFRESH SCAN</button>
      </div>
      <table style={{width:'100%'}}>
        <thead>
          <tr>
            <th>Identity</th>
            <th>Sector</th>
            <th>Timestamp</th>
            <th>Location Data</th>
            <th>Reason / Justification</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.length === 0 ? (
            <tr><td colSpan="6" style={{textAlign:'center', color:'gray', padding:'3rem'}}>NO PENDING REQUESTS IN BUFFER</td></tr>
          ) : (
            requests.map(req => (
              <tr key={req._id}>
                <td>
                  <div style={{fontWeight:'bold'}}>{req.user?.name}</div>
                  <div style={{fontSize:'10px', color:'gray'}}>{req.user?.email}</div>
                </td>
                <td>{req.user?.department?.name || 'GENERIC'}</td>
                <td>{new Date(req.checkIn).toLocaleString()}</td>
                <td style={{fontFamily:'monospace', fontSize:'11px'}}>{req.location}</td>
                <td style={{maxWidth:'300px', fontSize:'12px', color:'var(--primary-color)', whiteSpace:'normal', wordBreak:'break-word'}}>{req.reason}</td>
                <td>
                  <div style={{display:'flex', gap:'0.5rem'}}>
                    <button className="btn-primary" onClick={() => handleDecision(req._id, 'approve')} style={{padding:'4px 12px', fontSize:'10px', background:'green'}}>APPROVE</button>
                    <button className="btn-primary" onClick={() => handleDecision(req._id, 'reject')} style={{padding:'4px 12px', fontSize:'10px', background:'var(--danger-color)'}}>REJECT</button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
