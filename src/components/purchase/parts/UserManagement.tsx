"use client"

import React, { useState, useEffect } from "react"
import { Users, UserPlus, Key, Trash2, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { getAccounts, createAccount, deleteAccount, updateAccountPassword, resetAllData } from "@/lib/purchase/actions"
import { Account } from "@/lib/purchase/types"

interface Props {
    onToast: (msg: string, type: "SUCCESS" | "ERROR") => void
}

export default function UserManagement({ onToast }: Props) {
    const [accounts, setAccounts] = useState<Account[]>([])
    const [loading, setLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isResetting, setIsResetting] = useState(false)

    // Form State
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [name, setName] = useState("")

    useEffect(() => {
        loadAccounts()
    }, [])

    const loadAccounts = async () => {
        setLoading(true)
        const res = await getAccounts()
        if (res.success && res.data) {
            setAccounts(res.data)
        }
        setLoading(false)
    }

    const handleCreate = async () => {
        if (!username || !password) return
        setIsSaving(true)
        const res = await createAccount({ username, password, name })
        if (res.success) {
            onToast("계정이 생성되었습니다.", "SUCCESS")
            setUsername("")
            setPassword("")
            setName("")
            loadAccounts()
        } else {
            onToast(res.error || "생성 실패", "ERROR")
        }
        setIsSaving(false)
    }

    const handleDelete = async (id: string, uname: string) => {
        if (uname === 'admin') {
            onToast("관리자 계정은 삭제할 수 없습니다.", "ERROR")
            return
        }
        if (!confirm(`'${uname}' 계정을 삭제하시겠습니까?`)) return
        const res = await deleteAccount(id)
        if (res.success) {
            onToast("계정이 삭제되었습니다.", "SUCCESS")
            loadAccounts()
        }
    }

    const handleUpdatePassword = async (id: string, uname: string) => {
        const newPass = prompt(`'${uname}'의 새 비밀번호를 입력해주세요.`)
        if (!newPass) return
        const res = await updateAccountPassword(id, newPass)
        if (res.success) {
            onToast("비밀번호가 변경되었습니다.", "SUCCESS")
        }
    }

    const handleReset = async () => {
        if (!confirm("모든 구매 내역과 거래처 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return
        if (!confirm("정말 초기화하시겠습니까? (2차 확인)")) return

        setIsResetting(true)
        const res = await resetAllData()
        if (res.success) {
            onToast("모든 데이터가 초기화되었습니다.", "SUCCESS")
        } else {
            onToast("초기화 실패", "ERROR")
        }
        setIsResetting(false)
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Left: Add User */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
                <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-indigo-600" /> 사용자 추가
                </h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">아이디</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="사용할 아이디"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">비밀번호</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="비밀번호"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">이름 (선택)</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="직원 이름"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <button
                        onClick={handleCreate}
                        disabled={isSaving}
                        className="w-full mt-2 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex justify-center items-center"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "계정 생성하기"}
                    </button>
                </div>
            </div>

            {/* Middle: User List */}
            <div className="md:col-span-1 space-y-4">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                    <div className="bg-indigo-100 p-1.5 rounded-lg">
                        <Users className="w-4 h-4 text-indigo-600" />
                    </div>
                    등록된 사용자
                </h2>
                {loading ? (
                    <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
                ) : (
                    <div className="space-y-3">
                        {accounts.map((acc) => (
                            <div key={acc.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center group hover:border-indigo-200 transition-all">
                                <div>
                                    <div className="font-bold text-slate-800">{acc.username}</div>
                                    <div className="text-xs text-slate-500">{acc.name || "이름 없음"}</div>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleUpdatePassword(acc.id, acc.username)}
                                        className="p-2 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                                        title="비밀번호 변경"
                                    >
                                        <Key className="w-4 h-4" />
                                    </button>
                                    {acc.username !== 'admin' && (
                                        <button
                                            onClick={() => handleDelete(acc.id, acc.username)}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="계정 삭제"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Right: Security/Reset */}
            <div className="md:col-span-1 space-y-4">
                <div className="bg-red-50 p-6 rounded-xl border border-red-100 shadow-sm">
                    <h2 className="font-bold text-red-700 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" /> 데이터 초기화
                    </h2>
                    <p className="text-xs text-red-600 mb-4 leading-relaxed">
                        구매 내역과 거래처 정보를 포함한<br />
                        <strong>모든 데이터를 영구적으로 삭제</strong>합니다.
                    </p>
                    <button
                        onClick={handleReset}
                        disabled={isResetting}
                        className="w-full bg-white border border-red-200 text-red-600 py-2.5 rounded-lg font-bold hover:bg-red-600 hover:text-white transition-all shadow-sm text-sm flex justify-center items-center gap-2"
                    >
                        {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        전체 데이터 삭제
                    </button>
                </div>
            </div>
        </div>
    )
}
