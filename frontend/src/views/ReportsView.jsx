import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
    History, 
    FileSpreadsheet, 
    TrendingUp, 
    Calendar, 
    Clock, 
    Zap,
    Search,
    Filter
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Skeleton from '../components/Skeleton';

const ReportsView = ({ selectedUser, setSelectedUser, range, setRange, customDates, setCustomDates, globalSearch }) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'COMPANY_ADMIN';
    const [logs, setLogs] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [offices, setOffices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [mode, setMode] = useState('detailed');

    const getDist = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3; // meters
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;
        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    const resolveLoc = (l, offList) => {
        if (!l.checkInLocation || !offList.length) return l.checkInIp || 'OFFICE';
        const [lat, lng] = l.checkInLocation.split(',').map(Number);
        for (const o of offList) {
            const [oLat, oLng] = o.location.split(',').map(Number);
            if (getDist(lat, lng, oLat, oLng) <= (o.radius || 100)) return o.name;
        }
        return 'FIELD / OUTSIDE';
    };

    const fetchL = useCallback(async () => { 
        if (!isAdmin) return;
        setRefreshing(true);
        try { 
            const params = { range };
            if (range === 'custom' && customDates.start && customDates.end) {
                params.start = customDates.start;
                params.end = customDates.end;
            }
            if (selectedUser) params.userId = selectedUser;
            const r = await axios.get('admin/logs', { params }); 
            setLogs(r.data); 
        } catch (err) {
            console.error('Reporting Fetch Failure:', err);
            showToast("Strategic Data Feed Interrupted", "error");
        } finally { setLoading(false); setRefreshing(false); } 
    }, [range, customDates, selectedUser, isAdmin, showToast]);

    useEffect(() => {
        if (!isAdmin) return;
        const fetchE = async () => {
            try {
                const [eRes, oRes] = await Promise.all([
                    axios.get('admin/employees'),
                    axios.get('admin/offices')
                ]);
                setEmployees(eRes.data);
                setOffices(oRes.data);
            } catch (err) { 
                console.error('Reporting Metadata Failure:', err); 
                showToast("Metadata Handshake Failed", "warning");
            }
        };
        fetchE();
    }, [isAdmin]);

    useEffect(() => { 
        if (isAdmin) fetchL(); 
    }, [fetchL, isAdmin]);

    const stats = useMemo(() => {
        if (!logs.length) return null;
        const present = logs.filter(l => l.status === 'PRESENT').length;
        const punctuality = Math.round((present / logs.length) * 100);
        
        const totalHours = logs.reduce((acc, l) => {
            if (l.checkIn && l.checkOut) {
                return acc + (new Date(l.checkOut) - new Date(l.checkIn)) / 3600000;
            }
            return acc;
        }, 0);

        const checkInTimes = logs.filter(l => l.checkIn).map(l => new Date(l.checkIn).getHours() * 60 + new Date(l.checkIn).getMinutes());
        const avgCheckIn = checkInTimes.length ? Math.round(checkInTimes.reduce((a,b)=>a+b, 0) / checkInTimes.length) : 0;
        const avgCheckInStr = `${Math.floor(avgCheckIn/60)}:${(avgCheckIn%60).toString().padStart(2, '0')}`;

        return { punctuality, totalDays: logs.length, totalHours: totalHours.toFixed(1), avgCheckIn: avgCheckInStr };
    }, [logs]);

    const filtered = useMemo(() => {
        let base = logs;
        if (mode === 'absent') base = logs.filter(l => l.status === 'ABSENT');
        
        if (globalSearch) {
            base = base.filter(l => 
                l.user?.name?.toLowerCase().includes(globalSearch.toLowerCase()) ||
                l.user?.email?.toLowerCase().includes(globalSearch.toLowerCase())
            );
        }
        return base;
    }, [logs, mode, globalSearch]);

    return (
        <div className="flex-1 space-y-8 animate-in fade-in duration-500">
            {(loading || (selectedUser && stats)) && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        { icon: TrendingUp, color: 'violet', label: 'Punctuality', val: stats?.punctuality + '%' },
                        { icon: Calendar, color: 'emerald', label: 'Attendance', val: stats?.totalDays + ' Days' },
                        { icon: Clock, color: 'amber', label: 'Avg Start', val: stats?.avgCheckIn },
                        { icon: Zap, color: 'rose', label: 'Total Hours', val: stats?.totalHours }
                    ].map((s, idx) => (
                        <div key={idx} className={`glass-panel p-6 border-${s.color}-500/10`}>
                            {loading ? (
                                <>
                                    <div className="flex justify-between mb-4"><Skeleton variant="circle" width={18} height={18} /><Skeleton width={60} height={10} /></div>
                                    <Skeleton width="40%" height={24} />
                                </>
                            ) : (
                                <>
                                    <div className="flex justify-between items-start mb-2">
                                        <s.icon className={`text-${s.color}-500`} size={18} />
                                        <span className={`text-[10px] font-black text-${s.color}-500 uppercase tracking-widest`}>{s.label}</span>
                                    </div>
                                    <h4 className="text-2xl font-black italic text-white">{s.val}</h4>
                                    {idx === 0 && (
                                        <div className="w-full bg-white/5 h-1 mt-4 rounded-full overflow-hidden">
                                            <div className="bg-violet-500 h-full transition-all duration-1000" style={{width: `${stats.punctuality}%`}}></div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <div className="glass-panel flex-1">
                <div className="flex flex-col gap-6 mb-8 p-4">
                    <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                            <button className={`nav-item ${mode==='detailed'?'active':''}`} onClick={()=>setMode('detailed')}>Detailed Report</button>
                            <button className={`nav-item ${mode==='absent'?'active':''}`} onClick={()=>setMode('absent')}>Exception Log</button>
                        </div>
                        <div className="flex gap-4 items-center">
                            <select 
                                value={selectedUser} 
                                onChange={(e) => setSelectedUser(e.target.value)}
                                className="bg-black/40 border border-white/5 p-2 rounded-lg text-white text-[10px] uppercase font-black outline-none min-w-[140px]"
                            >
                                <option value="">All Employees</option>
                                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                            <button className="nav-item opacity-40 hover:opacity-100 transition-opacity" onClick={fetchL}>
                                <History size={14} className={refreshing ? 'animate-spin text-violet-500' : ''} />
                            </button>
                            <button onClick={()=>{
                                const currentEmployee = employees.find(e => e.id === selectedUser);
                                const fileName = currentEmployee ? `${currentEmployee.name}_${range}_Report.xlsx` : "Attendance_Report.xlsx";
                                
                                const isolationLogs = selectedUser ? logs.filter(l => l.userId === selectedUser) : logs;

                                const ws = XLSX.utils.json_to_sheet(isolationLogs.map(l => {
                                    const workHrs = l.checkIn && l.checkOut ? (new Date(l.checkOut) - new Date(l.checkIn)) / 3600000 : 0;
                                    const variance = workHrs > 0 ? (workHrs - 9).toFixed(2) : '--';
                                    return {
                                        Date: new Date(l.checkIn).toLocaleDateString(),
                                        Name: l.user?.name,
                                        In: new Date(l.checkIn).toLocaleTimeString(),
                                        Out: l.checkOut ? new Date(l.checkOut).toLocaleTimeString() : '---',
                                        Duration: workHrs ? workHrs.toFixed(2) + ' hrs' : '--',
                                        Variance: variance,
                                        Status: l.status,
                                        Location: resolveLoc(l, offices),
                                        Notes: l.isAutoCheckout ? (l.notes ? `${l.notes} (Auto Checked Out)` : 'Auto Checked Out') : (l.notes || '')
                                    }
                                }));
                                const wb = XLSX.utils.book_new();
                                XLSX.utils.book_append_sheet(wb, ws, "Attendance");
                                XLSX.writeFile(wb, fileName);
                            }} className="nav-item opacity-40 hover:opacity-100 transition-opacity"><FileSpreadsheet size={16} /></button>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="flex gap-1 bg-black/40 p-1 rounded-xl">
                            {['all', 'today', 'weekly', 'monthly', 'yearly', 'custom'].map(r => (
                                <button 
                                    key={r} 
                                    onClick={() => setRange(r)}
                                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${range === r ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                                >
                                    {r === 'all' ? 'All Time' : r}
                                </button>
                            ))}
                        </div>

                        {range === 'custom' && (
                            <div className="flex gap-3 animate-in slide-in-from-left-4 duration-300">
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black text-slate-700 uppercase">From</span>
                                    <input 
                                        type="date" 
                                        value={customDates.start}
                                        onChange={(e) => setCustomDates(prev => ({ ...prev, start: e.target.value }))}
                                        autoComplete="off"
                                        className="bg-transparent border-b border-white/10 text-[10px] font-bold text-white outline-none p-1"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black text-slate-700 uppercase">To</span>
                                    <input 
                                        type="date" 
                                        value={customDates.end}
                                        onChange={(e) => setCustomDates(prev => ({ ...prev, end: e.target.value }))}
                                        autoComplete="off"
                                        className="bg-transparent border-b border-white/10 text-[10px] font-bold text-white outline-none p-1"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="table-scroll-shield">
                    <table className="w-full">
                        <thead>
                            {selectedUser ? (
                                <tr><th>Date</th><th>Check-In</th><th>Check-Out</th><th>Duration</th><th>Variance</th><th className="text-right pr-8">Status</th></tr>
                            ) : (
                                <tr><th>Employee</th><th>Date & Time</th><th>Device Info</th><th>Notes</th><th className="text-right pr-8">Status</th></tr>
                            )}
                        </thead>
                        <tbody>
                            {loading ? (
                                Array(10).fill(0).map((_, i) => (
                                    <tr key={i}>
                                        {selectedUser ? (
                                            <>
                                                <td><Skeleton width={100} height={12} /></td>
                                                <td><Skeleton width={60} height={12} /></td>
                                                <td><Skeleton width={60} height={12} /></td>
                                                <td><Skeleton width={40} height={12} /></td>
                                                <td><Skeleton width={40} height={12} /></td>
                                            </>
                                        ) : (
                                            <>
                                                <td><Skeleton width={120} height={12} /></td>
                                                <td><Skeleton width={100} height={12} /></td>
                                                <td><Skeleton width={80} height={12} /></td>
                                                <td><Skeleton width={150} height={12} /></td>
                                            </>
                                        )}
                                        <td className="text-right pr-8"><Skeleton width={60} height={20} className="ml-auto" /></td>
                                    </tr>
                                ))
                            ) : (
                                filtered.map((l, i) => {
                                    const workHrs = l.checkIn && l.checkOut ? (new Date(l.checkOut) - new Date(l.checkIn)) / 3600000 : 0;
                                    const duration = workHrs > 0 ? workHrs.toFixed(1) + ' hrs' : '--';
                                    const varianceValue = workHrs > 0 ? (workHrs - 9).toFixed(2) : null;
                                    const variance = varianceValue ? (parseFloat(varianceValue) >= 0 ? `+${varianceValue}` : varianceValue) : '--';
                                    
                                    return (
                                        <tr key={i}>
                                            {selectedUser ? (
                                                <>
                                                    <td className="font-bold italic text-white uppercase text-[10px] tracking-widest">{new Date(l.checkIn).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                                                    <td><span className="text-white font-bold">{new Date(l.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></td>
                                                    <td>
                                                        <div className="flex flex-col">
                                                            <span className="text-white font-bold">{l.checkOut ? new Date(l.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                                                            {l.isAutoCheckout && <span className="text-[8px] text-amber-500 font-black uppercase mt-1">Auto Checked Out</span>}
                                                        </div>
                                                    </td>
                                                    <td className="text-violet-500 font-black italic text-[10px]">{duration}</td>
                                                    <td className={`font-black text-[10px] ${parseFloat(varianceValue) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                        {variance}
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td><div className="flex flex-col"><span className="font-bold italic uppercase text-white text-xs">{l.user?.name}</span><span className="text-[9px] text-slate-700">{l.user?.email}</span></div></td>
                                                    <td><div className="flex flex-col"><span className="text-white text-[10px] font-mono">{new Date(l.checkIn).toLocaleTimeString()}</span><span className="text-[8px] text-slate-700 uppercase">{new Date(l.checkIn).toLocaleDateString()}</span></div></td>
                                                    <td><span className="text-[10px] font-mono text-slate-500">{resolveLoc(l, offices)}</span></td>
                                                    <td>
                                                        <div className="flex flex-col">
                                                            <p className="text-[11px] text-slate-500 italic truncate max-w-[150px]">{l.notes || '--'}</p>
                                                            {l.isAutoCheckout && <span className="text-[8px] text-amber-500 font-black uppercase mt-1 tracking-widest">Auto Checked Out</span>}
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                            <td className="text-right pr-8"><span className={`status-pill ${l.status==='PRESENT'?'text-emerald-500 bg-emerald-500/10 border-emerald-500/20':l.status==='LATE'?'text-amber-500 bg-amber-500/10 border-amber-500/20':'text-rose-500 bg-rose-500/10 border-rose-500/20'}`}>{l.status || 'ABSENT'}</span></td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReportsView;
