'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { createProduct, updateProduct, ProductType as ActionProductType } from '@/actions/products';

interface ProductModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: ActionProductType;
    onSuccess?: () => void;
    product?: any; // Using any for flexibility with serialized dates, or define proper interface including strings/Dates
}

export function ProductModal({ open, onOpenChange, type, onSuccess, product }: ProductModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        category: '요리곁들임',
        date: '',
    });

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name,
                price: String(product.price),
                category: product.category || '요리곁들임',
                date: product.targetDate ? new Date(product.targetDate).toISOString().split('T')[0] : '',
            });
        } else {
            setFormData({
                name: '',
                price: '',
                category: '요리곁들임',
                date: '',
            });
        }
    }, [product, open]); // Reset when opening/changing product

    const handleSubmit = async () => {
        try {
            setLoading(true);
            let result;

            if (product) {
                // Update
                result = await updateProduct(product.id, {
                    name: formData.name,
                    price: Number(formData.price),
                    category: type === 'REGULAR' ? formData.category : undefined,
                    targetDate: (type === 'DAILY' || type === 'SPECIAL') && formData.date ? new Date(formData.date) : undefined,
                });
            } else {
                // Create
                result = await createProduct({
                    type: type,
                    name: formData.name,
                    price: Number(formData.price),
                    status: 'ACTIVE',
                    category: type === 'REGULAR' ? formData.category : undefined,
                    targetDate: (type === 'DAILY' || type === 'SPECIAL') && formData.date ? new Date(formData.date) : undefined,
                });
            }

            if (result.success) {
                onOpenChange(false);
                if (onSuccess) onSuccess();
            } else {
                alert(product ? 'Failed to update product' : 'Failed to save product');
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
                <DialogTitle>{product ? 'Edit Product' : `Add New Product (${type})`}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <label htmlFor="name" className="text-sm font-medium">Name</label>
                    <input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:focus-visible:ring-slate-300"
                        placeholder="Product Name"
                    />
                </div>
                <div className="grid gap-2">
                    <label htmlFor="price" className="text-sm font-medium">Price</label>
                    <input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
                        placeholder="0"
                    />
                </div>

                {type === 'REGULAR' && (
                    <div className="grid gap-2">
                        <label htmlFor="category" className="text-sm font-medium">Category</label>
                        <select
                            id="category"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm bg-white dark:border-slate-800 dark:bg-slate-950"
                        >
                            <option>요리곁들임</option>
                            <option>국물곁들임</option>
                            <option>반찬곁들임</option>
                            <option>김치곁들임</option>
                            <option>젓갈곁들임</option>
                            <option>장아찌곁들임</option>
                            <option>기타곁들임</option>
                            <option>배달비</option>
                            <option>쿠폰할인</option>
                        </select>
                    </div>
                )}

                {(type === 'DAILY' || type === 'SPECIAL') && (
                    <div className="grid gap-2">
                        <label htmlFor="date" className="text-sm font-medium">Target Date</label>
                        <input
                            id="date"
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
                        />
                    </div>
                )}
            </div>
            <DialogFooter>
                <button onClick={() => onOpenChange(false)} className="rounded-md border border-slate-200 px-4 py-2 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800">Cancel</button>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
                >
                    {loading ? 'Saving...' : 'Save'}
                </button>
            </DialogFooter>
        </Dialog>
    );
}
