import React from 'react';
import { 
    LayoutDashboard, 
    Users, 
    Briefcase, 
    MapPin, 
    FileText, 
    ShieldCheck, 
    Settings, 
    Activity,
    Wifi,
    WifiOff,
    Bell,
    ChevronRight,
    Search,
    Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../api/axios';
import { useState, useEffect } from 'react';

const Topbar = ({ user, view, setView, onToggleSidebar, globalSearch, setGlobalSearch }) => {
    const isOnline = navigator.onLine;
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    
    const [employees, setEmployees] = useState([]);
    
    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const [alertRes, empRes] = await Promise.all([
                    axios.get('broadcasts/active'),
                    axios.get('admin/employees')
                ]);
                setNotifications(alertRes.data);
                setEmployees(empRes.data);
            } catch (err) {
                console.error('System Sync Failed:', err);
            }
        };
        fetchAlerts();
    }, []);

    const searchResults = globalSearch.length > 1 ? employees.filter(e => 
        e.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
        e.email.toLowerCase().includes(globalSearch.toLowerCase())
    ).slice(0, 5) : [];

    const viewTitles = {
        'dashboard': 'Main Dashboard',
        'personnel': 'Employee List',
        'departments': 'Departments',
        'offices': 'Office Locations',
        'reports': 'Attendance Records',
        'spatial-intel': 'Live Location Map',
        'requests': 'Pending Approvals',
        'support': 'Get Support',
        'terminal': 'Mark Attendance',
        'settings': 'Account Settings'
    };

    return (
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-4 md:px-8 relative z-20 bg-slate-950/50 backdrop-blur-md">
            {/* Left: Breadcrumbs & Search */}
            <div className="flex items-center gap-4 md:gap-6">
                <button 
                    onClick={onToggleSidebar}
                    className="lg:hidden p-2 text-slate-500 hover:text-white transition-colors"
                >
                    <Menu size={20} />
                </button>
                <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                    <span className="text-white italic">Twishh<span className="text-violet-500">Sync</span></span>
                    <ChevronRight size={10} />
                    <span className="text-white italic">{viewTitles[view] || 'Terminal'}</span>
                </div>
                
                <div className="h-8 w-[1px] bg-white/5 mx-2" />

                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-hover:text-violet-500 transition-colors" size={14} />
                    <input 
                        type="text" 
                        placeholder="Neural Search..." 
                        value={globalSearch || ''}
                        onChange={(e) => setGlobalSearch(e.target.value)}
                        className="bg-white/5 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-[10px] font-bold text-white outline-none focus:border-violet-500/30 transition-all w-32 md:w-64"
                        autoComplete="off"
                    />
                    
                    {/* Instant Results Dropdown */}
                    <AnimatePresence>
                        {searchResults.length > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute top-full left-0 mt-2 w-72 bg-slate-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 p-2"
                            >
                                <div className="px-3 py-2 border-b border-white/5 mb-1">
                                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Matched Personnel</span>
                                </div>
                                {searchResults.map(e => (
                                    <button 
                                        key={e.id}
                                        onClick={() => {
                                            setGlobalSearch(e.name);
                                            setView('personnel');
                                        }}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-all group/res"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center text-violet-500 font-black italic text-[10px]">
                                            {e.name.charAt(0)}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] font-bold text-white group-hover/res:text-violet-400 transition-colors">{e.name}</p>
                                            <p className="text-[8px] text-slate-600 uppercase">{e.email}</p>
                                        </div>
                                    </button>
                                ))}
                                <button 
                                    onClick={() => setView('personnel')}
                                    className="w-full p-2 mt-1 text-[8px] font-black text-violet-500 hover:text-white transition-colors uppercase tracking-tighter text-center"
                                >
                                    View Full Registry
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Right: Metrics & Identity */}
            <div className="flex items-center gap-6">
                {/* Status Indicator */}
                <div className="flex items-center gap-4 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-2">
                        {isOnline ? (
                            <Wifi size={14} className="text-emerald-500 animate-pulse" />
                        ) : (
                            <WifiOff size={14} className="text-rose-500" />
                        )}
                        <span className={`text-[9px] font-black uppercase tracking-tighter ${isOnline ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {isOnline ? 'Link Active' : 'Offline Mode'}
                        </span>
                    </div>
                </div>

                {/* Notifications */}
                <div className="relative">
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className={`p-2.5 rounded-xl border transition-all relative ${showNotifications ? 'bg-violet-600 text-white border-violet-500' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white hover:bg-white/10'}`}
                    >
                        <Bell size={18} />
                        {notifications.length > 0 && (
                            <div className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-slate-950 animate-pulse" />
                        )}
                    </button>

                    <AnimatePresence>
                        {showNotifications && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute top-full right-0 mt-4 w-80 glass-panel border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
                            >
                                <div className="p-4 border-b border-white/5 bg-white/2 flex justify-between items-center">
                                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest italic">System Signals</h4>
                                    <span className="text-[8px] font-black text-slate-600 uppercase">Live Telemetry</span>
                                </div>
                                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                    {notifications.length > 0 ? (
                                        notifications.map((n, i) => (
                                            <div key={n.id} className="p-4 border-b border-white/5 hover:bg-white/2 transition-colors">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${n.type === 'CRITICAL' ? 'bg-rose-500' : n.type === 'WARNING' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                                                    <span className="text-[9px] font-black text-white uppercase italic">{n.type} Alert</span>
                                                </div>
                                                <p className="text-[10px] font-bold text-slate-400 leading-relaxed italic">{n.message}</p>
                                                <div className="mt-2 text-[8px] font-mono text-slate-700 uppercase">{new Date(n.createdAt).toLocaleString()}</div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-10 text-center flex flex-col items-center gap-4">
                                            <ShieldCheck size={32} className="text-slate-800" />
                                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">All perimeters secure. No active disruptions.</p>
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 bg-white/2 border-t border-white/5 text-center">
                                    <button className="text-[9px] font-black text-slate-600 hover:text-white uppercase transition-colors tracking-widest">Close Uplink</button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="h-8 w-[1px] bg-white/5 mx-2" />

                {/* User Snapshot */}
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-black text-white leading-none uppercase italic">{user?.name}</p>
                        <p className="text-[8px] font-bold text-slate-600 uppercase mt-1 tracking-tighter">{user?.role?.replace('_', ' ')}</p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-white font-black italic shadow-lg shadow-violet-900/20">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Topbar;
