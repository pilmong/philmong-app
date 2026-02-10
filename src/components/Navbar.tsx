"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePolling } from "@/context/PollingContext";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Bell } from "lucide-react";

export default function Navbar() {
    const pathname = usePathname();
    const { isPolling, startPolling, stopPolling, hasNewOrders, lastChecked, checkNow } = usePolling();

    const menuItems = [
        { href: "/products", label: "상품 관리" },
        { href: "/clients", label: "고객 관리" },
        { href: "/sales", label: "판매 관리" },
        { href: "/planning", label: "메뉴 기획" },
        { href: "/pricing", label: "원가 연구소" },
        { href: "/cashbook", label: "금전출납부" },
        { href: "/purchase", label: "구매 관리" },
    ];

    const instructionItems = [
        { href: "/work-orders/cooking", label: "조리 지시" },
        { href: "/work-orders/portioning", label: "소분 지시" },
    ];

    return (
        <nav className="hidden md:flex space-x-2 items-center">
            {menuItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`px-3 py-2 text-sm font-bold transition-all rounded-xl ${isActive
                            ? "bg-slate-900 text-white scale-105 shadow-md"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            }`}
                    >
                        {item.label}
                    </Link>
                );
            })}

            <div className="h-4 w-px bg-slate-200 self-center mx-2"></div>

            {instructionItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`px-3 py-2 text-sm font-medium transition-colors ${isActive ? "text-slate-900 font-bold" : "text-slate-500 hover:text-slate-900"
                            }`}
                    >
                        {item.label}
                    </Link>
                );
            })}

            <div className="h-4 w-px bg-slate-200 self-center mx-2"></div>

            {/* Polling Widget */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 ml-2">
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
        </nav>
    );
}
