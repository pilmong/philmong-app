'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, ShoppingBag, Calendar as CalendarIcon, Phone, MapPin, Plus, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrderModal } from '@/components/orders/order-modal';
import { OrderType } from '@/actions/orders'; // Action type definitions
import { useRouter } from 'next/navigation';
import { deleteOrder, updateOrder, updateOrderStatus } from '@/actions/orders';
import { parseNaverOrderText, findMatchingProduct } from '@/lib/naver-parser';
import { syncOrdersFromEmail } from '@/actions/email-sync';
import { Sparkles } from 'lucide-react';

interface Order {
    id: string;
    type: string;
    channel: string;
    customerName: string;
    customerContact: string | null;
    pickupType: string;
    pickupDate: Date | null;
    pickupTime: string | null;
    status: string;
    items: { name: string, quantity: number, price?: number }[];
    totalPrice: number | null;
    request: string | null;
    address: string | null;
    memo: string | null;
}

interface OrderListProps {
    initialOrders: Order[];
    products: any[];
}

export function OrderList({ initialOrders, products }: OrderListProps) {
    const router = useRouter();

    const handlePrint = (order: Order) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const itemsHtml = order.items.map(item => `
            <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 4px;">
                <span style="flex: 1;">${item.name}</span>
                <span style="font-weight: bold; margin-left: 10px;">x${item.quantity}</span>
            </div>
        `).join('');

        const content = `
            <html>
            <head>
                <title>Receipt - ${order.customerName}</title>
                <style>
                    @page { margin: 0; }
                    body { 
                        width: 72mm; 
                        margin: 0; 
                        padding: 5mm; 
                        font-family: 'Malgun Gothic', sans-serif; 
                        line-height: 1.4;
                        color: #000;
                    }
                    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px; }
                    .store-name { font-size: 22px; font-weight: 800; }
                    .section { margin-bottom: 12px; }
                    .label { font-size: 11px; font-weight: bold; border-bottom: 1px solid #eee; margin-bottom: 4px; padding-bottom: 2px; }
                    .value { font-size: 16px; font-weight: bold; }
                    .address-box { background: #f9f9f9; padding: 10px; border: 1px solid #000; margin-top: 5px; }
                    .request-box { border: 2px solid #000; padding: 8px; font-weight: bold; font-size: 15px; margin-top: 5px; }
                    .footer { text-align: center; font-size: 11px; border-top: 1px dashed #000; padding-top: 10px; margin-top: 20px; }
                    .item-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="store-name">필 몽 (Feel Mong)</div>
                    <div style="font-size: 12px; margin-top: 4px;">[ 주문 확인서 ]</div>
                    <div style="font-size: 10px; margin-top: 2px;">${new Date().toLocaleString()}</div>
                </div>

                <div class="section">
                    <div class="label">고객명 / 연락처</div>
                    <div class="value">${order.customerName}</div>
                    <div style="font-size: 15px; font-weight: bold;">${order.customerContact || '-'}</div>
                </div>

                ${order.pickupType === 'DELIVERY' && order.address ? `
                <div class="section">
                    <div class="label">★★ 배달 주소 (기님 확인용) ★★</div>
                    <div class="address-box">
                        <div class="value" style="font-size: 18px; line-height: 1.2;">${order.address}</div>
                    </div>
                </div>
                ` : `
                <div class="section">
                    <div class="label">수령 방법</div>
                    <div class="value">매장 방문 픽업 (${order.pickupTime || '시간미정'})</div>
                </div>
                `}

                <div class="section">
                    <div class="label">주문 품목</div>
                    ${itemsHtml}
                    <div style="border-top: 2px solid #000; margin-top: 8px; padding-top: 4px; text-align: right; font-size: 16px; font-weight: 900;">
                        결제금액: ${order.totalPrice?.toLocaleString()}원
                    </div>
                </div>

                ${order.request ? `
                <div class="section" style="margin-top: 20px;">
                    <div class="label">★★ 고객 요청사항 ★★</div>
                    <div class="request-box">${order.request}</div>
                </div>
                ` : ''}

                <div class="footer">
                    필몽을 이용해 주셔서 감사합니다.<br>
                    맛있게 드시고 행복한 하루 되세요!
                </div>

                <script>
                    window.focus();
                    setTimeout(() => {
                        window.print();
                        window.close();
                    }, 250);
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(content);
        printWindow.document.close();
    };

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('ALL');

    const STATUS_OPTIONS = [
        { id: 'ALL', label: '전체' },
        { id: 'PENDING', label: '대기' },
        { id: 'CONFIRMED', label: '접수' },
        { id: 'PREPARING', label: '포장 중' },
        { id: 'READY_FOR_PICKUP', label: '픽업대기' },
        { id: 'READY_FOR_DELIVERY', label: '배달대기' },
        { id: 'COMPLETED', label: '완료' },
        { id: 'CANCELLED', label: '취소' },
    ];

    const filteredOrders = initialOrders.filter(order => {
        const matchesSearch =
            order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.customerContact?.includes(searchTerm) ?? false) ||
            (order.address?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

        const matchesStatus = filterStatus === 'ALL' || order.status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    const handleAddNew = () => {
        setSelectedOrder(undefined);
        setIsModalOpen(true);
    };

    useEffect(() => {
        const performSync = async () => {
            try {
                const res = await syncOrdersFromEmail();
                if (res.success && res.count !== undefined && res.count > 0) {
                    console.log(`Auto-synced ${res.count} new orders from email.`);
                    router.refresh();
                }
            } catch (err) {
                console.error("Auto-sync failed:", err);
            }
        };

        performSync();
        const interval = setInterval(() => {
            performSync();
            router.refresh();
        }, 600000);

        return () => clearInterval(interval);
    }, [router]);

    const handleEdit = (order: Order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Delete this order?')) {
            await deleteOrder(id);
            router.refresh();
        }
    };

    const handleStatusChange = async (id: string, currentStatus: string) => {
        const orderOfStatus = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'READY_FOR_DELIVERY', 'COMPLETED', 'CANCELLED'];
        let nextIdx = (orderOfStatus.indexOf(currentStatus) + 1) % orderOfStatus.length;
        const nextStatus = orderOfStatus[nextIdx];

        await updateOrderStatus(id, nextStatus as any);
        router.refresh();
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'PENDING': return { label: '대기', color: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-900/50 dark:text-yellow-300' };
            case 'CONFIRMED': return { label: '접수', color: 'bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-blue-900/50 dark:text-blue-300' };
            case 'PREPARING': return { label: '포장 중', color: 'bg-purple-50 text-purple-700 ring-purple-700/10 dark:bg-purple-900/50 dark:text-purple-300' };
            case 'READY_FOR_PICKUP': return { label: '픽업대기', color: 'bg-indigo-50 text-indigo-700 ring-indigo-700/10 dark:bg-indigo-900/50 dark:text-indigo-300' };
            case 'READY_FOR_DELIVERY': return { label: '배달대기', color: 'bg-orange-50 text-orange-700 ring-orange-700/10 dark:bg-orange-900/50 dark:text-orange-300' };
            case 'COMPLETED': return { label: '완료', color: 'bg-green-50 text-green-700 ring-green-700/10 dark:bg-green-900/50 dark:text-green-300' };
            case 'CANCELLED': return { label: '취소', color: 'bg-red-50 text-red-700 ring-red-700/10 dark:bg-red-900/50 dark:text-red-300' };
            default: return { label: status, color: 'bg-slate-50 text-slate-600 ring-slate-500/10' };
        }
    };

    return (
        <>
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Order Management</h1>
                    <p className="text-slate-500 dark:text-slate-400">Track all reservations and orders.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={async () => {
                            if (!confirm('새 주문 메일을 확인하고 가져올까요?')) return;
                            const res = await syncOrdersFromEmail();
                            if (res.success) {
                                alert(`${res.count}개의 새 주문을 가져왔습니다!`);
                                router.refresh();
                            } else {
                                alert('동기화 실패: ' + res.error);
                            }
                        }}
                        className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
                    >
                        <Sparkles className="mr-2 h-4 w-4 text-blue-500" />
                        Sync Emails
                    </button>
                    <button
                        onClick={handleAddNew}
                        className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
                    >
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        New Order
                    </button>
                </div>
            </div>

            <div className="mb-6 flex flex-wrap gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                {STATUS_OPTIONS.map((opt) => (
                    <button
                        key={opt.id}
                        onClick={() => setFilterStatus(opt.id)}
                        className={cn(
                            "px-4 py-2 text-sm font-medium rounded-full transition-all whitespace-nowrap flex items-center gap-2",
                            filterStatus === opt.id
                                ? "bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900 shadow-sm"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                        )}
                    >
                        {opt.label}
                        <span className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-bold",
                            filterStatus === opt.id
                                ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900"
                                : "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500"
                        )}>
                            {opt.id === 'ALL' ? initialOrders.length : initialOrders.filter(o => o.status === opt.id).length}
                        </span>
                    </button>
                ))}
            </div>

            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by name, phone or address..."
                        className="h-10 w-full rounded-md border border-slate-200 bg-white pl-10 pr-4 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:focus:ring-slate-300"
                    />
                </div>
            </div>

            {filteredOrders.length > 0 && (
                <div className="mb-8 p-6 rounded-2xl bg-slate-50 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <ShoppingBag className="h-5 w-5 text-slate-900 dark:text-slate-100" />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">생산 요약 (현재 필터 합계)</h2>
                    </div>
                    <div className="space-y-4">
                        {(() => {
                            const summary: Record<string, number> = {};
                            filteredOrders.forEach(order => {
                                order.items.forEach((item: any) => {
                                    const nameLower = item.name.toLowerCase();
                                    const isExcluded = nameLower.includes('배달') || nameLower.includes('쿠폰') || nameLower.includes('할인') || nameLower.includes('zone');
                                    if (!isExcluded) {
                                        summary[item.name] = (summary[item.name] || 0) + (item.quantity || 0);
                                    }
                                });
                            });

                            const items = Object.entries(summary).sort((a, b) => b[1] - a[1]);
                            if (items.length === 0) return <p className="text-sm text-slate-500">표시할 품목이 없습니다.</p>;

                            const maxQty = Math.max(...items.map(i => i[1]));

                            return items.map(([name, qty]) => (
                                <div key={name} className="space-y-1.5">
                                    <div className="flex justify-between items-end">
                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{name}</span>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">{qty}개</span>
                                    </div>
                                    <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
                                            style={{ width: `${(qty / maxQty) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredOrders.length === 0 ? (
                    <div className="col-span-full rounded-xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
                        <div className="mx-auto mb-4 h-12 w-12 text-slate-300">
                            <ShoppingBag className="h-full w-full" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">No orders found</h3>
                    </div>
                ) : (
                    filteredOrders.map((order) => (
                        <div key={order.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
                            <div className="mb-4 flex items-start justify-between">
                                <div>
                                    <div className="flex gap-2 mb-2">
                                        <span className={cn(
                                            "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                                            getStatusInfo(order.status).color
                                        )}>
                                            {getStatusInfo(order.status).label}
                                        </span>
                                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                            {order.type === 'RESERVATION' ? '예약' : '주문'}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{order.customerName}</h3>
                                    <p className="text-sm text-slate-500 flex items-center gap-1">
                                        <Phone className="h-3 w-3" /> {order.customerContact}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                                        {order.totalPrice ? order.totalPrice.toLocaleString() + '원' : '-'}
                                    </p>
                                    <p className="text-xs text-slate-500">{order.channel}</p>
                                </div>
                            </div>

                            <div className="mb-4 border-t border-slate-100 py-3 dark:border-slate-800">
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 mb-2">
                                    <CalendarIcon className="h-4 w-4" />
                                    <span>
                                        {order.pickupDate ? new Date(order.pickupDate).toLocaleDateString() : ''} {order.pickupTime}
                                    </span>
                                    <span className="text-xs text-slate-400">({order.pickupType})</span>
                                </div>
                                {order.pickupType === 'DELIVERY' && order.address && (
                                    <div className="mt-2 rounded-xl bg-blue-50/50 p-3 border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800">
                                        <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 mb-1">
                                            <MapPin className="h-4 w-4" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">배달 목적지</span>
                                        </div>
                                        <span className="text-base font-bold text-slate-900 dark:text-white leading-tight block">
                                            {order.address}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1">
                                {[...order.items].sort((a: any, b: any) => {
                                    const aExcluded = /배달|쿠폰|할인|zone/i.test(a.name);
                                    const bExcluded = /배달|쿠폰|할인|zone/i.test(b.name);
                                    if (aExcluded && !bExcluded) return 1;
                                    if (!aExcluded && bExcluded) return -1;
                                    return 0;
                                }).map((item: any, idx: number) => {
                                    const nameLower = item.name.toLowerCase();
                                    const isExcluded = nameLower.includes('배달') || nameLower.includes('쿠폰') || nameLower.includes('할인') || nameLower.includes('zone');

                                    return (
                                        <div key={idx} className="flex items-center justify-between text-sm group">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                {!isExcluded && (
                                                    <input
                                                        type="checkbox"
                                                        checked={item.packed || false}
                                                        onChange={async (e) => {
                                                            const newItems = [...order.items];
                                                            const itemIndex = order.items.findIndex((i: any) => i.name === item.name && i.quantity === item.quantity && i.price === item.price);
                                                            if (itemIndex > -1) {
                                                                newItems[itemIndex] = { ...item, packed: e.target.checked };
                                                                await updateOrder(order.id, { items: newItems });
                                                                router.refresh();
                                                            }
                                                        }}
                                                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                                                    />
                                                )}
                                                <span className={cn(
                                                    "truncate transition-all",
                                                    item.packed ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-300",
                                                    isExcluded && "text-slate-500 italic"
                                                )}>
                                                    {item.name}
                                                </span>
                                            </div>
                                            <span className={cn(
                                                "shrink-0 text-slate-500",
                                                item.packed && "text-slate-300"
                                            )}>
                                                x{item.quantity}
                                                {item.price ? ` (${(item.price * item.quantity).toLocaleString()}원)` : ''}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {order.request && (
                                <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/50 p-3 dark:border-amber-900/30 dark:bg-amber-900/10">
                                    <div className="flex items-center gap-1 text-amber-700 dark:text-amber-400 mb-1">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">고객 요청사항</span>
                                    </div>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                        {order.request}
                                    </p>
                                </div>
                            )}

                            <div className="mt-4 flex gap-2">
                                {order.memo && (
                                    <button
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (!confirm('Analyze and update order from memo?')) return;

                                            try {
                                                const result = parseNaverOrderText(order.memo!);
                                                const dateStr = result.pickupDate;

                                                const matchedItems = result.items?.map((item: any) => {
                                                    const match = findMatchingProduct(item.name, products, dateStr);
                                                    if (match) {
                                                        return {
                                                            name: match.name,
                                                            quantity: item.quantity,
                                                            price: match.price
                                                        };
                                                    }
                                                    return item;
                                                });

                                                const payload = {
                                                    ...order,
                                                    channel: 'NAVER',
                                                    customerName: result.customerName || order.customerName,
                                                    customerContact: result.customerContact || order.customerContact,
                                                    pickupDate: result.pickupDate ? new Date(result.pickupDate) : order.pickupDate,
                                                    pickupTime: result.pickupTime || order.pickupTime,
                                                    pickupType: result.pickupType || order.pickupType,
                                                    address: result.address || order.address,
                                                    request: result.request || order.request,
                                                    items: matchedItems || order.items,
                                                    totalPrice: result.totalPrice || order.totalPrice,
                                                };

                                                await updateOrder(order.id, payload as any);
                                                router.refresh();
                                                alert('Order updated!');
                                            } catch (err) {
                                                console.error(err);
                                                alert('Failed to analyze');
                                            }
                                        }}
                                        className="rounded-md bg-green-50 px-3 py-2 text-sm font-bold text-green-600 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                                        title="Analyze Naver Memo"
                                    >
                                        ⚡ Analyze
                                    </button>
                                )}
                                <button
                                    onClick={() => handleEdit(order as any)}
                                    className={cn(
                                        "flex-1 rounded-md py-2 text-sm font-medium text-white shadow-sm transition-colors",
                                        order.status === 'PENDING' && order.channel === 'NAVER'
                                            ? "bg-blue-600 hover:bg-blue-700"
                                            : "bg-slate-900 hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900"
                                    )}
                                >
                                    {order.status === 'PENDING' && order.channel === 'NAVER' ? 'Review' : 'Edit'}
                                </button>
                                <button
                                    onClick={() => handlePrint(order)}
                                    className="px-3 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 flex items-center justify-center p-2"
                                    title="전표 출력"
                                >
                                    <Printer className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleStatusChange(order.id, order.status)}
                                    className="flex-1 rounded-md border border-slate-200 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 flex items-center justify-center gap-1"
                                >
                                    <span>상태 변경</span>
                                </button>
                                <button
                                    onClick={() => handleDelete(order.id)}
                                    className="px-3 rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                                >
                                    <span className="sr-only">Delete</span>
                                    ×
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <OrderModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                type="RESERVATION"
                onSuccess={() => router.refresh()}
                order={selectedOrder}
                products={products}
            />
        </>
    );
}
