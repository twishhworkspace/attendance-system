import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_ROOT = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_ADMIN = `${API_ROOT}/admin`;

export default function ReportsView({ token }) {
  const [mode, setMode] = useState('daily');
  const [data, setData] = useState([]);
  const [depts, setDepts] = useState([]);
  const [deptFilter, setDeptFilter] = useState("");
  const [date1, setDate1] = useState(new Date().toISOString().split('T')[0]);
  const [date2, setDate2] = useState(new Date().toISOString().split('T')[0]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const authHeader = { 'Authorization': `Bearer ${token}` };

  const fetchReports = useCallback(() => {
    let url = `${API_ADMIN}/reports/daily-absent`;
    if (mode === 'detailed') {
      url = `${API_ADMIN}/reports/detailed?from=${date1}&to=${date2}`;
    } else if (mode !== 'daily') {
      url = `${API_ADMIN}/reports/aggregate?type=${mode}`;
      if (mode === 'monthly') url += `&month=${selectedMonth}&year=${selectedYear}`;
      if (mode === 'yearly') url += `&year=${selectedYear}`;
      if (mode === 'range') url += `&from=${date1}&to=${date2}`;
    }

    fetch(url, { headers: authHeader })
      .then(res => res.json())
      .then(d => setData(Array.isArray(d) ? d : []))
      .catch(console.error);
  }, [mode, date1, date2, selectedYear, selectedMonth, token]);

  useEffect(() => {
    fetchReports();
    fetch(`${API_ADMIN}/departments`, { headers: authHeader }).then(res=>res.json()).then(setDepts).catch(()=>{});
  }, [fetchReports]);

  const approveJustification = (id) => {
    fetch(`${API_ADMIN}/attendance/requests/${id}/approve`, {
      method: 'PUT',
      headers: authHeader
    }).then(res => res.json()).then(() => fetchReports());
  };

  const filteredData = deptFilter ? data.filter(r => {
    const userObj = r.user || r;
    return userObj.department?.id === parseInt(deptFilter) || userObj.departmentId === parseInt(deptFilter);
  }) : data;

  const downloadExcel = () => {
    if (!filteredData.length) return alert("Report stack empty.");
    let mapped;
    if (mode === 'detailed') {
      mapped = filteredData.map(r => ({
        Date: new Date(r.date).toLocaleDateString(),
        Name: r.user?.name || '-',
        CheckIn: r.checkIn,
        CheckOut: r.checkOut || '-',
        Status: r.status,
        Remark: r.reason || '-'
      }));
    } else {
      mapped = filteredData.map(r => ({
        Identity: r.name || r._id,
        Email: r.email || '-',
        Sector: r.department?.name || 'Protocol N/A',
        Metric: mode === 'daily' ? 'Absent' : `${r.totalDays} Days / ${r.percentage}%`
      }));
    }
    const ws = XLSX.utils.json_to_sheet(mapped);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance Sheet");
    XLSX.writeFile(wb, `attendance_sheet_${mode}.xlsx`);
  };

  const downloadPDF = () => {
    if (!filteredData.length) return alert("Report stack empty.");
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("WORKSPACE HUB // ATTENDANCE AUDIT", 14, 22);
    doc.setFontSize(10);
    doc.text(`Type: ${mode.toUpperCase()} Audit`, 14, 30);
    
    let head, body;
    if (mode === 'detailed') {
      head = [['Date', 'Name', 'In/Out', 'Status', 'Remark']];
      body = filteredData.map(r => [
        new Date(r.date).toLocaleDateString(),
        r.user?.name || '-',
        `${r.checkIn} / ${r.checkOut || '-'}`,
        r.status,
        r.reason || '-'
      ]);
    } else {
      head = [['Identity', 'Email', 'Sector', 'Metrics']];
      body = filteredData.map(r => [
        r.name || r._id,
        r.email || '-',
        r.department?.name || 'Protocol N/A',
        mode === 'daily' ? 'ABSENT' : `${r.totalDays} Days (${r.percentage}%)`
      ]);
    }

    autoTable(doc, { head, body, startY: 40, theme: 'striped', headStyles: { fillColor: [45, 108, 223] } });
    doc.save(`audit_report_${mode}.pdf`);
  };

  return (
    <div className="glass-panel flex-1">
      <div className="report-header mb-6">
        <div style={{display:'flex', gap:'0.5rem', flexWrap:'wrap'}}>
          <button className={`btn-primary ${mode==='daily'?'active':''}`} onClick={()=>setMode('daily')}>Absentees</button>
          <button className={`btn-primary ${mode==='detailed'?'active':''}`} onClick={()=>setMode('detailed')}>Detailed Logs</button>
          <button className={`btn-primary ${mode==='monthly'?'active':''}`} onClick={()=>setMode('monthly')}>Monthly Summary</button>
          <button className={`btn-primary ${mode==='yearly'?'active':''}`} onClick={()=>setMode('yearly')}>Yearly Summary</button>
          <button className={`btn-primary ${mode==='range'?'active':''}`} onClick={()=>setMode('range')}>Range Summary</button>
        </div>
        <select onChange={(e)=>setDeptFilter(e.target.value)} style={{background:'#111', color:'white', border:'1px solid #333', borderRadius:'8px', padding:'0 1rem'}}>
           <option value="">All Sectors</option>
           {depts.map(d=><option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
      </div>

      <div className="filter-shelf mb-8">
        {(mode === 'monthly') && (
          <div style={{display:'flex', gap:'1rem'}}>
             <select value={selectedMonth} onChange={(e)=>setSelectedMonth(e.target.value)}><option value="1">Jan</option><option value="2">Feb</option><option value="3">Mar</option><option value="4">Apr</option><option value="5">May</option><option value="6">Jun</option><option value="7">Jul</option><option value="8">Aug</option><option value="9">Sep</option><option value="10">Oct</option><option value="11">Nov</option><option value="12">Dec</option></select>
             <input type="number" value={selectedYear} onChange={(e)=>setSelectedYear(e.target.value)} style={{width:'100px'}} />
          </div>
        )}
        {(mode === 'range' || mode === 'detailed') && (
           <div style={{display:'flex', gap:'1rem', alignItems:'center'}}>
              <input type="date" value={date1} onChange={(e)=>setDate1(e.target.value)} />
              <span style={{color:'gray'}}>to</span>
              <input type="date" value={date2} onChange={(e)=>setDate2(e.target.value)} />
           </div>
        )}
      </div>

      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'1rem'}}>
         <h3>{mode.toUpperCase()} Audit Data ({filteredData.length})</h3>
         <div style={{display:'flex', gap:'1rem'}}>
            <button onClick={downloadExcel} className="btn-primary" style={{background:'#1D6F42'}}>EXCEL</button>
            <button onClick={downloadPDF} className="btn-primary" style={{background:'#A32020'}}>PDF</button>
         </div>
      </div>

      <div style={{overflowX:'auto'}}>
      <table>
        {mode === 'detailed' ? (
          <>
            <thead><tr><th>Date</th><th>Employee</th><th>In/Out</th><th>Remark</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {filteredData.map(r => (
                <tr key={r._id}>
                  <td>{new Date(r.date).toLocaleDateString()}</td>
                  <td style={{fontWeight:'bold'}}>{r.user?.name}</td>
                  <td>{r.checkIn}<br/><span style={{fontSize:'10px', color:'gray'}}>{r.checkOut || '-'}</span></td>
                  <td style={{fontSize:'12px', color:'gray'}}>{r.reason || '-'}</td>
                  <td>
                    <span style={{
                      padding:'2px 8px', borderRadius:'4px', fontSize:'10px', fontWeight:'bold',
                      background: r.status === 'PENDING' ? '#443311' : (r.status === 'APPROVED' ? '#113311' : '#222'),
                      color: r.status === 'PENDING' ? 'goldenrod' : (r.status === 'APPROVED' ? 'lime' : 'white')
                    }}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    {r.status === 'PENDING' && (
                      <button onClick={() => approveJustification(r._id)} className="btn-primary" style={{fontSize:'10px', padding:'0.2rem 0.5rem'}}>Approve</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </>
        ) : (
          <>
            <thead><tr><th>Identity</th><th>Email</th><th>Sector</th><th>Metrics</th></tr></thead>
            <tbody>
              {filteredData.map(r => (
                <tr key={r._id}>
                  <td>{r.name || r._id}</td>
                  <td>{r.email || '-'}</td>
                  <td>{r.department?.name || 'Protocol N/A'}</td>
                  <td>
                    {mode === 'daily' ? (
                      <span style={{color:'var(--danger-color)', fontWeight:'bold'}}>[ABSENT]</span>
                    ) : (
                      <div style={{fontSize:'12px'}}>
                        <div style={{fontWeight:'bold', color:'var(--primary-color)'}}>{r.percentage}% Rate</div>
                        <div style={{color:'gray'}}>{r.totalDays} Total Checkins</div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </>
        )}
      </table>
      </div>
    </div>
  );
}
