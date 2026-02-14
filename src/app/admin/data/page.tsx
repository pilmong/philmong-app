'use client'

import { useState } from 'react'
import { getDatabaseBackup, restoreDatabase } from './actions'
import { Download, Upload, ShieldCheck, AlertTriangle, FileUp, CheckCircle2, ServerCrash, Database } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function DataManagementPage() {
    const [loading, setLoading] = useState(false)
    const [restoring, setRestoring] = useState(false)

    const handleBackup = async () => {
        setLoading(true)
        try {
            const res = await getDatabaseBackup()
            if (res.success && res.data) {
                const jsonString = JSON.stringify(res.data, null, 2)
                const blob = new Blob([jsonString], { type: "application/json" })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `philmong-backup-${new Date().toISOString().slice(0, 10)}.json`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
                toast.success("백업 파일이 다운로드되었습니다.")
            } else {
                toast.error("백업 실패: " + res.error)
            }
        } catch (e) {
            toast.error("백업 중 오류가 발생했습니다.")
        } finally {
            setLoading(false)
        }
    }

    const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!confirm("⚠️ 정말로 복원하시겠습니까?\n\n기존 데이터 중 ID가 중복되는 항목은 덮어씌워지며, 이 작업은 되돌릴 수 없습니다.\n먼저 현재 데이터를 백업하시는 것을 권장합니다.")) {
            e.target.value = "" // Reset input
            return
        }

        setRestoring(true)
        const reader = new FileReader()
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target?.result as string)
                const res = await restoreDatabase(json)
                if (res.success) {
                    toast.success(res.message)
                } else {
                    toast.error("복원 실패: " + res.error)
                }
            } catch (err) {
                console.error(err)
                toast.error("파일 형식이 올바르지 않거나 손상되었습니다.")
            } finally {
                setRestoring(false)
                if (e.target) e.target.value = ""
            }
        }
        reader.readAsText(file)
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 p-6 md:p-12">
            <div className="max-w-5xl mx-auto space-y-12">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black mb-4 uppercase tracking-tighter">
                            <Database className="w-3 h-3" />
                            <span>System Administration</span>
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tight mb-2">데이터 관리 센터</h1>
                        <p className="text-slate-400 text-lg">데이터베이스 백업 및 복구 작업을 수행합니다.</p>
                    </div>
                    <Link href="/" className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-bold transition-colors border border-white/5">
                        허브로 돌아가기
                    </Link>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Backup Section */}
                    <div className="bg-gradient-to-br from-indigo-900/20 to-slate-900 rounded-[2.5rem] border border-indigo-500/20 p-8 overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-700">
                            <ShieldCheck className="w-40 h-40 text-indigo-500" />
                        </div>

                        <div className="relative z-10 space-y-6">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                                <Download className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">데이터 백업 (Backup)</h2>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    현재 시스템의 모든 데이터를 JSON 형식으로 내려받습니다.<br />
                                    정기적인 백업은 데이터 손실을 방지하는 가장 좋은 방법입니다.
                                </p>
                            </div>

                            <button
                                onClick={handleBackup}
                                disabled={loading}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-900/50 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <span className="animate-pulse">데이터 추출 중...</span>
                                ) : (
                                    <>
                                        <Download className="w-5 h-5" />
                                        <span>백업 파일 다운로드</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Restore Section */}
                    <div className="bg-gradient-to-br from-rose-900/20 to-slate-900 rounded-[2.5rem] border border-rose-500/20 p-8 overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-700">
                            <ServerCrash className="w-40 h-40 text-rose-500" />
                        </div>

                        <div className="relative z-10 space-y-6">
                            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-400 mb-4 shadow-[0_0_30px_rgba(244,63,94,0.2)]">
                                <Upload className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">데이터 복원 (Restore)</h2>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    백업된 JSON 파일을 업로드하여 데이터를 복구합니다.<br />
                                    <span className="text-rose-400 font-bold">주의: ID가 일치하는 데이터는 덮어씌워집니다.</span>
                                </p>
                            </div>

                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleRestore}
                                    disabled={restoring}
                                    id="restore-input"
                                    className="hidden"
                                />
                                <label
                                    htmlFor="restore-input"
                                    className={`w-full py-4 border-2 border-dashed border-rose-500/30 hover:border-rose-500 hover:bg-rose-500/10 rounded-2xl font-bold text-lg text-rose-400 transition-all cursor-pointer flex items-center justify-center gap-3 ${restoring ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {restoring ? (
                                        <span className="animate-pulse">복원 진행 중... (시간이 걸릴 수 있습니다)</span>
                                    ) : (
                                        <>
                                            <FileUp className="w-5 h-5" />
                                            <span>백업 파일 업로드하여 복원</span>
                                        </>
                                    )}
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800/50 rounded-3xl p-8 border border-slate-700">
                    <h3 className="text-xl font-bold text-white flex items-center gap-3 mb-4">
                        <AlertTriangle className="w-6 h-6 text-amber-500" />
                        <span>데이터 복원 시 주의사항</span>
                    </h3>
                    <ul className="space-y-3 text-slate-400 text-sm pl-2">
                        <li className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                            <span>
                                복원 기능은 <b>Overwrite(덮어쓰기)</b> 및 <b>Create(생성)</b> 방식으로 동작합니다.
                                이미 존재하는 데이터(ID 기준)는 백업 파일의 내용으로 변경되며, 없는 데이터는 새로 생성됩니다.
                            </span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                            <span>
                                백업 파일에 포함되지 않은 기존 데이터는 삭제되지 않고 <b>그대로 유지</b>됩니다.
                                (데이터베이스 초기화 후 복원을 원하시면 먼저 초기화를 진행해야 합니다.)
                            </span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                            <span>
                                대량의 데이터를 복원할 경우 시간이 소요될 수 있으며, 네트워크 연결을 유지해주세요.
                            </span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
