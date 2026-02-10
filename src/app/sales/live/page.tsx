'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, RefreshCcw, Bell, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { getSalesByIds, getRecentSales } from '@/app/sales/actions';
import { usePolling } from "@/context/PollingContext";

interface PollLog {
    time: string;
    message: string;
    type: 'info' | 'success' | 'error';
}

interface OrderSummary {
    id: string;
    customerName: string;
    items: string[];
    total: number;
    time: string;
    reservationNumber?: string; // 추가
}

export default function LiveOrderPage() {
    const { isPolling, startPolling, stopPolling, checkNow, logs, lastChecked, clearNewOrderFlag, hasNewOrders } = usePolling();
    const [newOrders, setNewOrders] = useState<OrderSummary[]>([]);

    // Audio ref is handled in context now, but simple notification sound for local list update can also be here if needed.
    // However, context handles the main notification sound.

    // Effect to fetch new order details when context signals new orders
    useEffect(() => {
        const syncOrders = async () => {
            // Here we might need a way to know WHICH IDs are new if we want to be precise.
            // But for now, we can fetch latest sales or just fetch all recent unseen.
            // For simplicity in this "Live" view, let's just re-fetch recent listings on signal.

            if (hasNewOrders) {
                // In a perfect world, context passes IDs. For now, let's fetch top 10 recent.
                // Or we can keep the local polling logic just for data fetching, but trigger is shared?
                // Actually, the context is doing the polling and getting 'createdSaleIds'.
                // To make this robust without over-engineering context:
                // Let's just fetch recent sales whenever `lastChecked` updates if we are on this page.

                // Better yet:
                // Let's fetch the latest sales simply when `lastChecked` changes, regardless of `hasNewOrders` flag,
                // to ensure this view is always up to date.
            }
        };
        syncOrders();
    }, [hasNewOrders]);

    // Fetch recent orders on load and when signal updates
    useEffect(() => {
        const updateList = async () => {
            const sales = await getRecentSales();
            const summaries = sales.map(sale => ({
                id: sale.id,
                customerName: sale.customerName || 'Unknown',
                items: sale.items.map(i => `${i.product ? i.product.name : (i.customName || "알 수 없는 상품")} x${i.quantity}`),
                total: sale.totalAmount,
                time: format(sale.createdAt, 'HH:mm'),
                reservationNumber: sale.reservationNumber || undefined
            }));
            // Only show orders from today? Or just recent 20?
            // Let's filter for today for "Live" feel
            const today = new Date().toDateString();
            const todaysOrders = summaries.filter(s => new Date(sales.find(o => o.id === s.id)!.createdAt).toDateString() === today);

            setNewOrders(todaysOrders);

            // If we are looking at the page, we can clear the global "New" badge?
            if (hasNewOrders) {
                clearNewOrderFlag();
            }
        };

        updateList();
    }, [lastChecked, hasNewOrders]);


    // We remove local polling logic and audio refs since context handles it.

    return (
        <div className="container mx-auto p-4 max-w-6xl">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Bell className="w-8 h-8 text-yellow-500" />
                Live Order Monitoring
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                Control Center
                                <div className="flex gap-2">
                                    <Button
                                        variant={isPolling ? "destructive" : "default"}
                                        onClick={() => isPolling ? stopPolling() : startPolling()}
                                    >
                                        {isPolling ? "Stop Monitoring" : "Start Monitoring"}
                                    </Button>
                                    <Button variant="outline" onClick={() => checkNow()} disabled={isPolling}>
                                        <RefreshCcw className="w-4 h-4 mr-2" />
                                        Check Now
                                    </Button>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`w-4 h-4 rounded-full ${isPolling ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                                <span className="font-medium text-lg">
                                    {isPolling ? "System Active (Auto-refresh: 60s)" : "System Paused"}
                                </span>
                            </div>
                            {lastChecked && (
                                <div className="text-sm text-gray-500">
                                    Last checked: {format(lastChecked, 'yyyy-MM-dd HH:mm:ss')}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="h-[500px] flex flex-col">
                        <CardHeader>
                            <CardTitle>System Logs</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto bg-slate-950 text-slate-50 font-mono text-sm p-4 rounded-b-lg">
                            <div className="space-y-1">
                                {logs.map((log, i) => (
                                    <div key={i} className="flex gap-2">
                                        <span className="text-slate-500">[{log.time}]</span>
                                        <span className={
                                            log.type === 'success' ? 'text-green-400' :
                                                log.type === 'error' ? 'text-red-400' :
                                                    'text-slate-300'
                                        }>
                                            {log.message}
                                        </span>
                                    </div>
                                ))}
                                {logs.length === 0 && (
                                    <div className="text-center text-slate-500 py-8">
                                        System initialized... Waiting for activity.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex justify-between">
                                Incoming Orders
                                <Badge variant="secondary">{newOrders.length} New</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto bg-gray-50 p-4">
                            {newOrders.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                                    <Bell className="w-12 h-12 opacity-20" />
                                    <p>No new orders yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {newOrders.map((order) => (
                                        <div key={order.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold text-lg">{order.customerName}</h3>
                                                        {order.reservationNumber && (
                                                            <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                                                                No.{order.reservationNumber}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-gray-500">{order.time}</span>
                                                </div>
                                                <Badge variant="outline" className="text-lg font-bold">
                                                    {order.total.toLocaleString()}원
                                                </Badge>
                                            </div>
                                            <ul className="text-sm text-gray-600 mb-3 space-y-1">
                                                {order.items.map((item, idx) => (
                                                    <li key={idx}>• {item}</li>
                                                ))}
                                            </ul>
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="outline" onClick={() => window.open('https://partner.booking.naver.com/', '_blank')}>
                                                    <span className="text-green-600 font-bold mr-1">N</span> 파트너센터 이동
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => window.print()}>
                                                    <Printer className="w-4 h-4 mr-1" />
                                                    Print Ticket
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
