import React, { useState } from 'react';
import { ShieldCheck, ArrowLeft, Loader2, KeyRound, User, Fingerprint, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import axios from '../api/axios';
import { startAuthentication } from '@simplewebauthn/browser';

const LoginView = ({ onBack, isStandalone }) => {
    const { login, loginWithPasskey, verifyOTP } = useAuth();
    const { showToast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [showOTP, setShowOTP] = useState(false);
    const [loading, setLoading] = useState(false);
    const [passkeyLoading, setPasskeyLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    React.useEffect(() => {
        const lastUsername = localStorage.getItem('last_login_username');
        const hasPasskey = localStorage.getItem('has_passkey') === 'true';

        if (lastUsername) {
            setEmail(lastUsername);
        }

        if (hasPasskey && lastUsername) {
            const timer = setTimeout(() => {
                handlePasskeyLogin(lastUsername);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await login(email, password); 
            
            if (data.status === 'REQUIRE_OTP') {
                setShowOTP(true);
                showToast("Verification code sent to your email.", "info");
            } else {
                showToast("Login Successful", "success");
            }
        } catch (err) { 
            showToast(err.response?.data?.error || "Invalid Credentials", "error");
        } finally {
            setLoading(false);
        }
    };

    const handlePasskeyLogin = async (overrideEmail) => {
        const targetEmail = (typeof overrideEmail === 'string' ? overrideEmail : email)?.trim().toLowerCase();
        if (!targetEmail) {
            showToast("Enter email first to locate your passkey.", "error");
            return;
        }
        setPasskeyLoading(true);
        try {
            const optionsRes = await axios.get(`auth/passkey/login-options?email=${encodeURIComponent(targetEmail)}`);
            const options = optionsRes.data;

            const assertion = await startAuthentication({ optionsJSON: options });

            await loginWithPasskey(targetEmail, assertion);
            showToast("Passkey Verification Successful", "success");
        } catch (err) {
            console.error('Passkey Auth Error:', err);
            const errMsg = err.response?.data?.error || err.message || "Passkey login failed.";
            showToast(errMsg, "error");
        } finally {
            setPasskeyLoading(false);
        }
    };

    const handleOTPVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await verifyOTP(email, otp);
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
                <div className="glass-panel w-full max-w-[420px] text-center p-8 md:p-12 animate-in fade-in zoom-in-95 duration-500">
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
                        <h3 className="italic font-black text-2xl mb-2 uppercase text-white">Verify Device</h3>
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">
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
                        <button type="submit" className="btn-primary mt-6 h-14 flex items-center justify-center text-center" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" /> : 'AUTHORIZE DEVICE'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="app-container flex items-center justify-center min-h-[90vh] px-6">
            <div className="glass-panel w-full max-w-[420px] text-center p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col items-center mb-10">
                    <img src="/logo.png" alt="Logo" className="h-16 w-auto mb-4" />
                    <div className="flex items-center text-[24px] font-black tracking-tighter italic uppercase">
                        <span className="text-white">TWISHH</span>
                        <span className="text-violet-500 ml-1">SYNC</span>
                    </div>
                </div>

                <h3 className="italic font-black text-2xl mb-10 uppercase text-white">
                    {isStandalone ? "Employee Portal" : "Secure Access"}
                </h3>

                <form onSubmit={handleLogin} className="space-y-8 text-left">
                    <div>
                        <label className="label-proto">Email / Mobile Number</label>
                        <div className="relative">
                            <input 
                                name="e" 
                                type="text" 
                                placeholder="name@company.com"
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)}
                                required 
                                autoComplete="username"
                            />
                            <User className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700" size={16} />
                        </div>
                    </div>

                    <div>
                        <label className="label-proto">Security Password</label>
                        <div className="relative">
                            <input 
                                name="p" 
                                type={showPassword ? "text" : "password"} 
                                placeholder="••••••••"
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)}
                                required 
                                autoComplete="current-password"
                                className="pr-12"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                title={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-4 mt-6">
                        <button type="submit" className="btn-primary flex-1 h-14 flex items-center justify-center text-center" disabled={loading || passkeyLoading}>
                            {loading ? <Loader2 className="animate-spin" /> : 'LOG IN TO DASHBOARD'}
                        </button>
                        <button 
                            type="button" 
                            onClick={handlePasskeyLogin} 
                            disabled={loading || passkeyLoading}
                            className="w-14 h-14 rounded-2xl flex items-center justify-center bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 shadow-lg shadow-emerald-500/5 transition-all shrink-0 hover:scale-105 active:scale-95"
                            title="Sign in with Passkey"
                        >
                            {passkeyLoading ? <Loader2 className="animate-spin size-5" /> : <Fingerprint size={24} />}
                        </button>
                    </div>
                </form>
                
                <div className="text-center pt-8 mt-8 border-t border-white/5">
                    <button 
                        type="button" 
                        onClick={() => showToast("Support: twishhworkspace@gmail.com", "info")}
                        className="text-[9px] font-black uppercase text-slate-600 hover:text-white transition-colors tracking-[0.2em]"
                    >
                        Forgot Password or Access?
                    </button>
                </div>

                {!isStandalone && (
                    <button 
                        onClick={onBack}
                        className="mt-6 text-[10px] font-black uppercase text-slate-500 hover:text-violet-400 transition-colors flex items-center gap-2 mx-auto"
                    >
                        <ArrowLeft size={12} /> Back to Landing
                    </button>
                )}
            </div>
        </div>
    );
};

export default LoginView;
