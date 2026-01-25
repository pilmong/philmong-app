'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { createOrder, updateOrder, OrderType as ActionOrderType } from '@/actions/orders';
import { parseNaverOrderText, findMatchingProduct } from '@/lib/naver-parser';
import { Plus, Trash, Sparkles } from 'lucide-react';

interface OrderModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: ActionOrderType;
    onSuccess?: () => void;
    order?: any;
    products?: any[]; // Add products prop
}

export function OrderModal({ open, onOpenChange, type, onSuccess, order, products = [] }: OrderModalProps) {
    // ... existing state ...
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<any>({
        type: 'RESERVATION', // Default
        channel: 'PHONE',
        customerName: '',
        customerContact: '',
        pickupType: 'PICKUP',
        pickupDate: '',
        pickupTime: '',
        address: '',
        request: '',
        items: [{ name: '', quantity: 1 }],
        memo: '', // New memo field
    });

    // ... useEffect ...
    useEffect(() => {
        if (order) {
            setFormData({
                type: order.type,
                channel: order.channel,
                customerName: order.customerName,
                customerContact: order.customerContact || '',
                pickupType: order.pickupType,
                pickupDate: order.pickupDate ? new Date(order.pickupDate).toISOString().split('T')[0] : '',
                pickupTime: order.pickupTime || '',
                address: order.address || '',
                request: order.request || '',
                items: order.items || [{ name: '', quantity: 1 }],
                totalPrice: order.totalPrice || 0,
                memo: order.memo || '',
            });
        } else {
            // Reset for new order
            // If type param is passed (which we might deprecate or use as default), use it
            setFormData({
                type: type || 'RESERVATION',
                channel: 'PHONE',
                customerName: '',
                customerContact: '',
                pickupType: 'PICKUP',
                pickupDate: new Date().toISOString().split('T')[0],
                pickupTime: '12:00',
                address: '',
                request: '',
                items: [{ name: '', quantity: 1 }],
                totalPrice: 0,
                memo: '',
            });
        }
    }, [order, open, type]);

    const handleAddItem = () => {
        setFormData((prev: any) => ({
            ...prev,
            items: [...prev.items, { name: '', quantity: 1 }]
        }));
    };

    const handleRemoveItem = (index: number) => {
        setFormData((prev: any) => ({
            ...prev,
            items: prev.items.filter((_: any, i: number) => i !== index)
        }));
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setFormData({ ...formData, items: newItems });
    };

    const handleParse = () => {
        const textToParse = formData.memo;
        if (!textToParse?.trim()) {
            alert('분석할 메모 내용이 없습니다.');
            return;
        }

        try {
            const result = parseNaverOrderText(textToParse);

            // Extract date first for matching
            const dateStr = result.pickupDate;

            // Apply product matching using SHARED helper
            const matchedItems = result.items?.map((item) => {
                const match = findMatchingProduct(item.name, products, dateStr);
                if (match) {
                    return {
                        name: match.name, // Use official DB name
                        quantity: item.quantity,
                        price: match.price // Use DB price! (As requested)
                    };
                }
                // Fallback: use parsed price if no match
                return item;
            });

            setFormData((prev: any) => ({
                ...prev,
                channel: 'NAVER',
                customerName: result.customerName || prev.customerName,
                customerContact: result.customerContact || prev.customerContact,
                pickupDate: result.pickupDate || prev.pickupDate,
                pickupTime: result.pickupTime || prev.pickupTime,
                pickupType: result.pickupType || prev.pickupType,
                address: result.address || prev.address,
                request: result.request || prev.request,
                items: matchedItems || prev.items,
                totalPrice: result.totalPrice || prev.totalPrice, // Use total from text, or recalculate? 
                // Naver Total Price includes delivery & discounts. 
                // We should probably trust the parsed total, but item prices are from DB.
                // Or recalculate total based on new item prices?
                // Let's trust parser total for now (Naver's official total), or items sum?
                // Actually parsed total is reliable.
                // memo: prev.memo (Keep existing memo)
            }));

            alert(`성공적으로 분석했습니다!\n이름: ${result.customerName}\n금액: ${result.totalPrice?.toLocaleString()}원\n품목: ${result.items?.length}개`);
        } catch (e) {
            console.error(e);
            alert('분석에 실패했습니다. 텍스트 형식을 확인해주세요.');
        }
    };


    const handleSubmit = async () => {
        try {
            setLoading(true);

            const payload = {
                ...formData,
                type: formData.type || type, // Use form data preferred
                pickupDate: formData.pickupDate ? new Date(formData.pickupDate) : null,
                totalPrice: formData.totalPrice || 0,
                status: order?.status || (formData.type === 'ORDER' ? 'CONFIRMED' : 'PENDING'),
            };

            let result;
            if (order) {
                result = await updateOrder(order.id, payload);
            } else {
                result = await createOrder(payload);
            }

            if (result.success) {
                onOpenChange(false);
                if (onSuccess) onSuccess();
            } else {
                alert('Failed to save order');
            }
        } catch (e) {
            console.error(e);
            alert('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogHeader>
                <DialogTitle>{order ? 'Edit Order' : `New ${type === 'RESERVATION' ? 'Reservation' : 'Order'}`}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">

                {/* Smart Analysis Button - Only if memo exists or is being added */}
                <div className="flex justify-end">
                    <button
                        onClick={handleParse}
                        className="flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700 shadow-sm transition-colors"
                        title="Analyze content in Memo field"
                    >
                        <Sparkles className="h-3 w-3" />
                        Analyze Memo
                    </button>
                </div>

                {/* Form Fields - Always Visible */}
                <div className="grid gap-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Order Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm bg-white dark:bg-slate-950 dark:border-slate-800"
                            >
                                <option value="RESERVATION">예약 (Reservation)</option>
                                <option value="ORDER">즉시 주문 (Immediate)</option>
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Channel</label>
                            <select
                                value={formData.channel}
                                onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                                className="flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm bg-white dark:bg-slate-950 dark:border-slate-800"
                            >
                                <option value="PHONE">전화 (Phone)</option>
                                <option value="TEXT">문자 (Text)</option>
                                <option value="NAVER">네이버 (Naver)</option>
                                <option value="BAND">밴드 (Band)</option>
                                <option value="INSTA">인스타 (Insta)</option>
                                <option value="WALK_IN">방문 (Walk-in)</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Customer Name</label>
                        <input
                            value={formData.customerName}
                            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm dark:bg-slate-950 dark:border-slate-800"
                        />
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Contact</label>
                        <input
                            value={formData.customerContact}
                            onChange={(e) => setFormData({ ...formData, customerContact: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm dark:bg-slate-950 dark:border-slate-800"
                            placeholder="010-0000-0000"
                        />
                    </div>

                    {/* Pickup/Delivery */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Type</label>
                            <select
                                value={formData.pickupType}
                                onChange={(e) => setFormData({ ...formData, pickupType: e.target.value })}
                                className="flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm bg-white dark:bg-slate-950 dark:border-slate-800"
                            >
                                <option value="PICKUP">픽업 (Pickup)</option>
                                <option value="DELIVERY">배달 (Delivery)</option>
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Date & Time</label>
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    value={formData.pickupDate}
                                    onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                                    className="flex h-10 w-full rounded-md border border-slate-200 px-2 py-2 text-sm dark:bg-slate-950 dark:border-slate-800"
                                />
                                <input
                                    type="time"
                                    value={formData.pickupTime}
                                    onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                                    className="flex h-10 w-full rounded-md border border-slate-200 px-2 py-2 text-sm dark:bg-slate-950 dark:border-slate-800"
                                />
                            </div>
                        </div>
                    </div>

                    {formData.pickupType === 'DELIVERY' && (
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Address</label>
                            <input
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm dark:bg-slate-950 dark:border-slate-800"
                            />
                        </div>
                    )}

                    {/* Items */}
                    <div className="space-y-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Order Items</label>
                            <button
                                onClick={handleAddItem}
                                className="text-xs flex items-center bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
                            >
                                <Plus className="h-3 w-3 mr-1" /> Add Item
                            </button>
                        </div>
                        {formData.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex gap-2 items-center">
                                <input
                                    placeholder="Item Name"
                                    value={item.name}
                                    onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                                    className="flex-1 h-9 rounded-md border border-slate-200 px-3 text-sm dark:bg-slate-950 dark:border-slate-800"
                                />
                                <input
                                    type="number"
                                    placeholder="Qty"
                                    value={item.quantity}
                                    onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                                    className="w-16 h-9 rounded-md border border-slate-200 px-2 text-sm dark:bg-slate-950 dark:border-slate-800"
                                />
                                <input
                                    type="number"
                                    placeholder="Price"
                                    value={item.price || ''}
                                    onChange={(e) => handleItemChange(idx, 'price', Number(e.target.value))}
                                    className="w-24 h-9 rounded-md border border-slate-200 px-2 text-sm dark:bg-slate-950 dark:border-slate-800 text-right"
                                />
                                {/* Subtotal Display */}
                                <div className="w-20 text-right text-sm text-slate-500 font-medium">
                                    {((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                                </div>
                                <button onClick={() => handleRemoveItem(idx)} className="text-slate-400 hover:text-red-500">
                                    <Trash className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Note / Request</label>
                        <textarea
                            value={formData.request}
                            onChange={(e) => setFormData({ ...formData, request: e.target.value })}
                            className="flex min-h-[60px] w-full rounded-md border border-slate-200 px-3 py-2 text-sm dark:bg-slate-950 dark:border-slate-800"
                        />
                    </div>

                    {/* Order Memo / Original Text */}
                    <div className="grid gap-2">
                        <label className="text-sm font-medium text-slate-500">
                            Original Text / Memo (Parse Source)
                        </label>
                        <textarea
                            value={formData.memo}
                            onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                            className="flex min-h-[100px] w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono dark:bg-slate-900 dark:border-slate-800"
                            placeholder="Original Naver order text will appear here..."
                        />
                    </div>
                </div>
            </div>
            <DialogFooter>
                <button onClick={() => onOpenChange(false)} className="rounded-md border border-slate-200 px-4 py-2 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800">Cancel</button>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
                >
                    {loading ? 'Saving...' : 'Save Order'}
                </button>
            </DialogFooter>
        </Dialog>
    );
}
