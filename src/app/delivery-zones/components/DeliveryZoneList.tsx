"use client";

import { useState } from "react";
import { Plus, Trash2, Edit2, CheckCircle2, XCircle } from "lucide-react";
import DeliveryZoneDialog from "./DeliveryZoneDialog";
import { deleteDeliveryZone } from "../actions";
import { toast } from "sonner";

interface DeliveryZoneListProps {
    initialZones: any[];
}

export default function DeliveryZoneList({ initialZones }: DeliveryZoneListProps) {
    const [zones, setZones] = useState(initialZones);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedZone, setSelectedZone] = useState<any>(null);

    const handleEdit = (zone: any) => {
        setSelectedZone(zone);
        setIsDialogOpen(true);
    };

    const handleAdd = () => {
        setSelectedZone(null);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("정말 삭제하시겠습니까? 필몽 스토어에서도 삭제됩니다.")) return;
        const res = await deleteDeliveryZone(id);
        if (res.success) {
            setZones(zones.filter(z => z.id !== id));
            toast.success("삭제되었습니다.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-sm transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-indigo-100"
                >
                    <Plus className="w-5 h-5" />
                    새 배달 구역 추가
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {zones.map((zone) => (
                    <div
                        key={zone.id}
                        className={`group bg-white rounded-3xl border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${zone.isActive ? 'border-slate-100' : 'border-slate-50 opacity-60'
                            }`}
                    >
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 mb-2">{zone.name}</h3>
                                    <div className="flex items-center gap-2">
                                        {zone.isActive ? (
                                            <span className="flex items-center gap-1 text-xs font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">
                                                <CheckCircle2 className="w-3 h-3" /> Active
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-xs font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase tracking-widest">
                                                <XCircle className="w-3 h-3" /> Inactive
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-3xl font-black text-indigo-600">
                                    {zone.price.toLocaleString()}원
                                </div>
                            </div>

                            <div className="mb-8">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">Matching Keywords</label>
                                <div className="flex flex-wrap gap-2">
                                    {zone.areas.map((area: string, idx: number) => (
                                        <span key={idx} className="bg-slate-100 text-slate-600 px-4 py-1.5 rounded-xl text-xs font-bold border border-slate-200 shadow-sm">
                                            {area}
                                        </span>
                                    ))}
                                    {zone.areas.length === 0 && (
                                        <span className="text-slate-300 text-xs italic">등록된 키워드가 없습니다.</span>
                                    )}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-50 flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleEdit(zone)}
                                    className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all"
                                >
                                    <Edit2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(zone.id)}
                                    className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <DeliveryZoneDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                zone={selectedZone}
                onSuccess={() => window.location.reload()}
            />
        </div>
    );
}
