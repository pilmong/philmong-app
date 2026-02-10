"use client"

import React, { useState, useEffect } from "react"
import { ShoppingBag, Calendar, CreditCard, Save, X, Search, List, History, PieChart, Users, Shield, LogOut, Home, Zap, Loader2, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { logoutAction } from "@/lib/purchase/actions"
import { PurchaseRecord } from "@/lib/purchase/types"

// Sub-components
import PurchaseEntry from "./parts/PurchaseEntry"
import PurchaseHistory from "./parts/PurchaseHistory"
import PurchaseStats from "./parts/PurchaseStats"
import VendorManagement from "./parts/VendorManagement"
import UserManagement from "./parts/UserManagement"

// Utils
export const toComma = (val: number | string | undefined) => {
    if (val === undefined || val === null || val === "") return "";
    const num = typeof val === "string" ? parseInt(val.replace(/[^0-9-]/g, "")) : val;
    if (isNaN(num)) return "";
    return num.toLocaleString();
};

export const fromComma = (val: string) => {
    const num = parseInt(val.replace(/[^0-9-]/g, ""));
    return isNaN(num) ? 0 : num;
};

export default function PurchaseApp() {
    const [activeTab, setActiveTab] = useState<"ENTRY" | "HISTORY" | "STATISTICS" | "VENDORS" | "USERS">("ENTRY")
    const [editingRecord, setEditingRecord] = useState<PurchaseRecord | null>(null)

    const [toast, setToast] = useState<{ visible: boolean, message: string, type: "SUCCESS" | "ERROR" | "INFO" }>({
        visible: false,
        message: "",
        type: "INFO"
    })

    useEffect(() => {
        if (toast.visible) {
            const timer = setTimeout(() => {
                setToast(prev => ({ ...prev, visible: false }))
            }, 3000)
            return () => clearTimeout(timer)
        }
    }, [toast.visible])

    const showToast = (message: string, type: "SUCCESS" | "ERROR" | "INFO" = "INFO") => {
        setToast({ visible: true, message, type })
    }

    const handleEdit = (record: PurchaseRecord) => {
        setEditingRecord(record)
        setActiveTab("ENTRY")
    }

    const handleLogout = async () => {
        await logoutAction()
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header Title */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <ShoppingBag className="w-8 h-8 text-indigo-600" />
                        구매 관리 <span className="text-sm font-normal text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">프로젝트 필몽</span>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-[10px] font-black ml-2">
                            <Zap className="w-3 h-3" />
                            <span>LAB - 3001</span>
                        </div>
                    </h1>

                    <div className="flex items-center gap-2">
                        <a
                            href="/"
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 active:scale-95 transition-all mr-2"
                        >
                            <Home className="w-4 h-4" /> 필몽 허브
                        </a>

                        <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex overflow-x-auto">
                            {[
                                { id: "ENTRY", label: "구매 입력", icon: List },
                                { id: "HISTORY", label: "구매 내역", icon: History },
                                { id: "STATISTICS", label: "통계 대시보드", icon: PieChart },
                                { id: "VENDORS", label: "거래처 관리", icon: Users },
                                { id: "USERS", label: "사용자 관리", icon: Shield },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id as any)
                                        if (tab.id !== "ENTRY") setEditingRecord(null)
                                    }}
                                    className={`flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                        ? "bg-indigo-600 text-white shadow-md"
                                        : "text-slate-600 hover:bg-slate-50"
                                        }`}
                                    title={tab.label}
                                >
                                    <tab.icon className="w-4 h-4" /> <span className="hidden md:inline">{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleLogout}
                            className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                            title="로그아웃"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Tab Contents */}
                {activeTab === "ENTRY" && (
                    <PurchaseEntry
                        editingRecord={editingRecord}
                        onCancelEdit={() => { setEditingRecord(null); setActiveTab("HISTORY"); }}
                        onToast={showToast}
                    />
                )}
                {activeTab === "HISTORY" && (
                    <PurchaseHistory
                        onEdit={handleEdit}
                        onToast={showToast}
                    />
                )}
                {activeTab === "STATISTICS" && <PurchaseStats />}
                {activeTab === "VENDORS" && <VendorManagement onToast={showToast} />}
                {activeTab === "USERS" && <UserManagement onToast={showToast} />}

                {/* Toast Notification */}
                {toast.visible && (
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-4 fade-in duration-300">
                        <div className={`px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md ${toast.type === "SUCCESS" ? "bg-green-600/90 border-green-500 text-white" :
                            toast.type === "ERROR" ? "bg-red-600/90 border-red-500 text-white" :
                                "bg-slate-800/90 border-slate-700 text-white"
                            }`}>
                            {toast.type === "SUCCESS" ? <CheckCircle2 className="w-5 h-5 text-green-200" /> :
                                toast.type === "ERROR" ? <AlertCircle className="w-5 h-5 text-red-200" /> :
                                    <Info className="w-5 h-5 text-indigo-300" />}
                            <span className="font-medium">{toast.message}</span>
                            <button onClick={() => setToast(prev => ({ ...prev, visible: false }))} className="ml-2 hover:opacity-70">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}
