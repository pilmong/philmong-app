"use client"

import React, { useState, useEffect } from "react"
import { History, Search, Calendar, Filter, Trash2, Edit2, Loader2, CheckCircle2, ChevronRight, Share2 } from 'lucide-react'
import { getPurchases, deletePurchase, updatePurchaseStatus, toggleItemCheck } from "@/lib/purchase/actions"
import { PurchaseRecord, PaymentStatus } from "@/lib/purchase/types"

interface Props {
    onEdit: (record: PurchaseRecord) => void
    onToast: (msg: string, type: "SUCCESS" | "ERROR") => void
}

export default function PurchaseHistory({ onEdit, onToast }: Props) {
    const [records, setRecords] = useState<PurchaseRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [query, setQuery] = useState("")
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(false)
    const [totalCount, setTotalCount] = useState(0)

    useEffect(() => {
        loadRecords()
    }, [page])

    const loadRecords = async (isSearch = false) => {
        setLoading(true)
        const currentPage = isSearch ? 1 : page
        const res = await getPurchases(query, currentPage)
        if (res.success) {
            setRecords(res.data as any)
            setHasMore(res.hasMore || false)
            setTotalCount(res.totalCount || 0)
        }
        setLoading(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("이 구매 내역을 삭제하시겠습니까?")) return
        const res = await deletePurchase(id)
        if (res.success) {
            onToast("삭제되었습니다.", "SUCCESS")
            loadRecords()
        }
    }

    const handleStatusChange = async (id: string, status: PaymentStatus) => {
        const res = await updatePurchaseStatus(id, status)
        if (res.success) {
            onToast("상태가 변경되었습니다.", "SUCCESS")
            loadRecords()
        }
    }

    const handleToggleCheck = async (itemId: string, isChecked: boolean) => {
        const res = await toggleItemCheck(itemId, isChecked)
        if (res.success) {
            // Update local state for immediate feedback
            setRecords(prev => prev.map(p => ({
                ...p,
                items: p.items.map(i => i.id === itemId ? { ...i, isChecked } : i)
            })))
        }
    }

    const handleCopyHistory = (record: PurchaseRecord) => {
        const itemList = record.items.map((item, idx) => `${idx + 1}. ${item.name}`).join('\n')
        const fullText = `거래처: ${record.vendorName}\n날짜: ${new Date(record.date).toLocaleDateString()}\n\n${itemList}\n\n항상 감사합니다.`

        navigator.clipboard.writeText(fullText)
            .then(() => onToast("발주 내역이 복사되었습니다.", "SUCCESS"))
            .catch(() => onToast("복사 실패", "ERROR"))
    }

    const getStatusStyle = (status: PaymentStatus) => {
        switch (status) {
            case "ORDERED": return "bg-amber-100 text-amber-700 border-amber-200"
            case "RECEIVED": return "bg-blue-100 text-blue-700 border-blue-200"
            case "COMPLETED": return "bg-emerald-100 text-emerald-700 border-emerald-200"
            case "CANCELLED": return "bg-red-100 text-red-700 border-red-200"
            default: return "bg-slate-100 text-slate-700 border-slate-200"
        }
    }

    const getStatusLabel = (status: PaymentStatus) => {
        switch (status) {
            case "ORDERED": return "발주완료"
            case "RECEIVED": return "입고완료"
            case "COMPLETED": return "정산완료"
            case "CANCELLED": return "취소됨"
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && loadRecords(true)}
                        placeholder="거래처명 또는 품목명으로 검색..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <button
                    onClick={() => loadRecords(true)}
                    className="w-full md:w-auto px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all shadow-md"
                >
                    검색
                </button>
            </div>

            <div className="text-sm text-slate-500 font-medium">
                총 <span className="text-indigo-600 font-bold">{totalCount}</span>건의 구매 내역이 있습니다.
            </div>

            {loading && records.length === 0 ? (
                <div className="flex justify-center p-24">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                </div>
            ) : records.length === 0 ? (
                <div className="bg-white p-24 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400">
                    검색 결과가 없습니다.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {records.map((record) => (
                        <div key={record.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:border-indigo-200 transition-all">
                            <div className="p-5 border-b border-slate-50 flex flex-wrap justify-between items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${getStatusStyle(record.status)}`}>
                                        {getStatusLabel(record.status)}
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-lg">{record.vendorName}</h4>
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> {new Date(record.date).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-right mr-4">
                                        <div className="text-[10px] text-slate-400 uppercase font-bold">Total Amount</div>
                                        <div className="text-lg font-black text-indigo-600">
                                            {record.totalAmount.toLocaleString()}원
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleCopyHistory(record)}
                                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="발주내역 복사"
                                    >
                                        <Share2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onEdit(record)}
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="수정"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(record.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="삭제"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50/50">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {record.items.map((item) => (
                                        <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleToggleCheck(item.id, !item.isChecked)}
                                                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${item.isChecked ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 hover:border-indigo-400"}`}
                                                >
                                                    {item.isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                                                </button>
                                                <div>
                                                    <div className={`text-sm font-bold ${item.isChecked ? "text-slate-400 line-through" : "text-slate-700"}`}>{item.name}</div>
                                                    <div className="text-[10px] text-slate-400">
                                                        {item.quantity}개 × {item.unitPrice.toLocaleString()}원
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-slate-800">{item.amount.toLocaleString()}원</div>
                                                <div className={`text-[10px] font-bold ${item.usage === "BUSINESS" ? "text-blue-500" : "text-orange-500"}`}>
                                                    {item.usage === "BUSINESS" ? "🏢" : "🏠"}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {hasMore && (
                <div className="flex justify-center mt-8">
                    <button
                        onClick={() => setPage(p => p + 1)}
                        className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-2"
                    >
                        더 보기 <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    )
}
