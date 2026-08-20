import { useEffect, useCallback } from 'react';
import { offlineStore } from '../utils/offlineStore';
import axios from '../api/axios';
import { useToast } from '../context/ToastContext';

export const useOfflineSync = (onSyncComplete) => {
    const { showToast } = useToast();

    const syncPendingPunches = useCallback(async () => {
        const queue = await offlineStore.getPendingPunches();
        if (queue.length === 0) return;

        showToast(`Syncing ${queue.length} pending records...`, "info");

        for (const item of queue) {
            try {
                const endpoint = item.type === 'check-in' ? 'attendance/check-in' : 
                                item.type === 'check-out' ? 'attendance/check-out' :
                                'out-location/submit';
                
                await axios.post(endpoint, {
                    ...item.payload,
                    offlineTimestamp: item.timestamp
                });

                await offlineStore.deletePendingPunch(item.id);
            } catch (err) {
                console.error("Failed to sync item:", item, err);
                break;
            }
        }

        const remaining = await offlineStore.getPendingPunches();
        if (remaining.length === 0) {
            showToast("Offline data successfully synchronized.", "success");
        }
        if (onSyncComplete) {
            onSyncComplete();
        }
    }, [showToast, onSyncComplete]);

    useEffect(() => {
        const handleOnline = () => {
            console.log("Network restored. Triggering sync...");
            syncPendingPunches();
        };

        window.addEventListener('online', handleOnline);
        
        if (navigator.onLine) {
            syncPendingPunches();
        }

        return () => window.removeEventListener('online', handleOnline);
    }, [syncPendingPunches]);

    return { syncPendingPunches };
};
