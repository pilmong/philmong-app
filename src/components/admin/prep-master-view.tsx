'use client';

import { useState, useEffect } from 'react';
import { getDailyPrepWorkload } from '@/actions/prep';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChefHat, Package, CheckCircle2, AlertCircle, Calendar, RefreshCcw, ClipboardCheck, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function PrepMasterView() {
    const [date, setDate] = useState(new Date());
    const [prepItems, setPrepItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [date]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getDailyPrepWorkload(date);
            setPrepItems(data);
        } finally {
            setLoading(false);
        }
    };

    const cookingItems = prepItems.filter(i => i.workType === 'COOKING');
    const subdivisionItems = prepItems.filter(i => i.workType !== 'COOKING');

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-3 italic">
                        <ClipboardCheck className="w-10 h-10 text-blue-600" /> PREP MASTER
                    </h1>
                    <p className="text-slate-500 font-bold mt-1">오늘 아침의 전투력을 디지털로 집결하세요. (통합 조리 지시서)</p>
                </div>
                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border-2 border-slate-100 shadow-sm">
                    <button
                        onClick={() => setDate(new Date(date.setDate(date.getDate() - 1)))}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors font-black"
                    >이전</button>
                    <div className="px-6 py-2 bg-slate-900 text-white rounded-xl font-black text-sm flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        {format(date, 'MM월 dd일 (EEE)', { locale: ko })}
                    </div>
                    <button
                        onClick={() => setDate(new Date(date.setDate(date.getDate() + 1)))}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors font-black"
                    >다음</button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <RefreshCcw className="w-10 h-10 animate-spin mb-4" />
                    <p className="font-black italic">주문 데이터를 정밀 합산 중입니다...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Cooking Strategy (조리 파트) */}
                    <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="bg-orange-600 text-white p-8">
                            <div className="flex items-center gap-3">
                                <ChefHat className="w-8 h-8" />
                                <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Production: Cooking</CardTitle>
                            </div>
                            <CardDescription className="text-orange-100 font-bold opacity-80 mt-1">
                                메인 주방에서 불을 써서 조리해야 할 품목들입니다.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {cookingItems.length > 0 ? cookingItems.map((item, i) => (
                                    <div key={i} className="p-6 flex items-center justify-between hover:bg-orange-50/30 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center font-black text-xl italic">{i + 1}</div>
                                            <div>
                                                <div className="font-black text-lg text-slate-900">{item.name}</div>
                                                <div className="flex gap-2 mt-1">
                                                    {item.reservations > 0 && <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-black">예약 {item.reservations}</span>}
                                                    {item.lunch > 0 && <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-black">런치 {item.lunch}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-3xl font-black text-slate-900 tracking-tighter">
                                                {item.totalQty}<span className="text-sm ml-1 font-bold text-slate-400">개/팩</span>
                                            </div>
                                            <div className="text-[10px] text-emerald-600 font-black flex items-center justify-end gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> READY TO COOK
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-20 text-center text-slate-400 italic">오늘 예정된 조리 품목이 없습니다.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Subdivision Strategy (소분/포장/기타) */}
                    <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="bg-blue-600 text-white p-8">
                            <div className="flex items-center gap-3">
                                <Package className="w-8 h-8" />
                                <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Production: Packing</CardTitle>
                            </div>
                            <CardDescription className="text-blue-100 font-bold opacity-80 mt-1">
                                샐러드, 소분, 또는 단순 포장이 필요한 품목들입니다.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {subdivisionItems.length > 0 ? subdivisionItems.map((item, i) => (
                                    <div key={i} className="p-6 flex items-center justify-between hover:bg-blue-50/30 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-black text-xl italic">{i + 1}</div>
                                            <div>
                                                <div className="font-black text-lg text-slate-900">{item.name}</div>
                                                <div className="flex gap-2 mt-1">
                                                    {item.reservations > 0 && <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-black">예약 {item.reservations}</span>}
                                                    {item.lunch > 0 && <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-black">런치 {item.lunch}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-3xl font-black text-slate-900 tracking-tighter">
                                                {item.totalQty}<span className="text-sm ml-1 font-bold text-slate-400">개/팩</span>
                                            </div>
                                            <div className="text-[10px] text-blue-600 font-black flex items-center justify-end gap-1 uppercase tracking-wider">
                                                Prep Pending
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-20 text-center text-slate-400 italic">오늘 무언가를 소분하거나 포장할 리스트가 비어있습니다.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Practical Tip Card */}
            <Card className="border-none shadow-sm bg-blue-50 dark:bg-slate-900 border-l-4 border-l-blue-500 rounded-3xl">
                <CardContent className="p-8 flex items-start gap-6">
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
                        <AlertCircle className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                        <h4 className="text-lg font-black text-slate-900 dark:text-white mb-1 italic">PRO TIP: 사장님을 위한 아침 지휘 가이드</h4>
                        <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">
                            우선순위 리스트는 **[네이버 예약 + 런치 주문]**을 실시간 합산한 결과입니다.
                            주방 팀에는 왼쪽의 주황색 리스트를, 포장 팀에는 오른쪽의 파란색 리스트를 즉시 공유하여 홀 오픈 전까지 생산을 완료할 수 있도록 독려하세요.
                            포스(오프라인) 판매량은 이 합계에 포함되지 않으므로, 진열대에 놓을 추가 생산량은 사장님의 직관을 더해 주방에 지시해 주세요!
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
