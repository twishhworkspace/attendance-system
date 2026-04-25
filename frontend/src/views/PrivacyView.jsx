import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Server, RefreshCcw } from 'lucide-react';

const PrivacyView = ({ onBack }) => {
    const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

    return (
        <div className="flex-1 overflow-y-auto px-6 py-12 md:px-20 md:py-24 bg-white text-slate-800">
            <div className="max-w-4xl mx-auto">
                <motion.button 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    onClick={onBack}
                    className="mb-12 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-violet-500 transition-colors"
                >
                    &larr; Back to Platform
                </motion.button>

                <motion.div initial="hidden" animate="visible" variants={fadeInUp} transition={{ duration: 0.6 }}>
                    <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-4 text-[#103e7a]">
                        Privacy <span className="text-amber-500">Policy.</span>
                    </h1>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-16">Last Updated: April 2026</p>

                    <div className="space-y-16">
                        <section>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-10 h-10 bg-blue-50 flex items-center justify-center rounded-xl text-blue-600"><Shield size={20}/></div>
                                <h2 className="text-2xl font-black italic uppercase tracking-tight">1. Data Collection</h2>
                            </div>
                            <p className="text-lg leading-relaxed text-slate-600 font-medium">
                                TwishhSync collects information necessary to provide high-fidelity attendance tracking services. This includes company name, administrator contact details, and employee professional information.
                            </p>
                        </section>

                        <section>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-10 h-10 bg-amber-50 flex items-center justify-center rounded-xl text-amber-600"><Server size={20}/></div>
                                <h2 className="text-2xl font-black italic uppercase tracking-tight">2. Spatial Telemetry</h2>
                            </div>
                            <p className="text-lg leading-relaxed text-slate-600 font-medium">
                                Our platform utilizes GPS and network triangulation data to verify attendance within authorized zones. <span className="font-bold text-[#103e7a]">We do not track location in the background.</span> Location data is only accessed during active check-in/out handshakes.
                            </p>
                        </section>

                        <section>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-10 h-10 bg-emerald-50 flex items-center justify-center rounded-xl text-emerald-600"><Lock size={20}/></div>
                                <h2 className="text-2xl font-black italic uppercase tracking-tight">3. Biometric Security</h2>
                            </div>
                            <p className="text-lg leading-relaxed text-slate-600 font-medium">
                                We support hardware-backed biometric verification (Passkeys). <span className="font-bold text-[#103e7a]">TwishhSync never sees or stores your actual fingerprint or face data.</span> These remain on your device's secure enclave; we only receive a cryptographic proof of authentication.
                            </p>
                        </section>

                        <section>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-10 h-10 bg-rose-50 flex items-center justify-center rounded-xl text-rose-600"><RefreshCcw size={20}/></div>
                                <h2 className="text-2xl font-black italic uppercase tracking-tight">4. Data Retention</h2>
                            </div>
                            <p className="text-lg leading-relaxed text-slate-600 font-medium">
                                By default, TwishhSync retains attendance logs for a period of <span className="font-bold text-[#103e7a]">3 years</span> to comply with labor laws and audit requirements, after which data is automatically purged from our production clusters.
                            </p>
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default PrivacyView;
