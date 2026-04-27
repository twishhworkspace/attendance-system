import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { 
    Bell, 
    Calendar, 
    Plus, 
    Trash2, 
    Megaphone, 
    Loader2,
    X,
    Info,
    AlertTriangle
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import Skeleton from '../components/Skeleton';

const NoticesView = () => {
    const { showToast } = useToast();
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        type: 'NOTICE',
        scheduledDate: ''
    });

    const fetchNotices = async () => {
        setLoading(true);
        try {
            const res = await axios.get('admin/notices');
            setNotices(res.data);
        } catch (err) {
            showToast("Failed to fetch notification board", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotices();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await axios.post('admin/notices', formData);
            showToast("Communication Broadcasted Successfully", "success");
            setShowAddModal(false);
            setFormData({ title: '', message: '', type: 'NOTICE', scheduledDate: '' });
            fetchNotices();
        } catch (err) {
            showToast("Signal Interrupted: Failed to broadcast", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Retract this notice from the ecosystem?")) return;
        try {
            await axios.delete(`admin/notices/${id}`);
            showToast("Communication Retracted", "info");
            fetchNotices();
        } catch (err) {
            showToast("Failed to retract communication", "error");
        }
    };

    return (
        <div className="flex-1 flex flex-col gap-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h2 className="italic font-black text-4xl mb-2 flex items-center gap-4 uppercase tracking-tighter">
                        Notice Board
                        <div className="px-2 py-0.5 bg-violet-600 text-[10px] tracking-[0.3em] italic rounded">BROADCAST_HUB</div>
                    </h2>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Managing Company Announcements & Holidays</p>
                </div>

                <button 
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary h-12 px-6 flex items-center gap-3 text-[10px]"
                >
                    <Plus size={16} /> NEW BROADCAST
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {loading ? (
                    [...Array(4)].map((_, i) => (
                        <div key={i} className="glass-panel p-8 space-y-4">
                            <Skeleton className="h-6 w-1/2" />
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-4 w-1/4" />
                        </div>
                    ))
                ) : notices.length === 0 ? (
                    <div className="lg:col-span-2 py-20 text-center opacity-30">
                        <Megaphone size={64} className="mx-auto mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest">No active communications found in current registry.</p>
                    </div>
                ) : (
                    notices.map(notice => (
                        <div key={notice.id} className={`glass-panel p-8 border-l-4 group relative transition-all hover:scale-[1.01] ${
                            notice.type === 'HOLIDAY' ? 'border-l-emerald-500' : 'border-l-violet-500'
                        }`}>
                            <button 
                                onClick={() => handleDelete(notice.id)}
                                className="absolute top-6 right-6 p-2 text-slate-700 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <Trash2 size={16} />
                            </button>

                            <div className="flex items-start gap-4 mb-6">
                                <div className={`p-3 rounded-2xl ${
                                    notice.type === 'HOLIDAY' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-violet-500/10 text-violet-500'
                                }`}>
                                    {notice.type === 'HOLIDAY' ? <Calendar size={20} /> : <Bell size={20} />}
                                </div>
                                <div>
                                    <h3 className="italic font-black text-xl uppercase text-white leading-none mb-1">{notice.title}</h3>
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{notice.type} Protocol</span>
                                </div>
                            </div>

                            <p className="text-[11px] font-bold text-slate-400 leading-relaxed mb-8 italic">
                                {notice.message}
                            </p>

                            <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Info size={12} />
                                    <span className="text-[9px] font-black uppercase tracking-tighter">
                                        Posted: {new Date(notice.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                {notice.scheduledDate && (
                                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg">
                                        <Calendar size={12} />
                                        <span className="text-[9px] font-black uppercase tracking-tighter">
                                            Event Date: {new Date(notice.scheduledDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content w-[500px]">
                        <button className="close-btn" onClick={() => setShowAddModal(false)}><X size={20} /></button>
                        <h3 className="italic font-black text-2xl uppercase mb-8">Initiate Broadcast</h3>
                        
                        <form onSubmit={handleSubmit} className="space-y-6 text-left">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="label-proto">Signal Type</label>
                                    <select 
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="proto-input"
                                    >
                                        <option value="NOTICE">GENERAL NOTICE</option>
                                        <option value="HOLIDAY">HOLIDAY ANNOUNCEMENT</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="label-proto">Target Date (Optional)</label>
                                    <input 
                                        type="date" 
                                        value={formData.scheduledDate}
                                        onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                                        className="proto-input"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="label-proto">Communication Title</label>
                                <input 
                                    type="text" 
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="E.G. DIWALI CELEBRATION"
                                    required
                                    className="proto-input"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="label-proto">Payload Message</label>
                                <textarea 
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    className="proto-input min-h-[120px]"
                                    placeholder="Enter your announcement payload here..."
                                    required
                                />
                            </div>

                            <button className="btn-primary mt-8 py-5" disabled={isSaving}>
                                {isSaving ? <Loader2 className="animate-spin mx-auto" /> : 'DEPLOY BROADCAST'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NoticesView;
