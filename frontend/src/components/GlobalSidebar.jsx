import { 
    LayoutDashboard, 
    Users, 
    Briefcase, 
    Map, 
    FileText, 
    ShieldCheck, 
    Settings, 
    LogOut,
    MessageSquare,
    Globe,
    Building,
    Radio,
    Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { X } from 'lucide-react';

const GlobalSidebar = ({ user, view, setView, onLogout, isOpen, setIsOpen }) => {
    if (!user) return null;

    const isAdmin = user.role === 'ADMIN' || user.role === 'COMPANY_ADMIN';
    const isSuper = user.role === 'SUPER_ADMIN';

    const menuItems = isSuper ? [
        { id: 'master-dashboard', label: 'Admin Dashboard', icon: Globe },
        { id: 'master-companies', label: 'Manage Companies', icon: Building },
        { id: 'support-hub', label: 'Support Center', icon: MessageSquare },
        { id: 'broadcasts', label: 'Send Alerts', icon: Radio },
        { id: 'audit-logs', label: 'Security Logs', icon: Terminal },
        { id: 'master-profile', label: 'My Profile', icon: ShieldCheck },
    ] : isAdmin ? [
        { id: 'dashboard', label: 'Main Dashboard', icon: LayoutDashboard },
        { id: 'personnel', label: 'Employees', icon: Users },
        { id: 'departments', label: 'Departments', icon: Briefcase },
        { id: 'offices', label: 'Office Locations', icon: Map },
        { id: 'reports', label: 'Attendance Logs', icon: FileText },
        { id: 'spatial-intel', label: 'Live Location Map', icon: Map },
        { id: 'requests', label: 'Pending Approvals', icon: ShieldCheck },
        { id: 'support', label: 'Get Support', icon: MessageSquare },
        { id: 'audit-logs', label: 'Security Logs', icon: Terminal },
        { id: 'settings', label: 'System Settings', icon: Settings },
    ] : [
        { id: 'terminal', label: 'Mark Attendance', icon: ShieldCheck },
        { id: 'settings', label: 'My Profile', icon: Settings },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] lg:hidden"
                    />
                )}
            </AnimatePresence>

            <aside className={`fixed lg:relative top-0 left-0 w-72 bg-slate-950 border-r border-white/5 flex flex-col h-screen z-[101] shadow-2xl shrink-0 transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Branding Sector */}
                <div className="p-8 pb-12 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
                            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-white italic tracking-tighter uppercase">Twishh<span className="text-violet-500 italic">Sync</span></h1>
                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.4em]">Workspace Hub</p>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="lg:hidden p-2 text-slate-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

            {/* Navigation Sector */}
            <div className="flex-1 px-4 space-y-1 overflow-y-auto">
                <p className="px-4 text-[9px] font-black text-slate-700 uppercase tracking-[0.3em] mb-4">Main Menu</p>
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = view === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setView(item.id)}
                            className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group relative ${
                                isActive 
                                ? 'bg-violet-600/10 text-white' 
                                : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'
                            }`}
                        >
                            {isActive && (
                                <motion.div 
                                    layoutId="active-pill"
                                    className="absolute left-0 w-1 h-6 bg-violet-500 rounded-full"
                                />
                            )}
                            <Icon size={18} className={isActive ? 'text-violet-500' : 'group-hover:text-violet-400'} />
                            <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Identity & Session Sector */}
            <div className="p-6 bg-white/5 border-t border-white/5">
                <div className="flex items-center gap-4 p-4 mb-4 rounded-3xl bg-black/40 border border-white/5">
                    <div className="w-10 h-10 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500 font-black italic">
                        {user.name?.charAt(0) || user.role?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-white truncate uppercase italic">{user.name}</p>
                        <p className="text-[8px] font-bold text-slate-600 truncate uppercase mt-0.5">{user.role?.replace('_', ' ')}</p>
                    </div>
                </div>
                <button 
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/10 hover:bg-rose-500 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest"
                >
                    <LogOut size={16} />
                    Terminate Session
                </button>
            </div>
            </aside>
        </>
    );
};

export default GlobalSidebar;
