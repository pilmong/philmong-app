'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getLunchInvoiceData } from '@/actions/lunch';
import { getSystemSettings } from '@/actions/settings';
import { Button } from '@/components/ui/button';
import { Printer, ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';

export function InvoiceView({ clientId }: { clientId: string }) {
    const searchParams = useSearchParams();
    const startStr = searchParams.get('start');
    const endStr = searchParams.get('end');

    const [data, setData] = useState<any>(null);
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (startStr && endStr) {
            loadData();
        }
    }, [clientId, startStr, endStr]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [invoiceResult, settingsResult] = await Promise.all([
                getLunchInvoiceData(clientId, new Date(startStr!), new Date(endStr!)),
                getSystemSettings()
            ]);
            setData(invoiceResult);
            setSettings(settingsResult);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="text-center py-20">명세 정보를 불러오는 중...</div>;
    if (!data) return <div className="text-center py-20 text-red-500">데이터를 찾을 수 없습니다.</div>;

    const { client, orders, summary } = data;
    const companyName = settings?.companyName || '필몽';
    const bankInfo = settings?.bankInfo || '국민은행 123-456-7890123 (필몽)';

    return (
        <div className="space-y-6 max-w-4xl mx-auto px-4 sm:px-0">
            {/* Top Controls - Hidden during print */}
            <div className="flex items-center justify-between print:hidden">
                <Link href="/admin/lunch/settlement">
                    <Button variant="ghost" className="gap-2">
                        <ChevronLeft className="h-4 w-4" /> 목록으로
                    </Button>
                </Link>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2" onClick={handlePrint}>
                        <Printer className="h-4 w-4" /> 인쇄하기 (A4)
                    </Button>
                </div>
            </div>

            {/* Invoice Container - A4 Paper Feel */}
            <div className="bg-white p-10 shadow-lg min-h-[1000px] border dark:text-black print:shadow-none print:border-none print:p-0">
                {/* Header */}
                <div className="border-b-4 border-black pb-6 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter mb-1 uppercase">Delivery Invoice</h1>
                        <p className="text-slate-500 text-sm font-bold">납품 명세서 (Lunch Management System)</p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold uppercase">{companyName}</div>
                        <div className="text-xs text-slate-500">Premium Lunch Catering Service</div>
                    </div>
                </div>

                {/* Info Section */}
                <div className="grid grid-cols-2 gap-10 mt-10">
                    <div className="space-y-4">
                        <h3 className="font-black text-xs uppercase text-slate-400">Bill To (공급받는 자)</h3>
                        <div className="space-y-1">
                            <div className="text-xl font-black">{client.name}</div>
                            <div className="text-sm">{client.address || '주소 정보 없음'}</div>
                            <div className="text-sm font-medium">{client.contactName} {client.contactNumber}</div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-black text-xs uppercase text-slate-400">Statement Info (발행 정보)</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="font-bold">발행번호</div>
                            <div>INV-{format(new Date(), 'yyyyMMdd')}-{client.id.slice(0, 4).toUpperCase()}</div>
                            <div className="font-bold">발행일자</div>
                            <div>{format(new Date(), 'yyyy년 MM월 dd일')}</div>
                            <div className="font-bold">청구기간</div>
                            <div className="font-black">{format(new Date(startStr!), 'MM/dd')} ~ {format(new Date(endStr!), 'MM/dd')}</div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="mt-12">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-y border-slate-200">
                                <th className="py-3 px-2 text-xs font-black uppercase text-slate-500">날짜 (Date)</th>
                                <th className="py-3 px-2 text-xs font-black uppercase text-slate-500">품목/메뉴 (Description)</th>
                                <th className="py-3 px-2 text-xs font-black uppercase text-slate-500 text-right">단가 (Price)</th>
                                <th className="py-3 px-2 text-xs font-black uppercase text-slate-500 text-right">수량 (Qty)</th>
                                <th className="py-3 px-2 text-xs font-black uppercase text-slate-500 text-right">금액 (Amount)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order: any, idx: number) => (
                                <tr key={order.id} className="border-b border-slate-100">
                                    <td className="py-4 px-2 text-sm font-bold">
                                        {format(new Date(order.date), 'MM.dd(EEE)', { locale: ko })}
                                    </td>
                                    <td className="py-4 px-2">
                                        <div className="text-sm font-bold">도시락 & 샐러드 납품</div>
                                        <div className="text-[10px] text-slate-400">{order.menu?.main || '일반 메뉴'}</div>
                                    </td>
                                    <td className="py-4 px-2 text-right">
                                        <div className="text-xs text-slate-400 leading-tight">🍱 ₩{client.lunchboxPrice.toLocaleString()}</div>
                                        <div className="text-xs text-slate-400 leading-tight">🥗 ₩{client.saladPrice.toLocaleString()}</div>
                                    </td>
                                    <td className="py-4 px-2 text-right">
                                        <div className="text-sm font-bold leading-tight">{order.lunchboxCount}개</div>
                                        <div className="text-sm font-bold leading-tight">{order.saladCount}개</div>
                                    </td>
                                    <td className="py-4 px-2 text-right font-bold text-sm">
                                        ₩{((order.lunchboxCount * client.lunchboxPrice) + (order.saladCount * client.saladPrice)).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Summary */}
                <div className="mt-8 flex justify-end">
                    <div className="w-64 space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">총 수량 합계</span>
                            <span className="font-bold">{summary.totalLunchbox + summary.totalSalad}개</span>
                        </div>
                        <div className="border-t-2 border-slate-900 pt-2 flex justify-between items-center">
                            <span className="text-sm font-black uppercase">Total (최종 청구액)</span>
                            <span className="text-2xl font-black">₩{summary.totalAmount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-20 pt-10 border-t border-slate-100 grid grid-cols-2 gap-10 items-start">
                    <div className="space-y-4">
                        <h3 className="font-black text-xs uppercase text-slate-400">Payment Details (입금 정보)</h3>
                        <div className="space-y-1 text-sm bg-slate-50 p-4 rounded-lg border border-dashed border-slate-200">
                            <div className="flex flex-col gap-1">
                                <span className="font-bold text-slate-400 text-[9px] uppercase tracking-wider">Account Info</span>
                                <span className="font-black text-blue-900 break-words">{bankInfo}</span>
                            </div>
                            {settings?.companyRegNo && (
                                <div className="flex flex-col gap-1 mt-3 pt-3 border-t border-slate-200">
                                    <span className="font-bold text-slate-400 text-[9px] uppercase tracking-wider">Business Registration</span>
                                    <span className="font-medium text-xs text-slate-600">{settings.companyRegNo}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Enhanced Stamp Design */}
                    <div className="flex flex-col items-center">
                        <div className="text-[9px] font-black uppercase text-slate-300 mb-3 tracking-[0.2em]">Official Authorization</div>
                        <div className="relative group">
                            {/* Outer Glow/Shadow for Depth */}
                            <div className="absolute inset-0 bg-red-500/5 rounded-full blur-xl scale-110"></div>

                            {/* Main Stamp Body */}
                            <div className="relative w-24 h-24 rounded-full border-[3px] border-red-500/80 flex items-center justify-center rotate-[-12deg] transition-transform hover:rotate-0 duration-500 shadow-[inset_0_0_10px_rgba(239,68,68,0.1)]">
                                {/* Inner Border */}
                                <div className="absolute inset-1.5 rounded-full border border-red-500/40"></div>

                                {/* Grunge/Ink Texture Effect (Pseudo) */}
                                <div className="absolute inset-0 rounded-full opacity-10 bg-[radial-gradient(circle_at_center,_transparent_0%,_#ef4444_100%)] pointer-events-none"></div>

                                <div className="flex flex-col items-center justify-center text-center p-2 z-10 leading-none">
                                    <span className="text-[10px] font-black text-red-500/90 tracking-tighter mb-1 uppercase drop-shadow-sm">
                                        OFFICIAL SEAL
                                    </span>
                                    <div className="h-[1px] w-12 bg-red-500/30 my-0.5"></div>
                                    <span className="text-sm font-black text-red-600 drop-shadow-[0.5px_0.5px_0px_white]">
                                        {companyName}
                                    </span>
                                    <div className="h-[1px] w-10 bg-red-500/30 my-0.5"></div>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <span className="text-[8px] font-bold text-red-400">CERTIFIED</span>
                                        <div className="w-4 h-4 rounded-sm border border-red-500/60 flex items-center justify-center text-[7px] text-red-600 font-bold bg-white">
                                            印
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-10 text-[10px] text-slate-400 text-center uppercase tracking-widest">
                    This is a system generated document and does not require a physical signature for validity.
                </div>
            </div>

            {/* Print Only CSS */}
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    body {
                        background: white;
                    }
                    .container {
                        max-width: none;
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
}
