"use client";

import { useState } from "react";
import { updateDeadlineHour } from "@/app/clients/order-actions";
import { Clock, Check, AlertCircle } from "lucide-react";

export default function DeadlineSetting({ initialHour }: { initialHour: number }) {
    const [hour, setHour] = useState(initialHour);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);
        const result = await updateDeadlineHour(hour);
        if (result.success) {
            setMessage({ type: 'success', text: "마감 시간이 업데이트되었습니다." });
            setTimeout(() => setMessage(null), 3000);
        } else {
            setMessage({ type: 'error', text: "저장 실패" });
        }
        setIsSaving(false);
    };

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 mb-8 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-slate-900 font-black text-lg">발주 마감 설정</h3>
                        <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-tighter">B2B 고객사 대상</span>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">B2B 고객사의 익일 배송분에 대한 발주 마감 시간을 설정합니다. (현재: 오후 {initialHour}시)</p>
                </div>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="flex bg-slate-100 p-1.5 rounded-2xl flex-1 md:flex-none">
                    <input
                        type="number"
                        min="0"
                        max="23"
                        value={hour}
                        onChange={(e) => setHour(parseInt(e.target.value) || 0)}
                        className="w-20 bg-white border-none text-center font-black text-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="flex items-center px-4 font-black text-slate-400">시</span>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap"
                >
                    {isSaving ? "저장 중..." : "설정 저장"}
                </button>
            </div>

            {message && (
                <div className={`fixed bottom-8 right-8 animate-in slide-in-from-right-4 fade-in duration-300 ${message.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'} text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-[100]`}>
                    {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span className="font-bold text-sm">{message.text}</span>
                </div>
            )}
        </div>
    );
}
