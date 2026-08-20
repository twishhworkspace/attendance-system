import React, { useState, useEffect, useMemo } from 'react';
import { 
    Plus, 
    Trash2, 
    Edit3, 
    Loader2, 
    ChevronLeft, 
    ChevronRight, 
    Building, 
    Search, 
    FileText, 
    Check, 
    ChevronDown, 
    Tag, 
    FileSpreadsheet, 
    Pencil,
    X,
    Printer,
    Download
} from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { exportExpenseToExcel, exportExpenseToPDF } from '../utils/expenseExport';

const ExpenseTrackerView = () => {
    const { showToast } = useToast();
    const { user } = useAuth();
    
    // Core State
    const [companies, setCompanies] = useState([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState(() => {
        return localStorage.getItem('selected_expense_company_id') || '';
    });
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [entries, setEntries] = useState([]);
    const [summary, setSummary] = useState({ totalCredit: 0, totalDebit: 0, netBalance: 0 });
    
    const [loadingCompanies, setLoadingCompanies] = useState(true);
    const [loadingEntries, setLoadingEntries] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Active View Tab: 'daily' | 'monthly' | 'yearly'
    const [activeTab, setActiveTab] = useState('daily');
    
    // Active Date Trackers
    const [currentDate, setCurrentDate] = useState(new Date());
    
    // Slide-up Bottom Panel State
    const [showAddPanel, setShowAddPanel] = useState(false);
    const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
    const [isEditingCompany, setIsEditingCompany] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);

    // Add Form Fields
    const [entryType, setEntryType] = useState('DEBIT'); // 'CREDIT' | 'DEBIT'
    const [entryTitle, setEntryTitle] = useState('');
    const [entryAmount, setEntryAmount] = useState('');
    const [entryDescription, setEntryDescription] = useState('');
    const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);

    // Search Mode
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch list of expense companies
    const fetchCompanies = async () => {
        setLoadingCompanies(true);
        try {
            const response = await api.get('expenses/companies');
            setCompanies(response.data);
            
            if (selectedCompanyId) {
                const found = response.data.find(c => c.id === selectedCompanyId);
                if (found) {
                    setSelectedCompany(found);
                } else if (response.data.length > 0) {
                    handleSelectCompany(response.data[0].id, response.data);
                }
            } else if (response.data.length > 0) {
                handleSelectCompany(response.data[0].id, response.data);
            }
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to fetch expense books', 'error');
        } finally {
            setLoadingCompanies(false);
        }
    };

    // Fetch entries for selected company
    const fetchEntries = async (companyId) => {
        if (!companyId) return;
        setLoadingEntries(true);
        try {
            const response = await api.get(`expenses/companies/${companyId}/entries`);
            setEntries(response.data.entries);
            setSummary(response.data.summary);
            
            const currentComp = companies.find(c => c.id === companyId);
            if (currentComp) setSelectedCompany(currentComp);
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to load ledger entries', 'error');
        } finally {
            setLoadingEntries(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    useEffect(() => {
        if (selectedCompanyId) {
            fetchEntries(selectedCompanyId);
        } else {
            setEntries([]);
            setSummary({ totalCredit: 0, totalDebit: 0, netBalance: 0 });
            setSelectedCompany(null);
        }
    }, [selectedCompanyId]);

    const handleSelectCompany = (id, companyList = null) => {
        setSelectedCompanyId(id);
        const list = companyList || companies;
        const found = list.find(c => c.id === id);
        if (found) setSelectedCompany(found);
        if (id) {
            localStorage.setItem('selected_expense_company_id', id);
        } else {
            localStorage.removeItem('selected_expense_company_id');
        }
    };

    // Create/Edit Company Book
    const handleSaveCompany = async (e) => {
        e.preventDefault();
        const name = e.target.companyName.value.trim();
        if (!name) return;
        
        setIsSubmitting(true);
        try {
            if (isEditingCompany) {
                const response = await api.put(`expenses/companies/${selectedCompanyId}`, { name });
                showToast('Expense Book Renamed', 'success');
                setCompanies(prev => prev.map(c => c.id === selectedCompanyId ? response.data : c));
                setSelectedCompany(response.data);
            } else {
                const response = await api.post('expenses/companies', { name });
                showToast('Expense Book Created Successfully', 'success');
                setCompanies(prev => [...prev, response.data]);
                handleSelectCompany(response.data.id, [...companies, response.data]);
            }
            setShowAddCompanyModal(false);
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to save book', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Open Panel for new or edit transaction
    const openAddPanel = (entry = null, defaultType = 'DEBIT') => {
        if (entry) {
            setEditingEntry(entry);
            setEntryType(entry.type);
            setEntryTitle(entry.narration || '');
            setEntryAmount(entry.amount ? entry.amount.toString() : '');
            setEntryDescription(entry.description || '');
            setEntryDate(new Date(entry.date).toISOString().split('T')[0]);
        } else {
            setEditingEntry(null);
            setEntryType(defaultType);
            setEntryTitle('');
            setEntryAmount('');
            setEntryDescription('');
            setEntryDate(currentDate.toISOString().split('T')[0]);
        }
        setShowAddPanel(true);
    };

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

    // Save Entry Handler
    const handleSaveEntry = async (e) => {
        if (e) e.preventDefault();
        const amountNum = parseFloat(entryAmount);
        if (!entryTitle.trim()) {
            showToast('Please enter an item title/narration', 'error');
            return;
        }
        if (isNaN(amountNum) || amountNum <= 0) {
            showToast('Please enter a valid positive amount', 'error');
            return;
        }

        setIsSubmitting(true);
        const payload = {
            type: entryType,
            amount: amountNum,
            narration: entryTitle.trim(),
            description: entryDescription.trim(),
            date: entryDate
        };

        try {
            if (editingEntry) {
                await api.put(`expenses/entries/${editingEntry.id}`, payload);
                showToast('Transaction Updated', 'success');
            } else {
                await api.post(`expenses/companies/${selectedCompanyId}/entries`, payload);
                showToast('Transaction Added', 'success');
            }
            setShowAddPanel(false);
            fetchEntries(selectedCompanyId);
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to save transaction', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete Entry
    const handleDeleteEntry = async (entryId) => {
        if (!window.confirm('Delete this transaction entry?')) return;
        try {
            await api.delete(`expenses/entries/${entryId}`);
            showToast('Transaction deleted', 'info');
            if (editingEntry?.id === entryId) setShowAddPanel(false);
            fetchEntries(selectedCompanyId);
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to delete transaction', 'error');
        }
    };

    // Date Navigation helpers
    const navigateDaily = (deltaDays) => {
        const next = new Date(currentDate);
        next.setDate(next.getDate() + deltaDays);
        setCurrentDate(next);
    };

    const navigateMonthly = (deltaMonths) => {
        const next = new Date(currentDate);
        next.setMonth(next.getMonth() + deltaMonths);
        setCurrentDate(next);
    };

    const navigateYearly = (deltaYears) => {
        const next = new Date(currentDate);
        next.setFullYear(next.getFullYear() + deltaYears);
        setCurrentDate(next);
    };

    // Filtered Entries by Date & Search
    const searchFilteredEntries = useMemo(() => {
        if (!searchQuery) return entries;
        return entries.filter(e => 
            (e.narration || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (e.description || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [entries, searchQuery]);

    // Data for Daily View
    const dailyData = useMemo(() => {
        const targetStr = currentDate.toISOString().split('T')[0];
        
        // Filter entries matching exact day
        const dayEntries = searchFilteredEntries.filter(e => {
            const dStr = new Date(e.date).toISOString().split('T')[0];
            return dStr === targetStr;
        });

        const credits = dayEntries.filter(e => e.type === 'CREDIT' && e.status !== 'REJECTED');
        const debits = dayEntries.filter(e => e.type === 'DEBIT' && e.status !== 'REJECTED');

        const incomeTotal = credits.reduce((sum, e) => sum + e.amount, 0);
        const expenseTotal = debits.reduce((sum, e) => sum + e.amount, 0);

        // Carried Forward Balance (all entries strictly prior to target date)
        const targetTime = new Date(targetStr).getTime();
        const cfEntries = searchFilteredEntries.filter(e => {
            const dTime = new Date(new Date(e.date).toISOString().split('T')[0]).getTime();
            return dTime < targetTime && e.status !== 'REJECTED';
        });

        const cfBalance = cfEntries.reduce((sum, e) => {
            return sum + (e.type === 'CREDIT' ? e.amount : -e.amount);
        }, 0);

        const endDayBalance = cfBalance + incomeTotal - expenseTotal;

        return {
            credits,
            debits,
            incomeTotal,
            expenseTotal,
            cfBalance,
            endDayBalance
        };
    }, [searchFilteredEntries, currentDate]);

    // Data for Monthly View
    const monthlyData = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth(); // 0-indexed

        // Filter entries in target month
        const monthEntries = searchFilteredEntries.filter(e => {
            const d = new Date(e.date);
            return d.getFullYear() === year && d.getMonth() === month;
        });

        const totalIncome = monthEntries.filter(e => e.type === 'CREDIT' && e.status !== 'REJECTED').reduce((sum, e) => sum + e.amount, 0);
        const totalExpense = monthEntries.filter(e => e.type === 'DEBIT' && e.status !== 'REJECTED').reduce((sum, e) => sum + e.amount, 0);

        // C/F Balance prior to 1st of this month
        const firstOfMonth = new Date(year, month, 1).getTime();
        const cfEntries = searchFilteredEntries.filter(e => {
            const dTime = new Date(e.date).getTime();
            return dTime < firstOfMonth && e.status !== 'REJECTED';
        });
        const cfBalance = cfEntries.reduce((sum, e) => sum + (e.type === 'CREDIT' ? e.amount : -e.amount), 0);
        const monthBalance = cfBalance + totalIncome - totalExpense;

        // Group month entries by Date (descending)
        const groupsMap = {};
        monthEntries.forEach(e => {
            const dateKey = new Date(e.date).toISOString().split('T')[0];
            if (!groupsMap[dateKey]) groupsMap[dateKey] = [];
            groupsMap[dateKey].push(e);
        });

        // Compute balances per date group
        const dateKeys = Object.keys(groupsMap).sort().reverse();
        
        // Calculate cumulative running balances chronologically up to each date
        const chronologicalKeys = Object.keys(groupsMap).sort();
        let currentRunning = cfBalance;
        const groupBalances = {};

        chronologicalKeys.forEach(key => {
            const dayIncome = groupsMap[key].filter(e => e.type === 'CREDIT' && e.status !== 'REJECTED').reduce((s, e) => s + e.amount, 0);
            const dayExpense = groupsMap[key].filter(e => e.type === 'DEBIT' && e.status !== 'REJECTED').reduce((s, e) => s + e.amount, 0);
            currentRunning = currentRunning + dayIncome - dayExpense;
            groupBalances[key] = currentRunning;
        });

        const groups = dateKeys.map(key => ({
            dateKey: key,
            dateObj: new Date(key),
            items: groupsMap[key],
            income: groupsMap[key].filter(e => e.type === 'CREDIT' && e.status !== 'REJECTED').reduce((s, e) => s + e.amount, 0),
            expense: groupsMap[key].filter(e => e.type === 'DEBIT' && e.status !== 'REJECTED').reduce((s, e) => s + e.amount, 0),
            dayEndBalance: groupBalances[key]
        }));

        return {
            totalIncome,
            totalExpense,
            cfBalance,
            monthBalance,
            groups
        };
    }, [searchFilteredEntries, currentDate]);

    // Data for Yearly View
    const yearlyData = useMemo(() => {
        const year = currentDate.getFullYear();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // C/F Balance prior to Jan 1 of this year
        const startOfYear = new Date(year, 0, 1).getTime();
        const cfEntries = searchFilteredEntries.filter(e => new Date(e.date).getTime() < startOfYear && e.status !== 'REJECTED');
        const cfBalance = cfEntries.reduce((sum, e) => sum + (e.type === 'CREDIT' ? e.amount : -e.amount), 0);

        let running = cfBalance;
        const rows = months.map((mName, idx) => {
            const mEntries = searchFilteredEntries.filter(e => {
                const d = new Date(e.date);
                return d.getFullYear() === year && d.getMonth() === idx;
            });
            const income = mEntries.filter(e => e.type === 'CREDIT' && e.status !== 'REJECTED').reduce((s, e) => s + e.amount, 0);
            const expense = mEntries.filter(e => e.type === 'DEBIT' && e.status !== 'REJECTED').reduce((s, e) => s + e.amount, 0);
            running = running + income - expense;

            return {
                monthName: mName,
                income,
                expense,
                balance: running
            };
        });

        return {
            year,
            cfBalance,
            rows
        };
    }, [searchFilteredEntries, currentDate]);

    // Excel Statement Export
    const exportExcel = () => {
        if (entries.length === 0) {
            showToast('No entries to export', 'info');
            return;
        }
        exportExpenseToExcel({
            employee: user,
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
            employee: user,
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

    // Print / PDF Trigger
    const triggerPrint = () => {
        window.print();
    };

    const printStyles = `
        @page {
            margin: 0;
            size: auto;
        }
        @media print {
            body * {
                visibility: hidden !important;
            }
            #print-area-employee, #print-area-employee * {
                visibility: visible !important;
                color: #0f172a !important;
                background-color: transparent !important;
                box-shadow: none !important;
            }
            #print-area-employee {
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
            #print-area-employee table {
                width: 100% !important;
                border-collapse: collapse !important;
            }
            #print-area-employee tr {
                border-radius: 0 !important;
                background: transparent !important;
                border-bottom: 1px solid #e2e8f0 !important;
            }
            #print-area-employee td, #print-area-employee th {
                color: #0f172a !important;
                padding: 10px 8px !important;
                border-radius: 0 !important;
                background: transparent !important;
            }
            .no-print {
                display: none !important;
            }
        }
    `;

    if (loadingCompanies) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="animate-spin text-emerald-500 w-10 h-10" />
            </div>
        );
    }

    const dayNameStr = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
    const monthYearStr = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const dayNumber = currentDate.getDate();

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-[#0a0a0f] text-slate-100 selection:bg-violet-500/30 overflow-x-hidden pb-24 relative font-sans">
            <style>{printStyles}</style>

            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-30 bg-[#0b0f19]/90 backdrop-blur-md border-b border-slate-800/60 px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
                <div className="flex items-center justify-between w-full sm:w-auto">
                    <button 
                        onClick={() => {
                            setIsEditingCompany(true);
                            setShowAddCompanyModal(true);
                        }}
                        className="flex items-center gap-2 text-white hover:text-violet-400 font-bold text-lg tracking-tight transition-colors"
                    >
                        <span>{selectedCompany?.name || 'Day to Day Expenses'}</span>
                        <Pencil size={15} className="text-violet-400" />
                    </button>
                    
                    {/* Mobile search toggle */}
                    <button 
                        onClick={() => setShowSearch(!showSearch)} 
                        className={`sm:hidden p-2 rounded-xl transition-colors ${showSearch ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'}`}
                        title="Search Transactions"
                    >
                        <Search size={16} />
                    </button>
                </div>

                <div className="flex flex-col w-full sm:w-auto gap-2.5">
                    {/* Dropdown & Desktop search */}
                    <div className="flex items-center gap-2 w-full justify-between sm:justify-end">
                        <div className="relative flex-1 sm:flex-none flex items-center gap-1.5">
                            <div className="relative flex-1">
                                <select
                                    value={selectedCompanyId}
                                    onChange={(e) => handleSelectCompany(e.target.value)}
                                    className="w-full bg-[#111827] text-violet-400 text-xs font-bold py-2.5 px-3 pr-8 rounded-xl border border-slate-700/60 focus:outline-none cursor-pointer appearance-none uppercase"
                                >
                                    {companies.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-violet-400 pointer-events-none" />
                            </div>
                            <button
                                onClick={() => {
                                    setIsEditingCompany(false);
                                    setShowAddCompanyModal(true);
                                }}
                                className="p-2.5 bg-violet-600/10 hover:bg-violet-600 text-violet-400 hover:text-white rounded-xl border border-violet-500/20 transition-all flex items-center justify-center shrink-0"
                                title="Create New Expense Book"
                            >
                                <Plus size={16} />
                            </button>
                        </div>

                        <button 
                            onClick={() => setShowSearch(!showSearch)} 
                            className={`hidden sm:block p-2.5 rounded-xl transition-colors ${showSearch ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'}`}
                            title="Search Transactions"
                        >
                            <Search size={16} />
                        </button>
                    </div>

                    {/* Export / Print Actions Grid on mobile, flex on desktop */}
                    <div className="grid grid-cols-3 sm:flex items-center gap-2 w-full sm:w-auto">
                        <button
                            onClick={exportExcel}
                            className="px-3 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-wider text-emerald-400 transition-all flex items-center justify-center gap-1.5"
                            title="Download Excel Statement"
                        >
                            <Download size={13} /> Excel
                        </button>

                        <button
                            onClick={exportPDF}
                            className="px-3 py-2.5 bg-violet-600/20 hover:bg-violet-600 border border-violet-500/30 rounded-xl text-[10px] font-black uppercase tracking-wider text-violet-300 hover:text-white transition-all flex items-center justify-center gap-1.5"
                            title="Download PDF File"
                        >
                            <Download size={13} /> PDF
                        </button>

                        <button
                            onClick={triggerPrint}
                            className="px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-300 transition-all flex items-center justify-center gap-1.5"
                            title="Print PDF Statement"
                        >
                            <Printer size={13} /> Print
                        </button>
                    </div>
                </div>
            </header>

            {/* Optional Search Input */}
            <AnimatePresence>
                {showSearch && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 py-2 bg-[#0d1322] border-b border-slate-800/60 overflow-hidden"
                    >
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Search transactions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#070a14] border border-slate-700/60 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 font-bold focus:outline-none focus:border-violet-500"
                                autoFocus
                            />
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sub-header View Tabs: Daily | Monthly | Yearly */}
            <div className="flex border-b border-slate-800/60 bg-[#0b0f19]">
                {['daily', 'monthly', 'yearly'].map((tab) => {
                    const isActive = activeTab === tab;
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 text-sm font-black tracking-wider uppercase text-center transition-all relative ${
                                isActive ? 'text-violet-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            {tab === 'daily' && 'Daily'}
                            {tab === 'monthly' && 'Monthly'}
                            {tab === 'yearly' && 'Yearly'}

                            {isActive && (
                                <motion.div 
                                    layoutId="activeTabUnderline"
                                    className="absolute bottom-0 left-0 right-0 h-[3px] bg-violet-500 rounded-full mx-6 shadow-sm shadow-violet-500/50"
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Main Tab Views Content */}
            <div className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-4">
                
                {/* 1. DAILY VIEW */}
                {activeTab === 'daily' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        {/* Daily Date Card */}
                        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 flex items-center justify-between text-slate-100 shadow-xl">
                            <button onClick={() => navigateDaily(-1)} className="p-2 text-slate-400 hover:text-violet-400 transition-colors">
                                <ChevronLeft size={22} />
                            </button>

                            <div className="flex items-center gap-3">
                                <div className="border border-violet-500/30 rounded-xl px-3 py-1 text-center bg-[#0b0f19]">
                                    <span className="text-xl font-black italic text-violet-400 leading-none">{dayNumber}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-200 leading-tight">{monthYearStr}</span>
                                    <span className="text-[10px] text-slate-400 font-medium">{dayNameStr}</span>
                                </div>
                            </div>

                            <div className="text-right">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Balance</span>
                                <span className={`text-sm font-black font-mono ${dailyData.endDayBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    ₹{dailyData.endDayBalance.toFixed(2)}
                                </span>
                            </div>

                            <button onClick={() => navigateDaily(1)} className="p-2 text-slate-400 hover:text-emerald-400 transition-colors">
                                <ChevronRight size={22} />
                            </button>
                        </div>

                        {/* C/F Carried Forward Balance Row */}
                        <div className="flex items-center justify-between px-3 py-1 text-xs text-slate-300 font-mono">
                            <span className="font-bold tracking-wider text-slate-400 uppercase">C/F</span>
                            <span className="font-bold font-mono">₹{dailyData.cfBalance.toFixed(2)}</span>
                        </div>

                        {/* Income (Credit) Section */}
                        <div className="bg-[#141f1b] border border-emerald-900/20 rounded-2xl overflow-hidden shadow-md">
                            <div className="bg-[#1b2b25]/80 px-4 py-3 flex items-center justify-between border-b border-emerald-900/20">
                                <span className="font-black text-xs uppercase tracking-wider text-emerald-400">Income (Credit)</span>
                                <span className="font-mono font-bold text-emerald-400 text-sm">₹{dailyData.incomeTotal.toFixed(2)}</span>
                            </div>

                            <div className="p-4 space-y-2">
                                {dailyData.credits.length === 0 ? (
                                    <p className="text-[10px] font-bold text-slate-500 text-center py-2 italic tracking-wide">
                                        Tap on '+' to add new item and long press an entry to edit.
                                    </p>
                                ) : (
                                    dailyData.credits.map(item => (
                                        <div 
                                            key={item.id}
                                            onClick={() => openAddPanel(item, 'CREDIT')}
                                            className="flex items-center justify-between p-3 bg-[#0d1512] hover:bg-[#182823] rounded-xl border border-emerald-900/10 cursor-pointer transition-colors group"
                                        >
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-white uppercase tracking-wide group-hover:text-emerald-400 transition-colors">{item.narration}</span>
                                                    {getStatusBadge(item.status)}
                                                </div>
                                                {item.description && <span className="text-[9px] text-slate-500">{item.description}</span>}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono font-black text-emerald-400 text-sm">₹{item.amount.toFixed(2)}</span>
                                                {item.status === 'PENDING' ? (
                                                    <>
                                                        <button onClick={(e) => { e.stopPropagation(); openAddPanel(item, 'CREDIT'); }} className="text-slate-600 hover:text-violet-400 p-1">
                                                            <Pencil size={13} />
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteEntry(item.id); }} className="text-slate-600 hover:text-rose-400 p-1">
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className="w-6" /> // spacer
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Expense (Debit) Section */}
                        <div className="bg-[#141f1b] border border-emerald-900/20 rounded-2xl overflow-hidden shadow-md">
                            <div className="bg-[#1b2b25]/80 px-4 py-3 flex items-center justify-between border-b border-emerald-900/20">
                                <span className="font-black text-xs uppercase tracking-wider text-rose-400">Expense (Debit)</span>
                                <span className="font-mono font-bold text-rose-400 text-sm">₹{dailyData.expenseTotal.toFixed(2)}</span>
                            </div>

                            <div className="p-4 space-y-2">
                                {dailyData.debits.length === 0 ? (
                                    <p className="text-[10px] font-bold text-slate-500 text-center py-2 italic tracking-wide">
                                        Tap on '+' to add new item and long press an entry to edit.
                                    </p>
                                ) : (
                                    dailyData.debits.map(item => (
                                        <div 
                                            key={item.id}
                                            onClick={() => openAddPanel(item, 'DEBIT')}
                                            className="flex items-center justify-between p-3 bg-[#0d1512] hover:bg-[#182823] rounded-xl border border-emerald-900/10 cursor-pointer transition-colors group"
                                        >
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-white uppercase tracking-wide group-hover:text-rose-400 transition-colors">{item.narration}</span>
                                                    {getStatusBadge(item.status)}
                                                </div>
                                                {item.description && <span className="text-[9px] text-slate-500">{item.description}</span>}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono font-black text-rose-400 text-sm">₹{item.amount.toFixed(2)}</span>
                                                {item.status === 'PENDING' ? (
                                                    <>
                                                        <button onClick={(e) => { e.stopPropagation(); openAddPanel(item, 'DEBIT'); }} className="text-slate-600 hover:text-violet-400 p-1">
                                                            <Pencil size={13} />
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteEntry(item.id); }} className="text-slate-600 hover:text-rose-400 p-1">
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className="w-6" /> // spacer
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. MONTHLY VIEW */}
                {activeTab === 'monthly' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        {/* Month Navigator */}
                        <div className="flex items-center justify-center gap-6 py-2 text-slate-300">
                            <button onClick={() => navigateMonthly(-1)} className="p-2 hover:text-emerald-400 transition-colors">
                                <ChevronLeft size={20} />
                            </button>
                            <span className="text-base font-black uppercase tracking-wider text-white">
                                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </span>
                            <button onClick={() => navigateMonthly(1)} className="p-2 hover:text-emerald-400 transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        {/* Month Summary Card */}
                        <div className="bg-[#182823] border border-emerald-800/30 rounded-2xl p-4 shadow-lg text-xs space-y-3">
                            <div className="grid grid-cols-2 gap-4 border-b border-emerald-900/20 pb-3">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Income (Credit)</span>
                                    <span className="text-sm font-black font-mono text-emerald-400">₹{monthlyData.totalIncome.toFixed(2)}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Expense (Debit)</span>
                                    <span className="text-sm font-black font-mono text-rose-400">₹{monthlyData.totalExpense.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-1 font-mono text-slate-300">
                                <div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase block">C/F</span>
                                    <span className="font-bold">₹{monthlyData.cfBalance.toFixed(2)}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Balance</span>
                                    <span className={`text-sm font-black ${monthlyData.monthBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        ₹{monthlyData.monthBalance.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Grouped Cards By Date */}
                        <div className="space-y-4">
                            {monthlyData.groups.length === 0 ? (
                                <p className="text-center py-10 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    No records found for this month.
                                </p>
                            ) : (
                                monthlyData.groups.map(group => (
                                    <div key={group.dateKey} className="bg-[#141f1b] border border-emerald-900/20 rounded-2xl overflow-hidden shadow-md">
                                        {/* Date Header */}
                                        <div className="bg-[#1b2b25]/80 px-4 py-2.5 text-center text-xs font-black uppercase text-slate-200 border-b border-emerald-900/20">
                                            {group.dateObj.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' })}
                                        </div>

                                        <div className="p-4 space-y-3">
                                            <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400">
                                                <span>Income (Credit)</span>
                                                <span>Expense (Debit)</span>
                                            </div>

                                            {/* Item entries */}
                                            <div className="space-y-2">
                                                {group.items.map(item => (
                                                    <div key={item.id} onClick={() => openAddPanel(item, item.type)} className="flex items-center justify-between text-xs py-1 cursor-pointer hover:bg-white/5 px-2 rounded-lg transition-colors">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-white uppercase">{item.narration}</span>
                                                            {getStatusBadge(item.status)}
                                                        </div>
                                                        <span className={`font-mono font-bold ${item.type === 'CREDIT' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                            {item.type === 'CREDIT' ? `₹${item.amount.toFixed(2)}` : `₹${item.amount.toFixed(2)}`}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex justify-end pt-2 border-t border-emerald-900/10 text-xs font-mono">
                                                <span className="text-[10px] text-slate-400 uppercase mr-2 font-sans">Balance:</span>
                                                <span className="font-black text-white">₹{group.dayEndBalance.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* 3. YEARLY VIEW */}
                {activeTab === 'yearly' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        {/* Year Navigator */}
                        <div className="flex items-center justify-center gap-6 py-2 text-slate-300">
                            <button onClick={() => navigateYearly(-1)} className="p-2 hover:text-emerald-400 transition-colors">
                                <ChevronLeft size={20} />
                            </button>
                            <span className="text-base font-black uppercase tracking-wider text-white">
                                {yearlyData.year}
                            </span>
                            <button onClick={() => navigateYearly(1)} className="p-2 hover:text-emerald-400 transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        {/* Yearly Table */}
                        <div className="bg-[#141f1b] border border-emerald-900/20 rounded-2xl overflow-hidden shadow-md">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs font-mono">
                                    <thead>
                                        <tr className="bg-[#1b2b25]/80 text-[10px] font-black uppercase text-slate-300 border-b border-emerald-900/20">
                                            <th className="py-3 px-4">Month</th>
                                            <th className="py-3 text-right">Income (Credit)</th>
                                            <th className="py-3 text-right">Expense (Debit)</th>
                                            <th className="py-3 text-right pr-4">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-emerald-900/10">
                                        {/* C/F Row */}
                                        <tr className="text-slate-400 font-bold bg-[#0d1512]/50">
                                            <td className="py-3 px-4 font-sans font-black uppercase text-[10px] text-emerald-400">C/F</td>
                                            <td className="py-3 text-right">-</td>
                                            <td className="py-3 text-right">-</td>
                                            <td className="py-3 text-right pr-4 text-white">₹{yearlyData.cfBalance.toFixed(2)}</td>
                                        </tr>

                                        {yearlyData.rows.map((row) => (
                                            <tr key={row.monthName} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="py-3 px-4 font-sans font-bold text-white">{row.monthName}</td>
                                                <td className="py-3 text-right text-emerald-400 font-bold">
                                                    {row.income > 0 ? row.income.toFixed(2) : '0.00'}
                                                </td>
                                                <td className="py-3 text-right text-rose-400 font-bold">
                                                    {row.expense > 0 ? row.expense.toFixed(2) : '0.00'}
                                                </td>
                                                <td className={`py-3 text-right pr-4 font-black ${row.balance >= 0 ? 'text-white' : 'text-rose-400'}`}>
                                                    {row.balance.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Right Floating Action Buttons */}
            <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3 z-40">
                {/* Main '+' Add Transaction Button */}
                <button
                    onClick={() => openAddPanel(null, 'DEBIT')}
                    className="w-14 h-14 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center shadow-2xl shadow-violet-600/40 border border-violet-400/30 transition-all active:scale-95 group"
                    title="Add Transaction"
                >
                    <Plus size={28} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>
            </div>

            {/* SLIDE-UP BOTTOM SHEET PANEL: Add / Edit Transaction */}
            <AnimatePresence>
                {showAddPanel && (
                    <>
                        {/* Overlay */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowAddPanel(false)}
                            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
                        />

                        {/* Drawer */}
                        <motion.div 
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                            className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto border-t border-emerald-900/40 rounded-t-3xl p-4 sm:p-6 z-50 shadow-2xl max-h-[85vh] overflow-y-auto bg-[#0d1512]"
                        >
                            {/* Dismiss Chevron Handle */}
                            <div className="flex justify-center mb-3">
                                <button 
                                    onClick={() => setShowAddPanel(false)}
                                    className="p-1 rounded-full border text-slate-400 bg-black/40 border-white/10 hover:text-white transition-colors"
                                >
                                    <ChevronDown size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleSaveEntry} className="space-y-4">
                                {editingEntry && editingEntry.status !== 'PENDING' && (
                                    <div className="p-3.5 bg-slate-900/60 border border-white/5 rounded-2xl text-center backdrop-blur-md">
                                        <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                                            This record has been {editingEntry.status.toLowerCase()} and is locked.
                                        </p>
                                    </div>
                                )}
                                {/* Type Selector Pills: Income (Credit) | Expense (Debit) */}
                                <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-black/40 border border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setEntryType('CREDIT')}
                                        className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                                            entryType === 'CREDIT' 
                                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400 shadow-lg shadow-emerald-600/40 scale-[1.02]' 
                                            : 'bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/60 border border-emerald-800/40 opacity-75'
                                        }`}
                                    >
                                        {entryType === 'CREDIT' && <Check size={14} />} Income (Credit)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEntryType('DEBIT')}
                                        className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                                            entryType === 'DEBIT' 
                                            ? 'bg-rose-600 hover:bg-rose-500 text-white border border-rose-400 shadow-lg shadow-rose-600/40 scale-[1.02]' 
                                            : 'bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 border border-rose-800/40 opacity-75'
                                        }`}
                                    >
                                        {entryType === 'DEBIT' && <Check size={14} />} Expense (Debit)
                                    </button>
                                </div>

                                {/* Form Fields Row: Icon + Title + Amount + Dynamic Submit Check */}
                                <div className="flex items-center gap-2 pt-1">
                                    <div className={`p-2.5 rounded-xl border shrink-0 transition-colors ${
                                        entryType === 'CREDIT'
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-800/40'
                                        : 'bg-rose-500/10 text-rose-400 border-rose-800/40'
                                    }`}>
                                        <Tag size={16} />
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="Enter Text"
                                        value={entryTitle}
                                        onChange={(e) => setEntryTitle(e.target.value)}
                                        required
                                        disabled={isSubmitting || (editingEntry && editingEntry.status !== 'PENDING')}
                                        className={`min-w-0 flex-1 bg-transparent border-b text-white font-bold text-xs sm:text-sm py-2 focus:outline-none placeholder:text-slate-600 transition-colors ${
                                            entryType === 'CREDIT'
                                            ? 'border-emerald-800/40 focus:border-emerald-400'
                                            : 'border-rose-800/40 focus:border-rose-400'
                                        }`}
                                        autoFocus
                                    />

                                    <input 
                                        type="number" 
                                        step="0.01"
                                        placeholder="Amount"
                                        value={entryAmount}
                                        onChange={(e) => setEntryAmount(e.target.value)}
                                        required
                                        disabled={isSubmitting || (editingEntry && editingEntry.status !== 'PENDING')}
                                        className={`w-20 sm:w-24 shrink-0 bg-transparent border-b text-white font-mono font-bold text-xs sm:text-sm py-2 focus:outline-none text-right placeholder:text-slate-600 transition-colors ${
                                            entryType === 'CREDIT'
                                            ? 'border-emerald-800/40 focus:border-emerald-400'
                                            : 'border-rose-800/40 focus:border-rose-400'
                                        }`}
                                    />

                                    <button
                                        type="submit"
                                        disabled={isSubmitting || (editingEntry && editingEntry.status !== 'PENDING')}
                                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg transition-all active:scale-95 disabled:opacity-50 ${
                                            entryType === 'CREDIT'
                                            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                                            : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
                                        }`}
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin size-4" /> : <Check size={18} className="stroke-[3]" />}
                                    </button>
                                </div>

                                {/* Description / Date optional row */}
                                <div className="space-y-2.5 pt-2">
                                    <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors ${
                                        entryType === 'CREDIT'
                                        ? 'bg-[#0c1713] border-emerald-800/40'
                                        : 'bg-[#160d0f] border-rose-800/40'
                                    }`}>
                                        <Edit3 size={14} className="text-slate-500 shrink-0" />
                                        <input 
                                            type="text"
                                            placeholder="Description (Optional)"
                                            value={entryDescription}
                                            onChange={(e) => setEntryDescription(e.target.value)}
                                            disabled={isSubmitting || (editingEntry && editingEntry.status !== 'PENDING')}
                                            className="bg-transparent border-none text-xs text-white placeholder:text-slate-600 focus:outline-none w-full font-medium"
                                        />
                                    </div>
                                    <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors ${
                                        entryType === 'CREDIT'
                                        ? 'bg-[#0c1713] border-emerald-800/40'
                                        : 'bg-[#160d0f] border-rose-800/40'
                                    }`}>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">DATE:</span>
                                        <input 
                                            type="date"
                                            value={entryDate}
                                            onChange={(e) => setEntryDate(e.target.value)}
                                            disabled={isSubmitting || (editingEntry && editingEntry.status !== 'PENDING')}
                                            className={`bg-transparent border-none text-xs font-mono focus:outline-none w-full font-bold uppercase transition-colors ${
                                                entryType === 'CREDIT' ? 'text-emerald-400' : 'text-rose-400'
                                            }`}
                                        />
                                    </div>
                                </div>

                                {editingEntry && editingEntry.status === 'PENDING' && (
                                    <div className="pt-2 flex justify-end">
                                        <button 
                                            type="button"
                                            onClick={() => handleDeleteEntry(editingEntry.id)}
                                            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-xl text-xs font-bold uppercase transition-colors flex items-center gap-1.5"
                                        >
                                            <Trash2 size={13} /> Delete Entry
                                        </button>
                                    </div>
                                )}
                            </form>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* MODAL: Create/Rename Expense Book */}
            {showAddCompanyModal && (
                <div className="modal-overlay">
                    <div className="modal-content w-[400px] bg-[#14211c] border border-emerald-800/40">
                        <button className="close-btn" onClick={() => setShowAddCompanyModal(false)}>
                            <X size={18} />
                        </button>
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-3 border border-emerald-500/20">
                                <Building size={22} />
                            </div>
                            <h3 className="font-black text-xl uppercase text-white tracking-wide">
                                {isEditingCompany ? 'Rename Expense Book' : 'Expense Book Name'}
                            </h3>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                {isEditingCompany ? 'Update your ledger book label' : 'Categorize your daily or project entries'}
                            </p>
                        </div>
                        <form onSubmit={handleSaveCompany} className="space-y-6">
                            <div>
                                <label className="label-proto text-emerald-400">Book Name</label>
                                <input
                                    key={isEditingCompany ? 'edit' : 'add'}
                                    name="companyName"
                                    type="text"
                                    defaultValue={isEditingCompany ? selectedCompany?.name : ''}
                                    placeholder="e.g. Day to Day Expenses, Personal Cash"
                                    required
                                    autoFocus
                                    autoComplete="off"
                                    className="bg-[#0b120f] border border-emerald-800/40 text-white rounded-xl py-3 px-4 text-xs font-bold focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                            <button className="btn-primary py-4 font-black text-[10px] bg-emerald-600 hover:bg-emerald-500 border-none text-slate-950" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="animate-spin mx-auto text-slate-950" /> : 'CREATE EXPENSE BOOK'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Hidden Printable PDF Statement Template */}
            <div id="print-area-employee" className="hidden print:block p-8 bg-white text-black font-sans">
                <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
                    <div>
                        <span className="text-[10px] font-black tracking-widest text-emerald-700 uppercase">EMPLOYEE LEDGER STATEMENT</span>
                        <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 mt-0.5">
                            {activeTab.toUpperCase()} STATEMENT
                        </h1>
                        <p className="text-xs font-bold text-gray-700 mt-1">Book: {selectedCompany?.name || 'Day to Day Expenses'}</p>
                        <p className="text-xs font-mono text-gray-500 font-medium">Employee: {user?.name} ({user?.email})</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 font-bold">Generated: {new Date().toLocaleDateString()}</p>
                        <p className="text-lg font-black text-black mt-2 font-mono">
                            Net Balance: ₹{(
                                activeTab === 'daily' ? dailyData.endDayBalance :
                                activeTab === 'monthly' ? monthlyData.monthBalance :
                                (yearlyData.rows.length > 0 ? yearlyData.rows[11].balance : 0)
                            ).toFixed(2)}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6 border border-gray-300 p-4 rounded bg-gray-50 text-xs font-mono">
                    <div>
                        <span className="block text-gray-500 font-bold uppercase text-[9px]">Total Income (+)</span>
                        <span className="font-bold text-emerald-700 text-sm">
                            ₹{(
                                activeTab === 'daily' ? dailyData.incomeTotal :
                                activeTab === 'monthly' ? monthlyData.totalIncome :
                                yearlyData.rows.reduce((acc, r) => acc + r.income, 0)
                            ).toFixed(2)}
                        </span>
                    </div>
                    <div>
                        <span className="block text-gray-500 font-bold uppercase text-[9px]">Total Expense (-)</span>
                        <span className="font-bold text-rose-700 text-sm">
                            ₹{(
                                activeTab === 'daily' ? dailyData.expenseTotal :
                                activeTab === 'monthly' ? monthlyData.totalExpense :
                                yearlyData.rows.reduce((acc, r) => acc + r.expense, 0)
                            ).toFixed(2)}
                        </span>
                    </div>
                    <div>
                        <span className="block text-gray-500 font-bold uppercase text-[9px]">Net Period Balance</span>
                        <span className="font-bold text-black text-sm">
                            ₹{(
                                activeTab === 'daily' ? dailyData.endDayBalance :
                                activeTab === 'monthly' ? monthlyData.monthBalance :
                                (yearlyData.rows.length > 0 ? yearlyData.rows[11].balance : 0)
                            ).toFixed(2)}
                        </span>
                    </div>
                </div>

                {activeTab === 'yearly' ? (
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b-2 border-black font-black uppercase text-[10px]">
                                <th className="py-2">Month</th>
                                <th className="py-2 text-right">Income (Credit) (₹)</th>
                                <th className="py-2 text-right">Expense (Debit) (₹)</th>
                                <th className="py-2 text-right">Closing Balance (₹)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-300 font-mono">
                            <tr className="bg-gray-100 font-bold">
                                <td className="py-2 text-[10px] uppercase">Carried Forward Balance</td>
                                <td className="py-2 text-right">-</td>
                                <td className="py-2 text-right">-</td>
                                <td className="py-2 text-right">₹{yearlyData.cfBalance.toFixed(2)}</td>
                            </tr>
                            {yearlyData.rows.map((row, idx) => (
                                <tr key={idx}>
                                    <td className="py-2 font-bold">{row.monthName}</td>
                                    <td className="py-2 text-right text-emerald-700 font-bold">₹{row.income.toFixed(2)}</td>
                                    <td className="py-2 text-right text-rose-700 font-bold">₹{row.expense.toFixed(2)}</td>
                                    <td className="py-2 text-right font-black">₹{row.balance.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b-2 border-black font-black uppercase text-[10px]">
                                <th className="py-2">Date</th>
                                <th className="py-2">Narration</th>
                                <th className="py-2 text-center">Type</th>
                                <th className="py-2 text-right">Credit (₹)</th>
                                <th className="py-2 text-right">Debit (₹)</th>
                                <th className="py-2 text-right">Balance (₹)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-300 font-mono">
                            {activeTab === 'daily' && (
                                <tr className="bg-gray-100 font-bold">
                                    <td className="py-2 text-[10px] uppercase">Carried Forward</td>
                                    <td className="py-2 uppercase text-gray-600">Balance Before Date</td>
                                    <td className="py-2 text-center">-</td>
                                    <td className="py-2 text-right">-</td>
                                    <td className="py-2 text-right">-</td>
                                    <td className="py-2 text-right font-black">₹{dailyData.cfBalance.toFixed(2)}</td>
                                </tr>
                            )}
                            {activeTab === 'monthly' && (
                                <tr className="bg-gray-100 font-bold">
                                    <td className="py-2 text-[10px] uppercase">Carried Forward</td>
                                    <td className="py-2 uppercase text-gray-600">Balance Before Month</td>
                                    <td className="py-2 text-center">-</td>
                                    <td className="py-2 text-right">-</td>
                                    <td className="py-2 text-right">-</td>
                                    <td className="py-2 text-right font-black">₹{monthlyData.cfBalance.toFixed(2)}</td>
                                </tr>
                            )}
                            {(() => {
                                let list = entries;
                                let initialBalance = 0;
                                if (activeTab === 'daily') {
                                    const targetStr = currentDate.toISOString().split('T')[0];
                                    list = entries.filter(e => new Date(e.date).toISOString().split('T')[0] === targetStr);
                                    initialBalance = dailyData.cfBalance;
                                } else if (activeTab === 'monthly') {
                                    const year = currentDate.getFullYear();
                                    const month = currentDate.getMonth();
                                    list = entries.filter(e => {
                                        const d = new Date(e.date);
                                        return d.getFullYear() === year && d.getMonth() === month;
                                    });
                                    initialBalance = monthlyData.cfBalance;
                                }

                                const sorted = [...list].sort((a,b) => new Date(a.date || a.createdAt).getTime() - new Date(b.date || b.createdAt).getTime());
                                let r = initialBalance;
                                return sorted.map((entry) => {
                                    r = r + (entry.type === 'CREDIT' ? entry.amount : -entry.amount);
                                    return (
                                        <tr key={entry.id}>
                                            <td className="py-2 text-[10px]">{new Date(entry.date).toLocaleDateString()}</td>
                                            <td className="py-2 font-bold uppercase">{entry.narration || '-'}</td>
                                            <td className="py-2 text-center font-bold">{entry.type}</td>
                                            <td className="py-2 text-right text-emerald-700 font-bold">{entry.type === 'CREDIT' ? entry.amount.toFixed(2) : '-'}</td>
                                            <td className="py-2 text-right text-rose-700 font-bold">{entry.type === 'DEBIT' ? entry.amount.toFixed(2) : '-'}</td>
                                            <td className="py-2 text-right font-black">₹{r.toFixed(2)}</td>
                                        </tr>
                                    );
                                });
                            })()}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ExpenseTrackerView;
