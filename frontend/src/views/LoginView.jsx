import React, { useState } from 'react';
import { Fingerprint } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const LoginView = ({ onBack, biometricEmail, setBiometricEmail, isStandalone }) => {
    const { login, loginWithPasskey } = useAuth();
    const { showToast } = useToast();
    const [email, setEmail] = useState(biometricEmail || '');
    const [password, setPassword] = useState('');
    
    return (
        <div className="app-container flex items-center justify-center min-h-[90vh] px-6">
            <div className="glass-panel w-full max-w-[420px] text-center p-8 md:p-12">
                {!isStandalone && (
                    <button 
                        onClick={() => {
                            setEmail('');
                            setPassword('');
                            if (onBack) onBack();
                        }} 
                        className="close-btn mb-8"
                    >
                        REVERT
                    </button>
                )}
                <div className="flex flex-col items-center mb-10">
                    <img src="/logo.png" alt="Logo" className="h-16 w-auto mb-4" />
                    <div className="flex items-center text-[24px] font-black tracking-tighter italic uppercase">
                        <span className="text-white">TWISHH</span>
                        <span className="text-violet-500 ml-1">SYNC</span>
                    </div>
                </div>
                
                <h3 className="italic font-black text-2xl mb-10 uppercase">
                    {isStandalone ? "Employee Portal Access" : "Secure Access"}
                </h3>
                
                <div className="space-y-6">
                    {biometricEmail && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) && (
                        <button 
                            onClick={async () => {
                                try {
                                    await loginWithPasskey(biometricEmail);
                                    showToast("Biometric Signature Verified", "success");
                                } catch (err) { 
                                    showToast(err.response?.data?.error || "Biometric Authentication Failed", "error");
                                }
                            }}
                            className="w-full h-16 bg-violet-600/10 border-2 border-violet-500/30 rounded-2xl flex items-center justify-center gap-4 group hover:bg-violet-500/20 transition-all mb-4"
                        >
                            <Fingerprint className="text-violet-500 group-hover:scale-110 transition-transform" />
                            <span className="text-[11px] font-black italic uppercase tracking-widest text-violet-500">Touch to Login</span>
                        </button>
                    )}

                    <form onSubmit={async (e)=>{ 
                        e.preventDefault(); 
                        try {
                            await login(email, password); 
                            localStorage.setItem('twishh_last_email', email);
                            setBiometricEmail(email);
                            showToast("Access Granted", "success");
                        } catch (err) { 
                            showToast(err.response?.data?.error || "Invalid Credentials", "error");
                        }
                    }} className="space-y-8 text-left">
                        <div>
                            <label className="label-proto">Email</label>
                            <input 
                                name="e" 
                                type="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)}
                                required 
                                autoComplete="off"
                            />
                        </div>
                        <div>
                            <label className="label-proto">Password</label>
                            <input 
                                name="p" 
                                type="password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)}
                                required 
                                autoComplete="off"
                            />
                        </div>
                        <button type="submit" className="btn-primary mt-6 h-14">ESTABLISH LINK</button>
                        
                        <div className="text-center pt-4 border-t border-white/5">
                            <button 
                                type="button" 
                                onClick={() => showToast("Support: twishhworkspace@gmail.com", "info")}
                                className="text-[9px] font-black uppercase text-slate-600 hover:text-white transition-colors tracking-[0.2em]"
                            >
                                Forgot Password?
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginView;
