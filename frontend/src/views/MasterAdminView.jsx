import React, { useState, useEffect } from 'react'; // Strategic Handshake Active
import axios from '../api/axios';
import { 
    Globe, 
    Building, 
    Users, 
    Activity, 
    ShieldAlert, 
    MessageSquare, 
    Radio, 
    Lock,
    Loader2,
    Trash2,
    Edit3,
    AlertTriangle,
    ShieldCheck,
    X
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const MasterAdminView = ({ currentView, setGlobalView }) => {
    const [stats, setStats] = useState(null);
    const [companies, setCompanies] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [broadcasts, setBroadcasts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Management State
    const [editingCompany, setEditingCompany] = useState(null);
    const [deletingCompany, setDeletingCompany] = useState(null);
    const [broadcastForm, setBroadcastForm] = useState({ type: 'INFO', message: '' });
    const [isSaving, setIsSaving] = useState(false);

    // Impersonation & Override State
    const [overrideCompany, setOverrideCompany] = useState(null);
    const [newPass, setNewPass] = useState('');
    const [showAudit, setShowAudit] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [replyText, setReplyText] = useState('');

    const { showToast } = useToast();
    const { user, setSession } = useAuth();
    
    const [profileForm, setProfileForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
        password: ''
    });

    // Map internal views to global route keys
    const viewMap = {
        'master-dashboard': 'dashboard',
        'master-companies': 'companies',
        'support-hub': 'tickets',
        'broadcasts': 'broadcasts',
        'master-alerts': 'alerts',
        'master-profile': 'profile'
    };

    const activeView = viewMap[currentView] || 'dashboard';

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, compRes, ticketRes, broadcastRes] = await Promise.all([
                axios.get('super-admin/stats'),
                axios.get('super-admin/companies'),
                axios.get('super-admin/tickets'),
                axios.get('super-admin/broadcasts')
            ]);
            setStats(statsRes.data);
            setCompanies(compRes.data);
            setTickets(ticketRes.data);
            setBroadcasts(broadcastRes.data);
        } catch (err) {
            console.error('Master control sync failure:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentView]);

    const handleToggleStatus = async (id) => {
        try {
            await axios.post(`super-admin/companies/${id}/toggle`);
            showToast("Node Authorization Modified", "success");
            fetchData();
        } catch (err) {
            showToast("Node Authorization Toggle Failed", "error");
        }
    };

    const handleDelete = async (id) => {
        try {
            setIsSaving(true);
            await axios.delete(`super-admin/companies/${id}`);
            showToast("Cluster Terminated Permanently", "success");
            setDeletingCompany(null);
            fetchData();
        } catch (err) {
            showToast("Termination Sequence Failed", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            setIsSaving(true);
            await axios.put(`super-admin/companies/${editingCompany.id}`, {
                name: editingCompany.name
            });
            showToast("Registry Entry Synchronized", "success");
            setEditingCompany(null);
            fetchData();
        } catch (err) {
            showToast("Synchronization Failure", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateBroadcast = async (e) => {
        e.preventDefault();
        try {
            setIsSaving(true);
            await axios.post('super-admin/broadcasts', broadcastForm);
            showToast("Global Signal Deployed", "success");
            setBroadcastForm({ type: 'INFO', message: '' });
            fetchData();
        } catch (err) {
            showToast("Signal Interrupted", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleBroadcast = async (id) => {
        try {
            await axios.post(`super-admin/broadcasts/${id}/toggle`);
            fetchData();
        } catch (err) {
            showToast("Broadcast State Toggle Failed", "error");
        }
    };


    const handlePasswordOverride = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await axios.post(`super-admin/companies/${overrideCompany.id}/reset-password`, { newPassword: newPass });
            showToast("Administrative Password Override Successful.", 'success');
            setOverrideCompany(null);
            setNewPass('');
        } catch (err) {
            showToast("Override Failed: Sync Error.", 'error');
        } finally { setIsSaving(false); }
    };



    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;
        setIsSaving(true);
        try {
            await axios.post(`super-admin/tickets/${selectedTicket.id}/reply`, { message: replyText });
            showToast("Strategy Response Deployed", "success");
            setReplyText('');
            // Refresh ticket data locally or refetch
            const r = await axios.get('super-admin/tickets');
            setTickets(r.data);
            const updated = r.data.find(t => t.id === selectedTicket.id);
            setSelectedTicket(updated);
        } catch (err) {
            showToast("Transmission Interrupted", "error");
        } finally { setIsSaving(false); }
    };

    const handleUpdateMasterProfile = async (e) => {
        e.preventDefault();
        try {
            setIsSaving(true);
            const r = await axios.put('auth/profile', {
                name: profileForm.name,
                email: profileForm.email,
                password: profileForm.password || undefined
            });
            setSession(r.data); // Update AuthContext state
            showToast("Master Identity Parameters Synchronized", "success");
            setProfileForm(prev => ({ ...prev, password: '' }));
        } catch (err) {
            showToast("Sync Error: Profile update failed.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-700">
            {/* Master Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="italic font-black text-4xl mb-2 flex items-center gap-4 uppercase tracking-tighter">
                        Master Control Hub
                        <div className="px-2 py-0.5 bg-rose-600 text-[10px] tracking-[0.3em] italic rounded">SUPER_ADMIN_MODE</div>
                    </h2>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Managing Global Workspace Ecosystem</p>
                </div>

                <div className="flex gap-4">
                    <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-xl">
                        {[
                            { id: 'master-dashboard', icon: Globe, label: 'Overview' },
                            { id: 'master-companies', icon: Building, label: 'Clusters' },
                            { id: 'support-hub', icon: MessageSquare, label: 'Tickets' },
                            { id: 'broadcasts', icon: Radio, label: 'Broadcasts' }
                        ].map(item => (
                            <button
                                key={item.id}
                                onClick={() => setGlobalView(item.id)}
                                className={`px-4 py-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg ${currentView === item.id ? 'bg-rose-600 text-white italic' : 'text-slate-500 hover:text-white'}`}
                            >
                                <item.icon size={14} /> {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex gap-4">
                <button 
                    onClick={handleArchival}
                    className="px-6 py-2 bg-amber-500/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-amber-500 hover:bg-amber-500 hover:text-black transition-all"
                >
                    Archival Protocol
                </button>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center min-h-[400px]">
                    <Loader2 className="animate-spin text-rose-500" size={48} />
                </div>
            ) : (
                <div className="flex-1 space-y-8">
                    {activeView === 'dashboard' && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <StatCard icon={Building} label="Total Companies" val={stats?.companies} color="rose" />
                                <StatCard icon={Users} label="Total Personnel" val={stats?.users} color="indigo" />
                                <StatCard icon={Activity} label="Active Sessions" val={stats?.activeSessions} color="emerald" />
                                <StatCard icon={ShieldAlert} label="System Alerts" val={stats?.systemAlerts || 0} color="amber" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="glass-panel p-6 border-rose-500/10">
                                    <h3 className="italic font-black uppercase text-[11px] mb-6 flex items-center gap-2 text-rose-500">
                                        <Activity size={14} /> Ecosystem Health
                                    </h3>
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-black text-slate-500 uppercase">Uptime Protocol</span>
                                            <span className="text-xl font-black italic text-emerald-500">99.99%</span>
                                        </div>
                                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-emerald-500 h-full w-[99%]" />
                                        </div>
                                    </div>
                                </div>
                                <div className="glass-panel p-6 border-violet-500/10 relative overflow-hidden flex flex-col justify-between">
                                     <h3 className="italic font-black uppercase text-[11px] mb-6 flex items-center gap-2 text-violet-500">
                                        <Globe size={14} /> Spatial Radar
                                    </h3>
                                    
                                    <div className="relative h-24 w-full bg-black/20 rounded-xl border border-white/5 overflow-hidden flex items-center justify-center">
                                        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                                        {stats?.heatmap?.length > 0 ? (
                                            <div className="relative w-full h-full">
                                                {stats.heatmap.map((point, i) => (
                                                    <motion.div 
                                                        key={i}
                                                        style={{ left: `${(point.lng + 180) * (100 / 360)}%`, top: `${(90 - point.lat) * (100 / 180)}%` }}
                                                        animate={{ scale: [1, 2, 1], opacity: [0.5, 1, 0.5] }}
                                                        transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
                                                        className="absolute w-2 h-2 bg-rose-500 rounded-full blur-[2px]"
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-[8px] font-black text-slate-800 uppercase italic">Waiting for telemetry...</span>
                                        )}
                                    </div>

                                    <div className="mt-4 flex justify-between items-center text-[9px] font-black text-slate-700 uppercase">
                                        <span>Live Density Mapping</span>
                                        <span className="text-violet-500 italic">Sync Active</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeView === 'companies' && (
                        <div className="glass-panel overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr>
                                        <th className="pl-8">Company Entity</th>
                                        <th>Admin Identity</th>
                                        <th>Personnel Count</th>
                                        <th>Status</th>
                                        <th className="text-right pr-8">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {companies.map(company => (
                                        <tr key={company.id} className="group/row">
                                            <td className="pl-8 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black italic text-white uppercase">{company.name}</span>
                                                    <span className="text-[9px] text-slate-600 font-mono">{company.id}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-slate-300">{company.admin?.name || 'Admin'}</span>
                                                    <span className="text-[9px] text-slate-600 italic">{company.admin?.email}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge border-white/5 text-violet-500">{company.employeeCount || 0} Nodes</span>
                                            </td>
                                            <td>
                                                <span className={`status-pill ${company.status === 'ACTIVE' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-500 bg-rose-500/10 border-rose-500/20'}`}>
                                                    {company.status}
                                                </span>
                                            </td>
                                             <td className="text-right pr-8">
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => setOverrideCompany(company)}
                                                        className="p-2 hover:bg-white/5 text-amber-500 rounded-lg transition-colors"
                                                        title="Credential Override"
                                                    >
                                                        <Lock size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => setEditingCompany(company)}
                                                        className="p-2 hover:bg-white/5 text-violet-500 rounded-lg transition-colors"
                                                        title="Edit Entity"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleToggleStatus(company.id)}
                                                        className={`p-2 rounded-lg transition-colors ${company.status === 'ACTIVE' ? 'hover:bg-amber-500/10 text-amber-500' : 'hover:bg-emerald-500/10 text-emerald-500'}`}
                                                        title={company.status === 'ACTIVE' ? "Archive Node" : "Activate Node"}
                                                    >
                                                        {company.status === 'ACTIVE' ? <ShieldAlert size={16} /> : <Unlock size={16} />}
                                                    </button>
                                                    <button 
                                                        onClick={() => setDeletingCompany(company)}
                                                        className="p-2 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-colors"
                                                        title="Terminate Cluster"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeView === 'tickets' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {tickets.map(ticket => (
                                <div key={ticket.id} className="glass-panel p-6 space-y-4 hover:border-rose-500/30 transition-all cursor-pointer">
                                    <div className="flex justify-between items-start">
                                        <span className={`status-pill ${ticket.priority === 'HIGH' ? 'text-rose-500' : 'text-blue-500'}`}>{ticket.priority}</span>
                                        <span className="text-[9px] font-mono text-slate-700">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <h4 className="font-bold text-white uppercase italic text-xs">{ticket.subject}</h4>
                                    <p className="text-[10px] text-slate-500 italic line-clamp-2">{ticket.description}</p>
                                    <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">{ticket.company?.name || 'Unknown'}</span>
                                        <button 
                                            onClick={() => setSelectedTicket(ticket)}
                                            className="text-[10px] font-black uppercase text-rose-500 italic hover:underline"
                                        >
                                            View Intel
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeView === 'broadcasts' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="glass-panel p-8 space-y-6">
                                <h4 className="text-sm font-black text-white uppercase italic mb-4">Deploy Global Signal</h4>
                                <form onSubmit={handleCreateBroadcast} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Signal Type</label>
                                        <div className="flex gap-2">
                                            {['INFO', 'WARNING', 'CRITICAL'].map(type => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => setBroadcastForm({ ...broadcastForm, type })}
                                                    className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                                        broadcastForm.type === type 
                                                        ? 'bg-violet-600 text-white shadow-lg' 
                                                        : 'bg-white/5 text-slate-500 border border-white/5 hover:border-white/10'
                                                    }`}
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Message Payload</label>
                                        <textarea 
                                            value={broadcastForm.message}
                                            onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-xs font-bold outline-none focus:border-violet-500/50 min-h-[120px]"
                                            placeholder="Transmit system-wide instructions..."
                                            required
                                        />
                                    </div>
                                    <button 
                                        type="submit"
                                        disabled={isSaving}
                                        className="w-full bg-violet-600 hover:bg-violet-500 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] italic text-white transition-all flex items-center justify-center gap-2"
                                    >
                                        {isSaving ? <Loader2 className="animate-spin" size={16} /> : 'Initiate Broadcast'}
                                    </button>
                                </form>
                            </div>
                            <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                                {broadcasts.map(b => (
                                    <div key={b.id} className={`glass-panel p-6 border-l-4 transition-all ${b.active ? 'opacity-100' : 'opacity-40'} ${
                                        b.type === 'CRITICAL' ? 'border-l-rose-500' : b.type === 'WARNING' ? 'border-l-amber-500' : 'border-l-blue-500'
                                    }`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[9px] font-mono text-slate-600">{new Date(b.createdAt).toLocaleString()}</span>
                                            <button 
                                                onClick={() => handleToggleBroadcast(b.id)}
                                                className={`text-[9px] font-black uppercase tracking-widest italic ${b.active ? 'text-rose-500' : 'text-emerald-500'}`}
                                            >
                                                {b.active ? '[ TERMINATE ]' : '[ REACTIVATE ]'}
                                            </button>
                                        </div>
                                        <p className="text-[11px] font-bold text-slate-300 leading-relaxed">{b.message}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}


                </div>
            )}

            {/* Edit Modal */}
            {editingCompany && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="glass-panel max-w-md w-full p-8 border-violet-500/20 relative animate-in zoom-in duration-300">
                        <button 
                            onClick={() => setEditingCompany(null)}
                            className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                        
                        <div className="mb-8">
                            <h3 className="italic font-black text-2xl uppercase tracking-tighter text-white mb-2">Modify Entity</h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Company Registry ID: {editingCompany.id}</p>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entity Name</label>
                                <input 
                                    type="text" 
                                    value={editingCompany.name}
                                    onChange={(e) => setEditingCompany({ ...editingCompany, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold tracking-tight focus:border-violet-500/50 outline-none transition-all"
                                    required
                                    autoComplete="off"
                                />
                            </div>

                            <button 
                                type="submit"
                                disabled={isSaving}
                                className="w-full bg-violet-600 hover:bg-violet-500 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] italic text-white transition-all flex items-center justify-center gap-2"
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={16} /> : 'Sync Registry'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Deletion Modal */}
            {deletingCompany && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="glass-panel max-w-md w-full p-8 border-rose-500/20 relative animate-in scale-95 duration-300">
                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500">
                                <AlertTriangle size={32} />
                            </div>
                            
                            <div className="space-y-2">
                                <h3 className="italic font-black text-2xl uppercase tracking-tighter text-white">Critical Command</h3>
                                <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-wider">
                                    You are about to terminate <span className="text-rose-500">{deletingCompany.name}</span>.<br />
                                    This will decommission all nodes and logs permanently.
                                </p>
                            </div>

                            <div className="flex gap-4 w-full pt-4">
                                <button 
                                    onClick={() => setDeletingCompany(null)}
                                    className="flex-1 bg-white/5 hover:bg-white/10 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 transition-all italic"
                                >
                                    Abort
                                </button>
                                <button 
                                    onClick={() => handleDelete(deletingCompany.id)}
                                    disabled={isSaving}
                                    className="flex-1 bg-rose-600 hover:bg-rose-500 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all italic flex items-center justify-center gap-2"
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={16} /> : 'Terminate'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Credential Override Modal */}
            {overrideCompany && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="glass-panel max-w-md w-full p-8 border-amber-500/20 relative animate-in zoom-in duration-300">
                        <button 
                            onClick={() => setOverrideCompany(null)}
                            className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                        
                        <div className="mb-8 text-center">
                            <h3 className="italic font-black text-2xl uppercase tracking-tighter text-white mb-2">Master Override</h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">
                                Force reset credentials for <span className="text-amber-500">{overrideCompany.name}</span>.<br />
                                Target Root: <span className="text-white italic">{overrideCompany.adminEmail}</span>
                            </p>
                        </div>

                        <form onSubmit={handlePasswordOverride} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master-Force New Password</label>
                                <input 
                                    type="password" 
                                    value={newPass}
                                    onChange={(e) => setNewPass(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-bold tracking-[0.3em] focus:border-amber-500/50 outline-none transition-all"
                                    required
                                    minLength={6}
                                    autoComplete="off"
                                />
                            </div>

                            <button 
                                type="submit"
                                disabled={isSaving}
                                className="w-full bg-amber-600 hover:bg-amber-500 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] italic text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-900/20"
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={16} /> : 'Execute Master Reset'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Ticket Intel Modal */}
            <AnimatePresence>
                {selectedTicket && (
                    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[1000] flex items-center justify-center p-8">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="glass-panel max-w-3xl w-full max-h-[90vh] flex flex-col p-10 border-indigo-500/20"
                        >
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`status-pill ${selectedTicket.priority === 'HIGH' ? 'text-rose-500' : 'text-blue-500'}`}>{selectedTicket.priority}</span>
                                        <span className="text-[10px] font-black text-slate-700 uppercase">{selectedTicket.company?.name}</span>
                                    </div>
                                    <h3 className="italic font-black text-3xl uppercase tracking-tighter text-white">{selectedTicket.subject}</h3>
                                </div>
                                <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X size={24} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar mb-8 space-y-6">
                                <div className="p-6 bg-white/2 rounded-2xl border border-white/5">
                                    <p className="text-xs font-bold text-slate-300 leading-relaxed italic">{selectedTicket.description}</p>
                                    <div className="mt-4 flex items-center gap-2 text-[8px] font-black text-slate-700 uppercase tracking-[0.2em]">
                                        <Users size={12} /> Origin: {selectedTicket.user?.name} | {new Date(selectedTicket.createdAt).toLocaleString()}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Communication History</h4>
                                    {selectedTicket.replies?.map((reply, i) => (
                                        <div key={i} className={`p-4 rounded-xl border ${reply.isAdmin ? 'bg-rose-500/5 border-rose-500/10 ml-8' : 'bg-white/2 border-white/5 mr-8'}`}>
                                            <p className="text-[11px] font-bold text-white mb-2">{reply.message}</p>
                                            <div className="flex justify-between items-center text-[8px] font-bold text-slate-600 uppercase">
                                                <span>{reply.isAdmin ? 'MASTER CONTROL' : selectedTicket.user?.name}</span>
                                                <span>{new Date(reply.createdAt).toLocaleTimeString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <form onSubmit={handleReply} className="pt-6 border-t border-white/5 space-y-4">
                                <textarea 
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Transmit response to cluster admin..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-xs font-bold outline-none focus:border-indigo-500/50 min-h-[100px]"
                                    required
                                />
                                <button 
                                    type="submit"
                                    disabled={isSaving}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] italic text-white transition-all flex items-center justify-center gap-2"
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={16} /> : 'Deploy Response Signal'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ================= IDENTITY & SECURITY VIEW ================= */}
            {activeView === 'profile' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="glass-panel p-12 border-white/5 relative group overflow-hidden max-w-4xl mx-auto">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity translate-x-10 -translate-y-10">
                            <ShieldCheck size={300} />
                        </div>
                        
                        <div className="relative z-10 text-left">
                            <h3 className="text-3xl font-black text-white italic uppercase mb-2 flex items-center gap-4">
                                <Lock className="text-rose-500" size={32} />
                                Master Identity Architecture
                            </h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-12">Registry & Security Cipher Synchronization</p>

                            <form onSubmit={handleUpdateMasterProfile} className="space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Identity Subject (Name)</label>
                                        <input 
                                            type="text" 
                                            value={profileForm.name}
                                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-[14px] font-bold text-white focus:border-rose-500 outline-none transition-all placeholder:text-slate-800"
                                            placeholder="Enter Subject Name..."
                                            autoComplete="off"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Corporate Signal (Email)</label>
                                        <input 
                                            type="email" 
                                            value={profileForm.email}
                                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-[14px] font-bold text-white focus:border-rose-500 outline-none transition-all placeholder:text-slate-800"
                                            placeholder="master@twishh.sync"
                                            autoComplete="off"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3 text-left">
                                    <div className="flex justify-between items-end px-1">
                                        <label className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">Master Credentials (Security Cipher)</label>
                                        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest italic">Encrypted Transmission</span>
                                    </div>
                                    <input 
                                        type="password" 
                                        value={profileForm.password}
                                        onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-[14px] font-bold text-white focus:border-rose-500 outline-none transition-all placeholder:text-slate-800"
                                        placeholder="Update Master Password (Leave blank to maintain current cipher)"
                                        autoComplete="off"
                                    />
                                </div>

                                <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-slate-500">
                                        <Activity size={16} />
                                        <span className="text-[9px] font-bold uppercase tracking-widest">Master Control Ready</span>
                                    </div>
                                    <button 
                                        type="submit"
                                        disabled={isSaving}
                                        className="px-12 py-5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white transition-all font-black text-[12px] uppercase tracking-[0.2em] italic shadow-[0_0_30px_rgba(225,29,72,0.3)] disabled:opacity-50"
                                    >
                                        {isSaving ? 'Encrypting...' : 'Synchronize Identity'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
};

const StatCard = ({ icon: Icon, label, val, color }) => (
    <div className={`glass-panel p-6 border-${color}-500/10`}>
        <div className="flex justify-between items-start mb-4">
            <div className={`p-2 bg-${color}-500/10 rounded-lg`}>
                <Icon className={`text-${color}-500`} size={20} />
            </div>
            <span className={`text-[10px] font-black text-${color}-500 uppercase tracking-widest`}>{label}</span>
        </div>
        <h4 className="text-3xl font-black italic text-white">{val || 0}</h4>
    </div>
);

export default MasterAdminView;
