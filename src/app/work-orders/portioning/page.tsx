import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import PrintButton from "@/components/PrintButton";

export default async function PortioningWorkOrderPage({
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
            workDivision: {
                in: ['IMMEDIATE_SUB_PORTIONING', 'PROCESSING'] as any[]
            }
        },
        orderBy: { name: 'asc' }
    });

    const dateStr = format(targetDate, "yyyy년 MM월 dd일 (EEEE)", { locale: ko });

    return (
        <div className="max-w-4xl mx-auto p-12 bg-white min-h-screen">
            <div className="border-4 border-blue-600 p-8 shadow-[20px_20px_0px_0px_rgba(37,99,235,0.1)]">
                <div className="flex justify-between items-end border-b-4 border-blue-600 pb-6 mb-8">
                    <div>
                        <h1 className="text-5xl font-black text-blue-600 tracking-tighter">소분 / 포장 지시서</h1>
                        <p className="text-xl font-bold text-slate-400 mt-2 uppercase tracking-widest">Portioning & Packing Order</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-bold text-slate-400 mb-1">작업 일자</p>
                        <p className="text-2xl font-black text-blue-600 underline decoration-4 underline-offset-4">{dateStr}</p>
                    </div>
                </div>

                <div className="mb-8 p-4 bg-blue-50 border-l-8 border-blue-600 text-blue-800 font-bold">
                    ⚠️ 주의: 소분 전 반드시 위생 장갑과 마스크를 착용하고, 용기의 청결 상태를 재확인하십시오.
                </div>

                <table className="w-full border-collapse mb-12">
                    <thead>
                        <tr className="bg-blue-600 text-white text-lg">
                            <th className="border-2 border-blue-600 p-4 text-left w-1/2">품목명 (Item Name)</th>
                            <th className="border-2 border-blue-600 p-4 text-center">작업 구분</th>
                            <th className="border-2 border-blue-600 p-4 text-center">수량 (Qty)</th>
                        </tr>
                    </thead>
                    <tbody className="text-xl font-bold">
                        {plannedProducts.length > 0 ? (
                            plannedProducts.map((p: any, idx: number) => (
                                <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'}>
                                    <td className="border-2 border-blue-600 p-5">{p.name}</td>
                                    <td className="border-2 border-blue-600 p-5 text-center text-sm">
                                        <span className={`px-3 py-1 rounded-full ${p.workDivision === 'PROCESSING' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {p.workDivision === 'PROCESSING' ? '가공 후 소분' : '즉시 소분'}
                                        </span>
                                    </td>
                                    <td className="border-2 border-blue-600 p-5 text-center text-4xl font-black text-blue-700">
                                        {p.plannedQuantity || "-"}
                                        <span className="text-lg ml-2 font-normal text-slate-400 font-sans">EA</span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={3} className="border-2 border-blue-600 p-20 text-center text-slate-300">
                                    해당 날짜에 기획된 소분 품목이 없습니다.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <div className="grid grid-cols-1 gap-8 mt-12">
                    <div className="border-2 border-slate-100 p-8 rounded-2xl bg-slate-50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-200/20 rounded-bl-full"></div>
                        <h4 className="font-black text-slate-900 mb-6 flex items-center">
                            <span className="w-1.5 h-4 bg-blue-600 mr-2 rounded-full"></span>
                            소분 및 포장 특이사항
                        </h4>
                        <div className="space-y-4">
                            <div className="flex items-center text-slate-500 font-medium">
                                <div className="w-2 h-2 rounded-full bg-slate-300 mr-3"></div>
                                ____________________________________________________________________
                            </div>
                            <div className="flex items-center text-slate-500 font-medium">
                                <div className="w-2 h-2 rounded-full bg-slate-300 mr-3"></div>
                                ____________________________________________________________________
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-16 flex justify-between items-center px-4">
                    <div className="text-slate-300 font-bold italic tracking-tighter text-2xl">PHILMONG PORTIONING DEPT.</div>
                    <div className="flex space-x-12">
                        <div className="text-center">
                            <p className="text-[10px] text-slate-400 font-bold mb-4 uppercase">Prepared by</p>
                            <div className="w-20 h-1 my-2 bg-slate-100"></div>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] text-slate-400 font-bold mb-4 uppercase">Verified by</p>
                            <div className="w-20 h-1 my-2 bg-slate-100"></div>
                        </div>
                    </div>
                </div>
            </div>

            <PrintButton />
        </div>
    );
}
