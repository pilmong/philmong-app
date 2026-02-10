"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { format } from "date-fns";

interface PollLog {
    time: string;
    message: string;
    type: 'info' | 'success' | 'error';
}

interface PollingContextType {
    isPolling: boolean;
    startPolling: () => void;
    stopPolling: () => void;
    checkNow: () => Promise<void>;
    lastChecked: Date | null;
    logs: PollLog[];
    hasNewOrders: boolean;
    clearNewOrderFlag: () => void;
}

const PollingContext = createContext<PollingContextType | undefined>(undefined);

export function PollingProvider({ children }: { children: ReactNode }) {
    const [isPolling, setIsPolling] = useState(false);
    const [lastChecked, setLastChecked] = useState<Date | null>(null);
    const [logs, setLogs] = useState<PollLog[]>([]);
    const [hasNewOrders, setHasNewOrders] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Init audio
        if (typeof window !== "undefined") {
            audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        }
    }, []);

    const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
        setLogs(prev => [{ time: format(new Date(), 'HH:mm:ss'), message, type }, ...prev].slice(0, 50));
    };

    const playNotification = () => {
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.error("Audio play failed", e));
        }
    };

    const checkEmails = async () => {
        try {
            // addLog("Checking for new orders...", 'info'); 
            // Too noisy for global log? Maybe only log errors or success globally

            const res = await fetch('/api/email-polling', { method: 'POST' });
            const data = await res.json();
            setLastChecked(new Date());

            if (data.success) {
                if (data.processedCount > 0) {
                    addLog(`New orders found: ${data.processedCount}`, 'success');
                    playNotification();
                    setHasNewOrders(true);
                } else {
                    if (data.skipped && data.skipped.length > 0) {
                        // Only log skipped if relevant
                        data.skipped.forEach((msg: string) => addLog(msg, 'info'));
                    }
                }
            } else {
                addLog(`Polling failed: ${data.errors?.join(', ') || 'Unknown error'}`, 'error');
            }
        } catch (error: any) {
            addLog(`Network error: ${error.message}`, 'error');
        }
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPolling) {
            checkEmails(); // Initial check
            interval = setInterval(checkEmails, 60 * 1000);
        }
        return () => clearInterval(interval);
    }, [isPolling]);

    const startPolling = () => {
        setIsPolling(true);
        addLog("Global Monitoring Started", 'info');
    };

    const stopPolling = () => {
        setIsPolling(false);
        addLog("Global Monitoring Stopped", 'info');
    };

    const clearNewOrderFlag = () => {
        setHasNewOrders(false);
    }

    return (
        <PollingContext.Provider value={{
            isPolling,
            startPolling,
            stopPolling,
            checkNow: checkEmails,
            lastChecked,
            logs,
            hasNewOrders,
            clearNewOrderFlag
        }}>
            {children}
        </PollingContext.Provider>
    );
}

export function usePolling() {
    const context = useContext(PollingContext);
    if (context === undefined) {
        throw new Error("usePolling must be used within a PollingProvider");
    }
    return context;
}
