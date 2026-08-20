import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import { 
    History, MapPin, Loader2, Fingerprint, LogOut, Navigation, X, Bell, Info, Calendar, AlertCircle, WifiOff, RefreshCw, Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import RadarSystem from '../components/RadarSystem';
import Skeleton from '../components/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';

import { useOfflineSync } from '../hooks/useOfflineSync';
import { offlineStore } from '../utils/offlineStore';

const getLocationWithFallback = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("GPS ACCESS BLOCKED: Geolocation is not supported by this browser, or is blocked due to insecure HTTP access. Please use HTTPS."));
            return;
        }

        // Try with high accuracy first, timeout set to 10000ms, allow 5s cached coordinates
        navigator.geolocation.getCurrentPosition(
            resolve,
            (err) => {
                if (err.code === 1) { // PERMISSION_DENIED
                    reject(new Error("LOCATION ACCESS DENIED: Location access is required to verify your position."));
                } else {
                    console.warn("High accuracy geolocation failed, trying standard accuracy fallback...", err);
                    // Fallback to low accuracy, with a longer timeout and 10s cache age
                    navigator.geolocation.getCurrentPosition(
                        resolve,
                        (err2) => {
                            if (err2.code === 1) {
                                reject(new Error("LOCATION ACCESS DENIED: Location access is required to verify your position."));
                            } else if (err2.code === 3) {
                                reject(new Error("GPS TIMEOUT: Signal too weak to verify your location."));
                            } else {
                                reject(err2);
                            }
                        },
                        { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
                    );
                }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
        );
    });
};

