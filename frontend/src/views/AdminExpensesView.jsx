import React, { useState, useEffect } from 'react';
import { 
    CircleDollarSign, 
    Loader2, 
    TrendingUp, 
    TrendingDown, 
    Download, 
    Search,
    ChevronLeft,
    ChevronRight,
    Building,
    Calendar,
    HelpCircle,
    Printer,
    Users,
    ChevronRight as ChevronRightIcon,
    RefreshCw,
    X,
    UserCheck,
    ReceiptText
} from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { exportExpenseToExcel, exportExpenseToPDF } from '../utils/expenseExport';

const AdminExpensesView = () => {
    const { showToast } = useToast();
    const { user } = useAuth();

    // Status Badge Helper
    const getStatusBadge = (status) => {
        switch(status) {
            case 'APPROVED':
                return <span className="text-[8px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Approved</span>;
            case 'REJECTED':
                return <span className="text-[8px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">Rejected</span>;
            default:
                return <span className="text-[8px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Pending</span>;
        }
    };
    
    // States
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [companies, setCompanies] = useState([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState('');
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [entries, setEntries] = useState([]);
    const [summary, setSummary] = useState({ totalCredit: 0, totalDebit: 0, netBalance: 0 });
    
    const [loadingEmployees, setLoadingEmployees] = useState(true);
    const [loadingCompanies, setLoadingCompanies] = useState(false);
    const [loadingEntries, setLoadingEntries] = useState(false);
    
    // Search & Filter
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('ALL'); // ALL, CREDIT, DEBIT
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    // Period Views: 'all' | 'daily' | 'monthly' | 'yearly'
    const [activeTab, setActiveTab] = useState('all');
    const [currentDate, setCurrentDate] = useState(new Date());

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const entriesPerPage = 10;

    // Daily Period Computation
    const dailyData = React.useMemo(() => {
        if (!currentDate) return { dayEntries: [], cfBalance: 0, totalCredit: 0, totalDebit: 0, netBalance: 0 };
        const targetDateStr = currentDate.toDateString();

        const sorted = [...entries].sort((a,b) => new Date(a.date) - new Date(b.date));
        let cf = 0;
        const dayEntries = [];
        let dayCredit = 0;
        let dayDebit = 0;

        sorted.forEach(entry => {
            const eDate = new Date(entry.date);
            if (eDate < new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0, 0)) {
                if (entry.status !== 'REJECTED') {
                    if (entry.type === 'CREDIT') cf += entry.amount;
                    else cf -= entry.amount;
                }
            } else if (eDate.toDateString() === targetDateStr) {
                dayEntries.push(entry);
                if (entry.status !== 'REJECTED') {
                    if (entry.type === 'CREDIT') dayCredit += entry.amount;
                    else dayDebit += entry.amount;
                }
            }
        });

        return {
            dayEntries,
            cfBalance: cf,
            totalCredit: dayCredit,
            totalDebit: dayDebit,
            netBalance: cf + dayCredit - dayDebit
        };
    }, [entries, currentDate]);

    // Monthly Period Computation
    const monthlyData = React.useMemo(() => {
        if (!currentDate) return { groups: [], cfBalance: 0, monthCredit: 0, monthDebit: 0, monthNet: 0 };
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const sorted = [...entries].sort((a,b) => new Date(a.date) - new Date(b.date));
        let cf = 0;
        let monthCredit = 0;
        let monthDebit = 0;
        const dateGroupsMap = {};

        sorted.forEach(entry => {
            const eDate = new Date(entry.date);
            if (eDate < new Date(year, month, 1, 0, 0, 0, 0)) {
                if (entry.status !== 'REJECTED') {
                    if (entry.type === 'CREDIT') cf += entry.amount;
                    else cf -= entry.amount;
                }
            } else if (eDate.getFullYear() === year && eDate.getMonth() === month) {
                if (entry.status !== 'REJECTED') {
                    if (entry.type === 'CREDIT') monthCredit += entry.amount;
                    else monthDebit += entry.amount;
                }

                const dateKey = eDate.toDateString();
                if (!dateGroupsMap[dateKey]) {
                    dateGroupsMap[dateKey] = { date: eDate, entries: [], creditSum: 0, debitSum: 0 };
                }
                dateGroupsMap[dateKey].entries.push(entry);
                if (entry.status !== 'REJECTED') {
                    if (entry.type === 'CREDIT') dateGroupsMap[dateKey].creditSum += entry.amount;
                    else dateGroupsMap[dateKey].debitSum += entry.amount;
                }
            }
        });

        const groups = Object.values(dateGroupsMap).sort((a,b) => b.date - a.date);

        return {
            groups,
            cfBalance: cf,
            monthCredit,
            monthDebit,
            monthNet: cf + monthCredit - monthDebit
        };
    }, [entries, currentDate]);

    // Yearly Period Computation
    const yearlyData = React.useMemo(() => {
        if (!currentDate) return { year: currentDate.getFullYear(), cfBalance: 0, rows: [] };
        const year = currentDate.getFullYear();

        const sorted = [...entries].sort((a,b) => new Date(a.date) - new Date(b.date));
        let cf = 0;
        const monthTotalsMap = {};
        for (let m = 0; m < 12; m++) {
            monthTotalsMap[m] = { credit: 0, debit: 0 };
        }

        sorted.forEach(entry => {
            const eDate = new Date(entry.date);
            if (eDate < new Date(year, 0, 1, 0, 0, 0, 0)) {
                if (entry.status !== 'REJECTED') {
                    if (entry.type === 'CREDIT') cf += entry.amount;
                    else cf -= entry.amount;
                }
            } else if (eDate.getFullYear() === year) {
                const m = eDate.getMonth();
                if (entry.status !== 'REJECTED') {
                    if (entry.type === 'CREDIT') monthTotalsMap[m].credit += entry.amount;
                    else monthTotalsMap[m].debit += entry.amount;
                }
            }
        });

        let running = cf;
        const rows = [];
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

        for (let m = 0; m < 12; m++) {
            const c = monthTotalsMap[m].credit;
            const d = monthTotalsMap[m].debit;
            running = running + c - d;
            rows.push({
                monthName: `${months[m]} ${year}`,
                monthIndex: m,
                credit: c,
                debit: d,
                balance: running
            });
        }

        return {
            year,
            cfBalance: cf,
            rows
        };
    }, [entries, currentDate]);

    // Fetch employees with expenses enabled
    const fetchEmployees = async () => {
        setLoadingEmployees(true);
        try {
            const response = await api.get('expenses/admin/employees');
            setEmployees(response.data);
            if (response.data.length > 0) {
                // Auto-select first employee
                handleSelectEmployee(response.data[0]);
            }
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to load employee list', 'error');
        } finally {
            setLoadingEmployees(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const handleSelectEmployee = async (employee) => {
        setSelectedEmployee(employee);
        setCompanies([]);
        setSelectedCompanyId('');
        setSelectedCompany(null);
        setEntries([]);
        setSummary({ totalCredit: 0, totalDebit: 0, netBalance: 0 });
        
        if (!employee) return;
        setLoadingCompanies(true);
        try {
            const response = await api.get(`expenses/admin/employees/${employee.id}/companies`);
            setCompanies(response.data);
            if (response.data.length > 0) {
                handleSelectCompany(response.data[0].id, response.data);
            }
        } catch (err) {
            showToast('Failed to load expense books for employee', 'error');
        } finally {
            setLoadingCompanies(false);
        }
    };

    const handleSelectCompany = async (companyId, customCompanyList = null) => {
        setSelectedCompanyId(companyId);
        setCurrentPage(1);
        if (!companyId) {
            setSelectedCompany(null);
            setEntries([]);
            setSummary({ totalCredit: 0, totalDebit: 0, netBalance: 0 });
            return;
        }

        const currentList = customCompanyList || companies;
        const comp = currentList.find(c => c.id === companyId);
        if (comp) setSelectedCompany(comp);

        setLoadingEntries(true);
        try {
            const response = await api.get(`expenses/admin/companies/${companyId}/entries`);
            setEntries(response.data.entries);
            setSummary(response.data.summary);
        } catch (err) {
            showToast('Failed to load transaction ledger', 'error');
        } finally {
            setLoadingEntries(false);
        }
    };

    const handleUpdateStatus = async (entryId, action) => {
        try {
            const response = await api.put(`expenses/admin/entries/${entryId}/status`, { action });
            showToast(response.data.message || 'Transaction status updated', 'success');
            if (selectedCompanyId) {
                handleSelectCompany(selectedCompanyId);
            }
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to update transaction status', 'error');
        }
    };

    // Excel Statement Export
    const exportExcel = () => {
        if (entries.length === 0) {
            showToast('No entries to export', 'info');
            return;
        }
        exportExpenseToExcel({
            employee: selectedEmployee,
            bookName: selectedCompany?.name || 'Expense Book',
            activeTab,
            currentDate,
            entries,
            summary,
            dailyData,
            monthlyData,
            yearlyData,
            showToast
        });
    };

    // Direct PDF Statement Download
    const exportPDF = () => {
        if (entries.length === 0) {
            showToast('No entries to export', 'info');
            return;
        }
        exportExpenseToPDF({
            employee: selectedEmployee,
            bookName: selectedCompany?.name || 'Expense Book',
            activeTab,
            currentDate,
            entries,
            summary,
            dailyData,
            monthlyData,
            yearlyData,
            showToast
        });
    };

    // Print
    const triggerPrint = () => {
        window.print();
    };

    // Filters
    const filteredEmployees = employees.filter(emp => 
        emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        emp.email.toLowerCase().includes(employeeSearch.toLowerCase())
    );

    const filteredEntries = entries.filter(entry => {
        const matchSearch = (entry.narration || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchType = filterType === 'ALL' || entry.type === filterType;
        
        let matchDate = true;
        if (startDate) {
            const sDate = new Date(startDate);
            sDate.setHours(0,0,0,0);
            matchDate = matchDate && new Date(entry.date) >= sDate;
        }
        if (endDate) {
            const eDate = new Date(endDate);
            eDate.setHours(23,59,59,999);
            matchDate = matchDate && new Date(entry.date) <= eDate;
        }

        return matchSearch && matchType && matchDate;
    });

    // Pagination
    const indexOfLastEntry = currentPage * entriesPerPage;
    const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
    const currentEntries = filteredEntries.slice(indexOfFirstEntry, indexOfLastEntry);
    const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    // Dynamic print styling configuration
    const printStyles = `
        @page {
            margin: 0;
            size: auto;
        }
        @media print {
            body * {
                visibility: hidden !important;
            }
            #print-area-admin, #print-area-admin * {
                visibility: visible !important;
                color: #0f172a !important;
                background-color: transparent !important;
                box-shadow: none !important;
            }
            #print-area-admin {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                height: 100% !important;
                margin: 0 !important;
                padding: 20mm !important;
                background-color: #ffffff !important;
                color: #0f172a !important;
                box-sizing: border-box !important;
                overflow: visible !important;
            }
            #print-area-admin table {
                width: 100% !important;
                border-collapse: collapse !important;
            }
            #print-area-admin tr {
                border-radius: 0 !important;
                background: transparent !important;
                border-bottom: 1px solid #e2e8f0 !important;
            }
            #print-area-admin td, #print-area-admin th {
                color: #0f172a !important;
                padding: 10px 8px !important;
                border-radius: 0 !important;
                background: transparent !important;
            }
            #print-area-admin .text-emerald-700, #print-area-admin .text-emerald-500 {
                color: #047857 !important;
            }
            #print-area-admin .text-rose-700, #print-area-admin .text-rose-500 {
                color: #b91c1c !important;
            }
            #print-area-admin .bg-slate-50, #print-area-admin .bg-slate-100 {
                background-color: #f8fafc !important;
            }
            #print-area-admin .bg-emerald-100 {
                background-color: #d1fae5 !important;
                color: #065f46 !important;
            }
            #print-area-admin .bg-rose-100 {
                background-color: #ffe4e6 !important;
                color: #991b1b !important;
            }
            .no-print {
                display: none !important;
            }
        }
    `;

    if (loadingEmployees) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="animate-spin text-violet-500 w-10 h-10" />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col gap-6 animate-in fade-in duration-500 relative">
            <style>{printStyles}</style>

            {employees.length === 0 ? (
                /* Feature Opt-In Alert Card */
                <div className="max-w-2xl mx-auto w-full mt-10 md:mt-20">
                    <div className="bg-slate-900/60 border border-white/5 backdrop-blur-xl rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center">
                        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-violet-500 to-indigo-500" />
                        <div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center text-violet-500 mx-auto mb-6 border border-violet-500/20 animate-pulse">
                            <CircleDollarSign size={32} />
                        </div>
                        <h2 className="text-xl font-black italic text-white uppercase tracking-tight">No Privileged Expense Accounts</h2>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 max-w-md mx-auto leading-relaxed">
                            No employees have been granted Expense Tracker access in your company yet.
                            To activate this feature, go to the <span className="text-violet-400 italic">Employees</span> tab, edit an employee record, and enable the "Enable Expense Tracker" option.
                        </p>
                    </div>
                </div>
            ) : (
                /* Primary Admin Dashboard Layout */
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                    {/* Left Column: Employee & Book Selector */}
                    <div className="lg:col-span-1 flex flex-col gap-6 no-print">
                        {/* Employee Search / List card */}
                        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-5 backdrop-blur-md">
                            <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-4 flex items-center gap-2">
                                <Users size={14} className="text-violet-500" /> Personnel Privileged
                            </h3>
                            
                            {/* Search bar */}
                            <div className="relative mb-4">
                                <Search size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
                                <input
                                    type="text"
                                    placeholder="Find employee..."
                                    value={employeeSearch}
                                    onChange={(e) => setEmployeeSearch(e.target.value)}
                                    className="w-full bg-black/40 border border-white/5 rounded-xl pl-9 pr-3 py-2.5 text-[10px] text-white placeholder:text-slate-600 font-bold uppercase tracking-wider focus:outline-none focus:border-violet-500/20 transition-all"
                                />
                            </div>

                            {/* Employee List */}
                            <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
                                {filteredEmployees.length === 0 ? (
                                    <p className="text-center py-4 text-[9px] font-bold text-slate-600 uppercase tracking-wider">No matching personnel</p>
                                ) : (
                                    filteredEmployees.map(emp => {
                                        const isSelected = selectedEmployee?.id === emp.id;
                                        return (
                                            <button
                                                key={emp.id}
                                                onClick={() => handleSelectEmployee(emp)}
                                                className={`w-full flex items-center justify-between p-3.5 rounded-xl text-left transition-all ${
                                                    isSelected 
                                                    ? 'bg-violet-600 text-white font-black' 
                                                    : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200'
                                                }`}
                                            >
                                                <div className="min-w-0">
                                                    <p className={`text-[10px] font-black uppercase tracking-wide truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>{emp.name}</p>
                                                    <p className="text-[8px] opacity-60 truncate mt-0.5">{emp.email}</p>
                                                </div>
                                                <ChevronRightIcon size={12} className={isSelected ? 'text-white' : 'text-slate-600'} />
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Selected Employee's Books Card */}
                        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-5 backdrop-blur-md">
                            <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-4 flex items-center gap-2">
                                <Building size={14} className="text-violet-500" /> Expense Books
                            </h3>
                            
                            {loadingCompanies ? (
                                <div className="flex justify-center py-6">
                                    <Loader2 className="animate-spin text-violet-500 w-5 h-5" />
                                </div>
                            ) : companies.length === 0 ? (
                                <p className="text-center py-6 text-[9px] font-bold text-slate-600 uppercase tracking-widest border border-dashed border-white/5 rounded-2xl bg-black/25">
                                    No Books Formed Yet
                                </p>
                            ) : (
                                <div className="space-y-1.5">
                                    {companies.map(comp => {
                                        const isSelected = selectedCompanyId === comp.id;
                                        return (
                                            <button
                                                key={comp.id}
                                                onClick={() => handleSelectCompany(comp.id)}
                                                className={`w-full flex items-center gap-2.5 p-3.5 rounded-xl text-left text-[10px] font-black uppercase tracking-wider transition-all ${
                                                    isSelected 
                                                    ? 'bg-violet-600/15 text-white border border-violet-500/20' 
                                                    : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-transparent'
                                                }`}
                                            >
                                                <Building size={12} className={isSelected ? 'text-violet-400' : 'text-slate-600'} />
                                                <span className="truncate">{comp.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Ledger Auditor Workspace */}
                    <div className="lg:col-span-3 flex flex-col gap-6 w-full">
                        {!selectedCompanyId ? (
                            <div className="bg-slate-900/20 border border-white/5 rounded-3xl p-16 text-center no-print">
                                <HelpCircle size={36} className="text-slate-700 mx-auto mb-4" />
                                <h3 className="text-white text-sm font-black uppercase tracking-wide">No Active Ledger Book Selected</h3>
                                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-1.5">Select a privileged employee and choose their expense book to audit.</p>
                            </div>
                        ) : (
                            <>
                                {/* Ledger Header */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/5 no-print">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <ReceiptText size={18} className="text-violet-500" />
                                            <h2 className="text-lg md:text-xl font-black italic text-white uppercase tracking-tight">
                                                {selectedEmployee?.name}'s {selectedCompany?.name}
                                            </h2>
                                        </div>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Auditing Transaction Records</p>
                                    </div>
                                    
                                    <div className="flex flex-wrap items-center gap-3">
                                        <button
                                            onClick={exportExcel}
                                            className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-300 transition-all flex items-center gap-2"
                                            title="Download Excel / Spreadsheet Statement"
                                        >
                                            <Download size={12} /> Excel Statement
                                        </button>
                                        <button
                                            onClick={exportPDF}
                                            className="px-4 py-3 bg-violet-600/20 hover:bg-violet-600 border border-violet-500/30 rounded-2xl text-[9px] font-black uppercase tracking-widest text-violet-300 hover:text-white transition-all flex items-center gap-2"
                                            title="Directly Download PDF Document"
                                        >
                                            <Download size={12} /> Download PDF
                                        </button>
                                        <button
                                            onClick={triggerPrint}
                                            className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-300 transition-all flex items-center gap-2"
                                            title="Print Preview / Save PDF"
                                        >
                                            <Printer size={12} /> Print PDF
                                        </button>
                                    </div>
                                </div>

                                {/* Period View Selector Tabs: ALL | DAILY | MONTHLY | YEARLY */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40 border border-white/5 p-3 rounded-2xl no-print">
                                    <div className="flex items-center gap-1 overflow-x-auto">
                                        {[
                                            { id: 'all', label: 'All Entries' },
                                            { id: 'daily', label: 'Daily View' },
                                            { id: 'monthly', label: 'Monthly View' },
                                            { id: 'yearly', label: 'Yearly View' }
                                        ].map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => { setActiveTab(t.id); setCurrentPage(1); }}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                                                    activeTab === t.id
                                                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                                }`}
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>

                                    {activeTab !== 'all' && (
                                        <div className="flex items-center gap-2 self-end sm:self-auto">
                                            <button
                                                onClick={() => {
                                                    const d = new Date(currentDate);
                                                    if (activeTab === 'daily') d.setDate(d.getDate() - 1);
                                                    else if (activeTab === 'monthly') d.setMonth(d.getMonth() - 1);
                                                    else if (activeTab === 'yearly') d.setFullYear(d.getFullYear() - 1);
                                                    setCurrentDate(d);
                                                }}
                                                className="p-2 bg-black/40 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-colors"
                                                title="Previous Period"
                                            >
                                                <ChevronLeft size={14} />
                                            </button>

                                            <span className="text-xs font-mono font-bold text-violet-300 min-w-[120px] text-center">
                                                {activeTab === 'daily' && currentDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                                {activeTab === 'monthly' && currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                                {activeTab === 'yearly' && currentDate.getFullYear()}
                                            </span>

                                            <button
                                                onClick={() => setCurrentDate(new Date())}
                                                className="px-2.5 py-1 bg-violet-500/10 hover:bg-violet-500 text-violet-400 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors"
                                            >
                                                Today
                                            </button>

                                            <button
                                                onClick={() => {
                                                    const d = new Date(currentDate);
                                                    if (activeTab === 'daily') d.setDate(d.getDate() + 1);
                                                    else if (activeTab === 'monthly') d.setMonth(d.getMonth() + 1);
                                                    else if (activeTab === 'yearly') d.setFullYear(d.getFullYear() + 1);
                                                    setCurrentDate(d);
                                                }}
                                                className="p-2 bg-black/40 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-colors"
                                                title="Next Period"
                                            >
                                                <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* VIEW TAB 1: ALL ENTRIES */}
                                {activeTab === 'all' && (
                                    <>
                                        {/* Financial Summaries Cards */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
                                            <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Audited Balance</p>
                                                <h2 className={`text-3xl font-black italic tracking-tight mt-3 ${summary.netBalance >= 0 ? 'text-white' : 'text-rose-500'}`}>
                                                    ₹{summary.netBalance.toFixed(2)}
                                                </h2>
                                                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">Net status of selection book</p>
                                            </div>
                                            <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md">
                                                <div className="flex justify-between items-start">
                                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Total Inflow (Credits)</p>
                                                    <div className="p-1 bg-emerald-500/10 rounded-lg text-emerald-500"><TrendingUp size={12} /></div>
                                                </div>
                                                <h2 className="text-3xl font-black italic tracking-tight mt-3 text-emerald-500">
                                                    +₹{summary.totalCredit.toFixed(2)}
                                                </h2>
                                                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">Cumulated credit amount</p>
                                            </div>
                                            <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md">
                                                <div className="flex justify-between items-start">
                                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Total Outflow (Debits)</p>
                                                    <div className="p-1 bg-rose-500/10 rounded-lg text-rose-500"><TrendingDown size={12} /></div>
                                                </div>
                                                <h2 className="text-3xl font-black italic tracking-tight mt-3 text-rose-500">
                                                    -₹{summary.totalDebit.toFixed(2)}
                                                </h2>
                                                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">Cumulated debit amount</p>
                                            </div>
                                        </div>

                                        {/* Transaction Ledger Sheet */}
                                        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md no-print">
                                            {/* Table Filters */}
                                            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6 no-print">
                                                <div className="flex-1 flex flex-col md:flex-row gap-3">
                                                    <div className="relative flex-1">
                                                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                                        <input
                                                            type="text"
                                                            placeholder="Search transaction memo..."
                                                            value={searchQuery}
                                                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                                            className="w-full bg-black/40 border border-white/5 rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder:text-slate-600 font-bold uppercase tracking-widest focus:outline-none focus:border-violet-500/30 transition-all"
                                                        />
                                                    </div>

                                                    <div className="flex bg-black/40 border border-white/5 rounded-2xl p-1 shrink-0">
                                                        {['ALL', 'CREDIT', 'DEBIT'].map((type) => (
                                                            <button
                                                                key={type}
                                                                onClick={() => { setFilterType(type); setCurrentPage(1); }}
                                                                className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                                                    filterType === type 
                                                                    ? 'bg-violet-600 text-white shadow' 
                                                                    : 'text-slate-500 hover:text-slate-300'
                                                                }`}
                                                            >
                                                                {type}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-3">
                                                    <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-2xl px-3 py-2">
                                                        <Calendar size={12} className="text-slate-500" />
                                                        <input
                                                            type="date"
                                                            value={startDate}
                                                            onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                                                            className="bg-transparent border-none text-[10px] text-white font-bold font-mono focus:outline-none w-28 uppercase"
                                                        />
                                                    </div>
                                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">To</span>
                                                    <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-2xl px-3 py-2">
                                                        <Calendar size={12} className="text-slate-500" />
                                                        <input
                                                            type="date"
                                                            value={endDate}
                                                            onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                                                            className="bg-transparent border-none text-[10px] text-white font-bold font-mono focus:outline-none w-28 uppercase"
                                                        />
                                                    </div>
                                                    {(startDate || endDate) && (
                                                        <button
                                                            onClick={() => { setStartDate(''); setEndDate(''); setCurrentPage(1); }}
                                                            className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl border border-white/5 text-[9px] font-black uppercase tracking-widest transition-all"
                                                        >
                                                            Clear
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Table Sheet */}
                                            <div className="overflow-x-auto">
                                                {loadingEntries ? (
                                                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                                                        <Loader2 className="animate-spin text-violet-500 w-8 h-8" />
                                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Auditing entries...</p>
                                                    </div>
                                                ) : filteredEntries.length === 0 ? (
                                                    <div className="text-center py-12 border border-dashed border-white/5 rounded-3xl bg-black/10">
                                                        <HelpCircle size={24} className="text-slate-600 mx-auto mb-2.5" />
                                                        <p className="text-white text-xs font-black uppercase tracking-wide">No Entries matching filters</p>
                                                    </div>
                                                ) : (
                                                    <table className="w-full text-left border-collapse print-border">
                                                        <thead>
                                                            <tr className="border-b border-white/5 text-slate-500 text-[9px] font-black uppercase tracking-widest pb-3 print-border">
                                                                <th className="py-4 pl-4 print-pad">Date</th>
                                                                <th className="py-4 print-pad">Narration</th>
                                                                <th className="py-4 text-center print-pad">Type</th>
                                                                <th className="py-4 text-right text-emerald-500 print-pad">Credit (+)</th>
                                                                <th className="py-4 text-right text-rose-500 print-pad">Debit (-)</th>
                                                                <th className="py-4 text-center print-pad">Status</th>
                                                                <th className="py-4 text-right print-pad">Balance</th>
                                                                <th className="py-4 text-right pr-4 print-pad no-print">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-white/5 print-border">
                                                            {currentEntries.map((entry) => (
                                                                <tr key={entry.id} className="text-slate-300 text-xs font-medium hover:bg-white/[0.01] transition-colors print-border">
                                                                    <td className="py-4 pl-4 font-mono text-[10px] text-slate-400 print-pad">
                                                                        {new Date(entry.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })}
                                                                    </td>
                                                                    <td className="py-4 font-black uppercase tracking-wide text-white print-pad">
                                                                        {entry.narration || <span className="text-slate-600 font-bold italic tracking-wider text-[10px]">No Memo</span>}
                                                                    </td>
                                                                    <td className="py-4 text-center print-pad">
                                                                        <span className={`text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full ${
                                                                            entry.type === 'CREDIT' 
                                                                            ? 'bg-emerald-500/10 text-emerald-400' 
                                                                            : 'bg-rose-500/10 text-rose-400'
                                                                        }`}>
                                                                            {entry.type}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-4 text-right text-emerald-500 font-bold font-mono print-pad">
                                                                        {entry.type === 'CREDIT' ? `+₹${entry.amount.toFixed(2)}` : '-'}
                                                                    </td>
                                                                    <td className="py-4 text-right text-rose-500 font-bold font-mono print-pad">
                                                                        {entry.type === 'DEBIT' ? `-₹${entry.amount.toFixed(2)}` : '-'}
                                                                    </td>
                                                                    <td className="py-4 text-center print-pad">
                                                                        {getStatusBadge(entry.status)}
                                                                    </td>
                                                                    <td className={`py-4 text-right font-black font-mono print-pad ${entry.runningBalance >= 0 ? 'text-white' : 'text-rose-500'}`}>
                                                                        ₹{entry.runningBalance.toFixed(2)}
                                                                    </td>
                                                                    <td className="py-4 text-right pr-4 print-pad no-print">
                                                                        {entry.status === 'PENDING' ? (
                                                                            <div className="flex justify-end gap-1.5">
                                                                                <button
                                                                                    onClick={() => handleUpdateStatus(entry.id, 'APPROVE')}
                                                                                    className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/30 rounded-lg text-[9px] font-black uppercase text-emerald-400 hover:text-white transition-all"
                                                                                    title="Approve Transaction"
                                                                                >
                                                                                    Approve
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleUpdateStatus(entry.id, 'REJECT')}
                                                                                    className="px-2 py-1 bg-rose-600/20 hover:bg-rose-600 border border-rose-500/30 rounded-lg text-[9px] font-black uppercase text-rose-400 hover:text-white transition-all"
                                                                                    title="Reject Transaction"
                                                                                >
                                                                                    Reject
                                                                                </button>
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">Locked</span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* VIEW TAB 2: DAILY VIEW */}
                                {activeTab === 'daily' && (
                                    <div className="space-y-4 no-print">
                                        {/* C/F Balance Row */}
                                        <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between text-xs font-mono">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">Carried Forward Balance:</span>
                                            <span className="font-black text-white">₹{dailyData.cfBalance.toFixed(2)}</span>
                                        </div>

                                        {/* Income & Expense Summary Cards */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-4">
                                                <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Income (+)</p>
                                                <p className="text-xl font-black font-mono text-white mt-1">₹{dailyData.totalCredit.toFixed(2)}</p>
                                            </div>
                                            <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-4">
                                                <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">Expense (-)</p>
                                                <p className="text-xl font-black font-mono text-white mt-1">₹{dailyData.totalDebit.toFixed(2)}</p>
                                            </div>
                                        </div>

                                        {/* Daily Item List */}
                                        <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-4 space-y-2">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Day's Transactions</h4>
                                            {dailyData.dayEntries.length === 0 ? (
                                                <p className="text-center py-6 text-slate-500 text-xs font-bold uppercase tracking-wider">No entries recorded for this date</p>
                                            ) : (
                                                dailyData.dayEntries.map(item => (
                                                    <div key={item.id} className="flex items-center justify-between text-xs py-2 px-3 bg-black/20 rounded-xl">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-bold text-white uppercase">{item.narration || 'No Memo'}</p>
                                                                {getStatusBadge(item.status)}
                                                            </div>
                                                            <span className="text-[9px] text-slate-500 font-mono">{new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                        <span className={`font-mono font-bold ${item.type === 'CREDIT' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                            {item.type === 'CREDIT' ? `+₹${item.amount.toFixed(2)}` : `-₹${item.amount.toFixed(2)}`}
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* VIEW TAB 3: MONTHLY VIEW */}
                                {activeTab === 'monthly' && (
                                    <div className="space-y-4 no-print">
                                        {/* Monthly Overview Card */}
                                        <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-5">
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                                                <div>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase">C/F Balance</span>
                                                    <p className="text-sm font-black font-mono text-slate-200 mt-1">₹{monthlyData.cfBalance.toFixed(2)}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[9px] font-bold text-emerald-400 uppercase">Income</span>
                                                    <p className="text-sm font-black font-mono text-emerald-400 mt-1">+₹{monthlyData.monthCredit.toFixed(2)}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[9px] font-bold text-rose-400 uppercase">Expense</span>
                                                    <p className="text-sm font-black font-mono text-rose-400 mt-1">-₹{monthlyData.monthDebit.toFixed(2)}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[9px] font-bold text-violet-400 uppercase">Net Balance</span>
                                                    <p className="text-sm font-black font-mono text-white mt-1">₹{monthlyData.monthNet.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Date Grouped Transaction Cards */}
                                        <div className="space-y-3">
                                            {monthlyData.groups.length === 0 ? (
                                                <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-8 text-center text-slate-500 text-xs font-bold uppercase">
                                                    No entries recorded for this month
                                                </div>
                                            ) : (
                                                monthlyData.groups.map(group => (
                                                    <div key={group.date.toDateString()} className="bg-[#111827] border border-slate-800/80 rounded-2xl p-4 space-y-2">
                                                        <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                                                            <span className="text-xs font-black uppercase text-violet-300">
                                                                {group.date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </span>
                                                            <div className="flex gap-3 text-[10px] font-mono">
                                                                {group.creditSum > 0 && <span className="text-emerald-400 font-bold">+₹{group.creditSum.toFixed(2)}</span>}
                                                                {group.debitSum > 0 && <span className="text-rose-400 font-bold">-₹{group.debitSum.toFixed(2)}</span>}
                                                            </div>
                                                        </div>

                                                        <div className="space-y-1.5 pt-1">
                                                            {group.entries.map(item => (
                                                                <div key={item.id} className="flex justify-between items-center text-xs py-1 px-2 bg-black/20 rounded-lg">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-bold text-slate-200 uppercase">{item.narration || 'No Memo'}</span>
                                                                        {getStatusBadge(item.status)}
                                                                    </div>
                                                                    <span className={`font-mono font-bold ${item.type === 'CREDIT' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                        {item.type === 'CREDIT' ? `+₹${item.amount.toFixed(2)}` : `-₹${item.amount.toFixed(2)}`}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* VIEW TAB 4: YEARLY VIEW */}
                                {activeTab === 'yearly' && (
                                    <div className="space-y-4 no-print">
                                        <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between text-xs font-mono">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">Carried Forward Balance Before {yearlyData.year}:</span>
                                            <span className="font-black text-white">₹{yearlyData.cfBalance.toFixed(2)}</span>
                                        </div>

                                        {/* 12-Month Table */}
                                        <div className="bg-[#111827] border border-slate-800/80 rounded-2xl overflow-hidden shadow-md">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-xs font-mono">
                                                    <thead>
                                                        <tr className="bg-slate-900/80 text-[10px] font-black uppercase text-slate-400 border-b border-slate-800">
                                                            <th className="py-3 px-4">Month</th>
                                                            <th className="py-3 text-right text-emerald-400">Income (Credit)</th>
                                                            <th className="py-3 text-right text-rose-400">Expense (Debit)</th>
                                                            <th className="py-3 text-right pr-4 text-white">Closing Balance</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-800/60">
                                                        {yearlyData.rows.map((row, idx) => (
                                                            <tr key={idx} className="hover:bg-white/[0.01]">
                                                                <td className="py-3 px-4 font-bold text-slate-200">{row.monthName}</td>
                                                                <td className="py-3 text-right text-emerald-400 font-bold">
                                                                    {row.credit > 0 ? `+₹${row.credit.toFixed(2)}` : '-'}
                                                                </td>
                                                                <td className="py-3 text-right text-rose-400 font-bold">
                                                                    {row.debit > 0 ? `-₹${row.debit.toFixed(2)}` : '-'}
                                                                </td>
                                                                <td className={`py-3 text-right pr-4 font-black ${row.balance >= 0 ? 'text-white' : 'text-rose-400'}`}>
                                                                    ₹{row.balance.toFixed(2)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                    {/* Dedicated Executive Print Statement Template */}
                                    <div id="print-area-admin" className="hidden print:block p-8 bg-white text-black font-sans">
                                        {/* Header & Logo */}
                                        <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-end">
                                            <div>
                                                <span className="text-[10px] font-black tracking-[0.2em] text-violet-700 uppercase">TWISHHSYNC | FINANCIAL INTELLIGENCE</span>
                                                <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 mt-1">
                                                    {activeTab.toUpperCase()} STATEMENT
                                                </h1>
                                                <p className="text-xs font-bold text-slate-600 mt-0.5">Expense Book: {selectedCompany?.name || 'All Accounts'}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">OFFICIAL STATEMENT</span>
                                                <p className="text-xs text-slate-600 font-bold mt-1">Generated: {new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })}</p>
                                                <p className="text-[10px] text-slate-700 font-bold">Auditor: {user?.name || 'Company Admin'}</p>
                                            </div>
                                        </div>

                                        {/* Personnel Info Card */}
                                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 grid grid-cols-2 gap-4 text-xs">
                                            <div>
                                                <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Employee Name</span>
                                                <span className="font-bold text-slate-900 text-sm">{selectedEmployee?.name}</span>
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Employee Email</span>
                                                <span className="font-mono font-bold text-slate-800">{selectedEmployee?.email}</span>
                                            </div>
                                        </div>

                                        {/* Financial Metric Grid per activeTab */}
                                        <div className="grid grid-cols-3 gap-4 mb-6 border border-slate-300 p-4 rounded-xl bg-slate-50 text-xs font-mono">
                                            <div>
                                                <span className="block text-slate-500 font-bold uppercase text-[9px]">Total Credit Inflow (+)</span>
                                                <span className="font-bold text-emerald-700 text-base">
                                                    ₹{(
                                                        activeTab === 'all' ? summary.totalCredit :
                                                        activeTab === 'daily' ? dailyData.totalCredit :
                                                        activeTab === 'monthly' ? monthlyData.monthCredit :
                                                        yearlyData.rows.reduce((acc, r) => acc + r.credit, 0)
                                                    ).toFixed(2)}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="block text-slate-500 font-bold uppercase text-[9px]">Total Debit Outflow (-)</span>
                                                <span className="font-bold text-rose-700 text-base">
                                                    ₹{(
                                                        activeTab === 'all' ? summary.totalDebit :
                                                        activeTab === 'daily' ? dailyData.totalDebit :
                                                        activeTab === 'monthly' ? monthlyData.monthDebit :
                                                        yearlyData.rows.reduce((acc, r) => acc + r.debit, 0)
                                                    ).toFixed(2)}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="block text-slate-500 font-bold uppercase text-[9px]">Net Period Balance</span>
                                                <span className="font-black text-base text-slate-900">
                                                    ₹{(
                                                        activeTab === 'all' ? summary.netBalance :
                                                        activeTab === 'daily' ? dailyData.netBalance :
                                                        activeTab === 'monthly' ? monthlyData.monthNet :
                                                        (yearlyData.rows.length > 0 ? yearlyData.rows[11].balance : 0)
                                                    ).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Table depending on activeTab */}
                                        {activeTab === 'yearly' ? (
                                            <table className="w-full text-left text-xs border-collapse">
                                                <thead>
                                                    <tr className="border-b-2 border-slate-900 font-black uppercase text-[10px] text-slate-800">
                                                        <th className="py-2.5">Month</th>
                                                        <th className="py-2.5 text-right">Credit (₹)</th>
                                                        <th className="py-2.5 text-right">Debit (₹)</th>
                                                        <th className="py-2.5 text-right">Closing Balance (₹)</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200 font-mono">
                                                    <tr className="bg-slate-100 font-bold">
                                                        <td className="py-2.5 text-[10px] uppercase">Carried Forward Balance</td>
                                                        <td className="py-2.5 text-right">-</td>
                                                        <td className="py-2.5 text-right">-</td>
                                                        <td className="py-2.5 text-right">₹{yearlyData.cfBalance.toFixed(2)}</td>
                                                    </tr>
                                                    {yearlyData.rows.map((row, idx) => (
                                                        <tr key={idx}>
                                                            <td className="py-2.5 font-bold">{row.monthName}</td>
                                                            <td className="py-2.5 text-right text-emerald-700 font-bold">₹{row.credit.toFixed(2)}</td>
                                                            <td className="py-2.5 text-right text-rose-700 font-bold">₹{row.debit.toFixed(2)}</td>
                                                            <td className="py-2.5 text-right font-black">₹{row.balance.toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <table className="w-full text-left text-xs border-collapse">
                                                <thead>
                                                    <tr className="border-b-2 border-slate-900 font-black uppercase text-[10px] text-slate-800">
                                                        <th className="py-2.5">Date</th>
                                                        <th className="py-2.5">Narration / Item Memo</th>
                                                        <th className="py-2.5 text-center">Type</th>
                                                        <th className="py-2.5 text-right">Credit (₹)</th>
                                                        <th className="py-2.5 text-right">Debit (₹)</th>
                                                        <th className="py-2.5 text-right">Balance (₹)</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200 font-mono">
                                                    {activeTab === 'daily' && (
                                                        <tr className="bg-slate-100 font-bold">
                                                            <td className="py-2.5 text-[10px] uppercase">Carried Forward</td>
                                                            <td className="py-2.5 uppercase text-slate-600">Balance Before Date</td>
                                                            <td className="py-2.5 text-center">-</td>
                                                            <td className="py-2.5 text-right">-</td>
                                                            <td className="py-2.5 text-right">-</td>
                                                            <td className="py-2.5 text-right font-black">₹{dailyData.cfBalance.toFixed(2)}</td>
                                                        </tr>
                                                    )}
                                                    {activeTab === 'monthly' && (
                                                        <tr className="bg-slate-100 font-bold">
                                                            <td className="py-2.5 text-[10px] uppercase">Carried Forward</td>
                                                            <td className="py-2.5 uppercase text-slate-600">Balance Before Month</td>
                                                            <td className="py-2.5 text-center">-</td>
                                                            <td className="py-2.5 text-right">-</td>
                                                            <td className="py-2.5 text-right">-</td>
                                                            <td className="py-2.5 text-right font-black">₹{monthlyData.cfBalance.toFixed(2)}</td>
                                                        </tr>
                                                    )}
                                                    {(() => {
                                                        const list = activeTab === 'all' 
                                                            ? filteredEntries 
                                                            : activeTab === 'daily' 
                                                            ? dailyData.dayEntries 
                                                            : monthlyData.groups.flatMap(g => g.entries);
                                                        const sorted = [...list].sort((a,b) => new Date(a.date || a.createdAt).getTime() - new Date(b.date || b.createdAt).getTime());
                                                        let r = activeTab === 'all' ? 0 : (activeTab === 'daily' ? dailyData.cfBalance : monthlyData.cfBalance);
                                                        return sorted.map((entry) => {
                                                            r = r + (entry.type === 'CREDIT' ? entry.amount : -entry.amount);
                                                            return (
                                                                <tr key={entry.id}>
                                                                    <td className="py-2.5 text-[10px] font-medium">{new Date(entry.date).toLocaleDateString()}</td>
                                                                    <td className="py-2.5 font-bold uppercase text-slate-900">{entry.narration || '-'}</td>
                                                                    <td className="py-2.5 text-center font-bold">
                                                                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                                                                            entry.type === 'CREDIT' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                                                        }`}>
                                                                            {entry.type}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-2.5 text-right text-emerald-700 font-bold">
                                                                        {entry.type === 'CREDIT' ? `₹${entry.amount.toFixed(2)}` : '-'}
                                                                    </td>
                                                                    <td className="py-2.5 text-right text-rose-700 font-bold">
                                                                        {entry.type === 'DEBIT' ? `₹${entry.amount.toFixed(2)}` : '-'}
                                                                    </td>
                                                                    <td className="py-2.5 text-right font-black text-slate-900">
                                                                        ₹{r.toFixed(2)}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        });
                                                    })()}
                                                </tbody>
                                            </table>
                                        )}

                                        {/* Signature / Verification Line */}
                                        <div className="mt-12 pt-6 border-t border-slate-300 flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                                            <span>Automated Financial Audit System</span>
                                            <span>Authorized Auditor Signature: _______________________</span>
                                        </div>
                                    </div>

                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-between pt-6 mt-6 border-t border-white/5 no-print">
                                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                                                Page {currentPage} of {totalPages} ({filteredEntries.length} items)
                                            </span>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handlePrevPage}
                                                    disabled={currentPage === 1}
                                                    className="p-2.5 bg-black/40 border border-white/5 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
                                                >
                                                    <ChevronLeft size={16} />
                                                </button>
                                                <button
                                                    onClick={handleNextPage}
                                                    disabled={currentPage === totalPages}
                                                    className="p-2.5 bg-black/40 border border-white/5 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
                                                >
                                                    <ChevronRight size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminExpensesView;
