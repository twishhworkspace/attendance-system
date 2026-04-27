import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { 
    Activity, 
    Search, 
    ShieldAlert, 
    User, 
    Clock, 
    Globe, 
    Terminal,
    RefreshCcw
} from 'lucide-react';
import Skeleton from '../components/Skeleton';
import { useToast } from '../context/ToastContext';

const AuditLogsView = () => {
    const { showToast } = useToast();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await axios.get('admin/audit-logs');
            setLogs(res.data);
        } catch (err) {
            showToast("Failed to fetch system audit trails", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log => 
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ip?.includes(searchTerm)
    );

    return (
        <div className="flex-1 flex flex-col gap-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h2 className="italic font-black text-4xl mb-2 flex items-center gap-4 uppercase tracking-tighter">
                        Security Audit
                        <div className="px-2 py-0.5 bg-rose-600 text-[10px] tracking-[0.3em] italic rounded">LIVE_FEED</div>
                    </h2>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">System Integrity & Employee Action Protocol</p>
                </div>

                <div className="flex gap-4">
                    <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl">
                        <Search size={14} className="text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="FILTER BY ACTION OR IP..." 
                            className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest outline-none text-white placeholder:text-slate-700 w-48"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={fetchLogs}
                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-violet-500 transition-all"
                    >
                        <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="glass-panel flex-1 min-h-[600px] overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-white/5 bg-black/20">
                            <tr>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Timestamp</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Action Event</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Details / Metadata</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right pr-8">Source IP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(10)].map((_, i) => (
                                    <tr key={i} className="border-b border-white/5">
                                        <td className="px-8 py-6"><Skeleton className="h-4 w-32" /></td>
                                        <td className="px-6 py-6"><Skeleton className="h-4 w-40" /></td>
                                        <td className="px-6 py-6"><Skeleton className="h-4 w-60" /></td>
                                        <td className="px-6 py-6"><Skeleton className="h-4 w-24 float-right" /></td>
                                    </tr>
                                ))
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="py-20 text-center">
                                        <ShieldAlert size={48} className="mx-auto mb-4 text-slate-800" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">No security events found matching current filter.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <Clock size={14} className="text-slate-600" />
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-bold text-white tracking-tight">
                                                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    </span>
                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">
                                                        {new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-violet-600/10 rounded-lg text-violet-500">
                                                    <Terminal size={14} />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-violet-400 group-hover:text-violet-300 transition-colors">
                                                    {log.action.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <p className="text-[10px] font-bold text-slate-400 leading-relaxed max-w-md">
                                                {log.details}
                                            </p>
                                        </td>
                                        <td className="px-6 py-6 text-right pr-8">
                                            <div className="flex items-center justify-end gap-2">
                                                <Globe size={12} className="text-slate-600" />
                                                <span className="text-[10px] font-mono text-slate-500 group-hover:text-white transition-colors">{log.ip || '0.0.0.0'}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AuditLogsView;
