"use client"

import React, { useState, useEffect } from "react"
import { Users, Plus, Edit2, Trash2, Link as LinkIcon, Loader2 } from 'lucide-react'
import { getVendors, createVendor, deleteVendor, updateVendor } from "@/lib/purchase/actions"
import { Vendor } from "@/lib/purchase/types"

interface Props {
    onToast: (msg: string, type: "SUCCESS" | "ERROR") => void
}

export default function VendorManagement({ onToast }: Props) {
    const [vendors, setVendors] = useState<Vendor[]>([])
    const [loading, setLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null)
    const [name, setName] = useState("")
    const [contact, setContact] = useState("")
    const [website, setWebsite] = useState("")
    const [note, setNote] = useState("")

    useEffect(() => {
        loadVendors()
    }, [])

    const loadVendors = async () => {
        setLoading(true)
        const res = await getVendors()
        if (res.success && res.data) {
            setVendors(res.data)
        }
        setLoading(false)
    }

    const handleSave = async () => {
        if (!name.trim()) return
        setIsSaving(true)

        const data = { name, contact, website, note }
        const res = editingId
            ? await updateVendor(editingId, data)
            : await createVendor(data)

        if (res.success) {
            onToast(editingId ? "거래처 정보가 수정되었습니다." : "새 거래처가 등록되었습니다.", "SUCCESS")
            resetForm()
            loadVendors()
        } else {
            onToast(res.error || "처리 중 오류가 발생했습니다.", "ERROR")
        }
        setIsSaving(false)
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`'${name}' 거래처를 삭제하시겠습니까?`)) return
        const res = await deleteVendor(id)
        if (res.success) {
            onToast("거래처가 삭제되었습니다.", "SUCCESS")
            loadVendors()
        } else {
            onToast("삭제 실패: " + res.error, "ERROR")
        }
    }

    const resetForm = () => {
        setEditingId(null)
        setName("")
        setContact("")
        setWebsite("")
        setNote("")
    }

    const startEdit = (v: Vendor) => {
        setEditingId(v.id)
        setName(v.name)
        setContact(v.contact || "")
        setWebsite(v.website || "")
        setNote(v.note || "")
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Left: Form */}
            <div className="md:col-span-1 space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm sticky top-6">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-600" />
                        {editingId ? "거래처 정보 수정" : "새 거래처 등록"}
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 mb-1 block">거래처명 <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="예: 다이소, 쿠팡"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 mb-1 block">연락처</label>
                            <input
                                type="text"
                                value={contact}
                                onChange={(e) => setContact(e.target.value)}
                                placeholder="전화번호 또는 이메일"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 mb-1 block">웹사이트 (선택)</label>
                            <input
                                type="text"
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                                placeholder="https://..."
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 mb-1 block">메모</label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="계좌번호, 담당자 등 메모"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all h-20 resize-none"
                            />
                        </div>
                        <div className="flex gap-2">
                            {editingId && (
                                <button
                                    onClick={resetForm}
                                    className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl font-bold hover:bg-slate-200 active:scale-95 transition-all text-sm"
                                >
                                    취소
                                </button>
                            )}
                            <button
                                onClick={handleSave}
                                disabled={!name || isSaving}
                                className={`flex-[2] text-white py-2.5 rounded-xl font-bold hover:opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 ${editingId ? "bg-orange-600 shadow-orange-200" : "bg-indigo-600 shadow-indigo-200"}`}
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                {editingId ? "정보 수정" : "거래처 추가"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: List */}
            <div className="md:col-span-2">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100">
                        <h3 className="font-bold text-slate-800">등록된 거래처 목록 ({vendors.length})</h3>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                        {loading ? (
                            <div className="p-12 flex justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                            </div>
                        ) : vendors.length === 0 ? (
                            <div className="p-12 text-center text-slate-500">등록된 거래처가 없습니다.</div>
                        ) : (
                            vendors.map((vendor) => (
                                <div key={vendor.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                    <div>
                                        <div className="font-bold text-slate-800">{vendor.name}</div>
                                        {(vendor.contact || vendor.note || vendor.website) && (
                                            <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-2 items-center">
                                                {vendor.contact && <span>📞 {vendor.contact}</span>}
                                                {vendor.website && (
                                                    <a
                                                        href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1 text-indigo-500 hover:text-indigo-700 hover:underline"
                                                    >
                                                        <LinkIcon className="w-3 h-3" /> 웹사이트
                                                    </a>
                                                )}
                                                {vendor.note && <span className="text-slate-400">| {vendor.note}</span>}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => startEdit(vendor)}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                            title="수정"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(vendor.id, vendor.name)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            title="삭제"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
