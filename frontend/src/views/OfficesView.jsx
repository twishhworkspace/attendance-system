import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import { History, MapPin, MoreVertical, Trash2, X, Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

import { useAuth } from '../context/AuthContext';

const OfficesView = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'COMPANY_ADMIN';
    const [offices, setOffices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [activeMenu, setActiveMenu] = useState(null);
    const { showToast } = useToast();

    const fetchO = async () => { 
        if (!isAdmin) return;
        setRefreshing(true);
        try { 
            const r = await axios.get('admin/offices'); 
            setOffices(r.data); 
        } catch (err) {
            console.error('Office telemetry failure:', err);
            showToast("Telemetric Office Feed Interrupted.", "error");
        } finally { setLoading(false); setRefreshing(false); } 
    };

    useEffect(() => { 
        if (isAdmin) fetchO(); 
    }, [isAdmin]);

    const handleDelete = async (id) => {
        if (window.confirm("Permanently deconstruct this office node? Spatial verification for this zone will be disabled.")) {
            try { 
                await axios.delete(`admin/offices/${id}`); 
                showToast("Office Node Deconstructed.", "success");
                fetchO(); 
            } catch(e) { 
                showToast(e.response?.data?.error || "Deconstruction Protocol Interrupted.", "error");
            }
        }
    };

    if (loading) return <div className="p-20 opacity-40 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

    return (
        <div className="glass-panel flex-1 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h3 className="italic font-black uppercase tracking-tight text-xl">Offices Location</h3>
                    <p className="text-[9px] font-black uppercase text-slate-700 tracking-[0.3em]">Manage office locations and perimeters</p>
                </div>
                <div className="flex gap-4 items-center">
                    <button className="nav-item opacity-40 hover:opacity-100 transition-opacity p-2" onClick={fetchO}>
                        <History size={16} className={refreshing ? 'animate-spin text-violet-500' : ''} />
                    </button>
                    <button onClick={() => setShowModal(true)} className="btn-primary w-fit px-8 h-12 text-[10px]">ADD OFFICE LOCATION</button>
                </div>
            </div>
            <div className="table-scroll-shield">
                <table>
                    <thead><tr><th>Office Location</th><th>Geographical Index</th><th>Radius</th><th>Shift Timing</th><th className="text-right pr-6">Actions</th></tr></thead>
                    <tbody>
                        {offices.map(o=>(
                            <tr key={o.id} className="group/row">
                                <td className="font-bold uppercase italic text-white">{o.name}</td>
                                <td><div className="flex items-center gap-2 text-violet-500 font-mono text-[10px]"><MapPin size={10} /> <span className="truncate-mobile" title={o.location}>{o.location}</span></div></td>
                                <td><span className="badge border-white/5 text-[10px]">{o.radius}m Bounds</span></td>
                                <td><span className="text-violet-500 font-mono text-[10px] uppercase">{o.startTime} - {o.endTime}</span></td>
                                <td className="text-right pr-6 relative">
                                    <button onClick={() => setActiveMenu(activeMenu === o.id ? null : o.id)} className={`action-dots-btn ${activeMenu === o.id ? 'rotate-90 text-violet-500' : ''}`}><MoreVertical size={16} /></button>
                                    {activeMenu === o.id && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)}></div>
                                            <div className="absolute right-6 top-10 w-48 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl z-50 py-3 animate-in zoom-in-95 duration-200">
                                                <button onClick={() => { handleDelete(o.id); setActiveMenu(null); }} className="w-full text-left px-6 py-3 text-[11px] font-black text-rose-500 hover:bg-rose-500/10 flex items-center gap-3 transition-colors">
                                                    <Trash2 size={14} /> DECONSTRUCT NODE
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content w-[480px]">
                        <button className="close-btn" onClick={() => setShowModal(false)}><X size={18} /></button>
                        <h3 className="italic font-black uppercase mb-8">Add Office Location</h3>
                        <form onSubmit={async (e)=>{ 
                            e.preventDefault(); 
                            try {
                                const formData = new FormData(e.target);
                                await axios.post('admin/offices', { 
                                    name: formData.get('n'), 
                                    address: formData.get('a'), 
                                    location: formData.get('l'), 
                                    radius: formData.get('r'),
                                    startTime: formData.get('st'),
                                    endTime: formData.get('et')
                                }); 
                                showToast("Spatial Infrastructure Synced.", "success");
                                setShowModal(false); 
                                fetchO(); 
                            } catch(err) { 
                                showToast(err.response?.data?.error || "Spatial Infrastructure Sync Failed.", "error");
                            }
                        }} className="space-y-6">
                            <div><label className="label-proto">Office Name</label><input name="n" placeholder="E.g. Nexus HQ" required autoComplete="off" /></div>
                            <div><label className="label-proto">Physical Address</label><input name="a" placeholder="Full street address" required autoComplete="off" /></div>
                            <div>
                                <label className="label-proto">Spatial Index (GPS)</label>
                                <input name="l" placeholder="Latitude, Longitude" required autoComplete="off" />
                                <p className="text-[8px] font-bold text-slate-700 mt-2 uppercase italic">Format: 18.5204, 73.8567</p>
                            </div>
                            <div><label className="label-proto">Authorized Radius (Meters)</label><input name="r" type="number" defaultValue={100} required autoComplete="off" /></div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="label-proto">Work Start Time</label>
                                    <input name="st" type="time" defaultValue="08:00" required className="w-full" />
                                </div>
                                <div className="flex-1">
                                    <label className="label-proto">Work End Time</label>
                                    <input name="et" type="time" defaultValue="20:00" required className="w-full" />
                                </div>
                            </div>
                            <button className="btn-primary mt-8">SYNC INFRASTRUCTURE</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OfficesView;
