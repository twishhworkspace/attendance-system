import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const SettingsView = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [company, setCompany] = useState(null);
    const [companyLoading, setCompanyLoading] = useState(false);

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'COMPANY_ADMIN';

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
            showToast("Identity Synced successfully.", "success");
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
            showToast("Company Protocol Updated.", "success");
        } catch(err) { 
            // Handled by AxiosInterceptor
        } finally { 
            setLoading(false); 
        }
    };

    return (
        <div className="flex-1 flex flex-col gap-10 max-w-4xl mx-auto animate-in fade-in duration-500 pb-20">
            <div className="glass-panel w-full">
                <h3 className="italic font-black text-2xl uppercase tracking-tighter mb-2">Security & Identity</h3>
                <p className="text-[10px] font-black uppercase text-slate-700 tracking-[0.2em] mb-12">Manage your authentication protocol and personnel data</p>
                
                <form onSubmit={handleProfileUpdate} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div><label className="label-proto">Full Identity Name</label><input name="n" defaultValue={user?.name} required autoComplete="off" /></div>
                        <div><label className="label-proto">Logic Link (Email)</label><input name="e" defaultValue={user?.email} required type="email" autoComplete="off" /></div>
                    </div>
                    <div>
                        <label className="label-proto">New Access Password</label>
                        <input name="p" type="password" placeholder="Leave blank to maintain current link" minLength={6} />
                        <p className="text-[8px] font-bold text-slate-700 mt-2 uppercase italic tracking-widest">Only update if your current password node is compromised.</p>
                    </div>
                    <button type="submit" className="btn-primary h-14" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin mx-auto" /> : 'UPDATE IDENTITY'}
                    </button>
                </form>
            </div>

            {isAdmin && (
                <div className="glass-panel w-full border-violet-500/10">
                    <h3 className="italic font-black text-2xl uppercase tracking-tighter mb-2">Company Configuration</h3>
                    <p className="text-[10px] font-black uppercase text-slate-700 tracking-[0.2em] mb-12">Organization metadata and spatial headquarters defaults</p>
                    
                    {companyLoading ? <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto opacity-20" /></div> : (
                        <form onSubmit={handleCompanyUpdate} className="space-y-8">
                            <div><label className="label-proto">Organization Name</label><input name="cn" defaultValue={company?.name} required autoComplete="off" /></div>
                            <div><label className="label-proto">HQ Hub Address</label><input name="ca" defaultValue={company?.address} required autoComplete="off" /></div>
                            <button type="submit" className="btn-primary h-14" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin mx-auto" /> : 'SYNC COMPANY PROTOCOL'}
                            </button>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
};

export default SettingsView;
