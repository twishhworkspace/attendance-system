import React, { useEffect, useCallback, useState } from 'react';
import axios from '../api/axios';
import { History, Activity, Monitor, TrendingUp, BarChart2, Zap, Calendar, X, Search, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Skeleton from '../components/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';

const DashboardView = () => {
    const [stats, setStats] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [graphType, setGraphType] = useState('pulse'); // 'pulse' or 'bar'
    
    // Drawer States
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerStatus, setDrawerStatus] = useState('');
    const [drawerEmployees, setDrawerEmployees] = useState([]);
    const [drawerLoading, setDrawerLoading] = useState(false);
    const [drawerSearch, setDrawerSearch] = useState('');
    const [hoveredIndex, setHoveredIndex] = useState(null);

    const { user } = useAuth();
    const { showToast } = useToast();
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN';

    const fetchData = useCallback(async () => {
        setRefreshing(true);
        try {
            const [summaryRes, analyticsRes] = await Promise.all([
                axios.get('admin/summary'),
                axios.get('admin/analytics')
            ]);
            setStats(summaryRes.data);
            setAnalytics(analyticsRes.data);
        } catch (err) {
            console.error('Telemetry failure:', err);
            showToast("Real-time Connection Lost", "error");
        } finally { 
            setLoading(false); 
            setRefreshing(false); 
        }
    }, []);

    const fetchStatusEmployees = async (status) => {
        setDrawerLoading(true);
        setDrawerStatus(status);
        setDrawerOpen(true);
        setDrawerSearch('');
        try {
            const res = await axios.get(`admin/status-employees/${status}`);
            setDrawerEmployees(res.data);
        } catch (err) {
            showToast("Failed to fetch personnel data", "error");
            setDrawerOpen(false);
        } finally {
            setDrawerLoading(false);
        }
    };

    useEffect(() => { 
        if (isAdmin) {
            fetchData(); 
            // Live Feed: Refresh telemetry every 30 seconds
            const interval = setInterval(fetchData, 30000);
            return () => clearInterval(interval);
        }
    }, [fetchData, isAdmin]);

    if (!isAdmin) return <div className="p-20 text-center opacity-40">Personnel access only.</div>;

    const chartData = analytics?.chartData || [];
    const maxVal = Math.max(stats?.totalEmployees || 0, 1);

    const getSmoothPath = (field) => {
        if (chartData.length < 2) return "";
        const points = chartData.map((d, i) => ({
            x: i * 100,
            y: 200 - (d[field] / maxVal) * 160
        }));
        
        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i];
            const p1 = points[i+1];
            const cp1x = p0.x + 50;
            const cp1y = p0.y;
            const cp2x = p1.x - 50;
            const cp2y = p1.y;
            d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
        }
        return d;
    };

    const filteredDrawerEmployees = drawerEmployees.filter(e => 
        e.name.toLowerCase().includes(drawerSearch.toLowerCase()) || 
        e.sector.toLowerCase().includes(drawerSearch.toLowerCase())
    );

    return (
        <div className="flex-1 flex flex-col gap-8 animate-in fade-in duration-500">
            <div className="flex flex-wrap gap-8">
                {/* Visual Telemetry - HIDDEN ON MOBILE */}
                <div className="glass-panel hidden md:flex flex-1 p-8 h-[400px] flex-col">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h3 className="italic font-black text-xl uppercase tracking-tight">Daily Pulse</h3>
                            <div className="flex gap-4 mt-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-violet-600"></div>
                                    <span className="text-[9px] font-black uppercase text-slate-500">Present</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                    <span className="text-[9px] font-black uppercase text-slate-500">Leave</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                                    <span className="text-[9px] font-black uppercase text-slate-500">Absent</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4 items-center">
                            <button 
                                className="nav-item opacity-40 hover:opacity-100 transition-opacity p-2 flex items-center gap-2" 
                                onClick={() => setGraphType(graphType === 'pulse' ? 'bar' : 'pulse')}
                                title={graphType === 'pulse' ? "Switch to Bar View" : "Switch to Pulse View"}
                            >
                                {graphType === 'pulse' ? <BarChart2 size={16} /> : <Zap size={16} />}
                            </button>
                            <button className="nav-item opacity-40 hover:opacity-100 transition-opacity p-2" onClick={fetchData}>
                                <History size={16} className={refreshing ? 'animate-spin text-violet-500' : ''} />
                            </button>
                            <span className="badge badge-active flex items-center gap-2"><Activity size={10} /> SYNCED</span>
                        </div>
                    </div>
                    
                    <div className="flex-1 relative flex gap-6 mt-4">
                        <div className="w-8 flex flex-col justify-between text-[9px] font-black text-slate-700 py-2 border-r border-white/5 pr-4 h-[160px]">
                            <span>{maxVal}</span>
                            <span>{Math.round(maxVal / 2)}</span>
                            <span>0</span>
                        </div>

                        <div className="flex-1 relative">
                            {loading ? <Skeleton width="100%" height="100%" /> : (
                                <div className="h-48 w-full relative group/chart">
                                    <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                                        <defs>
                                            <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2"/><stop offset="100%" stopColor="#8b5cf6" stopOpacity="0"/></linearGradient>
                                            <linearGradient id="lGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2"/><stop offset="100%" stopColor="#f59e0b" stopOpacity="0"/></linearGradient>
                                            <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f43f5e" stopOpacity="0.1"/><stop offset="100%" stopColor="#f43f5e" stopOpacity="0"/></linearGradient>
                                            <filter id="outline">
                                                <feMorphology in="SourceAlpha" result="DILATED" operator="dilate" radius="1"/>
                                                <feFlood floodColor="black" floodOpacity="1" result="PINK"/>
                                                <feComposite in="PINK" in2="DILATED" operator="in" result="OUTLINE"/>
                                                <feMerge>
                                                    <feMergeNode in="OUTLINE"/>
                                                    <feMergeNode in="SourceGraphic"/>
                                                </feMerge>
                                            </filter>
                                        </defs>

                                        {graphType === 'pulse' && (
                                            <>
                                                <path d={`${getSmoothPath('Present')} L 600 200 L 0 200 Z`} fill="url(#pGrad)" className="transition-all duration-1000" />
                                                <path d={getSmoothPath('Present')} fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(139,92,246,0.5)] transition-all duration-1000" />
                                                <path d={`${getSmoothPath('Leave')} L 600 200 L 0 200 Z`} fill="url(#lGrad)" className="transition-all duration-1000" />
                                                <path d={getSmoothPath('Leave')} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" className="transition-all duration-1000" />
                                                <path d={`${getSmoothPath('Absent')} L 600 200 L 0 200 Z`} fill="url(#aGrad)" className="transition-all duration-1000" />
                                                <path d={getSmoothPath('Absent')} fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4,4" className="transition-all duration-1000" />
                                                {chartData.map((d, i) => (
                                                    <g key={i} className="group/pt">
                                                        <line x1={i * 100} y1="0" x2={i * 100} y2="200" stroke="white" strokeWidth="1" className="opacity-0 group-hover/chart:opacity-10 transition-opacity" />
                                                        
                                                        <circle cx={i * 100} cy={200 - (d.Present / maxVal) * 160} r="4" fill="#8b5cf6" className="cursor-pointer" />
                                                        <circle cx={i * 100} cy={200 - (d.Leave / maxVal) * 160} r="3" fill="#f59e0b" className="cursor-pointer" />
                                                        <circle cx={i * 100} cy={200 - (d.Absent / maxVal) * 160} r="3" fill="#f43f5e" className="cursor-pointer" />

                                                        {/* Floating Labels - VISIBLE ON CHART HOVER (Optimized Stacked Labels) */}
                                                        <g className="opacity-0 group-hover/chart:opacity-100 transition-opacity duration-500 pointer-events-none" filter="url(#outline)">
                                                            <g transform={`translate(${i * 100 + 12}, 0)`}>
                                                                <text y={200 - (d.Present / maxVal) * 160 - 5} className="text-[11px] font-black fill-violet-400 italic">P:{d.Present}</text>
                                                                <text y={200 - (d.Leave / maxVal) * 160 - 22} className="text-[11px] font-black fill-amber-400 italic">V:{d.Leave}</text>
                                                                <text y={200 - (d.Absent / maxVal) * 160 - 39} className="text-[11px] font-black fill-rose-400 italic">A:{d.Absent}</text>
                                                            </g>
                                                        </g>

                                                        <foreignObject x={i * 100 - 60} y={Math.min(200 - (d.Present / maxVal) * 160 - 100, 50)} width="140" height="90" className="pointer-events-none opacity-0 group-hover/pt:opacity-100 transition-all duration-300 transform group-hover/pt:-translate-y-2 z-50">
                                                            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-3 shadow-2xl flex flex-col gap-1 ring-1 ring-white/10">
                                                                <div className="flex justify-between items-center px-1 border-b border-white/5 pb-2 mb-1">
                                                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{d.name}</span>
                                                                </div>
                                                                <div className="flex flex-col gap-1 px-1">
                                                                    <div className="flex justify-between items-center text-[11px] font-black">
                                                                        <span className="text-violet-500">PRESENT</span>
                                                                        <span className="text-white">{d.Present}</span>
                                                                    </div>
                                                                    <div className="flex justify-between items-center text-[11px] font-black">
                                                                        <span className="text-amber-500">LEAVE</span>
                                                                        <span className="text-white">{d.Leave}</span>
                                                                    </div>
                                                                    <div className="flex justify-between items-center text-[11px] font-black">
                                                                        <span className="text-rose-500">ABSENT</span>
                                                                        <span className="text-white">{d.Absent}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </foreignObject>
                                                    </g>
                                                ))}
                                            </>
                                        )}

                                        {graphType === 'bar' && (
                                            <g>
                                                {chartData.map((d, i) => (
                                                    <g key={i} className="group/pt">
                                                        <rect x={i * 100 - 10} y={200 - (d.Present / maxVal) * 160} width="10" height={(d.Present / maxVal) * 160} fill="#8b5cf6" rx="2" className="transition-all duration-1000" />
                                                        <rect x={i * 100 + 4} y={200 - (d.Absent / maxVal) * 160} width="10" height={(d.Absent / maxVal) * 160} fill="#f43f5e" rx="2" className="transition-all duration-1000 opacity-60" />
                                                        
                                                        {/* Floating Labels for Bar View */}
                                                        <g className="opacity-0 group-hover/chart:opacity-100 transition-opacity duration-500 pointer-events-none" filter="url(#outline)">
                                                            <g transform={`translate(${i * 100 - 20}, ${Math.min(200 - (Math.max(d.Present, d.Absent) / maxVal) * 160, 180)})`}>
                                                                <text y="-5" className="text-[11px] font-black fill-violet-400 italic">P:{d.Present}</text>
                                                                <text y="-22" className="text-[11px] font-black fill-rose-400 italic">A:{d.Absent}</text>
                                                            </g>
                                                        </g>

                                                        {/* Tooltip for Bar View */}
                                                        <foreignObject 
                                                            x={i * 100 - 60} y={Math.min(200 - (d.Present / maxVal) * 160 - 90, 60)} 
                                                            width="140" height="90" 
                                                            className="pointer-events-none opacity-0 group-hover/pt:opacity-100 transition-all duration-300 transform group-hover/pt:-translate-y-2 z-50"
                                                        >
                                                            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-3 shadow-2xl flex flex-col gap-1 ring-1 ring-white/10">
                                                                <div className="flex justify-between items-center px-1 border-b border-white/5 pb-2 mb-1">
                                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{d.name}</span>
                                                                </div>
                                                                <div className="flex flex-col gap-1 px-1">
                                                                    <div className="flex justify-between items-center text-[11px] font-black">
                                                                        <span className="text-violet-500">PRESENT:</span>
                                                                        <span className="text-white">{d.Present}</span>
                                                                    </div>
                                                                    <div className="flex justify-between items-center text-[11px] font-black">
                                                                        <span className="text-rose-500">ABSENT:</span>
                                                                        <span className="text-white">{d.Absent}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </foreignObject>
                                                    </g>
                                                ))}
                                            </g>
                                        )}
                                    </svg>
                                    
                                    <div className="flex justify-between mt-10">
                                        {chartData.map((d, i) => (
                                            <div key={i} className="flex flex-col items-center">
                                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{d.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Allocation - ALWAYS VISIBLE */}
                <div className="glass-panel w-full md:w-80 p-8 min-h-[400px] flex flex-col">
                    <h3 className="italic font-black text-xs uppercase mb-10">Employee Distribution</h3>
                    <div className="flex-1 flex flex-col justify-center gap-8">
                        {analytics?.pieData?.map((d, i) => (
                            <button 
                                key={i} 
                                className="w-full text-left space-y-3 group/bar active:scale-95 transition-transform"
                                onClick={() => fetchStatusEmployees(d.name)}
                            >
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-slate-500 group-hover/bar:text-white transition-colors">{d.name}</span>
                                    <span className="text-white">{d.value}%</span>
                                </div>
                                <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/5">
                                    <div 
                                        className={`h-full transition-all duration-1000 ${d.name === 'Present' ? 'bg-violet-600 shadow-[0_0_10px_rgba(139,92,246,0.3)]' : d.name === 'Leave' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]'}`}
                                        style={{ width: `${d.value}%` }} 
                                    />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[
                    { label: 'Employees Present', val: stats?.presentToday || 0, icon: Monitor, status: 'Present' },
                    { label: 'Employees On Leave', val: stats?.onLeaveToday || 0, icon: Calendar, status: 'Leave' },
                    { label: 'Late Arrivals', val: stats?.lateToday || 0, icon: Zap, status: 'Late' },
                    { label: 'Employees Absent', val: stats?.absentToday || 0, icon: Activity, status: 'Absent' }
                ].map((s, i) => (
                    <button 
                        key={i} 
                        className="glass-panel p-8 group hover:border-violet-600/20 transition-all duration-500 text-left active:scale-95"
                        onClick={() => fetchStatusEmployees(s.status)}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[10px] font-black uppercase text-slate-700 tracking-[0.3em] group-hover:text-slate-400 transition-colors">{s.label}</p>
                            <s.icon size={14} className="text-violet-500/20 group-hover:text-violet-500 transition-colors" />
                        </div>
                        <h4 className="text-4xl font-black italic text-white">{loading ? '...' : s.val}</h4>
                    </button>
                ))}
            </div>

            {/* Personnel Drill-down Drawer */}
            <AnimatePresence>
                {drawerOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDrawerOpen(false)}
                            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1000]"
                        />
                        <motion.div 
                            initial={window.innerWidth < 768 ? { y: '100%' } : { x: '100%' }}
                            animate={window.innerWidth < 768 ? { y: 0 } : { x: 0 }}
                            exit={window.innerWidth < 768 ? { y: '100%' } : { x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 right-0 top-0 md:top-4 md:right-4 md:bottom-4 w-full md:w-[600px] bg-slate-900 border-l md:border border-white/10 rounded-t-[32px] md:rounded-[32px] z-[1001] flex flex-col overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
                        >
                            {/* Handle Bar (Mobile Only) */}
                            <div className="md:hidden w-12 h-1.5 bg-white/10 rounded-full mx-auto my-4 shrink-0" />
                            
                            <div className="p-6 md:p-10 flex flex-col h-full overflow-hidden">
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <h3 className="italic font-black text-2xl uppercase tracking-tight text-white leading-none">
                                            {(drawerStatus || 'Total') + ' Personnel'}
                                        </h3>
                                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] mt-3 flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full animate-pulse ${drawerStatus === 'Present' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                            Real-time Tactical Overview
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setDrawerOpen(false)}
                                        className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="relative mb-8">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input 
                                        type="text" 
                                        placeholder="Search by name or department..."
                                        value={drawerSearch}
                                        onChange={(e) => setDrawerSearch(e.target.value)}
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl py-5 pl-14 pr-5 text-sm font-bold text-white focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.07] transition-all placeholder:text-slate-700"
                                    />
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                                    {drawerLoading ? (
                                        Array.from({ length: 6 }).map((_, i) => (
                                            <div key={i} className="flex items-center gap-5 p-5 rounded-2xl border border-white/5 bg-white/[0.01]">
                                                <Skeleton width={48} height={48} rounded="12px" />
                                                <div className="flex-1 space-y-3">
                                                    <Skeleton width="70%" height={14} />
                                                    <Skeleton width="40%" height={10} />
                                                </div>
                                            </div>
                                        ))
                                    ) : filteredDrawerEmployees.length > 0 ? (
                                        filteredDrawerEmployees.map((emp) => (
                                            <div 
                                                key={emp.id} 
                                                className="flex items-center gap-6 p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-violet-500/30 transition-all group cursor-pointer"
                                            >
                                                <div className="w-14 h-14 rounded-2xl bg-violet-600/10 flex items-center justify-center text-violet-500 group-hover:bg-violet-600 group-hover:text-white group-hover:scale-105 transition-all duration-300">
                                                    <User size={24} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-black text-white italic uppercase text-sm mb-1 truncate tracking-tight">{emp.name}</h4>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider">Sector</span>
                                                        <span className="px-2 py-0.5 rounded-lg bg-violet-500/10 text-violet-400 text-[10px] font-black uppercase">{emp.sector}</span>
                                                    </div>
                                                </div>
                                                <div className={`w-3 h-3 rounded-full shrink-0 ${drawerStatus === 'Present' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : drawerStatus === 'Absent' ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]' : 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]'}`} />
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-24 px-10">
                                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <Search size={32} className="text-slate-700" />
                                            </div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-600">No personnel data matches your current search criteria.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DashboardView;
