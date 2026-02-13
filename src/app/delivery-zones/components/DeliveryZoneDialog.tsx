"use client";

import { useState, useEffect } from "react";
import { upsertDeliveryZone, DeliveryZoneInput } from "../actions";
import { X, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface DeliveryZoneDialogProps {
    isOpen: boolean;
    onClose: () => void;
    zone?: any;
    onSuccess: () => void;
}

export default function DeliveryZoneDialog({ isOpen, onClose, zone, onSuccess }: DeliveryZoneDialogProps) {
    const [name, setName] = useState("");
    const [price, setPrice] = useState(0);
    const [areasInput, setAreasInput] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (zone) {
            setName(zone.name);
            setPrice(zone.price);
            setAreasInput(zone.areas.join(", "));
            setIsActive(zone.isActive);
        } else {
            setName("");
            setPrice(0);
            setAreasInput("");
            setIsActive(true);
        }
    }, [zone, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const areas = areasInput.split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        const input: DeliveryZoneInput = {
            name,
            price,
            areas,
            isActive
        };

        const res = await upsertDeliveryZone(zone?.id || null, input);
        setIsSaving(false);

        if (res.success) {
            toast.success(zone ? "수정되었습니다." : "추가되었습니다.");
            onSuccess();
            onClose();
        } else {
            toast.error(res.error || "실패했습니다.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />

            <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-black text-slate-800">
                            {zone ? "배달 구역 수정" : "새 배달 구역 추가"}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors group">
                        <X className="w-5 h-5 text-slate-400 group-hover:text-slate-900" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">구역 명칭</label>
                            <input
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 focus:bg-white px-6 py-4 rounded-2xl text-slate-900 font-bold outline-none transition-all placeholder:text-slate-300"
                                placeholder="예: A구역 (주간)"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">배달 요금 (원)</label>
                            <input
                                required
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(Number(e.target.value))}
                                className="w-full bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 focus:bg-white px-6 py-4 rounded-2xl text-slate-900 font-bold outline-none transition-all"
                                placeholder="0"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">매칭 키워드 (지역명)</label>
                            <textarea
                                value={areasInput}
                                onChange={(e) => setAreasInput(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 focus:bg-white px-6 py-4 rounded-2xl text-slate-900 font-bold outline-none transition-all placeholder:text-slate-300 min-h-[120px]"
                                placeholder="역삼동, 논현동, 삼성동 (콤마로 구분)"
                            />
                            <p className="text-[10px] text-slate-400 font-bold ml-1 uppercase tracking-tighter italic">
                                * 주소 파싱 시 자동으로 배달비를 설정하는 기준이 됩니다.
                            </p>
                        </div>

                        <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-2xl">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                />
                                <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                            <span className="text-sm font-black text-slate-600 uppercase tracking-widest">
                                {isActive ? "현재 사용 중" : "일시 정지"}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-8 py-5 rounded-2xl hover:bg-slate-50 text-slate-500 font-black text-sm uppercase tracking-widest transition-all border-2 border-transparent"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white px-8 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-2xl disabled:opacity-50"
                        >
                            <Save className="w-5 h-5" />
                            {isSaving ? "저장 중..." : "설정 저장하기"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
