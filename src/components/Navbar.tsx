"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePolling } from "@/context/PollingContext";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Bell } from "lucide-react";

export default function Navbar() {
    const pathname = usePathname();
    const { isPolling, startPolling, stopPolling, hasNewOrders, lastChecked, checkNow } = usePolling();

    const internalMenuItems = [
        { href: "/", label: "🏮 허브" },
        { href: "/products", label: "생산 마스터" },
        { href: "/planning", label: "메뉴 기획" },
        { href: "/work-orders/cooking", label: "조리 지시" },
        { href: "/work-orders/portioning", label: "소분 지시" },
        { href: "/purchase", label: "구매 관리" },
        { href: "/pricing", label: "원가/손익" },
    ];

    const salesPortalItems = [
        { href: "/sales", label: "주문 관리", isExternal: true },
        { href: "/delivery-zones", label: "배송 설정", isExternal: true },
        { href: "/clients", label: "고객사 관리", isExternal: true },
    ];

    return (
        <>
            <nav className="hidden md:flex space-x-1 items-center bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200">
                {/* 내부 관리 (핵심) */}
                {internalMenuItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`px-3 py-1.5 text-sm font-bold transition-all rounded-xl ${isActive
                                ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                                : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                                }`}
                        >
                            {item.label}
                        </Link>
                    );
                })}

                <div className="h-4 w-px bg-slate-200 self-center mx-2"></div>

                {/* 외부 채널 (이전 대상) */}
                {salesPortalItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`px-3 py-1.5 text-[11px] font-black tracking-tighter transition-all rounded-xl border border-dashed ${isActive
                                ? "bg-slate-800 text-white border-slate-800"
                                : "text-slate-400 border-slate-200 hover:border-slate-400 hover:text-slate-600"
                                }`}
                        >
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="h-4 w-px bg-slate-200 self-center mx-2 hidden md:block"></div>

            {/* Polling Widget */}
            <div className="hidden md:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 ml-2">
                <div className={`w-2.5 h-2.5 rounded-full ${isPolling ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                <span className="text-xs font-semibold text-slate-600 w-16">
                    {isPolling ? "감시 중" : "중지됨"}
                </span>

                {hasNewOrders && (
                    <div className="bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full animate-bounce">
                        NEW
                    </div>
                )}

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={isPolling ? stopPolling : startPolling}
                    title={isPolling ? "감시 중지" : "감시 시작"}
                >
                    {isPolling ? (
                        <span className="h-3 w-3 rounded-sm bg-slate-500" />
                    ) : (
                        <span className="h-0 w-0 border-y-[4px] border-y-transparent border-l-[6px] border-l-slate-800 ml-0.5" />
                    )}
                </Button>

                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => checkNow()} disabled={isPolling} title="지금 확인">
                    <RefreshCcw className={`w-3 h-3 ${isPolling ? 'opacity-30' : ''}`} />
                </Button>

                <Link href="/sales/live" className="ml-1">
                    <Button variant="outline" size="icon" className={`h-7 w-7 rounded-full ${hasNewOrders ? 'border-red-500 text-red-500 bg-red-50' : 'border-slate-300'}`}>
                        <Bell className="w-3 h-3" />
                    </Button>
                </Link>
            </div>
        </>
    );
}
