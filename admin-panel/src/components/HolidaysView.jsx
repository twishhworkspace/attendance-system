import React, { useState, useEffect, useCallback } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const API_ROOT = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_ADMIN = `${API_ROOT}/admin`;

export default function HolidaysView({ token }) {
  const [holidays, setHolidays] = useState([]);
  const [date, setDate] = useState(new Date());
  const authHeader = { 'Authorization': `Bearer ${token}` };

  const fetchHolidays = useCallback(() => {
    fetch(`${API_ADMIN}/holidays`, { headers: authHeader }).then(res=>res.json()).then(setHolidays).catch(()=>{});
  }, [token]);

  useEffect(() => { fetchHolidays(); }, [fetchHolidays]);

  const markEntry = (type) => {
    const name = prompt(`Designation Name:`);
    if (!name) return;
    fetch(`${API_ADMIN}/holidays`, {
      method: 'POST', headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, name, type })
    }).then(() => fetchHolidays());
  };

  return (
    <div className="glass-panel flex-1" style={{display:'flex', gap:'2rem'}}>
      <div><Calendar onChange={setDate} value={date} className="dark-calendar" /></div>
      <div className="flex-1">
        <h3>Protocol Markers</h3>
        <div style={{display:'flex', gap:'1rem', marginBottom:'1.5rem'}}>
          <button className="btn-primary" onClick={() => markEntry('HOLIDAY')}>Add Holiday</button>
          <button className="btn-primary" onClick={() => markEntry('EVENT')}>Add Event</button>
        </div>
        <table>
          <tbody>
            {holidays.map(h => <tr key={h._id}><td>{new Date(h.date).toLocaleDateString()}</td><td>{h.name}</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
