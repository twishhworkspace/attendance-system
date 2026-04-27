import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import { 
    History, MapPin, Loader2, Fingerprint, LogOut, Navigation, X 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import RadarSystem from '../components/RadarSystem';
import Skeleton from '../components/Skeleton';

import { useOfflineSync } from '../hooks/useOfflineSync';
import { offlineStore } from '../utils/offlineStore';

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

    useOfflineSync(); // This will handle background syncing of queue

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
        } 
        finally { setLoading(false); setRefreshing(false); } 
    };

    useEffect(() => { fetchS(); }, []);

    const handleOutRequest = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const pos = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, (err) => {
                    if (err.code === 1) reject(new Error("LOCATION ACCESS DENIED: Spatial protocol requires GPS verification."));
                    else reject(err);
                }, { enableHighAccuracy: true });
            });
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
            const pos = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, (err) => {
                    if (err.code === 1) reject(new Error("LOCATION ACCESS DENIED: Spatial protocol requires active GPS telemetry."));
                    else if (err.code === 3) reject(new Error("GPS TIMEOUT: Signal too weak for spatial handshake."));
                    else reject(err);
                }, { enableHighAccuracy: true, timeout: 10000 });
            });

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
                const errorMsg = apiErr.response?.data?.error || "Neural Link Failure: Verification Interrupted.";
                showToast(errorMsg, "error");
                setSpatialStatus(!apiErr.response ? 'network-error' : null);
            }
        } catch (err) {
            showToast(err.message || "GPS Handshake Error", "error");
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
                <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] mb-12">
                   {loading ? <Skeleton width={120} height={10} /> : `Connection Status: ${spatialStatus === 'verified' ? 'CONNECTED' : (spatialStatus === 'out' ? 'LOCATION ERROR' : spatialStatus === 'network-error' ? 'NO NETWORK' : 'CONNECTING...')}`}
                </p>
                
                    <div className="flex flex-col gap-4 items-center w-full max-w-sm">
                        {user?.authenticators?.length === 0 && (
                            <button 
                                onClick={() => setView('settings')}
                                className="w-full p-4 bg-violet-600/10 border border-violet-500/20 rounded-2xl flex items-center justify-center gap-3 group hover:bg-violet-500/20 transition-all mb-2"
                            >
                                <Fingerprint className="text-violet-500 group-hover:scale-110 transition-transform" />
                                <div className="text-left">
                                    <p className="text-[10px] font-black text-white uppercase italic">Enable Fast Login</p>
                                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Link Fingerprint / FaceID</p>
                                </div>
                            </button>
                        )}
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
                                            const pos = await new Promise((resolve, reject) => {
                                                navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true });
                                            });
                                            const payload = { 
                                                location: `${pos.coords.latitude}, ${pos.coords.longitude}`,
                                                accuracy: pos.coords.accuracy
                                            };

                                            if (!navigator.onLine) {
                                                await offlineStore.savePendingPunch({ type: 'check-in', payload });
                                                showToast("Signal Lost. Check-In queued for sync.", "warning");
                                                setStatus({ checkIn: new Date(), status: 'PRESENT' }); // Optimistic local state
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
                                            const pos = await new Promise((resolve, reject) => {
                                                navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true });
                                            });
                                            const payload = { 
                                                location: `${pos.coords.latitude}, ${pos.coords.longitude}`,
                                                accuracy: pos.coords.accuracy
                                            };

                                            if (!navigator.onLine) {
                                                await offlineStore.savePendingPunch({ type: 'check-out', payload });
                                                showToast("Signal Lost. Check-Out queued for sync.", "warning");
                                                setStatus(null); // Optimistic local state clearing
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
                        
                        {(spatialStatus === 'out' || !active && !isApprovedOut) && !loading && (
                            <button 
                                onClick={() => setShowOutModal(true)}
                                className="text-[9px] font-black uppercase text-amber-500/60 hover:text-white transition-all tracking-[0.2em] px-4 py-2 bg-amber-500/5 border border-amber-500/10 rounded-lg hover:bg-amber-500/20"
                            >
                                <Navigation size={10} className="inline mr-2" /> Out-of-Location Check-in
                            </button>
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
        </div>
    );
};

export default PunchTerminal;
