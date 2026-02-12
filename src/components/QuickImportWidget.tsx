"use client";

import { useRouter } from "next/navigation";
import { Zap, Plus } from "lucide-react";

export default function QuickImportWidget() {
    const router = useRouter();

    return (
        <div
            onClick={() => router.push("/quick-add")}
            className="relative group cursor-pointer overflow-hidden bg-gradient-to-br from-indigo-600/20 to-purple-600/20 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 transition-all duration-500 hover:border-indigo-500/50 hover:shadow-[0_0_50px_rgba(99,102,241,0.2)] shadow-2xl"
        >
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                <Zap className="w-48 h-48 text-indigo-400 -rotate-12 translate-x-12 -translate-y-12" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-4 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-black uppercase tracking-widest">
                        <SparkleIcon />
                        <span>High Efficiency Workflow</span>
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-white tracking-tighter leading-none mb-2">
                            INTELLIGENT <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">QUICK ADD</span>
                        </h2>
                        <p className="text-slate-400 text-base font-medium leading-relaxed max-w-xl">
                            어떤 형태의 주문서든 척척 알아듣는 인공지능 보조자. <br className="hidden sm:block" />
                            지금 바로 퀵 에드로 주문을 입력하고 학습시키세요.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden lg:flex flex-col items-end opacity-40">
                        <span className="text-[10px] font-black uppercase tracking-tighter text-slate-500">Fast Entry System</span>
                        <span className="text-xs font-mono text-indigo-400">v2.1-READY</span>
                    </div>

                    <div className="h-20 w-20 bg-white text-slate-950 rounded-[1.5rem] flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500 shadow-xl group-hover:shadow-indigo-500/40 group-hover:rotate-[360deg] group-active:scale-95">
                        <Plus className="w-10 h-10" />
                    </div>
                </div>
            </div>

            {/* Hover Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
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
