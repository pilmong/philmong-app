import { getDeliveryZones } from "./actions";
import DeliveryZoneList from "./components/DeliveryZoneList";
import { Truck, Sparkles, MapPin } from "lucide-react";
import Link from "next/link";

export default async function DeliveryZonesPage() {
    const { success, data: zones } = await getDeliveryZones();

    if (!success || !zones) {
        return <div className="p-12 text-center text-slate-500">배달 구역 정보를 불러올 수 없습니다.</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-indigo-600 p-2 rounded-2xl shadow-lg shadow-indigo-100">
                            <Truck className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">배달 구역 통합 관리 🚚</h1>
                    </div>
                    <p className="text-slate-500 font-bold ml-1">
                        필몽 스토어와 <span className="text-indigo-600">실시간으로 공유</span>되는 공식 배달 정책입니다.
                    </p>
                </div>
                <div className="bg-white px-6 py-3 rounded-2xl border-2 border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-sm font-black text-slate-600 uppercase tracking-widest">Shared Database Synced</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                <div className="bg-white rounded-[2.5rem] border-4 border-white shadow-2xl shadow-slate-200 overflow-hidden">
                    <div className="p-8 border-b border-slate-50 bg-slate-50/50">
                        <div className="flex items-center gap-2 text-slate-400 font-black uppercase tracking-widest text-xs">
                            <MapPin className="w-3.5 h-3.5" />
                            Active Delivery Policy
                        </div>
                    </div>
                    <div className="p-8">
                        <DeliveryZoneList initialZones={zones} />
                    </div>
                </div>
            </div>
        </div>
    );
}
