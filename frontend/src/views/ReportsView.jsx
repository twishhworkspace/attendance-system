import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
    History, 
    FileSpreadsheet, 
    FileText,
    RotateCcw
} from 'lucide-react';

// API Services
import { adminService } from '../api/services/adminService';

// Components
import StatsCards from '../components/reports/StatsCards';
import AttendanceTable from '../components/reports/AttendanceTable';
import HolidayRegistryModal from '../components/reports/HolidayRegistryModal';
import EmployeeSelector from '../components/reports/EmployeeSelector';
import ModernSelect from '../components/ModernSelect';

// Utils
import { exportToExcel, exportToPDF } from '../utils/reportExport';

const ReportsView = ({ selectedUser, setSelectedUser, range, setRange, customDates, setCustomDates, globalSearch }) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN';
    
    const [logs, setLogs] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [offices, setOffices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [mode, setMode] = useState('detailed');
    const [holidays, setHolidays] = useState(JSON.parse(localStorage.getItem('company_holidays') || '[]'));
    const [notices, setNotices] = useState([]);
    const [showHolidayModal, setShowHolidayModal] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const months = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
    ];

    const years = useMemo(() => {
        const current = new Date().getFullYear();
        const arr = [];
        for (let i = current; i >= current - 4; i--) arr.push(i);
        return arr;
    }, []);

    const getDist = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3;
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
            } else if (range === 'monthly') {
                const startOfMonth = new Date(selectedYear, selectedMonth, 1);
                const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0);
                params.range = 'custom';
                params.start = startOfMonth.toISOString().split('T')[0];
                params.end = endOfMonth.toISOString().split('T')[0];
            }
            if (selectedUser) params.userId = selectedUser;
            
            const data = await adminService.getLogs(params);
            setLogs(data); 

            const noticesData = await adminService.getNotices();
            setNotices(noticesData.filter(n => n.type === 'HOLIDAY' && n.scheduledDate));
        } catch (err) {
            console.error('Reporting Fetch Failure:', err);
            showToast("Unable to load attendance data", "error");
        } finally { 
            setLoading(false); 
            setRefreshing(false); 
        } 
    }, [range, customDates, selectedUser, isAdmin, showToast, selectedMonth, selectedYear]);

    useEffect(() => {
        if (!isAdmin) return;
        const fetchMetadata = async () => {
            try {
                // Fetch independently to prevent one failure from blocking others
                adminService.getEmployees()
                    .then(data => setEmployees(data))
                    .catch(err => {
                        console.error('Employee Fetch Failure:', err);
                        showToast("Employee List Unavailable", "warning");
                    });
                
                adminService.getOffices()
                    .then(data => setOffices(data))
                    .catch(err => console.error('Office Fetch Failure:', err));
            } catch (err) { 
                console.error('Reporting Metadata Failure:', err); 
                showToast("Connection Error", "warning");
            }
        };
        fetchMetadata();
    }, [isAdmin, showToast]);

    useEffect(() => { 
        if (isAdmin) fetchL(); 
    }, [fetchL, isAdmin]);

    useEffect(() => {
        if (mode === 'absent') {
            setSelectedUser("");
            setRange("today");
        }
    }, [mode, setSelectedUser, setRange]);

    const stats = useMemo(() => {
        if (!logs.length) return null;
        
        // Calculate unique days and unique user-attendance pairs
        const uniqueDaysSet = new Set();
        const userDayPresence = new Set(); // "userId-dateString"
        
        logs.forEach(l => {
            const dateStr = new Date(l.date || l.checkIn).toDateString();
            uniqueDaysSet.add(dateStr);
            if (l.status === 'PRESENT' || l.status === 'LATE') {
                userDayPresence.add(`${l.userId}-${dateStr}`);
            }
        });

        const totalPotentialUserDays = selectedUser ? uniqueDaysSet.size : (employees.length * uniqueDaysSet.size);
        const actualPresentUserDays = userDayPresence.size;
        
        const punctuality = totalPotentialUserDays > 0 ? Math.round((actualPresentUserDays / totalPotentialUserDays) * 100) : 0;
        
        const totalHours = logs.reduce((acc, l) => {
            if (l.checkIn && l.checkOut) {
                return acc + (new Date(l.checkOut) - new Date(l.checkIn)) / 3600000;
            }
            return acc;
        }, 0);

        const checkInTimes = logs.filter(l => l.checkIn).map(l => new Date(l.checkIn).getHours() * 60 + new Date(l.checkIn).getMinutes());
        const avgCheckIn = checkInTimes.length ? Math.round(checkInTimes.reduce((a,b)=>a+b, 0) / checkInTimes.length) : 0;
        const avgCheckInStr = `${Math.floor(avgCheckIn/60)}:${(avgCheckIn%60).toString().padStart(2, '0')}`;

        return { 
            punctuality, 
            totalDays: uniqueDaysSet.size, 
            totalHours: totalHours.toFixed(1), 
            avgCheckIn: avgCheckInStr 
        };
    }, [logs, selectedUser, employees]);

    const filtered = useMemo(() => {
        let base = logs;
        
        if (mode === 'absent') {
            const today = new Date().toDateString();
            const missing = employees.filter(emp => {
                const hasLog = logs.some(l => l.userId === emp.id && new Date(l.date || l.checkIn).toDateString() === today);
                return !hasLog && emp.role !== 'ADMIN';
            });

            return missing.map(emp => ({
                date: new Date(),
                checkIn: null,
                status: 'ABSENT',
                user: emp,
                isVirtual: true,
                notes: 'Not Checked In Today'
            }));
        }

        if (selectedUser) {
            base = logs.filter(l => String(l.userId) === String(selectedUser));
        }
        
        if (globalSearch) {
            base = base.filter(l => 
                l.user?.name?.toLowerCase().includes(globalSearch.toLowerCase()) ||
                l.user?.email?.toLowerCase().includes(globalSearch.toLowerCase())
            );
        }
        return base;
    }, [logs, mode, globalSearch, selectedUser, range, customDates, selectedMonth, selectedYear, employees, holidays, notices]);

    const handleExcelExport = () => {
        exportToExcel({
            selectedUser, employees, logs, range, customDates,
            selectedMonth, selectedYear, holidays, notices,
            resolveLoc, offices, showToast
        });
    };

    const handlePDFExport = () => {
        exportToPDF({
            selectedUser, employees, logs, range, customDates,
            selectedMonth, selectedYear, holidays, notices, showToast
        });
    };

    return (
        <div className="flex-1 space-y-8 animate-in fade-in duration-500">
            <StatsCards loading={loading} stats={stats} />

            <div className="glass-panel flex-1">
                <div className="flex flex-col gap-6 mb-8 p-4">
                    <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                            <button className={`nav-item ${mode==='detailed'?'active':''}`} onClick={()=>setMode('detailed')}>Detailed Report</button>
                            <button className={`nav-item ${mode==='absent'?'active':''}`} onClick={()=>setMode('absent')}>Absence Log</button>
                            <button className="nav-item border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10" onClick={()=>setShowHolidayModal(true)}>Manage Holidays</button>
                        </div>
                        <div className="flex gap-4 items-center">
                            {mode !== 'absent' && (
                                <EmployeeSelector 
                                    employees={employees}
                                    selectedUser={selectedUser}
                                    setSelectedUser={setSelectedUser}
                                />
                            )}
                            <button className="nav-item opacity-40 hover:opacity-100 transition-opacity" onClick={fetchL} title="Refresh Data">
                                <History size={14} className={refreshing ? 'animate-spin text-violet-500' : ''} />
                            </button>
                            
                            <button onClick={handleExcelExport} className="nav-item opacity-40 hover:opacity-100 transition-opacity" title="Export Excel">
                                <FileSpreadsheet size={16} />
                            </button>

                            <button onClick={handlePDFExport} className="nav-item opacity-40 hover:opacity-100 transition-opacity" title="Export PDF">
                                <FileText size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                        {mode !== 'absent' && (
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
                        )}

                        {range === 'custom' && mode !== 'absent' && (
                            <div className="flex gap-3 animate-in slide-in-from-left-4 duration-300">
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black text-slate-700 uppercase">From</span>
                                    <input 
                                        type="date" 
                                        value={customDates.start}
                                        onChange={(e) => setCustomDates(prev => ({ ...prev, start: e.target.value }))}
                                        className="bg-transparent border-b border-white/10 text-[10px] font-bold text-white outline-none p-1"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black text-slate-700 uppercase">To</span>
                                    <input 
                                        type="date" 
                                        value={customDates.end}
                                        onChange={(e) => setCustomDates(prev => ({ ...prev, end: e.target.value }))}
                                        className="bg-transparent border-b border-white/10 text-[10px] font-bold text-white outline-none p-1"
                                    />
                                </div>
                            </div>
                        )}

                        {range === 'monthly' && mode !== 'absent' && (
                            <div className="flex gap-3 animate-in slide-in-from-left-4 duration-300">
                                <ModernSelect 
                                    value={selectedMonth}
                                    onChange={setSelectedMonth}
                                    options={months.map((m, i) => ({ label: m, value: i }))}
                                />
                                <ModernSelect 
                                    value={selectedYear}
                                    onChange={setSelectedYear}
                                    options={years.map(y => ({ label: String(y), value: y }))}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <AttendanceTable 
                    loading={loading} 
                    filtered={filtered} 
                    selectedUser={selectedUser} 
                    resolveLoc={resolveLoc} 
                    offices={offices} 
                />
            </div>

            <HolidayRegistryModal 
                isOpen={showHolidayModal} 
                onClose={() => setShowHolidayModal(false)} 
                holidays={holidays} 
                setHolidays={setHolidays} 
            />
        </div>
    );
};

export default ReportsView;
