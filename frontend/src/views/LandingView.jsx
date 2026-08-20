import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Activity, ShieldCheck, Navigation, TrendingUp, Monitor, 
    ChevronRight, Mail, Users, CheckCircle2, Clock, 
    AlertCircle, ShieldAlert, Zap, Factory, Stethoscope, PieChart as PieIcon, FileText,
    MapPin, Menu, X
} from 'lucide-react';
import AmbientBackground from '../components/AmbientBackground';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useToast } from '../context/ToastContext';

const LandingView = ({ onLogin, onSignup, onShowPrivacy, onShowTerms }) => {
    const { isInstallable, installPWA } = usePWAInstall();
    const isStandalone = typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);
    const { showToast } = useToast();
    const [showInstallGuide, setShowInstallGuide] = useState(false);
    const [isProvisioning, setIsProvisioning] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [infoModal, setInfoModal] = useState(null); // {title, content}

    // Sandbox and ROI States
    const [numEmployees, setNumEmployees] = useState(50);
    const [hourlyWage, setHourlyWage] = useState(35);
    const [nodeLocation, setNodeLocation] = useState({ x: 180, y: 150 });

    const cx = 150;
    const cy = 140;
    const dx = nodeLocation.x - cx;
    const dy = nodeLocation.y - cy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const isInside = distance <= 75;

    const hoursSavedWeekly = Math.round(numEmployees * 0.5);
    const buddyPunchingLeakageStopped = Math.round(numEmployees * 40 * hourlyWage * 0.03);
    const totalAnnualReturn = Math.round((hoursSavedWeekly * hourlyWage + buddyPunchingLeakageStopped) * 52);

    const fadeInUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } } };
    const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.12 } } };

    const scrollToQuickStart = () => {
        const el = document.getElementById('quick-start-card');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    const handleDirectInstall = () => {
        if (isInstallable) {
            installPWA();
        } else {
            const ua = typeof window !== 'undefined' ? window.navigator.userAgent.toLowerCase() : '';
            const isIOS = /ipad|iphone|ipod/.test(ua) && !window.MSStream;
            const isAndroid = /android/.test(ua);
            
            if (isIOS) {
                showToast("Safari iOS: Tap Share ⎋ and select 'Add to Home Screen' to install.", "info");
            } else if (isAndroid) {
                showToast("Android: Tap the three dots ⋮ and select 'Install app' or 'Add to Home screen'.", "info");
            } else {
                showToast("Others: Click the Install icon ⊕ in your browser's address bar.", "info");
            }
        }
    };

    const featureTabs = [
        {n:'Smart Geofencing', i:<Navigation/>, t:'Intelligent Perimeter Sync', d:'Our Smart Geofencing Hub ensures employees are exactly where they need to be, providing high-precision site handshakes across all branch locations.', f:['High-Precision GPS Site Handshake', 'Automatic clock-in via mobile hub', 'Real-time Perimeter Sync logic', 'Instant payroll-ready data generation']},
        {n:'Biometrics', i:<ShieldCheck/>, t:'Biometric Passkey Protocol', d:'Eliminate passwords entirely with our FIDO2-compliant Biometric Protocol. Hardware-linked keys ensure zero-compromise security.', f:['FIDO2 Passwordless Authentication', 'Biometric Touch-ID & Face-ID support', 'Hardware-Linked Device Binding', 'Encrypted spatial telemetry keys']},
        {n:'Geo Validation', i:<MapPin/>, t:'Spatial Accuracy Core', d:'Utilize advanced GPS and network triangulation to create invisible perimeters around your project sites and offices.', f:['Dynamic perimeter management', 'Entrance/Exit threshold alerts', 'Live site map visualization', 'Location history audit trails']},
        {n:'Analytics', i:<TrendingUp/>, t:'Data-Driven Workforce', d:'Transform raw attendance logs into actionable insights with our automated reporting engine and trend visualization.', f:['Automated weekly/monthly reports', 'Overtime and absence pattern detection', 'Branch-wise performance metrics', 'Export to Excel, PDF, or CSV']},
        {n:'Command Center', i:<Monitor/>, t:'Central Management Hub', d:'Manage your entire organization from a single, high-density interface designed for administrators and platform owners.', f:['One-Click Out-of-Location Approvals', 'Role-based access permissions', 'Bulk site and group management', 'Unified multi-tenant architecture']}
    ];
      return (
        <div className="w-full min-h-screen bg-white flex flex-col font-sans overflow-x-hidden text-slate-800 relative">
             <style>{`
               @keyframes scan {
                 0% { top: 0%; }
                 50% { top: 100%; }
                 100% { top: 0%; }
               }
               @keyframes pulseGlow {
                 0%, 100% { opacity: 0.15; transform: scale(1); }
                 50% { opacity: 0.35; transform: scale(1.05); }
               }
               @keyframes orbit {
                 0% { transform: rotate(0deg) translateX(40px) rotate(0deg); }
                 100% { transform: rotate(360deg) translateX(40px) rotate(-360deg); }
               }
               @keyframes ripple {
                 0% { transform: scale(0.8); opacity: 0.5; }
                 100% { transform: scale(2.2); opacity: 0; }
               }
               .animate-scan-line {
                 animation: scan 4s infinite linear;
               }
               .animate-pulse-glow {
                 animation: pulseGlow 2s infinite ease-in-out;
               }
             `}</style>
             <AmbientBackground />
             <nav className="fixed top-0 left-0 w-full bg-white/70 backdrop-blur-md flex justify-between items-center px-6 md:px-12 py-3 z-[100] border-b border-blue-50/20 shadow-sm transition-all">
                <div 
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
                    className="flex items-center gap-2 cursor-pointer group"
                >
                    <div className="w-[48px] h-[48px] flex items-center justify-center overflow-hidden transition-transform group-hover:scale-110">
                         <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex items-center text-[22px] font-black tracking-tighter leading-none italic uppercase">
                        <span className="text-[#103e7a] skew-x-[-12deg] inline-block">TWISHH</span>
                        <span className="text-[#eab308] skew-x-[-12deg] inline-block ml-1">SYNC</span>
                    </div>
                </div>
                <div className="hidden md:flex gap-10 items-center text-[13px] font-black text-[#103e7a] uppercase tracking-tighter italic">
                    <button 
                        onClick={() => document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' })} 
                        className="hover:text-blue-600 transition-colors cursor-pointer"
                    >
                        Features
                    </button>
                    <button 
                        onClick={() => document.getElementById('solutions-section')?.scrollIntoView({ behavior: 'smooth' })} 
                        className="hover:text-blue-600 transition-colors cursor-pointer"
                    >
                        Solutions
                    </button>
                    <button onClick={onLogin} className="hover:text-blue-600 transition-colors">Employee Portal</button>
                    {!isStandalone && (
                        <button 
                            onClick={handleDirectInstall}
                            className="bg-amber-100/50 text-[#103e7a] px-4 py-1.5 rounded-full font-black text-[10px] flex items-center gap-2 border border-amber-200 animate-pulse cursor-pointer"
                        >
                            <Zap size={12} fill="currentColor" /> GET APP
                        </button>
                    )}
                    <motion.button whileHover={{ scale: 1.05 }} onClick={scrollToQuickStart} className="bg-[#103e7a] text-white px-6 py-2 rounded-full font-black text-[12px] uppercase shadow-lg shadow-blue-900/20 transition-all cursor-pointer">Book a Demo</motion.button>
                </div>
                <div className="md:hidden flex items-center gap-4">
                    {!isStandalone && (
                        <button 
                            onClick={handleDirectInstall}
                            className="bg-amber-100/50 text-[#103e7a] px-3 py-1 rounded-full font-black text-[9px] flex items-center gap-1 border border-amber-200 transition-all cursor-pointer"
                        >
                            <Zap size={10} fill="currentColor" /> GET APP
                        </button>
                    )}
                    <button 
                        onClick={() => setShowMobileMenu(true)}
                        className="p-2 text-[#103e7a] hover:bg-blue-50/50 rounded-xl transition-colors"
                    >
                        <Menu size={24} />
                    </button>
                    <button onClick={onLogin} className="text-xs font-black text-[#103e7a] uppercase border-l border-blue-100 pl-4 py-1">Login</button>
                </div>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {showMobileMenu && (
                        <div className="fixed inset-0 z-[200]">
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowMobileMenu(false)}
                                className="absolute inset-0 bg-[#0a152e]/40 backdrop-blur-md"
                            />
                            <motion.div 
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="absolute top-0 right-0 w-[80%] max-w-sm h-full bg-white shadow-2xl flex flex-col p-8"
                            >
                                <div className="flex justify-between items-center mb-12">
                                    <div className="flex items-center text-[18px] font-black tracking-tighter italic uppercase">
                                        <span className="text-[#103e7a]">TWISHH</span>
                                        <span className="text-[#eab308] ml-1">SYNC</span>
                                    </div>
                                    <button onClick={() => setShowMobileMenu(false)} className="p-2 text-slate-400 hover:text-slate-800 transition-colors">
                                        <X size={24} />
                                    </button>
                                </div>
                                
                                <div className="flex flex-col gap-8 flex-1">
                                    <button 
                                        onClick={() => { setShowMobileMenu(false); document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' }); }}
                                        className="text-left text-2xl font-black text-[#103e7a] uppercase italic tracking-tighter hover:text-blue-600 transition-colors"
                                    >
                                        Features
                                    </button>
                                    <button 
                                        onClick={() => { setShowMobileMenu(false); document.getElementById('solutions-section')?.scrollIntoView({ behavior: 'smooth' }); }}
                                        className="text-left text-2xl font-black text-[#103e7a] uppercase italic tracking-tighter hover:text-blue-600 transition-colors"
                                    >
                                        Solutions
                                    </button>
                                    <button 
                                        onClick={() => { setShowMobileMenu(false); onLogin(); }}
                                        className="text-left text-2xl font-black text-[#103e7a] uppercase italic tracking-tighter hover:text-blue-600 transition-colors"
                                    >
                                        Portal
                                    </button>
                                    {!isStandalone && (
                                        <button 
                                            onClick={() => {
                                                setShowMobileMenu(false);
                                                handleDirectInstall();
                                            }}
                                            className="text-left text-2xl font-black text-[#eab308] uppercase italic tracking-tighter hover:text-amber-600 transition-colors flex items-center gap-3"
                                        >
                                            <Zap size={20} fill="currentColor" /> GET APP
                                        </button>
                                    )}
                                </div>

                                <button 
                                    onClick={() => { setShowMobileMenu(false); scrollToQuickStart(); }}
                                    className="mt-auto w-full bg-[#103e7a] text-white py-5 rounded-2xl font-black uppercase tracking-widest italic shadow-xl shadow-blue-900/20"
                                >
                                    Book a Demo
                                </button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
             </nav>
             <div className="relative flex flex-col lg:flex-row w-full min-h-[600px] pt-[64px] md:pt-[70px]">
                {/* Left Navy Area */}
                <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="w-full lg:w-[54%] bg-[#103e7a] pt-20 pb-28 md:pt-32 md:pb-40 px-8 md:pl-28 md:pr-24 flex flex-col relative z-20">
                    <div className="flex items-center gap-2 text-[10px] font-black text-[#eab308] uppercase tracking-[0.2em] mb-10">
                        <ShieldCheck size={14} /> ENTERPRISE GRADE
                    </div>
                    <h1 className="text-4xl md:text-[72px] font-black text-white leading-[0.95] mb-8 tracking-tighter italic uppercase">
                        Master Your<br className="hidden md:block"/>
                        <span className="text-[#eab308]">Workforce Data.</span>
                    </h1>
                    <p className="text-blue-50/80 text-sm md:text-[18px] mb-14 leading-relaxed max-w-[480px] font-semibold">
                        Eliminate manual errors, stop buddy punching, and monitor cross-branch attendance in real-time with our zero-trust tracking engine.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6 md:gap-12 items-start sm:items-center text-[16px] font-black mt-auto uppercase italic tracking-tighter">
                        <motion.button whileHover={{ scale: 1.05 }} onClick={scrollToQuickStart} className="text-[#eab308] flex items-center gap-2 hover:text-amber-300 transition-colors underline decoration-2 underline-offset-8">
                            Create Workspace <ChevronRight size={18} strokeWidth={4} />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} onClick={onLogin} className="text-white hover:text-blue-100 transition-colors">
                            Admin Login
                        </motion.button>
                        {!isStandalone && (
                            <motion.button 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1, boxShadow: ["0 0 0px 0px rgba(234,179,8,0)", "0 0 20px 5px rgba(234,179,8,0.3)", "0 0 0px 0px rgba(234,179,8,0)"] }}
                                transition={{ 
                                    opacity: { duration: 0.3 },
                                    scale: { duration: 0.3 },
                                    boxShadow: { repeat: Infinity, duration: 2 }
                                }}
                                whileHover={{ scale: 1.05 }} 
                                onClick={handleDirectInstall}
                                className="bg-[#eab308] text-[#103e7a] px-8 py-3 rounded-2xl font-black text-[13px] flex items-center gap-3 shadow-2xl relative overflow-hidden group hover:bg-amber-400 transition-colors cursor-pointer"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                                <Zap size={18} fill="currentColor" /> INSTALL TWISHHSYNC APP
                            </motion.button>
                        )}
                    </div>
                </motion.div>
                
                {/* Right Area */}
                <div className="w-full lg:w-[46%] bg-[#f5f7fa] relative py-16 px-6 lg:py-0 lg:px-0 flex items-center justify-center">
                    {/* Floating Quick Start Card */}
                    <motion.div id="quick-start-card" initial={{ opacity: 0, x: 50, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }} className="w-full max-w-[560px] lg:absolute lg:top-[5%] lg:-left-[140px] bg-white/40 backdrop-blur-xl rounded-[2.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)] overflow-hidden z-20 border border-white/50">
                        <div className="h-2 w-full bg-gradient-to-r from-[#103e7a] via-[#103e7a] to-[#eab308]"></div>
                        <div className="p-8 md:p-12 md:pr-16">
                            <h2 className="text-[#103e7a] text-[32px] md:text-[40px] font-black mb-1 tracking-tighter leading-none italic uppercase">Quick Start</h2>
                            <p className="text-slate-600 text-[13px] font-bold mb-8 md:mb-10 tracking-tight">Provision your company workspace in seconds.</p>
                            
                             <form className="space-y-6" onSubmit={async (e)=>{
                                e.preventDefault(); 
                                setIsProvisioning(true);
                                try {
                                    const formData = new FormData(e.target);
                                    await onSignup({
                                        companyName: formData.get('c'),
                                        adminName: formData.get('a'),
                                        email: formData.get('e'),
                                        password: formData.get('p')
                                    });
                                    showToast('Workspace Provisioned Successfully!', 'success');
                                } catch (error) {
                                    console.error("Provisioning Error:", error);
                                    showToast(error.response?.data?.error || 'Provisioning Failed. Please try again.', 'error');
                                } finally {
                                    setIsProvisioning(false);
                                }
                            }}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-black text-[#103e7a] uppercase mb-1 tracking-tight">COMPANY NAME</label>
                                        <div className="flex items-center bg-slate-100/50 border-b-2 border-slate-200 py-3 rounded-xl px-4 transition-all focus-within:bg-white focus-within:shadow-md focus-within:border-[#103e7a]">
                                            <Monitor className="text-[#103e7a]/60 mr-3" size={20} />
                                            <input name="c" required className="w-full bg-transparent outline-none text-[#103e7a] font-extrabold text-[14px] placeholder-slate-400" placeholder="Acme Corp" autoComplete="off" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black text-[#103e7a] uppercase mb-1 tracking-tight">ADMIN NAME</label>
                                        <div className="flex items-center bg-slate-100/50 border-b-2 border-slate-200 py-3 rounded-xl px-4 transition-all focus-within:bg-white focus-within:shadow-md focus-within:border-[#103e7a]">
                                            <Users className="text-[#103e7a]/60 mr-3" size={20} />
                                            <input name="a" required className="w-full bg-transparent outline-none text-[#103e7a] font-extrabold text-[14px] placeholder-slate-400" placeholder="John Doe" autoComplete="off" />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-black text-[#103e7a] uppercase mb-1 tracking-tight">WORK EMAIL</label>
                                        <div className="flex items-center bg-slate-100/50 border-b-2 border-slate-200 py-3 rounded-xl px-4 transition-all focus-within:bg-white focus-within:shadow-md focus-within:border-[#103e7a]">
                                            <Mail className="text-[#103e7a]/60 mr-3" size={20} />
                                            <input name="e" type="email" required className="w-full bg-transparent outline-none text-[#103e7a] font-extrabold text-[14px] placeholder-slate-400" placeholder="admin@company.com" autoComplete="off" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black text-[#103e7a] uppercase mb-1 tracking-tight">SECURITY KEY</label>
                                        <div className="flex items-center bg-slate-100/50 border-b-2 border-slate-200 py-3 rounded-xl px-4 transition-all focus-within:bg-white focus-within:shadow-md focus-within:border-[#103e7a]">
                                            <ShieldAlert className="text-[#103e7a]/60 mr-3" size={20} />
                                            <input name="p" type="password" required className="w-full bg-transparent outline-none text-[#103e7a] font-extrabold text-[14px] placeholder-slate-400" placeholder="••••••••" autoComplete="new-password" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 pt-2">
                                    <input type="checkbox" required className="w-5 h-5 accent-[#103e7a] cursor-pointer" />
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                        I agree to the 
                                        <span 
                                            className="text-[#103e7a] underline cursor-pointer px-1 relative z-30 hover:text-blue-600 font-black" 
                                            onClick={(e) => { e.stopPropagation(); setInfoModal({
                                                title: 'Terms of Service', 
                                                content: `1. HUB LICENSE: Enterprises are granted a secure license to operate a TwishhSync Workspace Hub under these protocols. 

2. NODE RESPONSIBILITY: Corporate entities must ensure nodes (employees) have active GPS and Secure-Element (Biometric) hardware enabled. 

3. SYNC UPTIME (SLA): We guarantee 99.9% protocol availability for all Strategic Operations clusters. Node-level network failures are excluded. 

4. PURGE PROTOCOL: Upon de-registration, a "Deep Purge" cycle irreversibly deconstructs all personnel data and audit logs within 30 days.`
                                            })}}
                                        >
                                            Terms of Service
                                        </span> 
                                        and 
                                        <span 
                                            className="text-[#103e7a] underline cursor-pointer px-1 relative z-30 hover:text-blue-600 font-black" 
                                            onClick={(e) => { e.stopPropagation(); setInfoModal({
                                                title: 'Privacy Protocol', 
                                                content: `1. DATA CATEGORIZATION: TwishhSync processes precise geolocation (Spatial Telemetry) and hardware-bound biometric handshakes. 

2. GEOGRAPHIC TRANSPARENCY: Location data is event-triggered during clock-operations only. We do NOT perform continuous background tracking. 

3. BIOMETRIC ZERO-KNOWLEDGE: Raw biometric sensors stay on-device. We only synchronize encrypted cryptographic proof (Templates). 

4. GLOBAL COMPLIANCE: Our data lifecycle is audited against GDPR (EU), BIPA (US), and PDPA standards for sensitive employee information.`
                                            })}}
                                        >
                                            Privacy Policy
                                        </span>.
                                    </p>
                                </div>

                                <motion.button 
                                    whileHover={{ scale: 1.02 }} 
                                    whileTap={{ scale: 0.98 }} 
                                    disabled={isProvisioning} 
                                    type="submit" 
                                    className="w-full mt-6 bg-[#103e7a] hover:bg-[#0a234b] transition-all text-white rounded-full py-4 font-black text-[18px] tracking-tight italic flex items-center justify-center gap-3 shadow-[0_20px_40px_-5px_rgba(16,62,122,0.4)] cursor-pointer"
                                >
                                    {isProvisioning ? (
                                        <>PROVISIONING PLATFORM...</>
                                    ) : (
                                        <>Launch Platform &rarr;</>
                                    )}
                                </motion.button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Stats Strip */}
            <div className="px-4 mt-20 lg:mt-24 relative z-30">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeInUp} className="max-w-[1240px] w-full mx-auto bg-white/60 backdrop-blur-lg rounded-3xl lg:rounded-full shadow-[0_30px_60px_-15px_rgba(0,0,0,0.12)] py-10 px-6 lg:px-16 border border-white/60 mb-12">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 lg:divide-x divide-gray-300 text-center">
                        <div className="px-4">
                            <div className="text-3xl md:text-[44px] font-black text-[#103e7a] tracking-tighter mb-1 leading-none">99.9%</div>
                            <div className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest">UPTIME SLA</div>
                        </div>
                        <div className="px-4">
                            <div className="text-3xl md:text-[44px] font-black text-[#103e7a] tracking-tighter mb-1 leading-none">100%</div>
                            <div className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest">BIOMETRIC INTEGRITY</div>
                        </div>
                        <div className="px-4">
                            <div className="text-3xl md:text-[44px] font-black text-[#103e7a] tracking-tighter mb-1 leading-none">&lt; 2s</div>
                            <div className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest">VERIFICATION HANDSHAKE</div>
                        </div>
                        <div className="px-4">
                            <div className="text-3xl md:text-[44px] font-black text-[#f43f5e] tracking-tighter mb-1 leading-none">1-Click</div>
                            <div className="text-[9px] md:text-[10px] font-black text-[#f43f5e] uppercase tracking-widest">PAYROLL REPORTS</div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Interactive Telemetry Sandbox & ROI Engine */}
            <div className="px-4 py-16 relative z-30 max-w-[1240px] w-full mx-auto">
                <div className="text-center mb-16">
                    <span className="text-[10px] font-black text-[#103e7a] uppercase tracking-[0.3em] mb-4 block">Interactive Demo</span>
                    <h2 className="text-3xl md:text-5xl font-black text-[#103e7a] mb-6 italic tracking-tighter uppercase">Live GPS Geofence & <span className="text-[#eab308]">ROI Simulator</span></h2>
                    <p className="text-slate-505 text-xs font-semibold mb-6 max-w-2xl mx-auto text-slate-500">Click coordinates on the live radar grid to move the employee device and calculate real-time financial yield from automated clocking.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                    {/* Sandbox Geofence Card */}
                    <div className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-[0_20px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)] transition-all duration-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 blur-[80px] pointer-events-none"></div>
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-black text-slate-800 italic uppercase tracking-tight flex items-center gap-2">
                                    <Navigation className="text-[#103e7a] rotate-45" size={20} /> Geofence Radar Simulator
                                </h3>
                                <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border transition-colors ${isInside ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm' : 'bg-rose-50 border-rose-200 text-rose-600 shadow-sm'}`}>
                                    {isInside ? 'Inside Bounds' : 'Out of bounds'}
                                </div>
                            </div>
                            <p className="text-slate-500 text-xs font-semibold mb-6">Click anywhere inside the dark radar grid below to update employee location and test the boundary security engine.</p>
                        </div>

                        {/* Interactive Geofence Map */}
                        <div className="relative mb-6">
                            <svg 
                                width="100%" 
                                height="280" 
                                className="bg-slate-950/80 rounded-2xl border border-slate-800/80 cursor-crosshair relative overflow-hidden shadow-inner"
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const x = Math.round(e.clientX - rect.left);
                                    const y = Math.round(e.clientY - rect.top);
                                    setNodeLocation({ x, y });
                                }}
                            >
                                {/* Grid Background */}
                                <defs>
                                    <pattern id="sandbox-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(234,179,8,0.03)" strokeWidth="1" />
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#sandbox-grid)" />
                                
                                {/* Geofence Boundary Circle */}
                                <circle 
                                    cx={cx} 
                                    cy={cy} 
                                    r="75" 
                                    fill={isInside ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.04)"} 
                                    stroke={isInside ? "#10b981" : "#ef4444"} 
                                    strokeWidth="2" 
                                    strokeDasharray="4 4"
                                    className="transition-all duration-300"
                                />
                                <circle 
                                    cx={cx} 
                                    cy={cy} 
                                    r="75" 
                                    fill="none" 
                                    stroke={isInside ? "#10b981" : "#ef4444"} 
                                    strokeWidth="6" 
                                    className="opacity-15 animate-ping"
                                    style={{ transformOrigin: `${cx}px ${cy}px` }}
                                />
                                
                                {/* Geofence Label */}
                                <text x={cx} y={cy - 10} textAnchor="middle" className="text-[10px] font-black fill-slate-400 uppercase tracking-widest pointer-events-none select-none">
                                    Office Zone
                                </text>
                                <text x={cx} y={cy + 10} textAnchor="middle" className="text-[9px] font-bold fill-slate-500 uppercase tracking-tight pointer-events-none select-none">
                                    Radius: 75m
                                </text>

                                {/* Employee Pin */}
                                <g transform={`translate(${nodeLocation.x - 12}, ${nodeLocation.y - 24})`} className="transition-all duration-300 pointer-events-none">
                                    <circle cx="12" cy="24" r="6" fill={isInside ? "#10b981" : "#ef4444"} className="opacity-40 animate-ping" style={{ transformOrigin: "12px 24px" }} />
                                    <path 
                                        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" 
                                        fill={isInside ? "#10b981" : "#ef4444"} 
                                        className="drop-shadow-lg"
                                    />
                                </g>
                            </svg>
                        </div>

                        {/* Telemetry Logs Container */}
                        <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 font-mono text-[10px] leading-relaxed shadow-inner select-all">
                            <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-2 text-slate-500 uppercase tracking-widest font-black">
                                <span>SYSTEM TELEMETRY FEED</span>
                                <span className="animate-pulse text-emerald-400 font-bold">● LIVE</span>
                            </div>
                            <div className="space-y-1">
                                <p className="text-slate-500">&gt; GPS COORDINATE HANDSHAKE INIT...</p>
                                <p className="text-slate-300">
                                    &gt; NODE X: <span className="text-[#eab308]">{nodeLocation.x}px</span> | Y: <span className="text-[#eab308]">{nodeLocation.y}px</span>
                                </p>
                                <p className="text-slate-300">
                                    &gt; SPATIAL DISTANCE FROM RADAR CENTER: <span className="text-blue-400">{distance.toFixed(1)}m</span>
                                </p>
                                <p className={isInside ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                    {isInside 
                                        ? '> STATUS: VERIFIED (Lat: 19.076, Lng: 72.877) | FIDO2 Key: PASS'
                                        : '> STATUS: OUT OF LOCATION | Requesting 1-Click Exemption Portal'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ROI Calculator Card */}
                    <div className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-[0_20px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)] transition-all duration-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/5 blur-[80px] pointer-events-none"></div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 italic uppercase tracking-tight flex items-center gap-2 mb-6">
                                <TrendingUp className="text-[#103e7a]" size={20} /> ROI Calculator Engine
                            </h3>
                            <p className="text-slate-500 text-xs font-semibold mb-8">Adjust the dials below to represent your organization. Let's calculate the financial leakages saved by our geofence automation.</p>
                        </div>

                        {/* Sliders Container */}
                        <div className="space-y-6 mb-8">
                            {/* Company Size Slider */}
                            <div>
                                <div className="flex items-center justify-between text-xs font-black text-slate-600 uppercase tracking-wider mb-2">
                                    <span>Company Size</span>
                                    <span className="text-[#103e7a] text-sm font-extrabold">{numEmployees} employees</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="5" 
                                    max="1000" 
                                    value={numEmployees}
                                    onChange={(e) => setNumEmployees(parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#103e7a] border border-slate-200"
                                />
                            </div>

                            {/* Average Hourly Wage Slider */}
                            <div>
                                <div className="flex items-center justify-between text-xs font-black text-slate-600 uppercase tracking-wider mb-2">
                                    <span>Average Hourly Wage</span>
                                    <span className="text-[#103e7a] text-sm font-extrabold">${hourlyWage}/hr</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="10" 
                                    max="120" 
                                    value={hourlyWage}
                                    onChange={(e) => setHourlyWage(parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#103e7a] border border-slate-200"
                                />
                            </div>
                        </div>

                        {/* Calculation Rollup Panels */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Hours Saved Weekly</p>
                                <p className="text-2xl font-black text-slate-800 italic tracking-tight uppercase">{hoursSavedWeekly} hrs</p>
                                <p className="text-[8px] font-bold text-slate-400 mt-1">Manual logging overhead eliminated</p>
                            </div>
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Buddy Punching Saved</p>
                                <p className="text-2xl font-black text-slate-800 italic tracking-tight uppercase">${buddyPunchingLeakageStopped.toLocaleString()}/wk</p>
                                <p className="text-[8px] font-bold text-slate-400 mt-1">Based on industry-standard 3% leakage</p>
                            </div>
                        </div>

                        {/* Total Return Panel */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 text-center">
                            <p className="text-[10px] font-black text-[#103e7a] uppercase tracking-[0.2em] mb-1">TOTAL ANNUAL FINANCIAL YIELD</p>
                            <p className="text-3xl md:text-4xl font-black text-[#103e7a] tracking-tighter italic uppercase">
                                ${totalAnnualReturn.toLocaleString()} <span className="text-xs text-slate-500 font-black not-italic lowercase">/yr</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Why Choose Location Based (6 Grid) */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp} className="w-full py-12 md:py-16 bg-transparent flex flex-col items-center relative z-10">
                <div className="px-6 text-center max-w-2xl mb-12 md:mb-16">
                    <span className="text-[9px] font-black text-[#e11d48] uppercase tracking-[0.3em] mb-4 block">INDUSTRY STANDARD</span>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-[#113264] mb-4">Why Choose Our Location System</h2>
                    <p className="text-slate-500">Experience measurable improvements in accuracy, efficiency, and cost savings.</p>
                </div>
                
                <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1200px] w-full px-6 md:px-8">
                    {[{t:'Enhanced Accuracy',d:'Eliminate buddy punching and ensure precise tracking.',i:<MapPin/>}, {t:'Cost Reduction',d:'Reduce administrative costs and minimize errors.',i:<Monitor/>}, {t:'Improved Security',d:'Device binding and spatial logic protect your org.',i:<ShieldCheck/>}, {t:'Time Savings',d:'Instant reporting and reduced manual work.',i:<Clock size={24}/>}, {t:'Scalable Solution',d:'Support unlimited users and multi-site deployments.',i:<TrendingUp/>}, {t:'Compliance Ready',d:'Labor law compliance and audit trail maintenance.',i:<FileText/>}].map((f, i)=>(
                        <motion.div variants={fadeInUp} whileHover={{ y: -8, transition: { duration: 0.2 } }} key={i} className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm hover:shadow-xl transition-shadow">
                            <div className="w-12 h-12 bg-blue-50/50 rounded-xl flex items-center justify-center text-blue-600 mb-6">{f.i}</div>
                            <h3 className="font-bold text-lg text-slate-800 mb-2">{f.t}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">{f.d}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </motion.div>

            {/* Interactive Timeline Challenges */}
            <div className="w-full py-16 md:py-24 bg-[#f8fbff]/60 flex flex-col items-center relative overflow-hidden z-20">
                <div className="px-6 text-center max-w-2xl mb-16 md:mb-20 relative z-10">
                    <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-6 tracking-tight">Common Attendance Management <span className="text-rose-500">Challenges We Solve</span></h2>
                    <p className="text-slate-500 font-medium">Traditional attendance systems create more problems than they solve. Our smart management system eliminates these pain points.</p>
                </div>
                
                <div className="relative max-w-[1100px] w-full px-6 md:px-8">
                    {/* Growing Vertical Line */}
                    <motion.div 
                        initial={{ height: 0 }}
                        whileInView={{ height: '90%' }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        className="absolute h-full w-[3px] bg-rose-200 left-[50%] transform -translate-x-1/2 top-0"
                    ></motion.div>

                    {[
                        {title:'Manual Attendance Tracking', icon:<Clock/>, desc:'Time-consuming manual processes, human errors in data entry, and buddy punching issues plague traditional systems.'},
                        {title:'Inaccurate Time Logging', side:'right', icon:<AlertCircle/>, desc:'Proxy attendance marking, time theft, and unreliable records create payroll discrepancies.'},
                        {title:'Complex Reporting', icon:<FileText/>, desc:'Manual report generation, data inconsistencies, and limited analytics capabilities waste valuable time.'},
                        {title:'Security Concerns', side:'right', icon:<ShieldAlert/>, desc:'Unauthorized access, identity verification issues, and data breach vulnerabilities threaten your organization.'},
                        {title:'Integration Challenges', icon:<Zap/>, desc:'Disconnected systems, data silos, and manual data transfer create operational inefficiencies.'}
                    ].map((item, idx) => (
                        <motion.div 
                            key={idx}
                            initial={{ opacity: 0, x: item.side === 'right' ? 50 : -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6, delay: idx * 0.1 }}
                            className={`w-full flex ${item.side === 'right' ? 'justify-end' : 'justify-start'} relative mb-16 md:mb-24`}
                        >
                            <div className="w-full md:w-[46%] bg-white p-8 rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.04)] border border-gray-100 relative group hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)] transition-all duration-500 text-left">
                                <div className="flex items-start gap-5">
                                    <div className="p-4 rounded-2xl bg-rose-50 text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors duration-300 shadow-sm">
                                        {React.cloneElement(item.icon, { size: 24 })}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-xl text-slate-800 mb-3 tracking-tight">{item.title}</h4>
                                        <p className="text-sm text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                                    </div>
                                </div>
                            </div>
                            {/* Red Dot Indicator on Line */}
                            <motion.div 
                                initial={{ scale: 0 }}
                                whileInView={{ scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.3 + (idx * 0.1) }}
                                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-white border-4 border-rose-500 rounded-full z-20 shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                            ></motion.div>
                        </motion.div>
                    ))}
                </div>

                {/* CTA in the middle of timeline area */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="mt-12 bg-white/80 backdrop-blur-md p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-white/60 text-center max-w-xl w-full mx-6 relative z-30"
                >
                    <h3 className="text-2xl font-black text-slate-800 mb-4">Ready to Solve These Problems?</h3>
                    <p className="text-slate-500 mb-8 font-medium italic">Let us show you how our smart attendance management system can eliminate these challenges for your organization.</p>
                    <button onClick={() => onSignup()} className="bg-rose-500 hover:bg-rose-600 text-white px-10 py-4 rounded-full font-black tracking-wide shadow-lg shadow-rose-500/30 transition-all transform hover:scale-105">Book a Free Demo</button>
                </motion.div>
            </div>

            {/* High-Fidelity Features Tabs */}
            <div id="features-section" className="w-full bg-[#0a152e] py-20 md:py-32 px-6 md:px-10 flex flex-col items-center text-white overflow-hidden relative z-20">
                <div className="text-center mb-16">
                    <p className="text-blue-400 text-xs font-black tracking-[0.4em] uppercase mb-4">TRACK, SECURE & OPTIMIZE</p>
                    <h2 className="text-4xl md:text-6xl font-black mb-6 italic tracking-tighter">Features that you'll <span className="text-blue-400 font-normal not-italic">✨</span> ever need.</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto font-medium">Experience the next generation of attendance tracking. Our smart face recognition system combines AI precision with location intelligence.</p>
                </div>
                
                <div className="w-full max-w-6xl">
                    {/* Tab Switcher */}
                    <div className="flex flex-wrap justify-center gap-3 mb-16">
                        {featureTabs.map((tab, i) => (
                            <button 
                                key={i} 
                                onClick={() => setActiveTab(i)}
                                className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[13px] font-black border transition-all duration-300 ${activeTab === i ? 'bg-blue-600 border-blue-500 text-white shadow-[0_10px_30px_rgba(37,99,235,0.4)]' : 'bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 text-slate-400'}`}
                            >
                                {React.cloneElement(tab.i, { size: 18 })}
                                {tab.n}
                            </button>
                        ))}
                    </div>
                    
                    {/* Feature Content Split */}
                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="flex flex-col lg:flex-row gap-12 bg-white/[0.02] rounded-[3rem] p-8 md:p-16 border border-white/5 items-center relative overflow-hidden group"
                    >
                        {/* Background Glow */}
                        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/10 blur-[120px] pointer-events-none"></div>

                        <div className="lg:w-1/2">
                            <div className="inline-block bg-blue-900/40 text-blue-300 text-[10px] font-black px-4 py-1.5 rounded-full tracking-[0.2em] border border-blue-800/50 mb-8 uppercase">Next-Gen Attendance Solution</div>
                            <h3 className="text-4xl md:text-5xl font-black mb-8 leading-tight italic">{featureTabs[activeTab].t}</h3>
                            <p className="text-slate-400 text-lg leading-relaxed mb-10 font-medium italic">{featureTabs[activeTab].d}</p>
                            
                            <div className="space-y-4 mb-10">
                                {featureTabs[activeTab].f.map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 text-slate-300">
                                        <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400"><CheckCircle2 size={12}/></div>
                                        <span className="text-sm font-bold italic">{item}</span>
                                    </div>
                                ))}
                            </div>

                            <button onClick={scrollToQuickStart} className="bg-white text-blue-900 hover:bg-slate-100 px-10 py-4 rounded-full font-black tracking-wide shadow-xl flex items-center gap-3 group/btn uppercase italic">
                                Book a Demo <ChevronRight size={18} className="group-hover/btn:translate-x-2 transition-transform"/>
                            </button>
                        </div>

                        {/* Animated Satellite Telemetry SVG */}
                        <div className="lg:w-1/2 relative w-full h-[400px] md:h-[500px] flex items-center justify-center bg-slate-950/40 rounded-[3rem] border border-slate-800/40 overflow-hidden shadow-2xl p-6">
                            <svg viewBox="0 0 400 400" className="w-full h-full max-w-[380px] select-none pointer-events-none">
                                {/* Defs */}
                                <defs>
                                    <linearGradient id="sat-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#eab308" />
                                        <stop offset="100%" stopColor="#3b82f6" />
                                    </linearGradient>
                                    <linearGradient id="glow-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#eab308" stopOpacity="0.4" />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                                    </linearGradient>
                                </defs>
                                
                                {/* Ambient Pulsing Radar Rings from Ground Station */}
                                <circle cx="200" cy="300" r="40" fill="none" stroke="rgba(234,179,8,0.2)" strokeWidth="1">
                                    <animate attributeName="r" values="40;100;160" dur="4s" repeatCount="indefinite" />
                                    <animate attributeName="opacity" values="0.8;0.3;0" dur="4s" repeatCount="indefinite" />
                                </circle>
                                <circle cx="200" cy="300" r="70" fill="none" stroke="rgba(59,130,246,0.15)" strokeWidth="1">
                                    <animate attributeName="r" values="70;130;190" dur="4s" begin="2s" repeatCount="indefinite" />
                                    <animate attributeName="opacity" values="0.8;0.3;0" dur="4s" begin="2s" repeatCount="indefinite" />
                                </circle>
                                
                                {/* Geofence Floor Base */}
                                <ellipse cx="200" cy="300" rx="90" ry="25" fill="rgba(15,23,42,0.6)" stroke="rgba(234,179,8,0.4)" strokeWidth="2" strokeDasharray="5 3" />
                                <ellipse cx="200" cy="300" rx="90" ry="25" fill="none" stroke="#eab308" strokeWidth="4" className="opacity-20 animate-pulse" />
                                
                                {/* Telemetry Downlink Beam Cone */}
                                <polygon points="200,60 110,300 290,300" fill="url(#glow-grad)" className="opacity-60" />
                                
                                {/* Telemetry Data Signal Pulses (Downward moving dots) */}
                                <circle cx="200" cy="60" r="4" fill="#eab308">
                                    <animate attributeName="cy" values="60;300" dur="3s" repeatCount="indefinite" />
                                    <animate attributeName="r" values="3;5;2" dur="3s" repeatCount="indefinite" />
                                </circle>
                                <circle cx="180" cy="60" r="3" fill="#3b82f6">
                                    <animate attributeName="cy" values="80;280" dur="2.5s" begin="1s" repeatCount="indefinite" />
                                    <animate attributeName="cx" values="180;150" dur="2.5s" begin="1s" repeatCount="indefinite" />
                                </circle>
                                <circle cx="220" cy="60" r="3" fill="#10b981">
                                    <animate attributeName="cy" values="70;290" dur="2.8s" begin="0.5s" repeatCount="indefinite" />
                                    <animate attributeName="cx" values="220;240" dur="2.8s" begin="0.5s" repeatCount="indefinite" />
                                </circle>

                                {/* Orbit Path for Satellite */}
                                <path d="M 120 60 A 80 20 0 1 1 280 60" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="3 3" />
                                
                                {/* Satellite Object */}
                                <g transform="translate(180, 30)">
                                    <rect x="0" y="10" width="40" height="8" rx="2" fill="#475569" />
                                    <rect x="16" y="0" width="8" height="28" rx="2" fill="url(#sat-grad)" />
                                    <circle cx="20" cy="14" r="5" fill="#f8fafc" />
                                    {/* Pulsing indicator */}
                                    <circle cx="20" cy="14" r="9" fill="none" stroke="#eab308" strokeWidth="2" className="opacity-50">
                                        <animate attributeName="r" values="5;14" dur="1.5s" repeatCount="indefinite" />
                                        <animate attributeName="opacity" values="1;0" dur="1.5s" repeatCount="indefinite" />
                                    </circle>
                                    {/* Satellite Solar Panels */}
                                    <path d="M -10,12 L 0,10 L 0,18 L -10,16 Z" fill="#3b82f6" stroke="#1e40af" strokeWidth="0.5" />
                                    <path d="M 50,12 L 40,10 L 40,18 L 50,16 Z" fill="#3b82f6" stroke="#1e40af" strokeWidth="0.5" />
                                    
                                    <animateTransform 
                                        attributeName="transform" 
                                        type="translate" 
                                        values="160,30; 220,35; 160,30" 
                                        dur="12s" 
                                        repeatCount="indefinite" 
                                    />
                                </g>

                                {/* Mobile Device at Center of Base */}
                                <g transform="translate(185, 270)">
                                    {/* Phone Base shadow */}
                                    <rect x="-2" y="-2" width="34" height="64" rx="6" fill="#020617" opacity="0.8" />
                                    {/* Phone Frame */}
                                    <rect x="0" y="0" width="30" height="60" rx="5" fill="#1e293b" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                                    {/* Screen */}
                                    <rect x="2" y="4" width="26" height="52" rx="3" fill="#0f172a" />
                                    {/* Camera/Notch */}
                                    <rect x="11" y="2" width="8" height="2" rx="1" fill="#475569" />
                                    
                                    {/* Dynamic UI Render inside phone */}
                                    <circle cx="15" cy="24" r="8" fill="none" stroke="#eab308" strokeWidth="1.5">
                                        <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
                                    </circle>
                                    <path d="M 12,24 L 14,26 L 18,22" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    
                                    {/* Mini Progress Bar */}
                                    <rect x="6" y="40" width="18" height="3" rx="1.5" fill="#334155" />
                                    <rect x="6" y="40" width="12" height="3" rx="1.5" fill="#eab308">
                                        <animate attributeName="width" values="0;18;18" dur="3s" repeatCount="indefinite" />
                                    </rect>
                                    
                                    {/* Handshake Verification Check */}
                                    <g className="animate-bounce" style={{ transformOrigin: "15px 48px" }}>
                                        <circle cx="15" cy="48" r="3" fill="#10b981" />
                                    </g>
                                </g>
                                
                                {/* Floating Verified Node Data HUD Card */}
                                <g transform="translate(25, 120)">
                                    <rect x="0" y="0" width="120" height="50" rx="12" fill="rgba(15,23,42,0.85)" stroke="rgba(59,130,246,0.3)" strokeWidth="1.5" />
                                    {/* Indicator Dot */}
                                    <circle cx="15" cy="25" r="4" fill="#10b981">
                                        <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" />
                                    </circle>
                                    {/* Text HUD */}
                                    <text x="28" y="20" className="text-[7px] font-black fill-slate-400 uppercase tracking-widest">SPATIAL SYNC</text>
                                    <text x="28" y="32" className="text-[9px] font-black fill-slate-100 italic uppercase">VERIFIED</text>
                                    <text x="28" y="42" className="text-[6px] font-bold fill-emerald-400 uppercase tracking-tight">LAT: 19.076 / LNG: 72.877</text>
                                </g>
                                
                                {/* Floating Biometric Passkey HUD Card */}
                                <g transform="translate(255, 180)">
                                    <rect x="0" y="0" width="120" height="50" rx="12" fill="rgba(15,23,42,0.85)" stroke="rgba(234,179,8,0.3)" strokeWidth="1.5" />
                                    {/* Fingerprint Glyph Outline */}
                                    <path d="M 12 18 C 15 15, 21 15, 24 18 M 10 23 C 14 19, 22 19, 26 23 M 12 28 C 15 25, 21 25, 24 28 M 15 33 C 18 31, 22 31, 25 33" fill="none" stroke="#eab308" strokeWidth="1.5" strokeLinecap="round" />
                                    {/* Text HUD */}
                                    <text x="36" y="20" className="text-[7px] font-black fill-slate-400 uppercase tracking-widest">FIDO2 SECURE</text>
                                    <text x="36" y="32" className="text-[9px] font-black fill-slate-100 italic uppercase">PASSKEY OK</text>
                                    <text x="36" y="42" className="text-[6px] font-bold fill-amber-400 uppercase tracking-tight">BOUND DEVICE ID: #8F8C</text>
                                </g>
                            </svg>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Attendance Tracking Solutions Across Industries */}
            <motion.div id="solutions-section" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp} className="w-full py-16 md:py-24 bg-transparent flex flex-col items-center relative z-10">
                <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-16 text-center italic tracking-tight">Attendance Tracking System <span className="text-blue-600 not-italic">Solutions Across Industries</span></h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-6 md:px-10 max-w-6xl w-full">
                    {[
                        {t:'Corporate Offices', i:<Monitor/>, img:'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=600&q=80'},
                        {t:'Manufacturing', i:<Factory/>, img:'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80'},
                        {t:'Healthcare', i:<Stethoscope/>, img:'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80'},
                        {t:'Education', i:<Users/>, img:'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=600&q=80'},
                        {t:'Retail', i:<PieIcon/>, img:'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80'},
                        {t:'Construction', i:<MapPin/>, img:'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=600&q=80'}
                    ].map((ind, i)=>(
                        <motion.div 
                            key={i}
                            whileHover={{ y: -15, scale: 1.02 }}
                            className="group relative h-72 rounded-[2.5rem] overflow-hidden shadow-lg cursor-pointer bg-slate-100"
                        >
                            <img 
                                src={ind.img} 
                                alt={ind.t} 
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                onError={(e) => {
                                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${ind.t}&background=0D8ABC&color=fff&size=512`;
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
                            <div className="absolute bottom-8 left-8 text-white">
                                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/20 group-hover:bg-blue-600 transition-colors duration-300">
                                    {React.cloneElement(ind.i, { size: 24, className: 'text-white' })}
                                </div>
                                <h4 className="text-2xl font-black italic uppercase tracking-tighter skew-x-[-12deg] inline-block">{ind.t}</h4>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Footer */}
            <footer className="w-full bg-white py-16 px-12 border-t border-gray-100 flex flex-col md:flex-row justify-between items-start text-sm relative z-20">
                <div className="max-w-xs mb-8 md:mb-0">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
                            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <div className="font-extrabold text-2xl tracking-tighter text-[#113264] italic uppercase">
                            TWISHH<span className="text-amber-500">SYNC</span>
                        </div>
                    </div>
                    <p className="text-slate-500 leading-relaxed mb-6">Simplifying business operations with smart software solutions. We help companies streamline processes and drive growth.</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-12 w-full lg:w-auto">
                    <div>
                        <h5 className="font-bold text-slate-800 mb-4">Quick Links</h5>
                        <ul className="space-y-2 text-slate-500">
                            <li><button onClick={() => setInfoModal({title: 'About TwishhSync', content: 'TwishhSync is a next-generation workspace management hub designed to synchronize personnel logic and spatial telemetry for modern enterprises.'})} className="hover:text-blue-600 transition-colors">About Us</button></li>
                            <li><button onClick={() => setInfoModal({title: 'Join the Cluster', content: 'We are looking for strategic thinkers in AI, IoT, and Backend Engineering. Send your neural signature to twishhworkspace@gmail.com.'})} className="hover:text-blue-600 transition-colors">Careers</button></li>
                            <li><button onClick={() => setShowInstallGuide(true)} className="hover:text-blue-600 transition-colors">Install App Guide</button></li>
                        </ul>
                    </div>
                    <div>
                        <h5 className="font-bold text-slate-800 mb-4">Legal</h5>
                        <ul className="space-y-2 text-slate-500">
                            <li>
                                <button 
                                    onClick={() => setInfoModal({
                                        title: 'Privacy Protocol', 
                                        content: `1. DATA CATEGORIZATION: TwishhSync processes precise geolocation (Spatial Telemetry) and hardware-bound biometric handshakes. \n\n2. GEOGRAPHIC TRANSPARENCY: Location data is event-triggered during clock-operations only. We do NOT perform continuous background tracking. \n\n3. BIOMETRIC ZERO-KNOWLEDGE: Raw biometric sensors stay on-device. We only synchronize encrypted cryptographic proof (Templates). \n\n4. GLOBAL COMPLIANCE: Our data lifecycle is audited against GDPR (EU), BIPA (US), and PDPA standards for sensitive employee information.`
                                    })} 
                                    className="hover:text-blue-600 transition-colors"
                                >
                                    Privacy Policy
                                </button>
                            </li>
                            <li>
                                <button 
                                    onClick={() => setInfoModal({
                                        title: 'Terms of Service', 
                                        content: `1. HUB LICENSE: Enterprises are granted a secure license to operate a TwishhSync Workspace Hub under these protocols. \n\n2. NODE RESPONSIBILITY: Corporate entities must ensure nodes (employees) have active GPS and Secure-Element (Biometric) hardware enabled. \n\n3. SYNC UPTIME (SLA): We guarantee 99.9% protocol availability for all Strategic Operations clusters. Node-level network failures are excluded. \n\n4. PURGE PROTOCOL: Upon de-registration, a "Deep Purge" cycle irreversibly deconstructs all personnel data and audit logs within 30 days.`
                                    })} 
                                    className="hover:text-blue-600 transition-colors"
                                >
                                    Terms of Service
                                </button>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h5 className="font-bold text-slate-800 mb-4">Contact</h5>
                        <ul className="space-y-2 text-slate-500">
                            <li><a href="mailto:twishhworkspace@gmail.com" className="hover:text-blue-600 transition-colors">twishhworkspace@gmail.com</a></li>
                            <li><button onClick={() => setInfoModal({title: 'Global Hubs', content: 'Our neural clusters are located in US-East, Mumbai, and Singapore to ensure zero-latency handshake for all branch locations.'})} className="hover:text-blue-600 transition-colors">Global Hubs</button></li>
                        </ul>
                    </div>
                </div>
            </footer>

            {/* Manual Install Global Guide */}
            {showInstallGuide && (
                <div className="modal-overlay">
                    <div className="modal-content w-[450px]">
                        <button className="close-btn" onClick={() => setShowInstallGuide(false)}><X size={20} /></button>
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-900/20">
                                <Monitor className="text-white" size={32} />
                            </div>
                            <h3 className="italic font-black text-2xl uppercase tracking-tighter">Install TwishhSync</h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Home Screen Protocol Guide</p>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic">
                                <p className="text-[11px] font-bold text-slate-600 leading-relaxed uppercase">
                                    <span className="text-blue-600">iOS (Safari):</span> Tap the share icon <span className="inline-block p-1 bg-white border border-slate-200 rounded mx-1">⎋</span> and select "Add to Home Screen".
                                </p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic">
                                <p className="text-[11px] font-bold text-slate-600 leading-relaxed uppercase">
                                    <span className="text-blue-600">Android:</span> Tap the three dots ⋮ and select "Install app" or "Add to Home screen".
                                </p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic">
                                <p className="text-[11px] font-bold text-slate-600 leading-relaxed uppercase">
                                    <span className="text-blue-600">Others:</span> Look for the install icon <span className="inline-block p-1 bg-white border border-slate-200 rounded mx-1">⊕</span> in the address bar.
                                </p>
                            </div>
                        </div>

                        {isInstallable && (
                             <button 
                                onClick={() => { installPWA(); setShowInstallGuide(false); }}
                                className="w-full mt-8 bg-[#103e7a] text-white py-4 rounded-full font-black text-[14px] italic uppercase tracking-widest shadow-lg shadow-blue-900/20"
                            >
                                Trigger Instant Install
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Informational Modal */}
            {infoModal && (
                <div className="modal-overlay">
                    <div className="modal-content w-[450px]">
                        <button className="close-btn" onClick={() => setInfoModal(null)}><X size={20} /></button>
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-violet-600/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-violet-500/20">
                                <FileText className="text-violet-500" size={32} />
                            </div>
                            <h3 className="italic font-black text-2xl uppercase tracking-tighter">{infoModal.title}</h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Enterprise Resource Document</p>
                        </div>
                        
                        <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 mb-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                            <p className="text-[13px] font-bold text-slate-600 leading-relaxed uppercase italic whitespace-pre-line">
                                {infoModal.content}
                            </p>
                        </div>

                        <button 
                            onClick={() => setInfoModal(null)}
                            className="w-full bg-[#103e7a] text-white py-4 rounded-full font-black text-[14px] italic uppercase tracking-widest shadow-lg shadow-blue-900/20"
                        >
                            ACKNOWLEDGE PROTOCOL
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LandingView;
