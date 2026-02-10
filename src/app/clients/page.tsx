import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { User, Mail, Phone, Building2, Search, Plus, ArrowRight, Tag } from "lucide-react";

export default async function ClientsPage({
    searchParams
}: {
    searchParams: { q?: string }
}) {
    const q = (await searchParams).q || "";

    const clients = await prisma.client.findMany({
        where: {
            OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { contact: { contains: q, mode: 'insensitive' } },
            ]
        },
        orderBy: { name: 'asc' }
    });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center">
                        고객사 관리
                        <span className="ml-4 text-sm font-bold bg-blue-100 text-blue-600 px-3 py-1 rounded-full uppercase tracking-widest">B2B Master</span>
                    </h2>
                    <p className="text-slate-500 mt-2 text-lg">납품처 목록과 전용 단가, 담당자 정보를 체계적으로 관리합니다.</p>
                </div>
                <Link href="/clients/new" className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 flex items-center group">
                    <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
                    새 고객사 등록
                </Link>
            </div>

            {/* 검색 섹션 */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 mb-10 shadow-sm flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <form action="/clients" method="GET">
                        <input
                            name="q"
                            type="text"
                            defaultValue={q}
                            placeholder="고객사명 또는 연락처로 검색..."
                            className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 text-slate-700 font-medium focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                        />
                    </form>
                </div>
                <div className="text-sm font-bold text-slate-400 px-2 whitespace-nowrap">
                    총 <span className="text-slate-900">{clients.length}</span>곳의 고객사
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {clients.length === 0 ? (
                    <div className="col-span-full bg-white p-20 text-center rounded-[3rem] border border-slate-200 text-slate-300 flex flex-col items-center">
                        <Search className="w-16 h-16 mb-4 opacity-10" />
                        <p className="text-xl font-bold">검색 결과가 없거나 등록된 고객사가 없습니다.</p>
                        <Link href="/clients/new" className="text-blue-600 mt-4 font-bold hover:underline">새 고객사 등록하기 →</Link>
                    </div>
                ) : (
                    clients.map((client) => (
                        <Link key={client.id} href={`/clients/${client.id}`} className="group relative bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                            {/* 데코 요소 */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[5rem] -mr-16 -mt-16 group-hover:bg-blue-50 transition-colors" />

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="space-y-1">
                                        <div className="inline-flex items-center text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-md mb-2 uppercase tracking-tighter">
                                            <Tag className="w-3 h-3 mr-1" />
                                            {client.category || "일반기업"}
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">{client.name}</h3>
                                    </div>
                                    <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors shadow-sm">
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center text-slate-500">
                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center mr-3 group-hover:bg-blue-50 transition-colors">
                                            <Mail className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                                        </div>
                                        <span className="text-sm font-medium">{client.managerEmail || "-"}</span>
                                    </div>
                                    <div className="flex items-center text-slate-500">
                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center mr-3 group-hover:bg-blue-50 transition-colors">
                                            <Phone className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                                        </div>
                                        <span className="text-sm font-medium">{client.contact || "-"}</span>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center text-sm">
                                    <div className={`font-bold ${client.isVatInclusive ? 'text-emerald-500' : 'text-orange-500'}`}>
                                        {client.isVatInclusive ? "부가세 포함" : "부가세 별도"}
                                    </div>
                                    <div className="flex items-center text-blue-600 font-black opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
                                        상세보기
                                        <ArrowRight className="w-4 h-4 ml-1" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
