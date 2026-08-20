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
    const [requestType, setRequestType] = useState('LEAVE'); // Default to LEAVE for better employee experience

    // Modal States
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [showOutModal, setShowOutModal] = useState(false);
    const [leaveDates, setLeaveDates] = useState({ start: '', end: '' });
    const [leaveReason, setLeaveReason] = useState('');
    const [outReason, setOutReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchR = async () => {
        setRefreshing(true);
        try {
            const statusParam = tab === 'PENDING' ? 'PENDING' : 'APPROVED,REJECTED'; 
            let endpoint;
            
            if (isAdmin) {
                endpoint = requestType === 'OUT-LOCATION' 
                    ? `admin/requests/out-location?status=${statusParam}`
                    : `admin/requests/leave?status=${statusParam}`;
            } else {
                // Employees only see their own requests
                endpoint = requestType === 'OUT-LOCATION'
                    ? `out-location/my?status=${statusParam}`
                    : `leave/my?status=${statusParam}`;
            }

            const r = await axios.get(endpoint);
            console.log(`[Telemetry] Response received:`, r.data);
            setRequests(r.data);
        } catch (err) {
            console.error('[Telemetry] Request failure details:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status
            });
            const msg = err.response?.data?.message || err.response?.data?.error || "Unable to load requests.";
            showToast(msg, "error");
        } finally { setLoading(false); setRefreshing(false); }
    };

    useEffect(() => { 
        fetchR(); 
    }, [isAdmin, tab, requestType]);

    const handleAction = async (id, action) => {
        try {
            const endpoint = requestType === 'OUT-LOCATION'
                ? `admin/requests/out-location/${id}/process`
                : `admin/requests/leave/${id}/process`;
            await axios.post(endpoint, { action });
            showToast(`Request ${action === 'APPROVE' ? 'Authorized' : 'Denied'}.`, "success");
            fetchR();
        } catch (err) {
            showToast(err.response?.data?.error || "Unable to process request.", "error");
        }
    };

    const handleLeaveSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await axios.post('leave/submit', {
                startDate: leaveDates.start,
                endDate: leaveDates.end,
                reason: leaveReason
            });
            showToast("Leave request transmitted.", "success");
            setShowLeaveModal(false);
            setLeaveReason('');
            setLeaveDates({ start: '', end: '' });
            fetchR();
        } catch (err) {
            showToast(err.response?.data?.error || "Submission failed.", "error");
        } finally { setIsSubmitting(false); }
    };

    const handleOutSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await axios.post('out-location/submit', { reason: outReason });
            showToast("Out-of-location request queued.", "success");
            setShowOutModal(false);
            setOutReason('');
            fetchR();
        } catch (err) {
            showToast(err.response?.data?.error || "Submission failed.", "error");
        } finally { setIsSubmitting(false); }
    };

    if (loading) return <div className="p-20 opacity-40 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

    return (
        <div className="glass-panel flex-1 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                <div className="flex flex-col gap-1 w-full sm:w-auto">
                    <h3 className="italic font-black uppercase tracking-tight text-xl">{isAdmin ? 'System Requests' : 'My Requests'}</h3>
                    <div className="flex gap-6">
                    {isAdmin && (
                        <button 
                            onClick={() => setRequestType('OUT-LOCATION')}
                            className={`text-[11px] font-black uppercase tracking-[0.2em] pb-2 transition-all ${requestType === 'OUT-LOCATION' ? 'text-white border-b-2 border-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Out-of-Office
                        </button>
                    )}
                    <button 
                        onClick={() => setRequestType('LEAVE')}
                        className={`text-[11px] font-black uppercase tracking-[0.2em] pb-2 transition-all ${requestType === 'LEAVE' ? 'text-white border-b-2 border-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Leave Permission
                    </button>
                </div>
                    <div className="flex gap-4 mt-2">
                        <button 
                            onClick={() => setTab('PENDING')}
                            className={`text-[11px] font-black uppercase tracking-[0.2em] pb-2 transition-all ${tab === 'PENDING' ? 'text-violet-500 border-b-2 border-violet-500' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Pending Approvals
                        </button>
                        <button 
                            onClick={() => setTab('HISTORY')}
                            className={`text-[11px] font-black uppercase tracking-[0.2em] pb-2 transition-all ${tab === 'HISTORY' ? 'text-violet-500 border-b-2 border-violet-500' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Action History
                        </button>
                    </div>
                </div>
                <div className="flex gap-4 items-center">
                    {!isAdmin && (
                        <div className="flex gap-2">
                            <button onClick={() => setShowLeaveModal(true)} className="btn-primary px-3 sm:px-6 h-10 text-[8px] sm:text-[9px] bg-amber-500 hover:bg-amber-600 uppercase italic font-black whitespace-nowrap">Apply Leave</button>
                        </div>
                    )}
                    <button className="nav-item opacity-40 hover:opacity-100 transition-opacity p-2" onClick={fetchR}>
                        <History size={16} className={refreshing ? 'animate-spin text-violet-500' : ''} />
                    </button>
                </div>
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
                             <th>{requestType === 'LEAVE' ? 'Leave Period' : 'Date Submitted'}</th>
                             {tab === 'HISTORY' && <th>Action Date</th>}
                             <th>Category</th>
                             <th>Reason for Request</th>
                             <th className="text-right pr-6">{isAdmin ? 'Action' : 'Status'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map(r => (
                            <tr key={r.id}>
                                <td><div className="flex flex-col"><span className="font-bold italic uppercase text-white text-xs">{r.user?.name}</span><span className="text-[9px] text-slate-700 font-bold uppercase tracking-tighter">{r.user?.sector?.name || 'ROOT'}</span></div></td>
                                <td>
                                    {requestType === 'LEAVE' ? (
                                        <div className="flex flex-col">
                                            <span className="text-white text-[10px] font-mono">
                                                {r.startDate ? new Date(r.startDate).toLocaleDateString('en-GB') : '--'} - {r.endDate ? new Date(r.endDate).toLocaleDateString('en-GB') : '--'}
                                            </span>
                                            <span className="text-[8px] text-slate-500 uppercase font-black">
                                                Applied on {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB') : '--'}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-white text-[10px] font-mono">
                                            {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB') : '--'}
                                        </span>
                                    )}
                                </td>
                                {tab === 'HISTORY' && <td><span className="text-emerald-500/60 text-[10px] font-mono">{r.updatedAt ? new Date(r.updatedAt).toLocaleDateString('en-GB') : '--'}</span></td>}
                                <td><span className={`badge border-white/5 text-[9px] font-black ${requestType === 'LEAVE' ? 'text-amber-500' : 'text-violet-500'}`}>{requestType}</span></td>
                                <td><p className="text-[11px] text-slate-500 italic whitespace-pre-wrap break-words max-w-[350px]">{r.reason || '--'}</p></td>
                                 <td className="text-right pr-6">
                                    {r.status === 'PENDING' ? (
                                        isAdmin ? (
                                            <div className="flex gap-2 justify-end">
                                                <button onClick={() => handleAction(r.id, 'APPROVE')} className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg transition-all border border-emerald-500/20"><Check size={14} /></button>
                                                <button onClick={() => handleAction(r.id, 'REJECT')} className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-all border border-rose-500/20"><X size={14} /></button>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] font-black uppercase italic text-slate-500">Pending</span>
                                        )
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

            {/* Employee Request Modals */}
            {showLeaveModal && (
                <div className="modal-overlay">
                    <div className="modal-content w-[450px]">
                        <button className="close-btn" onClick={() => setShowLeaveModal(false)}><X size={18} /></button>
                        <h3 className="italic font-black uppercase mb-8">Request Leave Permission</h3>
                        <form onSubmit={handleLeaveSubmit} className="space-y-6">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="label-proto">Start Date</label>
                                    <input type="date" value={leaveDates.start} onChange={e => setLeaveDates({...leaveDates, start: e.target.value})} required className="w-full" />
                                </div>
                                <div className="flex-1">
                                    <label className="label-proto">End Date</label>
                                    <input type="date" value={leaveDates.end} onChange={e => setLeaveDates({...leaveDates, end: e.target.value})} required className="w-full" />
                                </div>
                            </div>
                            <div>
                                <label className="label-proto">Reason for Leave</label>
                                <textarea 
                                    value={leaveReason} 
                                    onChange={e => setLeaveReason(e.target.value)} 
                                    placeholder="Briefly explain the requirement..."
                                    required
                                    className="w-full bg-white/5 border-white/10 rounded-xl p-4 text-xs italic min-h-[100px]"
                                />
                            </div>
                            <button className="btn-primary w-full h-14" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : 'SUBMIT REQUEST'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showOutModal && (
                <div className="modal-overlay">
                    <div className="modal-content w-[450px]">
                        <button className="close-btn" onClick={() => setShowOutModal(false)}><X size={18} /></button>
                        <h3 className="italic font-black uppercase mb-8">Out-of-Location Request</h3>
                        <form onSubmit={handleOutSubmit} className="space-y-6">
                            <div>
                                <label className="label-proto">Reason for Remote Sync</label>
                                <textarea 
                                    value={outReason} 
                                    onChange={e => setOutReason(e.target.value)} 
                                    placeholder="Explain why you are checking in from outside authorized perimeters..."
                                    required
                                    className="w-full bg-white/5 border-white/10 rounded-xl p-4 text-xs italic min-h-[100px]"
                                />
                            </div>
                            <button className="btn-primary w-full h-14" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : 'TRANSMIT REQUEST'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RequestsView;
