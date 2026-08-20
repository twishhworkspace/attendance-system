import React, { useState } from 'react';
import { Bug, X, Send, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../api/axios';

const GlobalBugReport = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [category, setCategory] = useState('BUG');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState('IDLE'); // IDLE, SENDING, SUCCESS, ERROR

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('SENDING');
        try {
            await axios.post('auth/report-bug', { category, message });
            setStatus('SUCCESS');
            setTimeout(() => {
                setIsOpen(false);
                setStatus('IDLE');
                setMessage('');
            }, 3000);
        } catch (err) {
            console.error('Report Failure:', err);
            setStatus('ERROR');
            setTimeout(() => setStatus('IDLE'), 3000);
        }
    };

    return (
        <>
            {/* Pulsing Alert Hub Trigger */}
            <motion.button 
                onClick={() => setIsOpen(true)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="fixed bottom-6 right-6 w-14 h-14 bg-violet-600 text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.5)] z-[9999] group overflow-hidden"
            >
                <Bug size={24} className="group-hover:rotate-12 transition-transform" />
                <motion.div 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 border-2 border-violet-400 rounded-full"
                />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 flex items-center justify-center z-[10000] p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl relative"
                        >
                            <div className="p-8">
                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>

                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center">
                                        <ShieldAlert className="text-violet-500" size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Direct Uplink</h3>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Report bugs to Master Control</p>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Signal Category</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['BUG', 'UPLINK', 'IDEATION'].map(cat => (
                                                <button
                                                    key={cat}
                                                    type="button"
                                                    onClick={() => setCategory(cat)}
                                                    className={`py-2 px-3 rounded-xl text-[9px] font-black transition-all border ${
                                                        category === cat 
                                                        ? 'bg-violet-600 border-violet-500 text-white' 
                                                        : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'
                                                    }`}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Incident Details</label>
                                        <textarea 
                                            required
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder="Describe the bug or problem in detail..."
                                            className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-slate-700 min-h-[120px] focus:outline-none focus:border-violet-500/50 transition-colors resize-none"
                                        />
                                    </div>

                                    <button 
                                        disabled={status !== 'IDLE'}
                                        type="submit"
                                        className="w-full h-14 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-2xl font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3"
                                    >
                                        {status === 'SENDING' ? (
                                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        ) : status === 'SUCCESS' ? (
                                            <>
                                                <CheckCircle2 size={20} />
                                                TRANSMITTED
                                            </>
                                        ) : (
                                            <>
                                                <Send size={18} />
                                                INITIALIZE UPLINK
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>

                            {/* Decorative Sub-footer */}
                            <div className="bg-white/5 p-4 border-t border-white/5 text-center px-8">
                                <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed">
                                    Strategic reporting ensures platform stability. All data is routed through the master control secure registry.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default GlobalBugReport;
