"use client"

import React, { useState, useEffect, useRef } from "react"
import { Plus, X, List, CreditCard, Save, Calendar, Search, Trash2, Edit2, Loader2, Share2, CornerDownRight } from 'lucide-react'
import { createPurchase, updatePurchase, getVendors } from "@/lib/purchase/actions"
import { Vendor, PurchaseItem, PurchaseRecord, PaymentMethod, PaymentStatus, UsageType } from "@/lib/purchase/types"
import { toComma, fromComma } from "../purchase-app"

interface Props {
    editingRecord: PurchaseRecord | null
    onCancelEdit: () => void
    onToast: (msg: string, type: "SUCCESS" | "ERROR") => void
}

export default function PurchaseEntry({ editingRecord, onCancelEdit, onToast }: Props) {
    const [vendors, setVendors] = useState<Vendor[]>([])
    const [isSaving, setIsSaving] = useState(false)

    // Main Form
    const [vendorName, setVendorName] = useState("")
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CREDIT_CARD")
    const [status, setStatus] = useState<PaymentStatus>("ORDERED")
    const [items, setItems] = useState<PurchaseItem[]>([])

    // Item Modal Form
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingItemId, setEditingItemId] = useState<string | null>(null)
    const [inputMode, setInputMode] = useState<"UNIT" | "TOTAL">("UNIT")
    const [newItem, setNewItem] = useState({
        name: "",
        quantity: 1,
        unitPrice: 0,
        usage: "BUSINESS" as UsageType,
        note: ""
    })
    const [subtotalInput, setSubtotalInput] = useState(0)
    const [discount, setDiscount] = useState(0)
    const [discountType, setDiscountType] = useState<"UNIT" | "TOTAL">("UNIT")

    const nameInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        loadVendors()
        const draft = localStorage.getItem('purchase_draft')
        if (draft && !editingRecord) {
            try {
                const parsed = JSON.parse(draft)
                setVendorName(parsed.vendorName || "")
                setItems(parsed.items || [])
            } catch (e) { }
        }
    }, [])

    useEffect(() => {
        if (editingRecord) {
            setVendorName(editingRecord.vendorName)
            setDate(new Date(editingRecord.date).toISOString().split('T')[0])
            setPaymentMethod(recordToMethod(editingRecord.paymentMethod))
            setStatus(recordToStatus(editingRecord.status))
            setItems(editingRecord.items)
        }
    }, [editingRecord])

    useEffect(() => {
        if (!editingRecord) {
            localStorage.setItem('purchase_draft', JSON.stringify({ vendorName, items }))
        }
    }, [vendorName, items])

    const recordToMethod = (m: string) => m as PaymentMethod
    const recordToStatus = (s: string) => s as PaymentStatus

    const loadVendors = async () => {
        const res = await getVendors()
        if (res.success && res.data) setVendors(res.data)
    }

    const handleAddItem = (keepOpen: boolean) => {
        if (!newItem.name) return

        let finalAmount = 0
        let effectiveUnitPrice = newItem.unitPrice

        if (inputMode === "TOTAL") {
            finalAmount = subtotalInput
            effectiveUnitPrice = Math.round(subtotalInput / (newItem.quantity || 1))
        } else {
            const baseAmount = newItem.quantity * newItem.unitPrice
            const totalDisc = discountType === "UNIT" ? (discount * newItem.quantity) : discount
            finalAmount = baseAmount - totalDisc
        }

        const item: PurchaseItem = {
            id: editingItemId || Math.random().toString(36).substr(2, 9),
            name: newItem.name,
            quantity: newItem.quantity,
            unitPrice: effectiveUnitPrice,
            amount: finalAmount,
            usage: newItem.usage,
            note: newItem.note,
            discountValue: discount,
            discountType: discountType
        }

        if (editingItemId) {
            setItems(items.map(i => i.id === editingItemId ? item : i))
            setEditingItemId(null)
            setIsModalOpen(false)
        } else {
            setItems([...items, item])
        }

        // Reset
        setNewItem({ name: "", quantity: 1, unitPrice: 0, usage: "BUSINESS", note: "" })
        setSubtotalInput(0)
        setDiscount(0)

        if (!keepOpen) setIsModalOpen(false)
        else nameInputRef.current?.focus()
    }

    const handleSave = async () => {
        if (!vendorName || items.length === 0) return
        setIsSaving(true)

        const data = { vendorName, date, paymentMethod, status, items }
        const res = editingRecord
            ? await updatePurchase(editingRecord.id, data)
            : await createPurchase(data)

        if (res.success) {
            onToast(editingRecord ? "수정되었습니다." : "저장되었습니다.", "SUCCESS")
            if (!editingRecord) {
                setVendorName("")
                setItems([])
                localStorage.removeItem('purchase_draft')
            }
            if (editingRecord) onCancelEdit()
        } else {
            onToast(res.error || "실패", "ERROR")
        }
        setIsSaving(false)
    }

    const handleCopyToClipboard = () => {
        if (items.length === 0) return
        const itemList = items.map((item, idx) => `${idx + 1}. ${item.name} (${item.quantity}개)`).join('\n')
        const fullText = `[필몽 발주 요청]\n거래처: ${vendorName || '미지정'}\n날짜: ${date}\n\n[품목 리스트]\n${itemList}\n\n합계금액: ${totalAmount.toLocaleString()}원\n항상 감사합니다.`

        navigator.clipboard.writeText(fullText)
            .then(() => onToast("클립보드에 발주 목록이 복사되었습니다.", "SUCCESS"))
            .catch(() => onToast("복사 실패", "ERROR"))
    }

    const totalAmount = items.reduce((sum, i) => sum + i.amount, 0)

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Left Column: Details */}
            <div className="md:col-span-1 space-y-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
                    <h3 className="font-black text-slate-800 flex items-center gap-2">
                        <List className="w-5 h-5 text-indigo-600" />
                        기본 정보
                    </h3>

                    <div className="space-y-4">
                        <div className="relative">
                            <label className="text-xs font-bold text-slate-400 mb-1.5 block">거래처</label>
                            <input
                                list="vendor-list"
                                type="text"
                                value={vendorName}
                                onChange={(e) => setVendorName(e.target.value)}
                                placeholder="거래처 선택 또는 입력"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                            />
                            <datalist id="vendor-list">
                                {vendors.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                            </datalist>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-400 mb-1.5 block">결제 날짜</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 mb-1.5 block">결제 수단</label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold appearance-none"
                                >
                                    <option value="CREDIT_CARD">신용카드</option>
                                    <option value="CHECK_CARD">체크카드</option>
                                    <option value="TRANSFER">계좌이체</option>
                                    <option value="CASH">현금</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 mb-1.5 block">현재 상태</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as PaymentStatus)}
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold appearance-none"
                                >
                                    <option value="ORDERED">발주완료</option>
                                    <option value="RECEIVED">입고완료</option>
                                    <option value="COMPLETED">정산완료</option>
                                    <option value="CANCELLED">취소</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl space-y-4">
                    <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-xl">
                        <span className="text-sm font-bold text-indigo-700">총 결제 금액</span>
                        <span className="text-2xl font-black text-indigo-600">{totalAmount.toLocaleString()}원</span>
                    </div>
                    {editingRecord && (
                        <button
                            onClick={onCancelEdit}
                            className="w-full bg-slate-100 text-slate-600 py-3.5 rounded-xl font-bold hover:bg-slate-200 transition-all text-sm mb-2"
                        >
                            수정 취소
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={items.length === 0 || !vendorName || isSaving}
                        className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-xl shadow-indigo-200 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {editingRecord ? "변경사항 저장하기" : "구매 내역 저장하기"}
                    </button>
                </div>
            </div>

            {/* Right Column: Items */}
            <div className="md:col-span-2 space-y-4">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm min-h-[400px]">
                    <div className="p-5 border-b border-slate-50 flex justify-between items-center">
                        <h3 className="font-black text-slate-800">구매 품목 목록 ({items.length})</h3>
                        <div className="flex items-center gap-2">
                            {items.length > 0 && (
                                <button
                                    onClick={handleCopyToClipboard}
                                    className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-100 transition-all flex items-center gap-2 border border-emerald-100"
                                >
                                    <Share2 className="w-4 h-4" /> 발주하기 (복사)
                                </button>
                            )}
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm"
                            >
                                <Plus className="w-4 h-4" /> 품목 추가
                            </button>
                        </div>
                    </div>

                    <div className="divide-y divide-slate-50">
                        {items.length === 0 ? (
                            <div className="p-20 text-center space-y-3">
                                <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-slate-300">
                                    <List className="w-8 h-8" />
                                </div>
                                <p className="text-slate-400 text-sm font-medium">품목을 추가해주세요.</p>
                            </div>
                        ) : (
                            items.map((item, idx) => (
                                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800 text-sm">{item.name}</div>
                                            <div className="text-[10px] text-slate-400 font-medium">
                                                {item.quantity}개 × {item.unitPrice.toLocaleString()}원
                                                {item.note && <span className="ml-2 text-indigo-400">| {item.note}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <div className="font-black text-slate-800">{item.amount.toLocaleString()}원</div>
                                            <div className={`text-[10px] font-black ${item.usage === "BUSINESS" ? "text-blue-500" : "text-orange-500"}`}>
                                                {item.usage === "BUSINESS" ? "🏢 업무용" : "🏠 개인용"}
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => {
                                                    setEditingItemId(item.id)
                                                    setNewItem({
                                                        name: item.name,
                                                        quantity: item.quantity,
                                                        unitPrice: item.unitPrice,
                                                        usage: item.usage,
                                                        note: item.note || ""
                                                    })
                                                    setDiscount(item.discountValue || 0)
                                                    setDiscountType((item.discountType as any) || "UNIT")
                                                    setIsModalOpen(true)
                                                }}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setItems(items.filter(i => i.id !== item.id))}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-lg text-slate-800">{editingItemId ? "품목 수정" : "새 품목 추가"}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); handleAddItem(true); }}>
                            <div className="p-6 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">품목명</label>
                                    <input
                                        ref={nameInputRef}
                                        autoFocus
                                        type="text"
                                        placeholder="예: 델몬트 바나나"
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                                        value={newItem.name}
                                        onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">수량</label>
                                        <input
                                            type="number"
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
                                            value={newItem.quantity}
                                            onChange={e => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">단가 (원)</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
                                            value={toComma(newItem.unitPrice)}
                                            onChange={e => setNewItem({ ...newItem, unitPrice: fromComma(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">용도 구분</label>
                                    <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => setNewItem({ ...newItem, usage: "BUSINESS" })}
                                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${newItem.usage === "BUSINESS" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}
                                        >
                                            🏢 업무용
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNewItem({ ...newItem, usage: "PERSONAL" })}
                                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${newItem.usage === "PERSONAL" ? "bg-white text-orange-600 shadow-sm" : "text-slate-500"}`}
                                        >
                                            🏠 개인용
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">비고</label>
                                    <input
                                        type="text"
                                        placeholder="박스 훼손 등 비고"
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
                                        value={newItem.note}
                                        onChange={e => setNewItem({ ...newItem, note: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                                {!editingItemId && (
                                    <button
                                        type="submit"
                                        className="flex-1 bg-white border border-indigo-200 text-indigo-700 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-all"
                                    >
                                        계속 추가
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => handleAddItem(false)}
                                    className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                                >
                                    {editingItemId ? "수정 완료" : "완료"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
