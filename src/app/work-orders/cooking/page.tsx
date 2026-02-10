import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import PrintButton from "@/components/PrintButton";

export default async function CookingWorkOrderPage({
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
            },
            workDivision: 'COOKING'
        },
        orderBy: { name: 'asc' }
    });

    const dateStr = format(targetDate, "yyyy년 MM월 dd일 (EEEE)", { locale: ko });

    return (
        <div className="max-w-4xl mx-auto p-12 bg-white min-h-screen">
            <div className="border-4 border-slate-900 p-8">
                <div className="flex justify-between items-end border-b-4 border-slate-900 pb-6 mb-8">
                    <div>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter">조리 작업 지시서</h1>
                        <p className="text-xl font-bold text-slate-500 mt-2 uppercase tracking-widest">Cooking Production Order</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-bold text-slate-400 mb-1">작업 일자</p>
                        <p className="text-2xl font-black text-slate-900 underline decoration-4 underline-offset-4">{dateStr}</p>
                    </div>
                </div>

                <table className="w-full border-collapse mb-12">
                    <thead>
                        <tr className="bg-slate-900 text-white text-lg">
                            <th className="border-2 border-slate-900 p-4 text-left w-2/3">품목명 (Item Name)</th>
                            <th className="border-2 border-slate-900 p-4 text-center w-1/3">계획 수량 (Qty)</th>
                        </tr>
                    </thead>
                    <tbody className="text-2xl font-bold">
                        {plannedProducts.length > 0 ? (
                            plannedProducts.map((p: any, idx: number) => (
                                <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                    <td className="border-2 border-slate-900 p-6">{p.name}</td>
                                    <td className="border-2 border-slate-900 p-6 text-center text-4xl font-black">
                                        {p.plannedQuantity || "-"}
                                        <span className="text-lg ml-2 font-normal text-slate-500">EA / SET</span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={2} className="border-2 border-slate-900 p-20 text-center text-slate-300">
                                    해당 날짜에 기획된 조리 품목이 없습니다.
                                </td>
                            </tr>
                        )}
                        {[...Array(3)].map((_, i) => (
                            <tr key={`extra-${i}`}>
                                <td className="border-2 border-slate-900 p-8"></td>
                                <td className="border-2 border-slate-900 p-8"></td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="grid grid-cols-2 gap-8 mt-12">
                    <div className="border-2 border-slate-200 p-6 rounded-xl">
                        <h4 className="font-bold text-slate-400 mb-4 uppercase text-xs tracking-widest">전달 사항 (Internal Note)</h4>
                        <div className="h-32 border-b border-slate-100"></div>
                        <div className="h-32 border-b border-slate-100"></div>
                    </div>
                    <div className="border-2 border-slate-900 p-6 rounded-xl flex flex-col justify-between">
                        <div>
                            <h4 className="font-bold text-slate-900 mb-2 uppercase text-xs tracking-widest">최종 확인 (Approval)</h4>
                            <p className="text-slate-400 text-[10px]">위 품목에 대한 조리가 정상적으로 완료되었음을 확인합니다.</p>
                        </div>
                        <div className="flex justify-between items-end border-t-2 border-slate-100 pt-6">
                            <span className="text-sm font-bold text-slate-300">Sign Here ✍️</span>
                            <div className="w-24 h-24 border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-200 font-bold bg-slate-50 rounded-full">인</div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-[10px] text-slate-300 font-medium tracking-tight">COPYRIGHT (C) PHILMONG FOOD SYSTEM. ALL RIGHTS RESERVED.</p>
                </div>
            </div>

            <PrintButton />
        </div>
    );
}
