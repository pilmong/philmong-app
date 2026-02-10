import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
    ShoppingBag,
    Calculator,
    CreditCard,
    ArrowRight,
    Zap,
    LayoutDashboard,
    Users,
    Package,
    CalendarCheck,
    TrendingUp,
    ShieldCheck
} from "lucide-react";

export default async function HubPage() {
    // DB 실시간 데이터 요약 (Dashboard Metrics)
    const productCount = await prisma.product.count();
    const clientCount = await prisma.client.count();
    const saleCount = await prisma.sale.count();

    // 메뉴 구성 정의
    const mainShortcuts = [
        {
            href: "/products",
            label: "상품 관리",
            description: "전체 메뉴 아이템 및 작업 구분 관리",
            icon: Package,
            color: "indigo",
            tags: ["재고", "분할"]
        },
        {
            href: "/clients",
            label: "고객 관리",
            description: "고객사별 위탁 단가 및 계약 관리",
            icon: Users,
            color: "blue",
            tags: ["B2B", "CRM"]
        },
        {
            href: "/sales",
            label: "판매 관리",
            description: "주문 내역 파싱 및 매출 집계",
            icon: TrendingUp,
            color: "emerald",
            tags: ["주문내역", "매출"]
        },
        {
            href: "/planning",
            label: "메뉴 기획",
            description: "일간/주간 메뉴 구성 및 생산 계획",
            icon: CalendarCheck,
            color: "rose",
            tags: ["식단표", "생산"]
        },
        {
            href: "/pricing",
            label: "원가 연구소",
            description: "재료비 및 마진율 기반 최적 판매가 산출",
            icon: Calculator,
            color: "orange",
            tags: ["원가분석", "마진"]
        },
        {
            href: "/purchase",
            label: "구매 관리",
            description: "매입처 관리 및 지출 자동 집계",
            icon: ShoppingBag,
            color: "violet",
            tags: ["발주", "매입"]
        },
        {
            href: "/cashbook",
            label: "금전출납부",
            description: "사업자/가계 통합 지출 모니터링",
            icon: CreditCard,
            color: "cyan",
            tags: ["현금흐름", "장부"]
        }
    ];

    return (
        <div className="min-h-full bg-slate-900 text-slate-200 overflow-hidden relative">
            {/* Background Decoration - Premium Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
                <div className="absolute top-[30%] right-[10%] w-[20%] h-[20%] bg-emerald-500/5 blur-[100px] rounded-full" />
            </div>

            <main className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:py-16">
                {/* Header Section */}
                <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="animate-in fade-in slide-in-from-left-4 duration-700">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black mb-4 uppercase tracking-tighter">
                            <Zap className="w-3 h-3" />
                            <span>System Operational: LAB - Master Hub</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-3">
                            PHILMONG <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 animate-gradient-x">OPERATIONS</span>
                        </h1>
                        <p className="text-slate-400 text-lg max-w-2xl font-medium leading-relaxed">
                            필몽 통합 운영 제어 센터입니다. <br className="hidden md:block" />
                            실시간 데이터 동기화와 고도화된 업무 지원 툴킷을 제공합니다.
                        </p>
                    </div>

                    {/* Integrated Mini-Dashboard */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 animate-in fade-in slide-in-from-right-4 duration-700">
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl min-w-[120px]">
                            <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Products</div>
                            <div className="text-2xl font-black text-indigo-400">{productCount}</div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl min-w-[120px]">
                            <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Clients</div>
                            <div className="text-2xl font-black text-emerald-400">{clientCount}</div>
                        </div>
                        <div className="hidden sm:block bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl min-w-[120px]">
                            <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Total Sales</div>
                            <div className="text-2xl font-black text-purple-400">{saleCount}</div>
                        </div>
                    </div>
                </header>

                {/* Hub Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {mainShortcuts.map((item, idx) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="group relative overflow-hidden bg-white/5 hover:bg-white/[0.08] backdrop-blur-xl border border-white/10 rounded-[2rem] p-7 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in fade-in slide-in-from-bottom-4 duration-500"
                            style={{ animationDelay: `${idx * 50}ms` }}
                        >
                            {/* Decorative Background Icon */}
                            <item.icon className="absolute -bottom-4 -right-4 w-24 h-24 text-white/[0.03] rotate-12 group-hover:scale-125 transition-transform duration-700" />

                            <div className="flex justify-between items-start mb-6">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110
                                    ${item.color === 'indigo' ? 'bg-indigo-500/10 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)] group-hover:bg-indigo-500 group-hover:text-white' : ''}
                                    ${item.color === 'blue' ? 'bg-blue-500/10 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)] group-hover:bg-blue-500 group-hover:text-white' : ''}
                                    ${item.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)] group-hover:bg-emerald-500 group-hover:text-white' : ''}
                                    ${item.color === 'rose' ? 'bg-rose-500/10 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)] group-hover:bg-rose-500 group-hover:text-white' : ''}
                                    ${item.color === 'orange' ? 'bg-orange-500/10 text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.2)] group-hover:bg-orange-500 group-hover:text-white' : ''}
                                    ${item.color === 'violet' ? 'bg-violet-500/10 text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.2)] group-hover:bg-violet-500 group-hover:text-white' : ''}
                                    ${item.color === 'cyan' ? 'bg-cyan-500/10 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)] group-hover:bg-cyan-500 group-hover:text-white' : ''}
                                `}>
                                    <item.icon className="w-6 h-6" />
                                </div>
                                <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </div>

                            <h2 className="text-xl font-bold text-white mb-2 group-hover:text-white transition-colors">
                                {item.label}
                            </h2>
                            <p className="text-slate-400 text-sm leading-relaxed mb-6 font-medium">
                                {item.description}
                            </p>

                            <div className="flex flex-wrap gap-2">
                                {item.tags.map(tag => (
                                    <span key={tag} className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-slate-500 font-bold uppercase tracking-widest">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </Link>
                    ))}
                </div>

                {/* System Status Footer */}
                <footer className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 opacity-60">
                    <div className="flex items-center gap-3 text-sm text-slate-400 font-medium">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        <span>통합 보안 및 클라우드 동기화 활성 상태</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Master Node Alive</span>
                        </div>
                        <div className="text-[10px] text-slate-300 bg-white/5 px-3 py-1 rounded-md border border-white/10 font-bold tabular-nums">
                            v3.0.1-MASTER
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
}
