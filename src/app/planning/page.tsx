import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import Link from "next/link";
import DatePicker from "@/components/DatePicker";

export default async function PlanningPage({
    searchParams
}: {
    searchParams: { date?: string }
}) {
    const { date } = await searchParams;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(targetDate);
    nextDay.setDate(targetDate.getDate() + 1);

    const plannedProducts = await prisma.product.findMany({
        where: {
            sellingDate: {
                gte: targetDate,
                lt: nextDay
            }
        },
        include: {
            lunchBoxConfig: true
        },
        orderBy: { type: 'asc' }
    });

    const dateStr = format(targetDate, "yyyy년 MM월 dd일 (EEEE)", { locale: ko });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                <div>
                    <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">메뉴 기획 대시보드</h2>
                    <p className="text-slate-500 mt-3 text-lg">기획된 메뉴를 검토하고 신규 일정을 관리하세요.</p>
                </div>

                <div className="flex items-center bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
                    <DatePicker defaultValue={targetDate.toISOString().split('T')[0]} />
                    <div className="h-6 w-px bg-slate-200 mx-2"></div>
                    <span className="text-slate-600 px-4 font-medium">{dateStr}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center">
                                <span className="w-2 h-6 bg-blue-500 rounded-full mr-3"></span>
                                일일 / 특별 메뉴
                            </h3>
                            <Link href={`/products/new?type=DAILY&date=${targetDate.toISOString().split('T')[0]}`} className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">
                                + 추가하기
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {plannedProducts.filter((p: any) => p.type !== 'LUNCH_BOX').length > 0 ? (
                                plannedProducts.filter((p: any) => p.type !== 'LUNCH_BOX').map((product: any) => (
                                    <div key={product.id} className="group flex items-center justify-between p-5 rounded-2xl bg-slate-50 border border-transparent hover:border-slate-200 hover:bg-white transition-all">
                                        <div>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${product.type === 'DAILY' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                                                {product.type}
                                            </span>
                                            <h4 className="text-lg font-bold text-slate-800 mt-1">{product.name}</h4>
                                            <p className="text-sm text-slate-400 mt-0.5">{product.plannedQuantity || 0}개 생산 예정</p>
                                        </div>
                                        <Link href={`/products/${product.id}/edit`} className="opacity-0 group-hover:opacity-100 btn-secondary py-2 px-4 text-sm scale-90 transition-all">
                                            수정
                                        </Link>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                    <p className="text-slate-400 font-medium">기획된 일반 메뉴가 없습니다.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Link href={`/work-orders/cooking?date=${targetDate.toISOString().split('T')[0]}`} className="group p-8 bg-slate-900 rounded-3xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200/50">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4 text-white text-2xl group-hover:scale-110 transition-transform">👨‍🍳</div>
                            <h4 className="text-xl font-bold text-white">조리 지시서</h4>
                            <p className="text-slate-400 text-sm mt-2">조리실 배포용 리스트 보기</p>
                        </Link>
                        <Link href={`/work-orders/portioning?date=${targetDate.toISOString().split('T')[0]}`} className="group p-8 bg-blue-600 rounded-3xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200/50">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4 text-white text-2xl group-hover:scale-110 transition-transform">🍱</div>
                            <h4 className="text-xl font-bold text-white">소분 지시서</h4>
                            <p className="text-blue-100 text-sm mt-2">소분팀 배포용 리스트 보기</p>
                        </Link>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm h-full">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center">
                                <span className="w-2 h-6 bg-orange-500 rounded-full mr-3"></span>
                                오늘의 도시락 기획
                            </h3>
                            <Link href={`/products/new?type=LUNCH_BOX&date=${targetDate.toISOString().split('T')[0]}`} className="btn-secondary py-1.5 px-3 text-xs">
                                + 신규
                            </Link>
                        </div>

                        <div className="space-y-6">
                            {plannedProducts.filter((p: any) => p.type === 'LUNCH_BOX').length > 0 ? (
                                plannedProducts.filter((p: any) => p.type === 'LUNCH_BOX').map((lunch: any) => (
                                    <div key={lunch.id} className="border-2 border-slate-100 rounded-2xl overflow-hidden p-6 bg-white hover:border-orange-200 transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <h4 className="text-lg font-bold text-slate-800">{lunch.name}</h4>
                                            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md">
                                                {lunch.plannedQuantity || 0} sets
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 mt-4">
                                            {['A', 'B', 'C', 'D', 'E', 'F'].map(slot => (
                                                <div key={slot} className="bg-slate-50 p-2 rounded-lg text-center">
                                                    <span className="block text-[8px] font-bold text-slate-400 uppercase">{slot}칸</span>
                                                    <span className="text-[10px] font-medium text-slate-600 truncate block">
                                                        {(lunch as any).lunchBoxConfig?.[`slot${slot}`] || "-"}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        <Link href={`/products/${lunch.id}/edit`} className="mt-6 w-full btn-secondary text-sm py-2">
                                            구성 수정하기
                                        </Link>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                    <p className="text-slate-400 font-medium">오늘 기획된<br />도시락이 없습니다.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
