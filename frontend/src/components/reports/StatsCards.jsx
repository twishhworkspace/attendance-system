import React from 'react';
import { TrendingUp, Calendar, Clock, Zap } from 'lucide-react';
import Skeleton from '../Skeleton';

const StatsCards = ({ loading, stats }) => {
    if (!loading && !stats) return null;

    const cards = [
        { icon: TrendingUp, color: 'violet', label: 'Punctuality', val: stats?.punctuality + '%' },
        { icon: Calendar, color: 'emerald', label: 'Attendance', val: stats?.totalDays + ' Days' },
        { icon: Clock, color: 'amber', label: 'Avg Start', val: stats?.avgCheckIn },
        { icon: Zap, color: 'rose', label: 'Total Hours', val: stats?.totalHours }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {cards.map((s, idx) => (
                <div key={idx} className={`glass-panel p-6 border-${s.color}-500/10`}>
                    {loading ? (
                        <>
                            <div className="flex justify-between mb-4">
                                <Skeleton variant="circle" width={18} height={18} />
                                <Skeleton width={60} height={10} />
                            </div>
                            <Skeleton width="40%" height={24} />
                        </>
                    ) : (
                        <>
                            <div className="flex justify-between items-start mb-2">
                                <s.icon className={`text-${s.color}-500`} size={18} />
                                <span className={`text-[10px] font-black text-${s.color}-500 uppercase tracking-widest`}>{s.label}</span>
                            </div>
                            <h4 className="text-2xl font-black italic text-white">{s.val}</h4>
                            {idx === 0 && (
                                <div className="w-full bg-white/5 h-1 mt-4 rounded-full overflow-hidden">
                                    <div className="bg-violet-500 h-full transition-all duration-1000" style={{ width: `${stats.punctuality}%` }}></div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            ))}
        </div>
    );
};

export default StatsCards;
