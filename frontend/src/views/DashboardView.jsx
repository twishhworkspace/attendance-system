import React, { useEffect, useCallback, useState } from 'react';
import axios from '../api/axios';
import { History, Activity, Monitor, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Skeleton from '../components/Skeleton';

const DashboardView = () => {
    const [stats, setStats] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
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
            showToast("Direct Telemetry Stream Interrupted", "error");
        } finally { 
            setLoading(false); 
            setRefreshing(false); 
        }
    }, []);

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
            // Cubic Bezier control points for a smooth 'sine-wave' feel
            const cp1x = p0.x + 50;
            const cp1y = p0.y;
            const cp2x = p1.x - 50;
            const cp2y = p1.y;
            d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
        }
        return d;
    };

    return (
        <div className="flex-1 flex flex-col gap-8 animate-in fade-in duration-500">
            <div className="flex flex-wrap gap-8">
                {/* Visual Telemetry */}
                <div className="glass-panel flex-1 p-8 h-[400px] flex flex-col">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h3 className="italic font-black text-xl uppercase tracking-tight">Daily Pulse</h3>
                            <div className="flex gap-4 mt-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-violet-600"></div>
                                    <span className="text-[9px] font-black uppercase text-slate-500">Present</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                                    <span className="text-[9px] font-black uppercase text-slate-500">Absent</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4 items-center">
                            <button className="nav-item opacity-40 hover:opacity-100 transition-opacity p-2" onClick={fetchData}>
                                <History size={16} className={refreshing ? 'animate-spin text-violet-500' : ''} />
                            </button>
                            <span className="badge badge-active flex items-center gap-2"><Activity size={10} /> SYNCED</span>
                        </div>
                    </div>
                    
                    <div className="flex-1 relative flex gap-6 mt-4">
                        {/* Y-Axis */}
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
                                            <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f43f5e" stopOpacity="0.1"/><stop offset="100%" stopColor="#f43f5e" stopOpacity="0"/></linearGradient>
                                        </defs>

                                        {/* Present Line */}
                                        <path d={`${getSmoothPath('Present')} L 600 200 L 0 200 Z`} fill="url(#pGrad)" className="transition-all duration-1000" />
                                        <path d={getSmoothPath('Present')} fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(139,92,246,0.5)] transition-all duration-1000" />

                                        {/* Absent Line */}
                                        <path d={`${getSmoothPath('Absent')} L 600 200 L 0 200 Z`} fill="url(#aGrad)" className="transition-all duration-1000" />
                                        <path d={getSmoothPath('Absent')} fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4,4" className="transition-all duration-1000" />

                                        {/* Interaction Points */}
                                        {chartData.map((d, i) => (
                                            <g key={i} className="group/pt">
                                                <circle cx={i * 100} cy={200 - (d.Present / maxVal) * 160} r="4" fill="#8b5cf6" />
                                                <circle cx={i * 100} cy={200 - (d.Absent / maxVal) * 160} r="3" fill="#f43f5e" />
                                                <line x1={i * 100} y1="0" x2={i * 100} y2="200" stroke="white" strokeWidth="1" className="opacity-0 group-hover/pt:opacity-10" />
                                            </g>
                                        ))}
                                    </svg>
                                    
                                    <div className="flex justify-between mt-8">
                                        {chartData.map((d, i) => (
                                            <div key={i} className="flex flex-col items-center">
                                                <span className="text-[9px] font-black text-slate-700 uppercase">{d.name}</span>
                                                <div className="text-[8px] font-black mt-1 opacity-0 group-hover/chart:opacity-100 transition-opacity flex gap-2">
                                                    <span className="text-violet-500">P:{d.Present}</span>
                                                    <span className="text-rose-500">A:{d.Absent}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Allocation */}
                <div className="glass-panel w-full md:w-80 p-8 h-[400px] flex flex-col">
                    <h3 className="italic font-black text-xs uppercase mb-10">Personnel Allocation</h3>
                    <div className="flex-1 flex flex-col justify-center gap-8">
                        {analytics?.pieData?.map((d, i) => (
                            <div key={i} className="space-y-3">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-slate-500">{d.name}</span>
                                    <span className="text-white">{d.value}%</span>
                                </div>
                                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-1000 ${i === 0 ? 'bg-violet-600' : i === 1 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                        style={{ width: `${d.value}%` }} 
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { label: 'Personnel Sync', val: stats?.presentToday || 0, icon: Monitor },
                    { label: 'Network Efficiency', val: `${stats?.attendanceRate || 0}%`, icon: TrendingUp },
                    { label: 'Active Sectors', val: stats?.activeSectors || 0, icon: Activity }
                ].map((s, i) => (
                    <div key={i} className="glass-panel p-8 group hover:border-violet-600/20 transition-all duration-500">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[10px] font-black uppercase text-slate-700 tracking-[0.3em]">{s.label}</p>
                            <s.icon size={14} className="text-violet-500/20 group-hover:text-violet-500 transition-colors" />
                        </div>
                        <h4 className="text-4xl font-black italic text-white">{s.val}</h4>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DashboardView;
