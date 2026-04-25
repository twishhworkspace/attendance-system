import React, { useState } from 'react';
import axios from '../api/axios';
import { Database, Loader2, CheckSquare, Square } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const SignupView = ({ onBack, prefillData = {}, onShowPrivacy, onShowTerms }) => {
    const [loading, setLoading] = useState(false);
    const [accepted, setAccepted] = useState(false);
    const { showToast } = useToast();
    
    return (
        <div className="flex-1 flex items-center justify-center animate-in fade-in duration-500">
            <div className="glass-panel w-[460px] p-12">
                <button onClick={onBack} className="close-btn mb-8">BACK</button>
                <div className="flex items-center gap-4 mb-10">
                    <Database className="text-violet-500" size={32} />
                    <div>
                        <h3 className="italic font-black text-2xl uppercase tracking-tighter">Register Your Company</h3>
                        <p className="text-[9px] font-black uppercase text-slate-700 tracking-[0.2em]">Platform Onboarding</p>
                    </div>
                </div>
                <form onSubmit={async (e) => { 
                    e.preventDefault(); 
                    if (!accepted) {
                        showToast("Please agree to the Terms and Privacy Policy.", "warning");
                        return;
                    }
                    setLoading(true); 
                    try { 
                        await axios.post('auth/register-company', { 
                            companyName: e.target.c.value, 
                            adminName: e.target.a.value, 
                            email: e.target.e.value, 
                            password: e.target.p.value 
                        }); 
                        showToast("Workspace Created successfully! Please log in.", "success"); 
                        onBack(); 
                    } catch(err) { 
                        showToast(err.response?.data?.error || "Registration Failed", "error");
                    } finally { 
                        setLoading(false); 
                    }
                }} className="space-y-6 text-left">
                    <div><label className="label-proto">Company Name</label><input name="c" defaultValue={prefillData.companyName} placeholder="E.g. Nexus Dynamics" required autoComplete="off" /></div>
                    <div><label className="label-proto">Admin Name</label><input name="a" defaultValue={prefillData.adminName} placeholder="Full Name" required autoComplete="off" /></div>
                    <div><label className="label-proto">Email Address</label><input name="e" defaultValue={prefillData.email} type="email" placeholder="admin@company.com" required autoComplete="off" /></div>
                    <div><label className="label-proto">Password</label><input name="p" defaultValue={prefillData.password} type="password" placeholder="At least 6 characters" minLength={6} required /></div>
                    
                    <div className="pt-4">
                        <div 
                            onClick={() => setAccepted(!accepted)}
                            className="flex items-start gap-3 cursor-pointer group"
                        >
                            <div className="mt-0.5">
                                {accepted ? <CheckSquare className="text-violet-500" size={16} /> : <Square className="text-slate-700 group-hover:text-slate-500" size={16} />}
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-widest">
                                I agree to the TwishhSync <button type="button" onClick={(e) => { e.stopPropagation(); onShowTerms(); }} className="text-violet-500 hover:underline">Terms of Service</button> and <button type="button" onClick={(e) => { e.stopPropagation(); onShowPrivacy(); }} className="text-violet-500 hover:underline">Privacy Policy</button>.
                            </p>
                        </div>
                    </div>

                    <button type="submit" className="btn-primary mt-6 h-14" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin mx-auto" /> : 'CREATE WORKSPACE'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SignupView;
