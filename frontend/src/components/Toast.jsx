import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X, Zap } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const ToastItem = ({ toast }) => {
  const { removeToast } = useToast();
  
  const iconMap = {
    success: <CheckCircle2 className="text-emerald-400" size={18} />,
    error: <AlertCircle className="text-rose-400" size={18} />,
    warning: <Zap className="text-amber-400" size={18} />,
    info: <Info className="text-blue-400" size={18} />,
  };

  const bgColorMap = {
    success: 'bg-emerald-500/10 border-emerald-500/20',
    error: 'bg-rose-500/10 border-rose-500/20',
    warning: 'bg-amber-500/10 border-amber-500/20',
    info: 'bg-blue-500/10 border-blue-500/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
      layout
      className={`flex items-center gap-4 p-4 pr-6 rounded-2xl backdrop-blur-xl border shadow-2xl min-w-[320px] max-w-md ${bgColorMap[toast.type] || bgColorMap.info}`}
    >
      <div className="flex-shrink-0">
        {iconMap[toast.type] || iconMap.info}
      </div>
      <div className="flex-1">
        <p className="text-[11px] font-black uppercase tracking-wider text-white/40 mb-0.5 leading-none">
          {toast.type || 'SYSTEM'}
        </p>
        <p className="text-[13px] font-bold text-white leading-tight italic">
          {toast.message}
        </p>
      </div>
      <button 
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 p-1 hover:bg-white/5 rounded-lg transition-colors text-white/20 hover:text-white"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
};

const ToastContainer = () => {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-4 sm:bottom-8 right-0 sm:right-8 left-0 sm:left-auto flex flex-col items-center sm:items-end gap-3 pointer-events-none px-4 z-[9999]">
      <AnimatePresence>
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto w-full sm:w-auto">
            <ToastItem toast={toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
