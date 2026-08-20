import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { startRegistration } from '@simplewebauthn/browser';

const SettingsView = () => {
    const { user, refreshUser } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [company, setCompany] = useState(null);
    const [companyLoading, setCompanyLoading] = useState(false);
    const [registeringPasskey, setRegisteringPasskey] = useState(false);
    const [clearingPasskey, setClearingPasskey] = useState(false);

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN';
    const hasPasskey = user?.authenticators && user.authenticators.length > 0;

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    useEffect(() => {
        if (isAdmin) {
            const fetchCompany = async () => {
                setCompanyLoading(true);
                try {
                    const prof = await axios.get('auth/profile');
                    setCompany(prof.data.company);
                } catch (err) { 
                    console.error('Company Telemetry Failure:', err); 
                } finally { 
                    setCompanyLoading(false); 
                }
            };
            fetchCompany();
        }
    }, [isAdmin]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.put('auth/profile', {
                name: e.target.n.value,
                email: e.target.e.value,
                password: e.target.p.value || undefined
            });
            showToast("Profile updated successfully.", "success");
            await refreshUser();
        } catch(err) { 
            // Handled by AxiosInterceptor
        } finally { 
            setLoading(false); 
        }
    };

    const handleCompanyUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.put('admin/company', {
                name: e.target.cn.value,
                address: e.target.ca.value
            });
            showToast("Company settings updated.", "success");
        } catch(err) { 
            // Handled by AxiosInterceptor
        } finally { 
            setLoading(false); 
        }
    };

    const handleRegisterPasskey = async () => {
        setRegisteringPasskey(true);
        try {
            const optionsRes = await axios.get('auth/passkey/register-options');
            const options = optionsRes.data;

            const attestation = await startRegistration({ optionsJSON: options });

            await axios.post('auth/passkey/register-verify', attestation);

            await refreshUser();
            showToast("Biometric passkey registered successfully!", "success");
        } catch (err) {
            console.error('WebAuthn Registration Error:', err);
            const errMsg = err.response?.data?.error || err.message || "Failed to register passkey.";
            showToast(errMsg, "error");
        } finally {
            setRegisteringPasskey(false);
        }
    };

    const handleClearPasskeys = async () => {
        if (!window.confirm("Are you sure you want to remove all registered biometric passkeys for this account? This will disable biometric sign-in until you register again.")) {
            return;
        }
        setClearingPasskey(true);
        try {
            await axios.delete('auth/passkey/clear');
            await refreshUser();
            showToast("All biometric passkeys cleared successfully.", "success");
        } catch (err) {
            console.error('WebAuthn Clear Error:', err);
            const errMsg = err.response?.data?.error || err.message || "Failed to clear passkeys.";
            showToast(errMsg, "error");
        } finally {
            setClearingPasskey(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col gap-10 max-w-4xl mx-auto animate-in fade-in duration-500 pb-20">
            <div className="glass-panel w-full">
                <h3 className="italic font-black text-2xl uppercase tracking-tighter mb-2">Security & Identity</h3>
                <p className="text-[10px] font-black uppercase text-slate-700 tracking-[0.2em] mb-12">Manage your security settings and profile data</p>
                
                <form onSubmit={handleProfileUpdate} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div><label className="label-proto">Full Name</label><input name="n" defaultValue={user?.name} required autoComplete="off" /></div>
                        <div><label className="label-proto">Email Address</label><input name="e" defaultValue={user?.email} required type="email" autoComplete="off" /></div>
                    </div>
                    <div>
                        <label className="label-proto">New Access Password</label>
                        <input name="p" type="password" placeholder="Leave blank to keep current password" minLength={6} />
                        <p className="text-[8px] font-bold text-slate-700 mt-2 uppercase italic tracking-widest">Only update if your current password needs to be changed.</p>
                    </div>
                    <button type="submit" className="btn-primary h-14" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin mx-auto" /> : 'UPDATE PROFILE'}
                    </button>
                </form>
            </div>

            <div className="glass-panel w-full border-emerald-500/10">
                <h3 className="italic font-black text-2xl uppercase tracking-tighter mb-2">Biometric Sign-In (Passkeys)</h3>
                <p className="text-[10px] font-black uppercase text-slate-700 tracking-[0.2em] mb-8">Register FaceID, Fingerprint or device hardware login keys for 1-click access</p>
                <div className="bg-black/20 p-6 rounded-2xl border border-white/5 space-y-6">
                    {hasPasskey && (
                        <div className="flex items-center gap-2.5 text-emerald-500 font-bold text-[10px] uppercase tracking-wider bg-emerald-500/5 border border-emerald-500/15 p-4 rounded-xl">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse"></span>
                            This account has registered biometrics
                        </div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                        <div>
                            <h4 className="text-xs font-bold uppercase text-white tracking-wider mb-1">Passkey Authentication</h4>
                            <p className="text-[9px] text-slate-500 uppercase font-black tracking-tight leading-relaxed max-w-md">
                                Hardware security keys provide cryptographic, phishing-resistant access to your account directly via device biometric scanners.
                            </p>
                        </div>
                        <div className="flex gap-4 w-full sm:w-auto shrink-0">
                            {hasPasskey ? (
                                <>
                                    <button 
                                        onClick={handleRegisterPasskey} 
                                        disabled={registeringPasskey || clearingPasskey} 
                                        className="btn-primary flex-1 sm:flex-initial py-3 px-6 text-[10px] uppercase font-black italic bg-slate-800 hover:bg-slate-700 border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        {registeringPasskey ? <Loader2 className="animate-spin size-4" /> : 'Add Device'}
                                    </button>
                                    <button 
                                        onClick={handleClearPasskeys} 
                                        disabled={registeringPasskey || clearingPasskey} 
                                        className="flex-1 sm:flex-initial py-3 px-6 text-[10px] uppercase font-black italic border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        {clearingPasskey ? <Loader2 className="animate-spin size-4" /> : 'Remove'}
                                    </button>
                                </>
                            ) : (
                                <button 
                                    onClick={handleRegisterPasskey} 
                                    disabled={registeringPasskey} 
                                    className="btn-primary w-full sm:w-auto py-3 px-6 text-[10px] uppercase font-black italic bg-emerald-600 hover:bg-emerald-500 border-emerald-700 shadow-emerald-900/10 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {registeringPasskey ? <Loader2 className="animate-spin size-4" /> : 'Register Passkey'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {isAdmin && (
                <div className="glass-panel w-full border-violet-500/10">
                    <h3 className="italic font-black text-2xl uppercase tracking-tighter mb-2">Company Configuration</h3>
                    <p className="text-[10px] font-black uppercase text-slate-700 tracking-[0.2em] mb-12">Organization details and office address</p>
                    
                    {companyLoading ? <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto opacity-20" /></div> : (
                        <form onSubmit={handleCompanyUpdate} className="space-y-8">
                            <div><label className="label-proto">Organization Name</label><input name="cn" defaultValue={company?.name} required autoComplete="off" /></div>
                            <div><label className="label-proto">Company Address</label><input name="ca" defaultValue={company?.address} required autoComplete="off" /></div>
                            <button type="submit" className="btn-primary h-14" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin mx-auto" /> : 'UPDATE COMPANY SETTINGS'}
                            </button>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
};

export default SettingsView;
