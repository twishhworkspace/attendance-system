import { useEffect, useCallback } from 'react';
import { offlineStore } from '../utils/offlineStore';
import axios from '../api/axios';
import { useToast } from '../context/ToastContext';

export const useOfflineSync = () => {
    const { showToast } = useToast();

    const syncPendingPunches = useCallback(async () => {
        const queue = await offlineStore.getPendingPunches();
        if (queue.length === 0) return;

        showToast(`Syncing ${queue.length} pending records...`, "info");

        for (const item of queue) {
            try {
                // Determine the correct endpoint based on item type
                const endpoint = item.type === 'check-in' ? 'attendance/check-in' : 
                                item.type === 'check-out' ? 'attendance/check-out' :
                                'out-location/submit';
                
                await axios.post(endpoint, {
                    ...item.payload,
                    offlineTimestamp: item.timestamp // Optional: let backend know it was an offline punch
                });

                await offlineStore.deletePendingPunch(item.id);
            } catch (err) {
                console.error("Failed to sync item:", item, err);
                // If it's a validation error, we might need to remove it anyway 
                // but for now we stop the loop to prevent spamming
                break;
            }
        }

        const remaining = await offlineStore.getPendingPunches();
        if (remaining.length === 0) {
            showToast("Offline data successfully synchronized.", "success");
        }
    }, [showToast]);

    useEffect(() => {
        const handleOnline = () => {
            console.log("Network restored. Triggering sync...");
            syncPendingPunches();
        };

        window.addEventListener('online', handleOnline);
        
        // Also check on mount
        if (navigator.onLine) {
            syncPendingPunches();
        }

        return () => window.removeEventListener('online', handleOnline);
    }, [syncPendingPunches]);

    return { syncPendingPunches };
};