const PunchTerminal = ({ setView }) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showOutModal, setShowOutModal] = useState(false);
    const [outReason, setOutReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [spatialStatus, setSpatialStatus] = useState(null); // null, 'verifying', 'verified', 'out', 'network-error'
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [notices, setNotices] = useState([]);
    const [lastAutoCheckout, setLastAutoCheckout] = useState(null);
    const [showReasonModal, setShowReasonModal] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [leaveDates, setLeaveDates] = useState({ start: '', end: '' });
    const [leaveReason, setLeaveReason] = useState('');

    const [pendingPunches, setPendingPunches] = useState([]);
    const [showSyncDrawer, setShowSyncDrawer] = useState(false);
    const [syncingOffline, setSyncingOffline] = useState(false);

    const { syncPendingPunches } = useOfflineSync(() => {
        fetchPendingPunches();
        fetchS();
    });

    const fetchPendingPunches = async () => {
        try {
            const list = await offlineStore.getPendingPunches();
            setPendingPunches(list);
        } catch (err) {
            console.error("Failed to load pending punches", err);
        }
    };

    const handleManualSync = async () => {
        if (!navigator.onLine) {
            showToast("Cannot sync: device is currently offline.", "error");
            return;
        }
        setSyncingOffline(true);
        try {
            await syncPendingPunches();
            await fetchPendingPunches();
            await fetchS();
        } catch (err) {
            showToast("Manual sync failed.", "error");
        } finally {
            setSyncingOffline(false);
        }
    };

    const handleClearQueue = async () => {
        if (window.confirm("Are you sure you want to clear all offline pending actions? This cannot be undone.")) {
            try {
                await offlineStore.clearQueue();
                await fetchPendingPunches();
                showToast("Pending punches queue cleared.", "success");
            } catch (err) {
                showToast("Failed to clear queue.", "error");
            }
        }
    };

    useEffect(() => {
        const handleStatus = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', handleStatus);
        window.addEventListener('offline', handleStatus);
        return () => {
            window.removeEventListener('online', handleStatus);
            window.removeEventListener('offline', handleStatus);
        };
    }, []);

    const fetchS = async () => { 
        if (!navigator.onLine) {
            setLoading(false);
            setRefreshing(false);
            return;
        }
        setRefreshing(true);
        try { 
            const r = await axios.get('attendance/status'); 
            setStatus(r.data.id ? r.data : null); 

            // Compliance Check: Block if last session was an auto-checkout without reason
            try {
                const historyRes = await axios.get('attendance/history?limit=1');
                const lastRecord = historyRes.data[0];
                if (lastRecord && lastRecord.isAutoCheckout && !lastRecord.notes?.includes('Reason:')) {
                    setLastAutoCheckout(lastRecord);
                    setShowReasonModal(true);
                }
            } catch (hErr) { console.error('Compliance handshake bypassed'); }
        } 
        finally { setLoading(false); setRefreshing(false); } 
    };

    const fetchNotices = async () => {
        try {
            const r = await axios.get('attendance/notices');
            setNotices(r.data);
        } catch (err) { console.error('Notice sync error'); }
    };

    useEffect(() => { 
        fetchS(); 
        fetchNotices();
        fetchPendingPunches();
    }, []);

    const handleReasonSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const formData = new FormData(e.target);
            await axios.post('attendance/log-missed-checkout-reason', { 
                attendanceId: lastAutoCheckout.id,
                reason: formData.get('reason') 
            });
            showToast("Compliance reason recorded. Resume active.", "success");
            setLastAutoCheckout(null);
            setShowReasonModal(false);
            fetchS();
        } catch (err) {
            showToast("Failed to log reason.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOutRequest = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const pos = await getLocationWithFallback();
            const locationStr = `${pos.coords.latitude}, ${pos.coords.longitude}`;
            const payload = { 
                reason: outReason, 
                location: locationStr 
            };

            if (!navigator.onLine) {
                await offlineStore.savePendingPunch({ type: 'out-request', payload });
                showToast("Signal Lost. Out-of-location request queued for sync.", "warning");
                setShowOutModal(false);
                setOutReason('');
                fetchPendingPunches();
            } else {
                await axios.post('out-location/submit', payload);
                showToast("Out-of-location request submitted for approval.", "success");
                setShowOutModal(false);
                setOutReason('');
            }
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.message || "Request submission failed.";
            showToast(errorMsg, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerify = async () => {
        if (!navigator.onLine) {
            setSpatialStatus('verified'); // Assume verified for offline mode to allow queuing
            showToast("Offline Mode Active. Spatial handshake bypassed.", "info");
            return;
        }
        setSpatialStatus('verifying');
        // ... rest of handleVerify remains same ...
        try {
            const pos = await getLocationWithFallback();

            const locationStr = `${pos.coords.latitude}, ${pos.coords.longitude}`;
            const accuracy = pos.coords.accuracy;

            try {
                const res = await axios.post('attendance/verify', { 
                    location: locationStr, 
                    accuracy: accuracy 
                });
                setSpatialStatus(res.data.inRange ? 'verified' : 'out');
                if (res.data.inRange) {
                    showToast("Spatial Integrity Confirmed", "success");
                } else {
                    showToast("Out of Authorized Perimeter", "warning");
                }
            } catch (apiErr) {
                console.error('API Verification Failure:', apiErr);
                const errorMsg = apiErr.response?.data?.error || "Connection Error: Verification Interrupted.";
                showToast(errorMsg, "error");
                setSpatialStatus(!apiErr.response ? 'network-error' : null);
            }
        } catch (err) {
            showToast(err.message || "Location Verification Error", "error");
            setSpatialStatus(null);
        }
    };

    const active = !!status && !status.checkOut;
    const isApprovedOut = !!status && !status.checkOut && status.status === 'PRESENT' && status.notes?.includes('Out-of-location');

    return (
        <div className="flex-1 flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500">
            <div className="glass-panel flex-1 flex flex-col items-center justify-center py-12 md:py-24 relative">
                {!isOnline && (
                    <div className="absolute top-0 inset-x-0 h-1 bg-amber-500/50 animate-pulse z-50">
                         <div className="absolute inset-0 flex items-center justify-center">
                            <span className="bg-amber-500 text-black text-[8px] font-black px-4 py-0.5 rounded-b-lg">OFFLINE MODE ACTIVE</span>
                         </div>
                    </div>
                )}
                
                {user?.forgotCheckoutCount > 0 && (
                    <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl mb-8 flex items-center gap-4 animate-in slide-in-from-top duration-500 max-w-lg">
                        <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center text-white shrink-0 shadow-[0_0_15px_rgba(244,63,94,0.4)]">
                            <X size={20} />
                        </div>
                        <div>
                            <h4 className="text-[11px] font-black uppercase text-rose-500 tracking-wider">Compliance Warning: Missed Check-outs</h4>
                            <p className="text-[10px] font-medium text-rose-500/80 uppercase tracking-tight leading-relaxed">
                                You have missed {user.forgotCheckoutCount} check-outs. {user.forgotCheckoutCount < 3 ? `Strike ${user.forgotCheckoutCount}/3: Please remember to check-out manually. After 3 strikes, you will be marked as ABSENT automatically.` : 'Limit Exceeded: Subsequent missed check-outs will now result in an automatic ABSENT status.'}
                            </p>
                        </div>
                    </div>
                )}
                
                <div className="relative mb-12 w-full max-w-[320px] aspect-square flex items-center justify-center">
                    <RadarSystem />
                    <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center border-4 relative z-10 transition-all duration-700 ${active ? 'border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.2)] text-emerald-500 bg-emerald-500/5' : (isApprovedOut ? 'border-emerald-500/40 text-emerald-500 bg-emerald-500/5' : spatialStatus === 'network-error' ? 'border-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.2)] text-amber-500 bg-amber-500/5' : 'border-violet-500/10 text-violet-500 shadow-[0_0_50px_rgba(139,92,246,0.05)] bg-violet-500/5')}`}>
                        <Fingerprint className={`w-16 h-16 md:w-20 md:h-20 ${active ? 'animate-pulse' : ''}`} />
                    </div>
                </div>

                <h3 className="italic font-black text-2xl lg:text-4xl mb-2 tracking-tighter uppercase text-center">
                    {loading ? <Skeleton width={200} height={40} className="mb-4" /> : (spatialStatus === 'verified' ? (active || isApprovedOut ? 'Authorized' : 'Verified') : (spatialStatus === 'out' ? 'Out-of-Location' : 'Disconnected'))}
                </h3>
                

                {/* Greetings (Today's Notices Only) */}
                {notices.length > 0 && !loading && (() => {
                    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
                    const todayNotices = notices.filter(n => {
                        const nDate = n.scheduledDate ? n.scheduledDate.split('T')[0] : n.createdAt.split('T')[0];
                        return nDate === todayStr;
                    });

                    if (todayNotices.length === 0) return null;

                    return (
                        <div className="space-y-4 mb-12 animate-in slide-in-from-top-4 duration-700 w-full max-w-lg">
                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] text-center">Broadcasts - Priority Alpha</p>
                            {todayNotices.map(notice => (
                                <div key={notice.id} className={`p-5 rounded-2xl border flex items-center gap-6 ${
                                    notice.type === 'HOLIDAY' 
                                    ? 'bg-emerald-500/10 border-emerald-500/20' 
                                    : 'bg-violet-600/10 border-violet-500/20 shadow-[0_0_30px_rgba(139,92,246,0.05)]'
                                }`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                        notice.type === 'HOLIDAY' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-violet-500/20 text-violet-500'
                                    }`}>
                                        {notice.type === 'HOLIDAY' ? <Calendar size={18} /> : <Info size={18} />}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="italic font-black uppercase text-[11px] text-white mb-1">{notice.title}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 italic leading-relaxed">{notice.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                })()}

                <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] mb-12">
                   {loading ? <Skeleton width={120} height={10} /> : `Connection Status: ${spatialStatus === 'verified' ? 'CONNECTED' : (spatialStatus === 'out' ? 'LOCATION ERROR' : spatialStatus === 'network-error' ? 'NO NETWORK' : 'CONNECTING...')}`}
                </p>
                
                    <div className="flex flex-col gap-4 items-center w-full max-w-sm">
                        {loading ? (
                        <Skeleton width="100%" height={64} style={{ borderRadius: '16px' }} />
                    ) : (
                        spatialStatus === null || spatialStatus === 'verifying' || spatialStatus === 'network-error' ? (
                            <button 
                                onClick={handleVerify}
                                disabled={spatialStatus === 'verifying'}
                                className={`btn-primary w-full h-16 text-[11px] tracking-[0.3em] font-black italic relative overflow-hidden group ${spatialStatus === 'network-error' ? 'border-amber-500/50 text-amber-500' : ''}`}
                            >
                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity ${spatialStatus === 'network-error' ? 'bg-amber-600' : 'bg-violet-600'}`}></div>
                                {spatialStatus === 'verifying' ? (
                                    <div className="flex items-center justify-center gap-3">
                                        <Loader2 className="animate-spin" size={20} /> CHECKING LOCATION...
                                    </div>
                                ) : (spatialStatus === 'network-error' ? 'RETRY CONNECTION' : 'VERIFY MY LOCATION')}
                            </button>
                        ) : spatialStatus === 'verified' ? (
                            <div className="btn-auth-split animate-in zoom-in-95 duration-500">
                                <button 
                                    disabled={active || isApprovedOut || isSubmitting}
                                    onClick={async ()=>{ 
                                        setIsSubmitting(true);
                                        try { 
                                            const pos = await getLocationWithFallback();
                                            const payload = { 
                                                location: `${pos.coords.latitude}, ${pos.coords.longitude}`,
                                                accuracy: pos.coords.accuracy
                                            };

                                            if (!navigator.onLine) {
                                                await offlineStore.savePendingPunch({ type: 'check-in', payload });
                                                showToast("Signal Lost. Check-In queued for sync.", "warning");
                                                setStatus({ checkIn: new Date(), status: 'PRESENT' }); // Optimistic local state
                                                fetchPendingPunches();
                                            } else {
                                                await axios.post('attendance/check-in', payload); 
                                                fetchS(); 
                                                showToast("Check-In Successful.", "success");
                                            }
                                        } catch(e){ 
                                            console.error('Check-In Error:', e);
                                        } finally { setIsSubmitting(false); }
                                    }} 
                                    className="btn-auth-node btn-auth-in"
                                >
                                    <Fingerprint size={20} /> {isSubmitting ? 'VERIFYING...' : 'CHECK-IN'}
                                </button>
                                <button 
                                    disabled={!(active || isApprovedOut) || isSubmitting}
                                    onClick={async ()=>{ 
                                        setIsSubmitting(true);
                                        try { 
                                            const pos = await getLocationWithFallback();
                                            const payload = { 
                                                location: `${pos.coords.latitude}, ${pos.coords.longitude}`,
                                                accuracy: pos.coords.accuracy
                                            };

                                            if (!navigator.onLine) {
                                                await offlineStore.savePendingPunch({ type: 'check-out', payload });
                                                showToast("Signal Lost. Check-Out queued for sync.", "warning");
                                                setStatus(null); // Optimistic local state clearing
                                                fetchPendingPunches();
                                            } else {
                                                await axios.post('attendance/check-out', payload); 
                                                fetchS(); 
                                                showToast("Check-Out Successful.", "success");
                                            }
                                        } catch(e){ 
                                            console.error('Check-Out Error:', e);
                                        } finally { setIsSubmitting(false); }
                                    }} 
                                    className="btn-auth-node btn-auth-out"
                                >
                                    <LogOut size={20} /> {isSubmitting ? 'VERIFYING...' : 'CHECK-OUT'}
                                </button>
                            </div>
                        ) : (
                            <div className="w-full flex flex-col gap-4 animate-in slide-in-from-bottom-4 duration-500">
                                 <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl text-rose-500 text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest mb-1">Out of Location</p>
                                    <p className="text-[9px] font-bold italic opacity-60">You must be within 100m of the office to check in.</p>
                                 </div>
                                 <button 
                                    onClick={() => setSpatialStatus(null)}
                                    className="text-[9px] font-black uppercase text-slate-500 hover:text-white transition-all tracking-widest"
                                 >
                                    [ Refresh Connection ]
                                 </button>
                            </div>
                        )
                    )}

                    <div className="flex gap-4 items-center">
                        <button onClick={fetchS} className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                            <History size={18} className={`text-violet-500/60 ${refreshing ? 'animate-spin text-violet-500' : ''}`} />
                        </button>

                        {pendingPunches.length > 0 && (
                            <button 
                                onClick={() => setShowSyncDrawer(true)} 
                                className="px-4 h-12 text-[10px] uppercase font-black tracking-widest italic rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/20 flex items-center gap-2 animate-pulse cursor-pointer"
                            >
                                <WifiOff size={14} /> {pendingPunches.length} Sync Queue
                            </button>
                        )}
                        
                        {spatialStatus === 'out' && !loading && (
                            <div className="flex flex-col gap-2">
                                <button 
                                    onClick={() => setShowOutModal(true)}
                                    className="text-[9px] font-black uppercase text-amber-500/60 hover:text-white transition-all tracking-[0.2em] px-4 py-2 bg-amber-500/5 border border-amber-500/10 rounded-lg hover:bg-amber-500/20 w-full text-left"
                                >
                                    <Navigation size={10} className="inline mr-2" /> Out-of-Location Check-in
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="glass-panel w-full lg:w-96 flex flex-col">
                <h3 className="italic font-black uppercase text-sm mb-10">Attendance History</h3>
                <div className="space-y-8 flex-1">
                    <div className="flex justify-between items-center py-4 border-b border-white/5">
                        <div className="flex flex-col">
                            <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Check-In Time</p>
                            {loading ? <Skeleton width={120} height={24} className="mt-1" /> : <p className="text-white text-lg font-black italic">{status?.checkIn ? new Date(status.checkIn).toLocaleTimeString() : '--:--:--'}</p>}
                        </div>
                        <MapPin size={20} className="text-violet-500 opacity-20" />
                    </div>
                    <div className="flex justify-between items-center py-4 border-b border-white/5">
                        <div className="flex flex-col">
                            <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Check-Out Time</p>
                            {loading ? <Skeleton width={120} height={24} className="mt-1" /> : <p className="text-white text-lg font-black italic">{status?.checkOut ? new Date(status.checkOut).toLocaleTimeString() : '--:--:--'}</p>}
                        </div>
                        <LogOut size={20} className="text-violet-500 opacity-20" />
                    </div>
                    {loading ? (
                         <div className="py-4"><Skeleton width="100%" height={40} /></div>
                    ) : status?.notes && (
                         <div className="py-4"><p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">System Notes</p><p className="text-emerald-500 text-[11px] font-bold italic line-clamp-2">{status.notes}</p></div>
                    )}
                </div>
                <div className="mt-auto pt-8 border-t border-white/5 text-center opacity-30"><p className="text-[8px] font-black uppercase tracking-[0.5em] italic leading-relaxed">System state is secure and private.</p></div>
            </div>

             {showOutModal && (
                <div className="modal-overlay">
                    <div className="modal-content w-[400px]">
                        <button className="close-btn" onClick={() => setShowOutModal(false)}><X size={18} /></button>
                        <h3 className="italic font-black uppercase mb-4">Out-of-Location Request</h3>
                        <p className="text-[10px] font-bold text-slate-500 mb-8 uppercase tracking-widest leading-relaxed">Required for out-of-location authentication due to company business.</p>
                        <form onSubmit={handleOutRequest} className="space-y-6">
                            <div>
                                <label className="label-proto">Business Reason</label>
                                <textarea 
                                    name="reason" 
                                    value={outReason}
                                    onChange={(e) => setOutReason(e.target.value)}
                                    placeholder="Enter specific purpose (e.g. client meeting at Sector 4)" 
                                    required 
                                    className="w-full bg-black/40 border-b-2 border-slate-800 p-4 text-white font-bold text-xs uppercase outline-none h-32 resize-none"
                                />
                            </div>
                            <button className="btn-primary mt-4" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : 'SUBMIT FOR APPROVAL'}
                            </button>
                        </form>
                    </div>
                </div>
            )}


             {showReasonModal && (
                <div className="modal-overlay z-[200]">
                    <div className="modal-content w-[450px] border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.1)]">
                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 mb-4 animate-pulse">
                                <AlertCircle size={32} />
                            </div>
                            <h3 className="italic font-black text-2xl uppercase tracking-tighter">Compliance Lock</h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">Check-in Blocked</p>
                        </div>
                        
                        <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl mb-8">
                            <p className="text-[10px] font-bold text-amber-200 uppercase leading-relaxed italic">
                                You missed your check-out on {new Date(lastAutoCheckout?.createdAt).toLocaleDateString('en-GB')}. System has engaged a safety lock. Please provide a valid reason to resume operations.
                            </p>
                        </div>

                        <form onSubmit={handleReasonSubmit} className="space-y-6">
                            <div>
                                <label className="label-proto">Explain Missed Check-out</label>
                                <textarea 
                                    name="reason" 
                                    placeholder="e.g. System crash during exit / Emergency departure..." 
                                    required 
                                    className="w-full bg-black/40 border-b-2 border-slate-800 p-4 text-white font-bold text-xs uppercase outline-none h-24 resize-none focus:border-amber-500 transition-colors"
                                />
                            </div>
                            <button className="btn-primary bg-amber-600 hover:bg-amber-500 border-amber-700 shadow-amber-900/20" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : 'SUBMIT REASON & UNLOCK'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showLeaveModal && (
                <div className="modal-overlay">
                    <div className="modal-content w-[400px]">
                        <button className="close-btn" onClick={() => setShowLeaveModal(false)}><X size={18} /></button>
                        <h3 className="italic font-black uppercase mb-4 text-violet-500">Leave Permission</h3>
                        <p className="text-[10px] font-bold text-slate-500 mb-8 uppercase tracking-widest leading-relaxed">Request official leave. This will be sent to admin for approval.</p>
                        <form onSubmit={handleLeaveRequest} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label-proto">Start Date</label>
                                    <input 
                                        type="date"
                                        value={leaveDates.start}
                                        onChange={(e) => setLeaveDates(prev => ({ ...prev, start: e.target.value }))}
                                        required
                                        className="w-full bg-black/40 border-b-2 border-slate-800 p-2 text-white font-bold text-[10px] uppercase outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="label-proto">End Date</label>
                                    <input 
                                        type="date"
                                        value={leaveDates.end}
                                        onChange={(e) => setLeaveDates(prev => ({ ...prev, end: e.target.value }))}
                                        required
                                        className="w-full bg-black/40 border-b-2 border-slate-800 p-2 text-white font-bold text-[10px] uppercase outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="label-proto">Reason for Leave</label>
                                <textarea 
                                    value={leaveReason}
                                    onChange={(e) => setLeaveReason(e.target.value)}
                                    placeholder="Enter reason (e.g. Family emergency, Sick leave)" 
                                    required 
                                    className="w-full bg-black/40 border-b-2 border-slate-800 p-4 text-white font-bold text-xs uppercase outline-none h-24 resize-none"
                                />
                            </div>
                            <button className="btn-primary mt-4" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : 'SUBMIT REQUEST'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
             {showSyncDrawer && (
                <div className="modal-overlay z-[250]">
                    <div className="modal-content w-[450px]">
                        <button className="close-btn" onClick={() => setShowSyncDrawer(false)}><X size={18} /></button>
                        <h3 className="italic font-black uppercase mb-4 text-white flex items-center gap-2">
                            <WifiOff size={20} className="text-amber-500" /> Offline Sync Console
                        </h3>
                        <p className="text-[10px] font-bold text-slate-500 mb-8 uppercase tracking-widest leading-relaxed">
                            Manage punch events that were logged locally while offline and are waiting to upload.
                        </p>
                        
                        <div className="space-y-4 max-h-60 overflow-y-auto mb-8 pr-2">
                            {pendingPunches.length === 0 ? (
                                <p className="text-slate-600 font-bold uppercase text-[10px] text-center py-4">No pending offline actions.</p>
                            ) : (
                                pendingPunches.map((item) => (
                                    <div key={item.id} className="p-4 bg-white/5 border border-white/10 rounded-xl flex justify-between items-center">
                                        <div>
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                                item.type === 'check-in' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                                item.type === 'check-out' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                                                'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                            }`}>
                                                {item.type}
                                            </span>
                                            <p className="text-[9px] font-medium text-slate-500 mt-2 font-mono">{new Date(item.timestamp).toLocaleString()}</p>
                                            {item.payload?.reason && (
                                                <p className="text-[9px] font-bold text-slate-400 mt-1 italic">Reason: {item.payload.reason}</p>
                                            )}
                                        </div>
                                        <button 
                                            onClick={async () => {
                                                if (window.confirm("Delete this queued item?")) {
                                                    await offlineStore.deletePendingPunch(item.id);
                                                    fetchPendingPunches();
                                                }
                                            }}
                                            className="p-2 text-slate-500 hover:text-rose-500 transition-colors cursor-pointer"
                                            title="Delete from Queue"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={handleManualSync}
                                disabled={syncingOffline || pendingPunches.length === 0}
                                className="btn-primary flex-1 flex items-center justify-center gap-2 h-14 font-black italic tracking-widest cursor-pointer"
                            >
                                {syncingOffline ? (
                                    <Loader2 className="animate-spin" size={16} />
                                ) : (
                                    <RefreshCw size={14} />
                                )}
                                SYNC QUEUE
                            </button>
                            <button 
                                onClick={handleClearQueue}
                                disabled={pendingPunches.length === 0}
                                className="px-5 border border-white/10 rounded-2xl text-slate-400 hover:text-rose-500 hover:border-rose-500/30 transition-colors cursor-pointer"
                                title="Clear Queue"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PunchTerminal;
