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
    const [notifications, setNotifications] = useState([]);
    
    const [employees, setEmployees] = useState([]);
    
    const [showHistory, setShowHistory] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showProfileCard, setShowProfileCard] = useState(false);
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                if (user?.role !== 'EMPLOYEE') {
                    const empRes = await axios.get('admin/employees');
                    setEmployees(empRes.data);
                }
                const noticeRes = await axios.get('attendance/notices');
                setNotifications(noticeRes.data);
                setUnreadCount(noticeRes.data.length);
            } catch (err) {
                console.error('System Sync Failed:', err);
            }
        };
        fetchData();
    }, [user]);

    const handleOpenHistory = () => {
        setShowHistory(true);
        setUnreadCount(0);
    };

    const handleProfileClick = () => {
        setShowProfileCard(prev => !prev);
    };

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
        <>
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-4 md:px-8 relative z-[150] bg-slate-950/50 backdrop-blur-md">
            {/* Left: Breadcrumbs & Search */}
            <div className="flex items-center gap-2 md:gap-6">
                <button 
                    onClick={onToggleSidebar}
                    className="lg:hidden p-2 text-slate-500 hover:text-white transition-colors"
                >
                    <Menu size={20} />
                </button>
                <div className="hidden md:flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                    <span className="text-white italic">Twishh<span className="text-violet-500">Sync</span></span>
                    <ChevronRight size={10} />
                    <span className="text-white italic">{viewTitles[view] || 'Terminal'}</span>
                </div>
                
                <div className="hidden md:block h-8 w-[1px] bg-white/5 mx-2" />

                {user?.role !== 'EMPLOYEE' && (
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-hover:text-violet-500 transition-colors" size={14} />
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            value={globalSearch || ''}
                            onChange={(e) => setGlobalSearch(e.target.value)}
                            className="bg-white/5 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-[10px] font-bold text-white outline-none focus:border-violet-500/30 transition-all w-28 md:w-64"
                            autoComplete="off"
                        />
                        
                        <AnimatePresence>
                            {searchResults.length > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-full left-0 mt-2 w-72 bg-slate-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 p-2"
                                >
                                    <div className="px-3 py-2 border-b border-white/5 mb-1">
                                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Matched Employees</span>
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
                                        View All Employees
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

            </div>

            {/* Right: Metrics & Identity */}
            <div className="flex items-center gap-3 md:gap-6">
                {/* Status Indicator */}
                <div className="hidden sm:flex items-center gap-4 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-2">
                        {isOnline ? (
                            <Wifi size={14} className="text-emerald-500 animate-pulse" />
                        ) : (
                            <WifiOff size={14} className="text-rose-500" />
                        )}
                        <span className={`text-[9px] font-black uppercase tracking-tighter ${isOnline ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {isOnline ? 'Connected' : 'Offline Mode'}
                        </span>
                    </div>
                </div>

                {/* Bell Icon Relocated to Right for Better UX */}
                <div className="relative">
                    <button 
                        onClick={handleOpenHistory}
                        className={`p-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 hover:border-violet-500/30 transition-all relative group/bell`}
                    >
                        <Bell size={18} className="group-hover/bell:animate-bounce" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-violet-600 rounded-full text-[8px] font-black flex items-center justify-center text-white border-2 border-slate-950 shadow-[0_0_10px_rgba(139,92,246,0.5)]">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* User Snapshot */}
                <div 
                    onClick={handleProfileClick}
                    className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-all select-none"
                >
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-black text-white leading-none uppercase italic">{user?.name}</p>
                        <p className="text-[8px] font-bold text-slate-600 uppercase mt-1 tracking-tighter">{user?.role?.replace('_', ' ')}</p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-white font-black italic shadow-lg shadow-violet-900/20">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showProfileCard && (
                    <>
                        <div 
                            className="fixed inset-0 z-[190] bg-transparent" 
                            onClick={() => setShowProfileCard(false)} 
                        />
                        
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-4 md:right-8 top-[5rem] w-80 bg-slate-950/95 border border-white/10 rounded-2xl p-6 shadow-2xl z-[200] backdrop-blur-xl animate-in fade-in slide-in-from-top-2"
                        >
                            {/* Profile Header */}
                            <div className="flex flex-col items-center text-center pb-6 border-b border-white/5">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-white font-black italic text-xl shadow-lg shadow-violet-900/30 mb-3">
                                    {user?.name?.charAt(0) || 'U'}
                                </div>
                                <h4 className="text-sm font-black text-white uppercase italic tracking-wide">{user?.name}</h4>
                                <span className="text-[9px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest mt-1">
                                    {user?.role?.replace('_', ' ')}
                                </span>
                            </div>

                            {/* Details Grid */}
                            <div className="py-6 space-y-4 text-left">
                                <div className="space-y-1">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Email Address</span>
                                    <span className="text-xs font-bold text-slate-300">{user?.email || 'N/A'}</span>
                                </div>
                                {user?.mobileNumber && (
                                    <div className="space-y-1">
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Mobile Number</span>
                                        <span className="text-xs font-bold text-slate-300">{user?.mobileNumber}</span>
                                    </div>
                                )}
                                {user?.company?.name && (
                                    <div className="space-y-1">
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Company / Organization</span>
                                        <span className="text-xs font-bold text-slate-300 uppercase italic">{user?.company?.name}</span>
                                    </div>
                                )}
                                {user?.sector?.name && (
                                    <div className="space-y-1">
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Department</span>
                                        <span className="text-xs font-bold text-slate-300 uppercase">{user?.sector?.name}</span>
                                    </div>
                                )}
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={() => setShowProfileCard(false)}
                                className="w-full py-3 bg-white/5 hover:bg-rose-500/10 hover:text-rose-500 border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all text-slate-400"
                            >
                                Close Info
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </header>

        <AnimatePresence>
            {showHistory && (
                <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-xl" onClick={() => setShowHistory(false)}>
                    <motion.div 
                        initial={{ x: '100%', opacity: 0 }} 
                        animate={{ x: 0, opacity: 1 }} 
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        onClick={e => e.stopPropagation()}
                        className="absolute right-0 top-0 h-full w-full max-w-2xl bg-slate-950 border-l border-white/10 shadow-[-20px_0_150px_rgba(0,0,0,1)] flex flex-col"
                    >
                        <div className="p-10 border-b border-white/10 bg-slate-950 sticky top-0 z-10">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="italic font-black uppercase text-xl text-white tracking-tighter flex items-center gap-2">
                                        <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
                                        Communication Hub
                                    </h3>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Notification History</p>
                                </div>
                                <button onClick={() => setShowHistory(false)} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5 text-slate-400 hover:text-white hover:bg-rose-500/20 hover:text-rose-500 transition-all border border-white/5 shadow-inner">
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="py-20 text-center opacity-30">
                                    <Bell size={40} className="mx-auto mb-4 text-slate-700" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">No communications found.</p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {notifications.map(notice => {
                                        const nDate = notice.scheduledDate ? new Date(notice.scheduledDate) : new Date(notice.createdAt);
                                        return (
                                            <div key={notice.id} className="relative pl-6 border-l border-slate-800 group/item">
                                            <div className="absolute left-[-4px] top-0 w-1.5 h-full bg-slate-800/40 rounded-full overflow-hidden">
                                                <div className={`w-full h-1/4 ${notice.type === 'HOLIDAY' ? 'bg-emerald-500' : 'bg-violet-600'} group-hover/item:h-full transition-all duration-700 ease-in-out`} />
                                            </div>
                                            <div className="mb-4 flex justify-between items-center">
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{nDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${notice.type === 'HOLIDAY' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-violet-500/10 text-violet-400 border border-violet-500/20'}`}>
                                                    {notice.type}
                                                </div>
                                            </div>
                                            {(() => {
                                                const lines = notice.title.split('\n');
                                                const hasMultiple = lines.length > 1;
                                                return (
                                                    <div className="space-y-1 mb-4">
                                                        {hasMultiple && (
                                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] leading-none mb-1">
                                                                {lines[0]}
                                                            </p>
                                                        )}
                                                        <h4 className="text-[18px] font-black text-white uppercase italic tracking-tight group-hover/item:text-violet-400 transition-colors leading-[1.1]">
                                                            {hasMultiple ? lines.slice(1).join(' ') : lines[0]}
                                                        </h4>
                                                    </div>
                                                );
                                            })()}
                                            
                                            <div className="bg-white/[0.03] border border-white/5 p-5 rounded-2xl group-hover/item:bg-white/[0.05] group-hover/item:border-white/10 transition-all shadow-inner">
                                                <p className="text-[13px] font-medium text-slate-300 leading-relaxed whitespace-pre-wrap">
                                                    {notice.message}
                                                </p>
                                                
                                                {/* Auto-detect metrics for report-style notices */}
                                                {notice.message.includes('%') && (
                                                    <div className="mt-4 pt-4 border-t border-white/5">
                                                        {notice.message.split('\n').filter(l => l.includes('%')).map((line, idx) => {
                                                            const percent = parseInt(line.match(/\d+/)?.[0] || '0');
                                                            const label = line.split(/\d+/)[0].trim() || 'METRIC';
                                                            return (
                                                                <div key={idx} className="space-y-2">
                                                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                                                                        <span className="text-slate-500">{label}</span>
                                                                        <span className="text-white">{percent}%</span>
                                                                    </div>
                                                                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                                                        <div className="h-full bg-violet-600 transition-all duration-1000 shadow-[0_0_10px_rgba(139,92,246,0.3)]" style={{ width: `${percent}%` }} />
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    </>
    );
};

export default Topbar;
