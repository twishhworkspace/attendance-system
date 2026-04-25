import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import { History, MoreVertical, Edit2, Trash2, X, Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

import { useAuth } from '../context/AuthContext';

const DepartmentsView = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'COMPANY_ADMIN';
    const [depts, setDepts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editSector, setEditSector] = useState(null);
    const [activeMenu, setActiveMenu] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const { showToast } = useToast();

    const fetchD = async () => { 
        if (!isAdmin) return;
        setRefreshing(true);
        try { 
            const r = await axios.get('admin/sectors'); 
            setDepts(r.data); 
        } catch (err) {
            console.error('Department telemetry failure:', err);
            showToast("Telemetric Department Feed Interrupted.", "error");
        } finally { setLoading(false); setRefreshing(false); } 
    };

    useEffect(() => { 
        if (isAdmin) fetchD(); 
    }, [isAdmin]);

    const handleDelete = async (id) => {
        try {
            await axios.delete(`admin/sectors/${id}`);
            showToast("Department successfully deleted.", "success");
            setConfirmDelete(null);
            fetchD();
        } catch(e) { 
            showToast(e.response?.data?.error || "Strategic Termination Interrupted.", "error");
        }
    };

    if (loading) return <div className="p-20 opacity-40 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

    return (
        <div className="glass-panel flex-1 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h3 className="italic font-black uppercase tracking-tight text-xl">Departments</h3>
                    <p className="text-[9px] font-black uppercase text-slate-700 tracking-[0.3em]">Manage company teams and sectors</p>
                </div>
                <div className="flex gap-4 items-center">
                    <button className="nav-item opacity-40 hover:opacity-100 transition-opacity p-2" onClick={fetchD}>
                        <History size={16} className={refreshing ? 'animate-spin text-violet-500' : ''} />
                    </button>
                    <button onClick={() => setShowModal(true)} className="btn-primary w-fit px-8 h-12 text-[10px]">REGISTER SECTOR</button>
                </div>
            </div>
            <div className="table-scroll-shield">
                <table className="relative">
                    <thead><tr><th>Department Name</th><th>Department ID</th><th>Employees</th><th className="text-right pr-6">Actions</th></tr></thead>
                    <tbody>
                        {Array.isArray(depts) && depts.map(d=>(
                            <tr key={d.id} className="group/row">
                                <td className="font-bold uppercase italic text-white">{d.name}</td>
                                <td className="font-mono text-[10px] text-slate-600">{d.id}</td>
                                <td><span className="badge border-white/5 text-[10px] text-violet-500 font-bold">{d.employeeCount || 0} Employees</span></td>
                                <td className="text-right pr-6 relative">
                                    <button 
                                        onClick={() => setActiveMenu(activeMenu === d.id ? null : d.id)}
                                        className={`action-dots-btn transition-transform ${activeMenu === d.id ? 'rotate-90 text-violet-500 scale-125' : ''}`}
                                    >
                                        <MoreVertical size={16} />
                                    </button>
                                    
                                    {activeMenu === d.id && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)}></div>
                                            <div className="absolute right-6 top-10 w-48 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl z-50 py-3 animate-in zoom-in-95 duration-200">
                                                <button onClick={() => { setEditSector(d); setActiveMenu(null); }} className="w-full text-left px-6 py-3 text-[11px] font-black text-white hover:bg-white/5 flex items-center gap-3 transition-colors">
                                                    <Edit2 size={14} className="text-violet-500" /> EDIT SIGNATURE
                                                </button>
                                                <div className="h-[1px] bg-white/5 mx-3 my-1"></div>
                                                <button onClick={() => { setConfirmDelete(d); setActiveMenu(null); }} className="w-full text-left px-6 py-3 text-[11px] font-black text-rose-500 hover:bg-rose-500/10 flex items-center gap-3 transition-colors">
                                                    <Trash2 size={14} /> DELETE DEPARTMENT
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
                    <div className="modal-content">
                        <button className="close-btn" onClick={() => setShowModal(false)}><X size={18} /></button>
                        <h3 className="italic font-black uppercase mb-6">Add Department</h3>
                        <form onSubmit={async (e)=>{ 
                            e.preventDefault(); 
                            try {
                                await axios.post('admin/sectors', { name: e.target.c.value }); 
                                showToast("Department Node Registered.", "success");
                                setShowModal(false); 
                                fetchD(); 
                            } catch(err) { 
                                showToast(err.response?.data?.error || "Department Registration Failed.", "error");
                            }
                        }}>
                            <label className="label-proto">Department Name</label>
                            <input name="c" placeholder="E.g. TOKYO_CORE" required autoComplete="off" />
                            <button className="btn-primary mt-6">SAVE DEPARTMENT</button>
                        </form>
                    </div>
                </div>
            )}

            {editSector && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button className="close-btn" onClick={() => setEditSector(null)}><X size={18} /></button>
                        <h3 className="italic font-black uppercase mb-6">Update Department Name</h3>
                        <form onSubmit={async (e)=>{ 
                            e.preventDefault(); 
                            try {
                                await axios.put(`admin/sectors/${editSector.id}`, { name: e.target.c.value }); 
                                showToast("Department Signature Remastered.", "success");
                                setEditSector(null); 
                                fetchD(); 
                            } catch(err) { 
                                showToast(err.response?.data?.error || "Department Update Failed.", "error");
                            }
                        }}>
                            <label className="label-proto">Department Name</label>
                            <input name="c" defaultValue={editSector.name} required autoComplete="off" />
                            <button className="btn-primary mt-6">UPDATE DEPARTMENT</button>
                        </form>
                    </div>
                </div>
            )}
            
            {confirmDelete && (
                <div className="modal-overlay">
                    <div className="modal-content text-center py-10">
                        <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-6">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="italic font-black text-xl uppercase mb-2">Delete Department?</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-8 leading-relaxed">
                            You are about to delete <span className="text-white italic">{confirmDelete.name}</span>.<br/>
                            All employees will be detached from this sector.
                        </p>
                        <div className="flex gap-4">
                            <button onClick={() => setConfirmDelete(null)} className="flex-1 px-8 py-4 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Cancel</button>
                            <button onClick={() => handleDelete(confirmDelete.id)} className="flex-1 px-8 py-4 bg-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-rose-500 transition-all shadow-lg shadow-rose-900/20">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DepartmentsView;
