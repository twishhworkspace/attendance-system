import React, { useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';
import { 
    Users, 
    UserPlus, 
    Search, 
    MoreVertical, 
    Edit2, 
    Trash2, 
    X, 
    Shield, 
    Briefcase, 
    Calendar,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Key
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Skeleton from '../components/Skeleton';
import ModernSelect from '../components/ModernSelect';

const PersonnelView = ({ onNavigateToReport, globalSearch }) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN';

    const [employees, setEmployees] = useState([]);
    const [sectors, setSectors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Modal States
    const [showAddModal, setShowAddModal] = useState(false);
    const [editEmployee, setEditEmployee] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeMenu, setActiveMenu] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [resetPasswordEmployee, setResetPasswordEmployee] = useState(null);
    const [addSector, setAddSector] = useState("");
    const [addWeeklyOff, setAddWeeklyOff] = useState("Sunday");
    const [editSector, setEditSector] = useState("");
    const [editWeeklyOff, setEditWeeklyOff] = useState("");

    useEffect(() => {
        if (editEmployee) {
            setEditSector(editEmployee.sectorId || "");
            setEditWeeklyOff(editEmployee.weeklyOff || "Sunday");
        }
    }, [editEmployee]);

    const fetchData = useCallback(async () => {
        if (!isAdmin) return;
        setRefreshing(true);
        try {
            // Independent fetches to prevent cascading failures
            axios.get('admin/employees')
                .then(res => setEmployees(res.data))
                .catch(err => console.error('Employee Fetch Failure:', err));

            axios.get('admin/sectors')
                .then(res => setSectors(res.data))
                .catch(err => console.error('Sector Fetch Failure:', err));
        } catch (err) {
            console.error('Personnel telemetry failure:', err);
            showToast("Personnel Data Unavailable: Connection Failed", "error");
        } finally { 
            setLoading(false); 
            setRefreshing(false); 
        }
    }, [isAdmin]);

    useEffect(() => { 
        fetchData(); 
    }, [fetchData]);

    const handleAddEmployee = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.target);
        const payload = Object.fromEntries(formData);
        payload.expenseEnabled = formData.get('expenseEnabled') === 'on';
        
        try {
            await axios.post('admin/employees', payload);
            showToast("Employee Registered Successfully", "success");
            setShowAddModal(false);
            fetchData();
        } catch (err) {
            showToast(err.response?.data?.error || "Failed to register personnel", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditEmployee = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.target);
        const payload = Object.fromEntries(formData);
        payload.expenseEnabled = formData.get('expenseEnabled') === 'on';
        
        try {
            await axios.put(`admin/employees/${editEmployee.id}`, payload);
            showToast("Employee Details Updated", "success");
            setEditEmployee(null);
            fetchData();
        } catch (err) {
            showToast(err.response?.data?.error || "Failed to update personnel", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteEmployee = async (id) => {
        try {
            await axios.delete(`admin/employees/${id}`);
            showToast("Personnel record deleted.", "info");
            setConfirmDelete(null);
            fetchData();
        } catch (err) {
            showToast(err.response?.data?.error || "Failed to delete personnel", "error");
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await axios.post(`admin/employees/${resetPasswordEmployee.id}/reset-password`, {
                password: e.target.p.value
            });
            showToast("Password Reset Successful", "success");
            setResetPasswordEmployee(null);
        } catch (err) {
            showToast(err.response?.data?.error || "Reset Failed", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredEmployees = employees.filter(emp => 
        emp.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
        emp.email.toLowerCase().includes(globalSearch.toLowerCase())
    );

    if (!isAdmin) return <div className="p-20 text-center opacity-40">Personnel access only.</div>;

    return (
        <div className="flex-1 flex flex-col gap-8 animate-in fade-in duration-500">
            {/* Header / Stats Overlay */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-4">
                <div>
                    <h2 className="italic font-black text-2xl md:text-4xl mb-2 flex flex-wrap items-center gap-2 md:gap-4 uppercase tracking-tighter">
                        Employee Directory
                        <div className="px-2 py-0.5 bg-violet-600 text-[8px] md:text-[10px] tracking-[0.3em] italic rounded">ACTIVE</div>
                    </h2>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Managing {employees.length} Active Employees</p>
                </div>

                <div className="flex flex-wrap gap-4 w-full md:w-auto">
                    <div className="flex-1 md:flex-none flex items-center gap-3 px-4 py-2 bg-violet-600/10 border border-violet-500/20 rounded-2xl">
                        <Search size={14} className="text-violet-500" />
                        <span className="text-[10px] font-black uppercase text-violet-400">Searching: {globalSearch || 'ALL'}</span>
                    </div>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="flex-1 md:flex-none btn-primary h-12 px-4 md:px-6 flex items-center justify-center gap-3 text-[10px]"
                    >
                        <UserPlus size={16} /> ADD EMPLOYEE
                    </button>
                </div>
            </div>

            {/* Main Table View */}
            <div className="glass-panel flex-1 min-h-[500px] overflow-hidden flex flex-col relative">
                <div className="table-scroll-shield flex-1">
                    <table className="w-full">
                        <thead className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md">
                            <tr>
                                <th className="pl-8">Employee Name</th>
                                <th>Department</th>
                                <th>User ID</th>
                                <th>Attendance Status</th>
                                <th className="text-right pr-8">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array(8).fill(0).map((_, i) => (
                                    <tr key={i}>
                                        <td className="pl-8"><div className="flex gap-3 items-center"><Skeleton variant="circle" width={32} height={32} /><Skeleton width={120} height={12} /></div></td>
                                        <td><Skeleton width={100} height={12} /></td>
                                        <td><Skeleton width={80} height={12} /></td>
                                        <td><Skeleton width={60} height={20} /></td>
                                        <td className="text-right pr-8"><Skeleton width={30} height={30} className="ml-auto" /></td>
                                    </tr>
                                ))
                            ) : (
                                filteredEmployees.map((emp, index) => (
                                    <tr key={emp.id} className="group/row hover:bg-white/[0.02] transition-colors">
                                        <td className="pl-8 py-5">
                                            <div 
                                                className="flex items-center gap-4 cursor-pointer group/avatar"
                                                onClick={() => onNavigateToReport(emp.id)}
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-violet-600/10 flex items-center justify-center text-violet-500 font-black italic border border-violet-500/10 group-hover/avatar:bg-violet-600 group-hover/avatar:text-white transition-all">
                                                    {emp.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-white font-bold italic tracking-tight group-hover/avatar:text-violet-400 transition-colors">{emp.name}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] text-slate-600 font-black uppercase tracking-tighter">{emp.email}</span>
                                                        {emp.mobileNumber && (
                                                            <>
                                                                <span className="w-1 h-1 rounded-full bg-slate-800"></span>
                                                                <span className="text-[9px] text-slate-600 font-black tracking-tighter">{emp.mobileNumber}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <Briefcase size={12} className="text-slate-500" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                    {emp.sector?.name || 'UNASSIGNED'}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <Shield size={12} className="text-violet-500/50" />
                                                <span className="text-[10px] font-mono text-white/60">ID-{emp.id.slice(-6).toUpperCase()}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 size={12} className={emp.forgotCheckoutCount >= 3 ? 'text-rose-500' : 'text-emerald-500'} />
                                                <span className={`text-[10px] font-black uppercase ${emp.forgotCheckoutCount >= 3 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                    {emp.forgotCheckoutCount >= 3 ? 'IMPAIRED' : 'STABLE'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="text-right pr-8 relative">
                                            <button 
                                                onClick={() => setActiveMenu(activeMenu === emp.id ? null : emp.id)}
                                                className={`p-2 hover:bg-white/5 rounded-lg transition-all ${activeMenu === emp.id ? 'text-violet-500 rotate-90' : 'text-slate-500'}`}
                                            >
                                                <MoreVertical size={18} />
                                            </button>
                                            
                                            {activeMenu === emp.id && (
                                                <>
                                                    <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)}></div>
                                                    <div className={`absolute right-8 ${filteredEmployees.length > 3 && index >= filteredEmployees.length - 2 ? 'bottom-full mb-[-20px]' : 'top-12'} w-48 bg-slate-950 border border-white/5 rounded-2xl shadow-2xl z-50 py-3 animate-in zoom-in-95 duration-200`}>
                                                        <button 
                                                            onClick={() => { onNavigateToReport(emp.id); setActiveMenu(null); }}
                                                            className="w-full text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/5 flex items-center gap-3 transition-colors"
                                                        >
                                                            <Calendar size={14} className="text-violet-500" /> View History
                                                        </button>
                                                        <button 
                                                            onClick={() => { setEditEmployee(emp); setActiveMenu(null); }}
                                                            className="w-full text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/5 flex items-center gap-3 transition-colors"
                                                        >
                                                            <Edit2 size={14} className="text-violet-500" /> Edit Employee
                                                        </button>
                                                        <button 
                                                            onClick={() => { setResetPasswordEmployee(emp); setActiveMenu(null); }}
                                                            className="w-full text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/5 flex items-center gap-3 transition-colors"
                                                        >
                                                            <Key size={14} className="text-violet-500" /> Reset Password
                                                        </button>
                                                        <button 
                                                            onClick={async () => {
                                                                try {
                                                                    await axios.post(`admin/employees/${emp.id}/reset-strikes`);
                                                                    showToast("Compliance Strikes Reset", "success");
                                                                    fetchData();
                                                                    setActiveMenu(null);
                                                                } catch (err) {
                                                                    showToast("Strike Reset Failed", "error");
                                                                }
                                                            }}
                                                            className="w-full text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:bg-emerald-500/10 flex items-center gap-3 transition-colors"
                                                        >
                                                            <Shield size={14} /> Reset Strikes
                                                        </button>
                                                        <div className="h-[1px] bg-white/5 mx-3 my-1"></div>
                                                        <button 
                                                            onClick={() => { setConfirmDelete(emp); setActiveMenu(null); }}
                                                            className="w-full text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 flex items-center gap-3 transition-colors"
                                                        >
                                                            <Trash2 size={14} /> Delete Employee
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content w-[500px]">
                        <button className="close-btn" onClick={() => setShowAddModal(false)}><X size={20} /></button>
                        <h3 className="italic font-black text-2xl uppercase mb-8">Add Employee</h3>
                        <form onSubmit={handleAddEmployee} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div><label className="label-proto">Full Name</label><input name="name" placeholder="John Doe" required autoComplete="off" /></div>
                                <div><label className="label-proto">Email Address</label><input name="email" type="email" placeholder="john@company.com" required autoComplete="off" /></div>
                            </div>
                            <div className="grid grid-cols-1 gap-6">
                                <div><label className="label-proto">Mobile Number (Login Option)</label><input name="mobileNumber" placeholder="9876543210" autoComplete="off" /></div>
                            </div>
                            <div><label className="label-proto">Temporary Password</label><input name="password" type="password" required /></div>
                            <div>
                                <label className="label-proto">Deployment Sector</label>
                                <ModernSelect 
                                    name="sectorId"
                                    value={addSector}
                                    onChange={setAddSector}
                                    options={[
                                        { label: "Unassigned", value: "" },
                                        ...sectors.map(s => ({ label: s.name, value: s.id }))
                                    ]}
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label className="label-proto">Weekly Off Protocol</label>
                                <ModernSelect 
                                    name="weeklyOff"
                                    value={addWeeklyOff}
                                    onChange={setAddWeeklyOff}
                                    options={[
                                        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
                                    ].map(d => ({ label: d, value: d }))}
                                    className="w-full"
                                />
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                                <input 
                                    type="checkbox" 
                                    id="addExpenseEnabled" 
                                    name="expenseEnabled" 
                                    className="w-4 h-4 rounded accent-violet-600 cursor-pointer"
                                />
                                <label htmlFor="addExpenseEnabled" className="text-xs font-bold text-slate-300 cursor-pointer select-none">
                                    Enable Expense Tracker Access
                                </label>
                            </div>
                            <button className="btn-primary mt-8 py-5" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : 'SAVE EMPLOYEE'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {editEmployee && (
                <div className="modal-overlay">
                    <div className="modal-content w-[500px]">
                        <button className="close-btn" onClick={() => setEditEmployee(null)}><X size={20} /></button>
                        <h3 className="italic font-black text-2xl uppercase mb-8">Update Employee</h3>
                        <form onSubmit={handleEditEmployee} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div><label className="label-proto">Full Name</label><input name="name" defaultValue={editEmployee.name} required autoComplete="off" /></div>
                                <div><label className="label-proto">Email Address</label><input name="email" defaultValue={editEmployee.email} required autoComplete="off" /></div>
                            </div>
                            <div className="grid grid-cols-1 gap-6">
                                <div><label className="label-proto">Mobile Number</label><input name="mobileNumber" defaultValue={editEmployee.mobileNumber || ''} placeholder="9876543210" autoComplete="off" /></div>
                            </div>
                            <div>
                                <label className="label-proto">Deployment Sector</label>
                                <ModernSelect 
                                    name="sectorId"
                                    value={editSector}
                                    onChange={setEditSector}
                                    options={[
                                        { label: "Unassigned", value: "" },
                                        ...sectors.map(s => ({ label: s.name, value: s.id }))
                                    ]}
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label className="label-proto">Weekly Off Protocol</label>
                                <ModernSelect 
                                    name="weeklyOff"
                                    value={editWeeklyOff}
                                    onChange={setEditWeeklyOff}
                                    options={[
                                        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
                                    ].map(d => ({ label: d, value: d }))}
                                    className="w-full"
                                />
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                                <input 
                                    type="checkbox" 
                                    id="editExpenseEnabled" 
                                    name="expenseEnabled" 
                                    defaultChecked={editEmployee?.expenseEnabled}
                                    className="w-4 h-4 rounded accent-violet-600 cursor-pointer"
                                />
                                <label htmlFor="editExpenseEnabled" className="text-xs font-bold text-slate-300 cursor-pointer select-none">
                                    Enable Expense Tracker Access
                                </label>
                            </div>
                            <button className="btn-primary mt-8 py-5" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : 'UPDATE EMPLOYEE'}
                            </button>
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
                        <h3 className="italic font-black text-xl uppercase mb-2">Delete Employee?</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-8 leading-relaxed">
                            You are about to delete <span className="text-white italic">{confirmDelete.name}</span>.<br/>
                            This action cannot be undone.
                        </p>
                        <div className="flex gap-4">
                            <button onClick={() => setConfirmDelete(null)} className="flex-1 px-8 py-4 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Cancel</button>
                            <button onClick={() => handleDeleteEmployee(confirmDelete.id)} className="flex-1 px-8 py-4 bg-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-rose-500 transition-all shadow-lg shadow-rose-900/20">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {resetPasswordEmployee && (
                <div className="modal-overlay">
                    <div className="modal-content w-[400px]">
                        <button className="close-btn" onClick={() => setResetPasswordEmployee(null)}><X size={20} /></button>
                        <div className="flex flex-col items-center mb-8">
                            <div className="w-16 h-16 bg-violet-500/10 rounded-full flex items-center justify-center mb-4">
                                <Key size={24} className="text-violet-500" />
                            </div>
                            <h3 className="italic font-black text-xl uppercase">Reset Password</h3>
                            <p className="text-[9px] font-black uppercase text-slate-700 tracking-widest mt-1">{resetPasswordEmployee.name}</p>
                        </div>
                        <form onSubmit={handleResetPassword} className="space-y-8">
                            <div>
                                <label className="label-proto">New Protocol Password</label>
                                <input name="p" type="password" required placeholder="Minimum 6 characters" minLength={6} autoComplete="off" />
                                <p className="text-[8px] font-bold text-slate-600 mt-2 uppercase italic tracking-widest">Provide this to the employee after reset.</p>
                            </div>
                            <button className="btn-primary h-14" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : 'UPDATE PASSWORD'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PersonnelView;
