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
    const { showToast } = useToast();
    const [showInstallGuide, setShowInstallGuide] = useState(false);
    const [isProvisioning, setIsProvisioning] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [infoModal, setInfoModal] = useState(null); // {title, content}
    const fadeInUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } } };
    const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.12 } } };

    const scrollToQuickStart = () => {
        const el = document.getElementById('quick-start-card');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
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
                    <button 
                        onClick={() => {
                            if (isInstallable) {
                                installPWA();
                            } else {
                                setShowInstallGuide(true);
                            }
                        }}
                        className="bg-amber-100/50 text-[#103e7a] px-4 py-1.5 rounded-full font-black text-[10px] flex items-center gap-2 border border-amber-200 animate-pulse"
                    >
                        <Zap size={12} fill="currentColor" /> GET APP
                    </button>
                    <motion.button whileHover={{ scale: 1.05 }} onClick={scrollToQuickStart} className="bg-[#103e7a] text-white px-6 py-2 rounded-full font-black text-[12px] uppercase shadow-lg shadow-blue-900/20">Book a Demo</motion.button>
                </div>
                <div className="md:hidden flex items-center gap-4">
                    <button 
                        onClick={() => {
                            if (isInstallable) {
                                installPWA();
                            } else {
                                setShowInstallGuide(true);
                            }
                        }}
                        className="bg-amber-100/50 text-[#103e7a] px-3 py-1 rounded-full font-black text-[9px] flex items-center gap-1 border border-amber-200"
                    >
                        <Zap size={10} fill="currentColor" /> GET APP
                    </button>
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
                                    <button 
                                        onClick={() => {
                                            setShowMobileMenu(false);
                                            if (isInstallable) {
                                                installPWA();
                                            } else {
                                                setShowInstallGuide(true);
                                            }
                                        }}
                                        className="text-left text-2xl font-black text-[#eab308] uppercase italic tracking-tighter hover:text-amber-600 transition-colors flex items-center gap-3"
                                    >
                                        <Zap size={20} fill="currentColor" /> GET APP
                                    </button>
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
                        <motion.button 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1, boxShadow: ["0 0 0px 0px rgba(234,179,8,0)", "0 0 20px 5px rgba(234,179,8,0.3)", "0 0 0px 0px rgba(234,179,8,0)"] }}
                            transition={{ 
                                opacity: { duration: 0.3 },
                                scale: { duration: 0.3 },
                                boxShadow: { repeat: Infinity, duration: 2 }
                            }}
                            whileHover={{ scale: 1.05 }} 
                            onClick={() => {
                                if (isInstallable) {
                                    installPWA();
                                } else {
                                    setShowInstallGuide(true);
                                }
                            }}
                            className="bg-[#eab308] text-[#103e7a] px-8 py-3 rounded-2xl font-black text-[13px] flex items-center gap-3 shadow-2xl relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                            <Zap size={18} fill="currentColor" /> INSTALL TWISHHSYNC APP
                        </motion.button>
                    </div>
                </motion.div>
                
                {/* Right Cream Area */}
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
                                            <input name="p" type="password" required className="w-full bg-transparent outline-none text-[#103e7a] font-extrabold text-[14px] placeholder-slate-400" placeholder="••••••••" />
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
                                    className="w-full mt-6 bg-[#103e7a] hover:bg-[#0a234b] transition-all text-white rounded-full py-4 font-black text-[18px] tracking-tight italic flex items-center justify-center gap-3 shadow-[0_20px_40px_-5px_rgba(16,62,122,0.4)]"
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
                            <div className={`w-full md:w-[46%] bg-white p-8 rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.04)] border border-gray-100 relative group hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)] transition-all duration-500 ${item.side === 'right' ? 'text-left' : 'text-left'}`}>
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

                            <button className="bg-white text-blue-900 px-10 py-4 rounded-full font-black tracking-wide shadow-xl flex items-center gap-3 group/btn">
                                Know More <ChevronRight size={18} className="group-hover/btn:translate-x-2 transition-transform"/>
                            </button>
                        </div>

                        <div className="lg:w-1/2 relative w-full h-[400px] md:h-[500px] flex items-center justify-center">
                            {/* Generic Mobile App Placeholders */}
                            <div className="relative w-[240px] h-[480px] bg-slate-900 rounded-[3rem] border-8 border-slate-800 shadow-2xl z-20 transform -rotate-6 -translate-x-12 transition-transform group-hover:rotate-0 group-hover:translate-x-0 duration-700">
                                <div className="absolute inset-0 bg-blue-600/10 rounded-[2.5rem] flex flex-col items-center justify-center p-6 border border-white/5">
                                    <div className="w-12 h-1 bg-slate-700 rounded-full mb-8"></div>
                                    <div className="w-24 h-24 rounded-full border-4 border-blue-400/30 flex items-center justify-center mb-6">
                                        {React.cloneElement(featureTabs[activeTab].i, { size: 48, className: "text-blue-400 opacity-50" })}
                                    </div>
                                    <div className="w-full h-2 bg-slate-700 rounded-full mb-3"></div>
                                    <div className="w-2/3 h-2 bg-slate-700 rounded-full mb-8"></div>
                                    <div className="grid grid-cols-2 gap-2 w-full mt-auto">
                                        <div className="h-10 bg-blue-600/40 rounded-xl"></div>
                                        <div className="h-10 bg-slate-700/40 rounded-xl"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute w-[240px] h-[480px] bg-slate-900 rounded-[3rem] border-8 border-slate-800 shadow-2xl z-10 transform rotate-6 translate-x-12 transition-transform group-hover:rotate-0 group-hover:translate-x-0 duration-700">
                                <div className="absolute inset-0 bg-violet-600/10 rounded-[2.5rem] flex flex-col items-center justify-center p-6 border border-white/5">
                                    <div className="w-12 h-1 bg-slate-700 rounded-full mb-8"></div>
                                    <div className="w-full h-32 bg-slate-800/60 rounded-2xl mb-6"></div>
                                    <div className="space-y-3 w-full">
                                        <div className="w-full h-2 bg-slate-700 rounded-full"></div>
                                        <div className="w-full h-2 bg-slate-700 rounded-full"></div>
                                        <div className="w-1/2 h-2 bg-slate-700 rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                            {/* Status Overlay */}
                            <div className="absolute bottom-10 right-0 z-30 bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center gap-3 shadow-2xl">
                                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg"><Activity size={16}/></div>
                                <div className="text-left">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">System Status</p>
                                    <p className="text-sm font-black text-white italic">99.9% Accuracy</p>
                                </div>
                            </div>
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
                                    e.target.src = `https://ui-avatars.com/api/?name=${ind.t}&background=0D8ABC&color=fff&size=512`;
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
                                        content: `1. DATA CATEGORIZATION: TwishhSync processes precise geolocation (Spatial Telemetry) and hardware-bound biometric handshakes. 

2. GEOGRAPHIC TRANSPARENCY: Location data is event-triggered during clock-operations only. We do NOT perform continuous background tracking. 

3. BIOMETRIC ZERO-KNOWLEDGE: Raw biometric sensors stay on-device. We only synchronize encrypted cryptographic proof (Templates). 

4. GLOBAL COMPLIANCE: Our data lifecycle is audited against GDPR (EU), BIPA (US), and PDPA standards for sensitive employee information.`
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
                                        content: `1. HUB LICENSE: Enterprises are granted a secure license to operate a TwishhSync Workspace Hub under these protocols. 

2. NODE RESPONSIBILITY: Corporate entities must ensure nodes (employees) have active GPS and Secure-Element (Biometric) hardware enabled. 

3. SYNC UPTIME (SLA): We guarantee 99.9% protocol availability for all Strategic Operations clusters. Node-level network failures are excluded. 

4. PURGE PROTOCOL: Upon de-registration, a "Deep Purge" cycle irreversibly deconstructs all personnel data and audit logs within 30 days.`
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
                                    <span className="text-blue-600">Android (Chrome):</span> Tap the three dots ⋮ and select "Install app" or "Add to Home screen".
                                </p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic">
                                <p className="text-[11px] font-bold text-slate-600 leading-relaxed uppercase">
                                    <span className="text-blue-600">Desktop:</span> Look for the install icon <span className="inline-block p-1 bg-white border border-slate-200 rounded mx-1">⊕</span> in the address bar.
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
