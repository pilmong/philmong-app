import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CustomPriceSection from "../components/CustomPriceSection";
import { ArrowLeft, Edit3, Building2, Phone, Mail, Tag, FileText, CheckCircle2, ShoppingCart } from "lucide-react";

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
    const { id } = await params;

    // 고객사 정보 조회
    const client = await prisma.client.findUnique({
        where: { id },
        include: {
            customPrices: true,
            orders: {
                orderBy: { targetDate: 'desc' },
                take: 5
            }
        }
    });

    if (!client) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <h2 className="text-2xl font-bold text-slate-800">고객사를 찾을 수 없습니다.</h2>
            <Link href="/clients" className="text-blue-600 font-bold hover:underline">고객사 목록으로 돌아가기</Link>
        </div>
    );

    // 모든 판매 가능 상품 조회 (이제 런치박스뿐만 아니라 모든 상품 지원)
    const allProducts = await prisma.product.findMany({
        where: { status: 'SELLING' },
        orderBy: [{ type: 'asc' }, { name: 'asc' }]
    });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <Link href="/clients" className="inline-flex items-center text-slate-400 hover:text-slate-600 font-bold text-sm mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        목록으로 가기
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white rounded-3xl border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                            <Building2 className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-4xl font-black text-slate-900 tracking-tight">{client.name}</h1>
                                <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-black uppercase tracking-widest">
                                    {client.category || "일반기업"}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-4 mt-2 text-slate-500 font-medium">
                                <div className="flex items-center"><Mail className="w-4 h-4 mr-1 opacity-40" /> {client.managerEmail || "담당자 이메일 없음"}</div>
                                <div className="flex items-center"><Phone className="w-4 h-4 mr-1 opacity-40" /> {client.contact || "연락처 없음"}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Link
                        href={`/clients/${id}/orders?admin=true`}
                        className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all flex items-center shadow-lg shadow-blue-200 active:scale-95"
                    >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        주간 발주하기
                    </Link>
                    <Link
                        href={`/clients/${id}/edit`}
                        className="bg-white text-slate-900 border border-slate-200 px-6 py-3 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center shadow-sm"
                    >
                        <Edit3 className="w-4 h-4 mr-2" />
                        정보 수정
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* 좌측 레이아웃 */}
                <div className="xl:col-span-1 space-y-8">
                    {/* 설정 요약 */}
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center">
                            <Tag className="w-5 h-5 mr-2 text-blue-600" />
                            공급 설정
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                                <span className="text-sm font-bold text-slate-400">부가세 설정</span>
                                <span className={`font-black ${client.isVatInclusive ? 'text-emerald-500' : 'text-orange-500'}`}>
                                    {client.isVatInclusive ? "부가세 포함" : "부가세 별도"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 비고 사항 */}
                    <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200">
                        <h3 className="text-lg font-bold mb-4 flex items-center">
                            <FileText className="w-5 h-5 mr-2 opacity-50" />
                            고객사 특이사항
                        </h3>
                        <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap italic">
                            {client.note || "등록된 비고 사항이 없습니다."}
                        </p>
                    </div>
                </div>

                {/* 우측 레이아웃: 맞춤 단가 관리 */}
                <div className="xl:col-span-2">
                    <CustomPriceSection
                        clientId={id}
                        allProducts={allProducts.map(p => ({ id: p.id, name: p.name, price: p.price, type: p.type }))}
                        initialCustomPrices={client.customPrices.map(cp => ({ productId: cp.productId, customPrice: cp.customPrice }))}
                    />
                </div>
            </div>
        </div>
    );
}
