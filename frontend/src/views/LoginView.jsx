import React, { useState } from 'react';
import { Fingerprint, ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const LoginView = ({ onBack, biometricEmail, setBiometricEmail, isStandalone }) => {
    const { login, loginWithPasskey, verifyOTP } = useAuth();
    const { showToast } = useToast();
    const [email, setEmail] = useState(biometricEmail || '');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [showOTP, setShowOTP] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const handleLogin = async (e) => {
        e.preventDefault(); 
        setLoading(true);
        try {
            const data = await login(email, password); 
            
            if (data.status === 'REQUIRE_OTP') {
                setShowOTP(true);
                showToast("New device detected. Check your email for a code.", "info");
            } else {
                localStorage.setItem('twishh_last_email', email);
                setBiometricEmail(email);
                showToast("Access Granted", "success");
            }
        } catch (err) { 
            showToast(err.response?.data?.error || "Invalid Credentials", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleOTPVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await verifyOTP(email, otp);
            localStorage.setItem('twishh_last_email', email);
            setBiometricEmail(email);
            showToast("Device Authorized", "success");
        } catch (err) {
            showToast(err.response?.data?.error || "Invalid Verification Code", "error");
        } finally {
            setLoading(false);
        }
    };

    if (showOTP) {
        return (
            <div className="app-container flex items-center justify-center min-h-[90vh] px-6">
                <div className="glass-panel w-full max-w-[420px] text-center p-8 md:p-12">
                    <button 
                        onClick={() => setShowOTP(false)} 
                        className="close-btn mb-8 flex items-center gap-2"
                    >
                        <ArrowLeft size={14} /> REVERT
                    </button>

                    <div className="flex flex-col items-center mb-10">
                        <div className="w-20 h-20 bg-violet-500/10 rounded-full flex items-center justify-center mb-6">
                            <ShieldCheck size={40} className="text-violet-500" />
                        </div>
                        <h3 className="italic font-black text-2xl mb-2 uppercase">Verify Device</h3>
                        <p className="text-[10px] font-black uppercase text-slate-700 tracking-[0.2em]">
                            Enter the 6-digit code sent to<br/> {email}
                        </p>
                    </div>

                    <form onSubmit={handleOTPVerify} className="space-y-8 text-left">
                        <div>
                            <label className="label-proto">Verification Code</label>
                            <input 
                                name="otp" 
                                type="text" 
                                placeholder="000000"
                                value={otp} 
                                onChange={(e) => setOtp(e.target.value)}
                                required 
                                maxLength={6}
                                className="text-center tracking-[1em] text-xl font-black"
                                autoComplete="off"
                            />
                        </div>
                        <button type="submit" className="btn-primary mt-6 h-14" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'AUTHORIZE DEVICE'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }
    
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
                    <form onSubmit={handleLogin} className="space-y-8 text-left">
                        <div>
                            <label className="label-proto">Email / Mobile Number</label>
                            <input 
                                name="e" 
                                type="text" 
                                placeholder="name@company.com or 9876543210"
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
                        <button type="submit" className="btn-primary mt-6 h-14" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'ESTABLISH LINK'}
                        </button>
                        
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
