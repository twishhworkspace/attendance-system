import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, User, X, Check } from 'lucide-react';

const EmployeeSelector = ({ employees, selectedUser, setSelectedUser }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef(null);

    const selectedEmployee = useMemo(() => 
        employees.find(e => String(e.id) === String(selectedUser)),
    [employees, selectedUser]);

    const filteredEmployees = useMemo(() => {
        if (!searchTerm) return employees;
        return employees.filter(e => 
            e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [employees, searchTerm]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-3 px-4 py-2.5 rounded-xl
                    bg-black/40 border border-white/5 
                    hover:border-violet-500/30 hover:bg-white/[0.02]
                    transition-all duration-300 min-w-[200px] text-left
                    ${isOpen ? 'border-violet-500/50 bg-white/[0.05] ring-4 ring-violet-500/10' : ''}
                `}
            >
                <div className="w-6 h-6 rounded-lg bg-violet-600/10 flex items-center justify-center text-violet-500">
                    <User size={14} />
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="text-[10px] font-black text-white uppercase truncate tracking-tight">
                        {selectedEmployee ? selectedEmployee.name : 'All Employees'}
                    </p>
                    {selectedEmployee && (
                        <p className="text-[8px] font-bold text-slate-500 uppercase truncate tracking-tighter">
                            {selectedEmployee.email}
                        </p>
                    )}
                </div>
                <ChevronDown 
                    size={14} 
                    className={`text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-violet-500' : ''}`} 
                />
            </button>

            {isOpen && (
                <div className="absolute top-full mt-2 right-0 w-72 bg-slate-950 border border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-3 border-b border-white/5 bg-white/[0.02]">
                        <div className="relative group">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-500 transition-colors" />
                            <input 
                                type="text"
                                placeholder="Search personnel..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                                className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 pl-9 pr-4 text-[10px] font-bold text-white placeholder:text-slate-600 outline-none focus:border-violet-500/50 transition-all"
                            />
                            {searchTerm && (
                                <button 
                                    onClick={() => setSearchTerm("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                        <button 
                            onClick={() => { setSelectedUser(""); setIsOpen(false); }}
                            className={`
                                w-full flex items-center gap-3 px-4 py-3 text-left transition-all
                                ${!selectedUser ? 'bg-violet-600/10' : 'hover:bg-white/5'}
                            `}
                        >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${!selectedUser ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-500'}`}>
                                <User size={16} />
                            </div>
                            <div className="flex-1">
                                <p className={`text-[10px] font-black uppercase ${!selectedUser ? 'text-violet-400' : 'text-slate-300'}`}>All Employees</p>
                                <p className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">System-wide Data Aggregate</p>
                            </div>
                            {!selectedUser && <Check size={14} className="text-violet-500" />}
                        </button>

                        <div className="px-3 py-2 text-[8px] font-black text-slate-700 uppercase tracking-widest border-t border-white/5">
                            Personnel Nodes
                        </div>

                        {filteredEmployees.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                                <p className="text-[10px] font-black text-slate-600 uppercase italic">No matching nodes found</p>
                            </div>
                        ) : (
                            filteredEmployees.map((e) => (
                                <button 
                                    key={e.id}
                                    onClick={() => { setSelectedUser(e.id); setIsOpen(false); }}
                                    className={`
                                        w-full flex items-center gap-3 px-4 py-3 text-left transition-all
                                        ${String(selectedUser) === String(e.id) ? 'bg-violet-600/10' : 'hover:bg-white/5'}
                                    `}
                                >
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${String(selectedUser) === String(e.id) ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-500'}`}>
                                        <span className="text-[12px] font-black italic">{e.name.charAt(0)}</span>
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className={`text-[10px] font-black uppercase truncate ${String(selectedUser) === String(e.id) ? 'text-violet-400' : 'text-slate-300'}`}>{e.name}</p>
                                        <p className="text-[8px] font-bold text-slate-600 uppercase truncate tracking-tighter">{e.email}</p>
                                    </div>
                                    {String(selectedUser) === String(e.id) && <Check size={14} className="text-violet-500" />}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeSelector;
