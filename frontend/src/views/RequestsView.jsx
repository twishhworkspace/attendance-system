import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import { History, MapPin, Loader2, Check, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';

import { useAuth } from '../context/AuthContext';

const RequestsView = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN';
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { showToast } = useToast();
    const [tab, setTab] = useState('PENDING'); // PENDING or HISTORY

    const fetchR = async () => {
        if (!isAdmin) return;
        setRefreshing(true);
        try {
            const statusParam = tab === 'PENDING' ? 'PENDING' : 'APPROVED,REJECTED'; 
            const r = await axios.get(`admin/requests/out-location?status=${statusParam}`);
            setRequests(r.data);
        } catch (err) {
            console.error('Request telemetry failure:', err);
            showToast("Telemetric Request Feed Interrupted.", "error");
        } finally { setLoading(false); setRefreshing(false); }
    };

    useEffect(() => { 
        if (isAdmin) fetchR(); 
    }, [isAdmin, tab]);

    const handleAction = async (id, action) => {
        try {
            await axios.post(`admin/requests/out-location/${id}/process`, { action });
            showToast(`Request ${action === 'APPROVE' ? 'Authorized' : 'Denied'}.`, "success");
            fetchR();
        } catch (err) {
            showToast(err.response?.data?.error || "Request Resolution Sequence Failed.", "error");
        }
    };

    if (loading) return <div className="p-20 opacity-40 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

    return (
        <div className="glass-panel flex-1 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-10">
                <div className="flex flex-col gap-1">
                    <h3 className="italic font-black uppercase tracking-tight text-xl">Out-of-Location Management</h3>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setTab('PENDING')}
                            className={`text-[9px] font-black uppercase tracking-[0.3em] pb-1 transition-all ${tab === 'PENDING' ? 'text-violet-500 border-b-2 border-violet-500' : 'text-slate-700 hover:text-slate-500'}`}
                        >
                            Pending Approvals
                        </button>
                        <button 
                            onClick={() => setTab('HISTORY')}
                            className={`text-[9px] font-black uppercase tracking-[0.3em] pb-1 transition-all ${tab === 'HISTORY' ? 'text-violet-500 border-b-2 border-violet-500' : 'text-slate-700 hover:text-slate-500'}`}
                        >
                            Action History
                        </button>
                    </div>
                </div>
                <button className="nav-item opacity-40 hover:opacity-100 transition-opacity p-2" onClick={fetchR}>
                    <History size={16} className={refreshing ? 'animate-spin text-violet-500' : ''} />
                </button>
            </div>
            {requests.length === 0 ? (
                <div className="py-20 text-center opacity-30 text-[10px] font-black uppercase tracking-widest">
                    {tab === 'PENDING' ? 'No pending requests requiring action.' : 'No history of approved or rejected requests found.'}
                </div>
            ) : (
                <div className="table-scroll-shield">
                <table>
                    <thead>
                        <tr>
                            <th>Employee Details</th>
                            <th>Date Submitted</th>
                            {tab === 'HISTORY' && <th>Action Date</th>}
                            <th>Request Category</th>
                            <th>Reason for Request</th>
                            <th className="text-right pr-6">Management Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map(r => (
                            <tr key={r.id}>
                                <td><div className="flex flex-col"><span className="font-bold italic uppercase text-white text-xs">{r.user?.name}</span><span className="text-[9px] text-slate-700 font-bold uppercase tracking-tighter">{r.user?.sector?.name || 'ROOT'}</span></div></td>
                                <td><span className="text-white text-[10px] font-mono">{new Date(r.createdAt).toLocaleDateString()}</span></td>
                                {tab === 'HISTORY' && <td><span className="text-emerald-500/60 text-[10px] font-mono">{r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : '--'}</span></td>}
                                <td><span className="badge border-white/5 text-[9px] font-black text-violet-500">OUT-OF-LOCATION</span></td>
                                <td><p className="text-[11px] text-slate-500 italic truncate max-w-[250px]">{r.reason || '--'}</p></td>
                                <td className="text-right pr-6">
                                    {r.status === 'PENDING' ? (
                                        <div className="flex gap-2 justify-end">
                                            <button onClick={() => handleAction(r.id, 'APPROVED')} className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg transition-all border border-emerald-500/20"><Check size={14} /></button>
                                            <button onClick={() => handleAction(r.id, 'REJECTED')} className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-all border border-rose-500/20"><X size={14} /></button>
                                        </div>
                                    ) : (
                                        <span className={`text-[10px] font-black uppercase italic ${r.status === 'APPROVED' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {r.status}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            )}
        </div>
    );
};

export default RequestsView;
