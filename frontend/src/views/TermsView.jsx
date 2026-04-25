import React from 'react';
import { motion } from 'framer-motion';
import { Book, FileCheck, Scale, AlertTriangle, HelpCircle } from 'lucide-react';

const TermsView = ({ onBack }) => {
    const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

    return (
        <div className="flex-1 overflow-y-auto px-6 py-12 md:px-20 md:py-24 bg-white text-slate-800 border-l border-slate-100">
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
                        Terms of <span className="text-amber-500">Service.</span>
                    </h1>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-16">Last Updated: April 2026</p>

                    <div className="space-y-16">
                        <section>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-10 h-10 bg-indigo-50 flex items-center justify-center rounded-xl text-indigo-600"><Book size={20}/></div>
                                <h2 className="text-2xl font-black italic uppercase tracking-tight">1. Use of Service</h2>
                            </div>
                            <p className="text-lg leading-relaxed text-slate-600 font-medium">
                                TwishhSync provides a specialized attendance management platform. Users agree to use the service only for lawful business purposes and in accordance with all local labor regulations.
                            </p>
                        </section>

                        <section>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-10 h-10 bg-violet-50 flex items-center justify-center rounded-xl text-violet-600"><FileCheck size={20}/></div>
                                <h2 className="text-2xl font-black italic uppercase tracking-tight">2. Accuracy of Data</h2>
                            </div>
                            <p className="text-lg leading-relaxed text-slate-600 font-medium">
                                While we strive for 100% spatial accuracy, environmental factors (GPS interference, network lag) may occasionally affect results. TwishhSync is a tracking aid, and administrators are encouraged to review audit logs before finalizing payroll.
                            </p>
                        </section>

                        <section>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-10 h-10 bg-amber-50 flex items-center justify-center rounded-xl text-amber-600"><AlertTriangle size={20}/></div>
                                <h2 className="text-2xl font-black italic uppercase tracking-tight">3. User Responsibility</h2>
                            </div>
                            <p className="text-lg leading-relaxed text-slate-600 font-medium">
                                Administrators are responsible for the security of their workspace and the accurate onboarding of personnel. Employees are responsible for providing authentic location data during check-in events.
                            </p>
                        </section>

                        <section>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-10 h-10 bg-slate-50 flex items-center justify-center rounded-xl text-slate-600"><Scale size={20}/></div>
                                <h2 className="text-2xl font-black italic uppercase tracking-tight">4. Limitation of Liability</h2>
                            </div>
                            <p className="text-lg leading-relaxed text-slate-600 font-medium">
                                TwishhSync shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use the service, including but not limited to payroll disputes or management decisions based on system data.
                            </p>
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default TermsView;
