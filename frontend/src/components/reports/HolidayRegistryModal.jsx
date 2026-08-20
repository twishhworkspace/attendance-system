import React from 'react';
import { Zap } from 'lucide-react';

const HolidayRegistryModal = ({ isOpen, onClose, holidays, setHolidays }) => {
    if (!isOpen) return null;

    const handleRemove = (h) => {
        const next = holidays.filter(x => x !== h);
        setHolidays(next);
        localStorage.setItem('company_holidays', JSON.stringify(next));
    };

    const handleAdd = (e) => {
        e.preventDefault();
        const date = e.target.date.value;
        if (date && !holidays.includes(date)) {
            const next = [...holidays, date];
            setHolidays(next);
            localStorage.setItem('company_holidays', JSON.stringify(next));
            e.target.reset();
        }
    };

    return (
        <div className="modal-overlay z-[200]">
            <div className="modal-content w-[400px]">
                <button className="close-btn" onClick={onClose}><Zap size={18} /></button>
                <h3 className="italic font-black text-xl uppercase mb-4">Company Holiday Registry</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-8 leading-relaxed">
                    Registered dates will be excluded from absence tracking for all personnel.
                </p>
                
                <div className="space-y-4 mb-8 max-h-[200px] overflow-y-auto">
                    {holidays.length === 0 && <p className="text-[9px] text-slate-700 italic">No holidays registered.</p>}
                    {holidays.map(h => (
                        <div key={h} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                            <span className="text-[10px] font-black text-white">
                                {new Date(h).toLocaleDateString('en-GB')}
                            </span>
                            <button 
                                onClick={() => handleRemove(h)} 
                                className="text-rose-500 hover:text-rose-400 font-black text-[9px] uppercase"
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>

                <form onSubmit={handleAdd} className="flex gap-2">
                    <input 
                        type="date" 
                        name="date" 
                        required 
                        className="flex-1 bg-black/40 border border-white/10 p-3 rounded-xl text-white text-xs outline-none focus:border-emerald-500" 
                    />
                    <button className="px-6 py-3 bg-emerald-600 rounded-xl text-[10px] font-black uppercase text-white hover:bg-emerald-500 transition-all">
                        Add Holiday
                    </button>
                </form>
            </div>
        </div>
    );
};

export default HolidayRegistryModal;
