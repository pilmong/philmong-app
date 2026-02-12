"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, ArrowRight, Clipboard } from "lucide-react";

export default function QuickImportWidget() {
    const [text, setText] = useState("");
    const router = useRouter();

    const handleQuickStart = () => {
        if (!text.trim()) return;

        // 입력된 텍스트를 로컬 스토리지에 임시 저장 (페이지 이동 후 꺼내 쓰기 용도)
        localStorage.setItem("quickImportData", text);

        // 퀵 에드 페이지로 이동
        router.push("/quick-add");
    };

    return (
        <div className="relative group overflow-hidden bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 transition-all duration-500 hover:border-indigo-500/30 shadow-2xl">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <Zap className="w-32 h-32 text-indigo-400" />
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-4 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                        <SparkleIcon />
                        <span>Smart Order Parser</span>
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tighter leading-none">
                        ROCKET <span className="text-indigo-400">FUEL</span>
                    </h2>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">
                        네이버 예약이나 메세지를 바로 붙여넣으세요.<br />
                        인공지능 파서가 즉시 주문으로 변환합니다.
                    </p>
                </div>

                <div className="lg:col-span-8 flex flex-col sm:flex-row gap-4 items-stretch">
                    <div className="flex-1 relative group/input">
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="이곳에 예약 정보를 붙여넣으세요..."
                            className="w-full h-32 sm:h-24 bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-mono resize-none leading-relaxed"
                        />
                        <div className="absolute top-4 right-4 text-slate-700 pointer-events-none group-focus-within/input:text-indigo-500/50 transition-colors">
                            <Clipboard className="w-5 h-5" />
                        </div>
                    </div>

                    <button
                        onClick={handleQuickStart}
                        disabled={!text.trim()}
                        className="sm:w-40 flex flex-col items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-2xl font-black transition-all active:scale-[0.98] group/btn overflow-hidden relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                        <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-1 transition-transform" />
                        <span className="text-[11px] uppercase tracking-tighter">Analyze</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

function SparkleIcon() {
    return (
        <svg className="w-3 h-3 animate-pulse" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L14.5 9.5H22L16 14.5L18.5 22L12 17L5.5 22L8 14.5L2 9.5H9.5L12 2Z" fill="currentColor" />
        </svg>
    );
}
