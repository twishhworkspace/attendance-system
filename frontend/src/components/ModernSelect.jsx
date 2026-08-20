import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const ModernSelect = ({ value, onChange, options, placeholder = "Select option", className = "", name }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const selectedOption = options.find(opt => String(opt.value) === String(value));

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
        <div className={`relative ${className}`} ref={dropdownRef}>
            {name && <input type="hidden" name={name} value={value} />}
            <button 
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center justify-between gap-2 px-4 py-2 rounded-lg
                    bg-black/40 border border-white/5 
                    hover:border-violet-500/30 hover:bg-white/[0.02]
                    transition-all duration-300 min-w-[120px] text-left
                    ${isOpen ? 'border-violet-500/50 bg-white/[0.05]' : ''}
                `}
            >
                <span className="text-[10px] font-black text-white uppercase truncate tracking-tight">
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown 
                    size={12} 
                    className={`text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-violet-500' : ''}`} 
                />
            </button>

            {isOpen && (
                <div className="absolute top-full mt-2 left-0 w-full min-w-[150px] bg-slate-950 border border-white/10 rounded-xl shadow-2xl z-[110] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="max-h-[200px] overflow-y-auto custom-scrollbar p-1">
                        {options.map((opt) => (
                            <button 
                                key={opt.value}
                                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                                className={`
                                    w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-left transition-all
                                    ${String(value) === String(opt.value) ? 'bg-violet-600/20 text-violet-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}
                                `}
                            >
                                <span className="text-[10px] font-black uppercase truncate tracking-tight">{opt.label}</span>
                                {String(value) === String(opt.value) && <Check size={12} />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModernSelect;
