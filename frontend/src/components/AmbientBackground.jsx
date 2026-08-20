import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, MapPin, Zap } from 'lucide-react';

const PulsingRadar = ({ className }) => (
    <div className={`absolute pointer-events-none ${className}`}>
        {[0, 1, 2].map((i) => (
            <motion.div 
                key={i}
                initial={{ scale: 0.5, opacity: 0.6 }}
                animate={{ scale: 3.5, opacity: 0 }}
                transition={{ duration: 6, repeat: Infinity, delay: i * 2, ease: "easeOut" }}
                className="absolute inset-0 border-[3px] border-blue-400/50 rounded-full dark:border-blue-300/40"
            />
        ))}
    </div>
);

const FloatingCard = ({ icon: Icon, text, delay = 0, className }) => (
    <motion.div 
        initial={{ y: 0, opacity: 0 }}
        animate={{ y: [0, -35, 0], opacity: [0, 1, 0.8] }}
        transition={{ duration: 8, repeat: Infinity, delay, ease: "easeInOut" }}
        className={`absolute p-5 pe-10 rounded-[1.5rem] bg-white/20 backdrop-blur-2xl border border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center gap-4 pointer-events-none group z-[15] ${className}`}
    >
        <div className="p-3 bg-blue-600/30 text-white rounded-xl group-hover:bg-blue-600/50 transition-colors shadow-lg">
            <Icon size={20} />
        </div>
        <div>
            <p className="text-[9px] font-black text-[#103e7a] uppercase tracking-[0.1em] mb-1">Neural Node</p>
            <p className="text-[13px] font-black text-[#103e7a] italic whitespace-nowrap tracking-tight leading-none">{text}</p>
        </div>
    </motion.div>
);

const AmbientBackground = () => (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
        {/* Pulsing Core behind Hero */}
        <PulsingRadar className="w-[600px] h-[600px] -top-20 -left-20 opacity-40 blur-sm" />
        <PulsingRadar className="w-[800px] h-[800px] top-[40%] -right-40 opacity-20 blur-md" />
        
        {/* Floating System Cards */}
        <FloatingCard icon={ShieldCheck} text="Neural Link Active" delay={0} className="top-[15%] left-[5%] scale-90" />
        <FloatingCard icon={MapPin} text="Location Verified" delay={1.5} className="top-[60%] right-[10%] scale-110" />
        <FloatingCard icon={Zap} text="Auth Handshake Complete" delay={3} className="top-[80%] left-[12%] scale-75" />
        
        {/* Abstract Neural Nodes */}
        <div className="absolute inset-0 opacity-[0.03] overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: `radial-gradient(#103e7a 1px, transparent 1px)`, backgroundSize: '40px 40px' }}></div>
        </div>

        {/* Global Bloom Glares */}
        <div className="absolute top-[20%] left-[15%] w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[10%] right-[5%] w-[800px] h-[800px] bg-amber-500/5 blur-[150px] rounded-full"></div>
    </div>
);

export default AmbientBackground;
