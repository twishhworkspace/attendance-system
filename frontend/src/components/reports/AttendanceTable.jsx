import React from 'react';
import Skeleton from '../Skeleton';

const AttendanceTable = ({ loading, filtered, selectedUser, resolveLoc, offices }) => {
    return (
        <div className="table-scroll-shield">
            <table className="w-full">
                <thead>
                    {selectedUser ? (
                        <tr>
                            <th>Date</th>
                            <th>Check-In</th>
                            <th>Check-Out</th>
                            <th>Duration</th>
                            <th>Variance</th>
                            <th className="text-right pr-8">Status</th>
                        </tr>
                    ) : (
                        <tr>
                            <th>Employee</th>
                            <th>Date & Time</th>
                            <th>Device Info</th>
                            <th>Notes</th>
                            <th className="text-right pr-8">Status</th>
                        </tr>
                    )}
                </thead>
                <tbody>
                    {loading ? (
                        Array(10).fill(0).map((_, i) => (
                            <tr key={i}>
                                {selectedUser ? (
                                    <>
                                        <td><Skeleton width={100} height={12} /></td>
                                        <td><Skeleton width={60} height={12} /></td>
                                        <td><Skeleton width={60} height={12} /></td>
                                        <td><Skeleton width={40} height={12} /></td>
                                        <td><Skeleton width={40} height={12} /></td>
                                    </>
                                ) : (
                                    <>
                                        <td><Skeleton width={120} height={12} /></td>
                                        <td><Skeleton width={100} height={12} /></td>
                                        <td><Skeleton width={80} height={12} /></td>
                                        <td><Skeleton width={150} height={12} /></td>
                                    </>
                                )}
                                <td className="text-right pr-8"><Skeleton width={60} height={20} className="ml-auto" /></td>
                            </tr>
                        ))
                    ) : (
                        filtered.map((l, i) => {
                            const workHrs = l.checkIn && l.checkOut && !l.isAutoCheckout ? (new Date(l.checkOut) - new Date(l.checkIn)) / 3600000 : 0;
                            const duration = workHrs > 0 ? workHrs.toFixed(1) + ' hrs' : '--';
                            const varianceValue = workHrs > 0 ? (workHrs - 9).toFixed(2) : null;
                            const variance = varianceValue ? (parseFloat(varianceValue) >= 0 ? `+${varianceValue}` : varianceValue) : '--';
                            
                            return (
                                <tr key={i}>
                                    {selectedUser ? (
                                        <>
                                            <td className="font-bold italic text-white uppercase text-[10px] tracking-widest">
                                                {new Date(l.date || l.checkIn).toLocaleDateString('en-GB')}
                                            </td>
                                            <td>
                                                <span className="text-white font-bold">
                                                    {l.checkIn ? new Date(l.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex flex-col">
                                                    <span className="text-white font-bold">
                                                        {l.checkOut && !l.isAutoCheckout ? new Date(l.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                    </span>
                                                    {l.isAutoCheckout && (
                                                        <span className="text-[8px] text-amber-500 font-black uppercase mt-1">
                                                            Autocheckout
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="text-violet-500 font-black italic text-[10px]">{duration}</td>
                                            <td className={`font-black text-[10px] ${parseFloat(varianceValue) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {variance}
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td>
                                                <div className="flex flex-col">
                                                    <span className="font-bold italic uppercase text-white text-xs">{l.user?.name}</span>
                                                    <span className="text-[9px] text-slate-700">{l.user?.email}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex flex-col">
                                                    <span className="text-white text-[10px] font-mono">
                                                        {l.checkIn ? new Date(l.checkIn).toLocaleTimeString() : '--:--'}
                                                    </span>
                                                    <span className="text-[8px] text-slate-700 uppercase">
                                                        {new Date(l.date || l.checkIn || new Date()).toLocaleDateString('en-GB')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td><span className="text-[10px] font-mono text-slate-500">{resolveLoc(l, offices)}</span></td>
                                            <td>
                                                <div className="flex flex-col">
                                                    <p className="text-[11px] text-slate-500 italic truncate max-w-[150px]">
                                                        {l.isAutoCheckout ? 'Auto checked out' : (l.notes || '--')}
                                                    </p>
                                                    {l.isAutoCheckout && (
                                                        <span className="text-[8px] text-amber-500 font-black uppercase mt-1 tracking-widest">
                                                            Autocheckout
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </>
                                    )}
                                    <td className="text-right pr-8">
                                        {(() => {
                                            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                                            const isWeeklyOff = l.status === 'WEEKLY_OFF' || (l.status === 'ABSENT' && l.user?.weeklyOff && days[new Date(l.date || l.checkIn).getDay()] === l.user.weeklyOff);
                                            const statusText = l.status === 'HOLIDAY' ? 'HOLIDAY' : (isWeeklyOff ? 'WEEKLY OFF' : (l.status || 'ABSENT'));
                                            const statusStyles = 
                                                statusText === 'PRESENT' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' :
                                                statusText === 'LATE' ? 'text-amber-500 bg-amber-500/10 border-amber-500/20' :
                                                statusText === 'LEAVE' ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' :
                                                statusText === 'WEEKLY OFF' ? 'text-violet-400 bg-violet-500/5 border-violet-500/10' :
                                                statusText === 'HOLIDAY' ? 'text-cyan-400 bg-cyan-500/5 border-cyan-500/10' :
                                                'text-rose-500 bg-rose-500/10 border-rose-500/20';
                                            
                                            return <span className={`status-pill ${statusStyles}`}>{statusText}</span>;
                                        })()}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default AttendanceTable;
