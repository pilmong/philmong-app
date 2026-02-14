import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
    ShoppingBag,
    Calculator,
    ArrowRight,
    Package,
    CalendarCheck,
    ShieldCheck
} from "lucide-react";

export default async function HubPage() {
    // 내부 관리용 실시간 데이터 요약
    const productCount = await prisma.product.count();
    const activePurchaseCount = await prisma.purchase.count();

    // dailyMenuPlan 테이블이 없을 경우를 대비한 방어 로직
    let upcomingPlansCount = 0;
    try {
        upcomingPlansCount = await (prisma as any).dailyMenuPlan?.count() || 0;
    } catch (e) {
        upcomingPlansCount = 0;
    }

    // 기둥별 핵심 메뉴 구성 (살림꾼 버전)
    const mainShortcuts = [
        {
            href: "/products",
            label: "생산 마스터",
            description: "레시피 정의 및 소분/가공 공정 관리",
            icon: Package,
            color: "indigo",
            tags: ["레시피", "공정"]
        },
        {
            href: "/planning",
            label: "메뉴 기획",
            description: "일간/주간 식단 구성 및 생산량 계획",
            icon: CalendarCheck,
            color: "rose",
            tags: ["식단표", "생산계획"]
        },
        {
            href: "/purchase",
            label: "구매/물류 관리",
            description: "식재료 발주 및 거래처 매입 현황",
            icon: ShoppingBag,
            color: "violet",
            tags: ["발주", "매입처"]
        },
        {
            href: "/pricing",
            label: "원가/손익 분석",
            description: "재료비 기반 원가 산출 및 수익성 연구",
            icon: Calculator,
            color: "orange",
            tags: ["원가분석", "손익"]
        },
        {
            href: "/admin/data",
            label: "데이터 백업/복원",
            description: "시스템 데이터 전체 백업 및 긴급 복구 센터",
            icon: ShieldCheck,
            color: "emerald",
            tags: ["백업", "복원", "관리"]
        }
    ];

    return (
        <div className="min-h-full bg-slate-900 text-slate-200 overflow-hidden relative">
            {/* Background Decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <main className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:py-16">
                {/* Header Section */}
                <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="animate-in fade-in slide-in-from-left-4 duration-700">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black mb-4 uppercase tracking-tighter">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Internal Operations: Brain Mode</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-3">
                            PHILMONG <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-rose-400 to-indigo-400">MANAGEMENT</span>
                        </h1>
                        <p className="text-slate-400 text-lg max-w-2xl font-medium leading-relaxed">
                            필몽 내부 운영 및 생산 제어 센터입니다. <br className="hidden md:block" />
                            장사보다는 **안정적인 살림과 생산 효율**에 집중하는 공간입니다.
                        </p>
                    </div>

                    {/* Operational Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 animate-in fade-in slide-in-from-right-4 duration-700">
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl min-w-[120px]">
                            <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Master Menus</div>
                            <div className="text-2xl font-black text-indigo-400">{productCount}</div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl min-w-[120px]">
                            <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Active Plans</div>
                            <div className="text-2xl font-black text-rose-400">{upcomingPlansCount}</div>
                        </div>
                        <div className="hidden sm:block bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl min-w-[120px]">
                            <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Stock Items</div>
                            <div className="text-2xl font-black text-violet-400">{activePurchaseCount}</div>
                        </div>
                    </div>
                </header>

                {/* Hub Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                    {mainShortcuts.map((item, idx) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="group relative overflow-hidden bg-white/5 hover:bg-white/[0.08] backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in fade-in slide-in-from-bottom-4 duration-500"
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <item.icon className="absolute -bottom-4 -right-4 w-28 h-28 text-white/[0.03] rotate-12 group-hover:scale-125 transition-transform duration-700" />

                            <div className="flex justify-between items-start mb-8">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110
                                    ${item.color === 'indigo' ? 'bg-indigo-500/10 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)] group-hover:bg-indigo-500 group-hover:text-white' : ''}
                                    ${item.color === 'rose' ? 'bg-rose-500/10 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)] group-hover:bg-rose-500 group-hover:text-white' : ''}
                                    ${item.color === 'violet' ? 'bg-violet-500/10 text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.2)] group-hover:bg-violet-500 group-hover:text-white' : ''}
                                    ${item.color === 'orange' ? 'bg-orange-500/10 text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.2)] group-hover:bg-orange-500 group-hover:text-white' : ''}
                                    ${item.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)] group-hover:bg-emerald-500 group-hover:text-white' : ''}
                                `}>
                                    <item.icon className="w-7 h-7" />
                                </div>
                                <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-3 tracking-tight transition-colors">
                                {item.label}
                            </h2>
                            <p className="text-slate-400 text-sm leading-relaxed mb-8 font-medium">
                                {item.description}
                            </p>

                            <div className="flex flex-wrap gap-2">
                                {item.tags.map(tag => (
                                    <span key={tag} className="text-[10px] bg-white/5 border border-white/10 px-3 py-1 rounded-full text-slate-500 font-bold uppercase tracking-widest group-hover:text-white/60 transition-colors">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </Link>
                    ))}
                </div>

                {/* System Status Footer */}
                <footer className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 opacity-60">
                    <div className="flex items-center gap-3 text-sm text-slate-400 font-medium font-black tracking-widest uppercase">
                        <ShieldCheck className="w-5 h-5 text-indigo-400" />
                        <span>Philmong Operations Control v4.0</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)] animate-pulse" />
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Master Database Sync: OK</span>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
}
