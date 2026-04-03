import React, { useState, useEffect, useCallback } from 'react';

const API_ROOT = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_ADMIN = `${API_ROOT}/admin`;

export default function LocationsView({ token }) {
  const [locations, setLocations] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const authHeader = { 'Authorization': `Bearer ${token}` };

  const fetchLocations = useCallback(() => {
    fetch(`${API_ADMIN}/locations`, { headers: authHeader })
      .then(res => res.json())
      .then(data => setLocations(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, [token]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleAdd = (e) => {
    e.preventDefault();
    const payload = {
      name: e.target.lname.value,
      latitude: e.target.lat.value,
      longitude: e.target.lng.value,
      radius: 100
    };

    fetch(`${API_ADMIN}/locations`, {
      method: 'POST',
      headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(() => {
      setShowAddModal(false);
      fetchLocations();
    })
    .catch(() => alert("Failed to add location. Check coordinates."));
  };

  const handleDelete = (id) => {
    if (!window.confirm("ARE YOU SURE? This will de-authorize this office zone immediately.")) return;
    fetch(`${API_ADMIN}/locations/${id}`, { method: 'DELETE', headers: authHeader })
      .then(() => fetchLocations())
      .catch(() => alert("Decommissioning failed."));
  };

  return (
    <div className="glass-panel flex-1">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem'}}>
        <h3>Authorized Company Locations</h3>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>+ Provision Zone</button>
      </div>

      <p style={{color:'gray', fontSize:'12px', marginBottom:'2rem'}}>Identity verification is enforced within a fixed 100m radial zone. Overlapping zones are permitted.</p>

      <table>
        <thead>
          <tr>
            <th>Zone Name</th>
            <th>Latitude</th>
            <th>Longitude</th>
            <th>Radius (m)</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {locations.map(loc => (
            <tr key={loc._id}>
              <td style={{fontWeight:'bold'}}>{loc.name}</td>
              <td style={{fontFamily:'monospace'}}>{loc.latitude}</td>
              <td style={{fontFamily:'monospace'}}>{loc.longitude}</td>
              <td>{loc.radius}m</td>
              <td><span style={{color:'lime', fontSize:'10px'}}>● ACTIVE</span></td>
              <td>
                <button 
                  onClick={() => handleDelete(loc._id)} 
                  style={{background:'transparent', color:'var(--danger-color)', border:'1px solid #441111', padding:'4px 8px', borderRadius:'4px', fontSize:'10px'}}
                >
                  PURGE
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setShowAddModal(false)}>X</button>
            <h3 className="mb-4">Provision New Office Zone</h3>
            <form onSubmit={handleAdd}>
              <label style={{fontSize:'10px', color:'var(--primary-color)'}}>ZONE DESIGNATION</label>
              <input name="lname" placeholder="e.g. Headquarters / Branch X" required />
              
              <div style={{display:'flex', gap:'1rem'}}>
                <div style={{flex:1}}>
                  <label style={{fontSize:'10px', color:'var(--primary-color)'}}>LATITUDE</label>
                  <input name="lat" type="number" step="any" placeholder="18.xxxx" required />
                </div>
                <div style={{flex:1}}>
                  <label style={{fontSize:'10px', color:'var(--primary-color)'}}>LONGITUDE</label>
                  <input name="lng" type="number" step="any" placeholder="73.xxxx" required />
                </div>
              </div>

              <div style={{background:'rgba(255,255,255,0.05)', padding:'1rem', borderRadius:'8px', marginTop:'1rem'}}>
                <span style={{fontSize:'10px', color:'gray', display:'block', marginBottom:'4px'}}>SECURITY PROTOCOL</span>
                <span style={{fontSize:'13px', color:'lime', fontWeight:'bold'}}>FIXED 100M SCAN RADIUS ENFORCED</span>
              </div>
              
              <button className="btn-primary mt-6" type="submit">ACTIVATE ZONE</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
