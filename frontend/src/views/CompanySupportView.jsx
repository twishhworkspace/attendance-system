import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import { Loader2, MessageSquare, Send, Plus, ChevronRight, User, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../context/ToastContext';

const CompanySupportView = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewModal, setShowNewModal] = useState(false);
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('NORMAL');
    const [sending, setSending] = useState(false);
    const { showToast } = useToast();

    const fetchTickets = async () => {
        try {
            const r = await axios.get('admin/tickets');
            setTickets(r.data);
        } catch (err) {
            console.error('Ticket Fetch Failure:', err);
        } finally { setLoading(false); }
    };

    const handleCreate = async () => {
        if (!subject.trim() || !description.trim()) return;
        setSending(true);
        try {
            await axios.post('admin/tickets', { subject, description, priority });
            showToast("Support Ticket Dispatched", "success");
            setShowNewModal(false);
            setSubject(''); setDescription('');
            fetchTickets();
        } catch (err) {
            showToast("Transmission Error", "error");
        } finally { setSending(false); }
    };

    useEffect(() => { fetchTickets(); }, []);

    if (loading) return <div className="p-20 opacity-40 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

    return (
        <div className="flex-1 space-y-8 animate-in fade-in duration-700">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h3 className="italic font-black text-3xl uppercase tracking-tighter text-white">Technical <span className="text-violet-500">Support.</span></h3>
                    <p className="text-[10px] font-black uppercase text-slate-700 tracking-[0.4em]">Direct Uplink to Platform Master Control</p>
                </div>
                <button onClick={() => setShowNewModal(true)} className="btn-primary h-14 px-8 flex items-center gap-3">
                    <Plus size={18} /> INITIATE NEW TICKET
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.isArray(tickets) && tickets.length > 0 ? (
                    tickets.map((t, i) => (
                        <motion.div 
                        key={t.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="glass-panel p-8 group hover:border-violet-500/20 transition-all cursor-default relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-6">
                             <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${t.status === 'OPEN' ? 'bg-amber-500 text-black' : 'bg-emerald-500 text-black'}`}>
                                {t.status}
                            </span>
                        </div>

                        <div className="flex items-center gap-4 mb-6 text-slate-700">
                            <MessageSquare size={16} />
                            <span className="text-[9px] font-black uppercase tracking-widest">{t.priority} PRIORITY</span>
                            <span className="text-[8px] font-mono text-slate-800">{new Date(t.createdAt || Date.now()).toLocaleDateString()}</span>
                        </div>
                        <h4 className="text-sm font-black text-white mb-2 truncate uppercase italic">{t.subject || 'UNTITLED SIGNAL'}</h4>
                        <p className="text-[10px] text-slate-500 font-bold leading-relaxed mb-6 line-clamp-2 uppercase tracking-tight">{t.description}</p>
                        
                        <div className="flex items-center justify-between border-t border-white/5 pt-6">
                            <div className="flex items-center gap-2">
                                <User size={12} className="text-violet-500" />
                                <span className="text-[9px] font-black text-slate-300 uppercase">Initiated by {t?.user?.name || 'FIELD AGENT'}</span>
                            </div>
                            <div className="flex gap-1 items-center">
                                {Array.isArray(t?.replies) && t.replies.length > 0 && <span className="text-[8px] font-black text-violet-500 uppercase">{t.replies.length} REPLIES</span>}
                                <ChevronRight size={14} className="text-slate-700 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </motion.div>
                    ))
                ) : (
                    <div className="col-span-2 p-20 text-center opacity-20 border-2 border-dashed border-white/5 rounded-3xl">
                        <Shield size={48} className="mx-auto mb-6" />
                        <h4 className="text-xl font-black uppercase italic italic">No active support nodes.</h4>
                        <p className="text-[10px] font-bold uppercase tracking-[0.4em] mt-2">Platform secure and operating at nominal capacity.</p>
                    </div>
                )}
            </div>

            {/* New Ticket Modal */}
            <AnimatePresence>
                {showNewModal && (
                    <div className="modal-overlay z-[10000]">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="modal-content w-[600px] p-12 overflow-visible"
                        >
                            <h3 className="italic font-black text-2xl uppercase mb-8 text-white">Initiate Technical <span className="text-violet-500">Uplink.</span></h3>
                            
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase text-slate-700 tracking-widest">Subject Protocol</label>
                                    <input 
                                        type="text" 
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="E.G., GEODATA SYNC ERROR"
                                        className="modal-input h-14"
                                        autoComplete="off"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase text-slate-700 tracking-widest">Priority Tier</label>
                                    <select 
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                        className="modal-input h-14 appearance-none"
                                    >
                                        <option value="LOW">LOW - NON-CRITICAL</option>
                                        <option value="NORMAL">NORMAL - STANDARD</option>
                                        <option value="HIGH">HIGH - PRIORITY</option>
                                        <option value="URGENT">URGENT - SYSTEM LOCK</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase text-slate-700 tracking-widest">Situation Description</label>
                                    <textarea 
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="DESCRIBE THE TECHNICAL IMPERFECTION..."
                                        className="modal-input h-40 py-6"
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button onClick={() => setShowNewModal(false)} className="flex-1 h-14 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:text-white transition-colors">ABORT</button>
                                    <button 
                                        onClick={handleCreate} 
                                        disabled={sending || !subject.trim() || !description.trim()}
                                        className="flex-[2] btn-primary h-14"
                                    >
                                        {sending ? <Loader2 className="animate-spin mx-auto" /> : 'DISPATCH TO MASTER CONTROL'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CompanySupportView;
