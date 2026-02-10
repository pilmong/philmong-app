"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createSaleFromText, getAllProducts } from "@/app/sales/actions";
import { Loader2, CheckCircle2, AlertCircle, ArrowRight, Eraser, Receipt, List, Sparkles } from "lucide-react";
import { parseOrderText, ParsedSaleData } from "@/lib/order-parser";

export default function QuickAddPage() {
    const [text, setText] = useState("");
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState("");
    const [lastSaleId, setLastSaleId] = useState<string | null>(null);
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [previewData, setPreviewData] = useState<ParsedSaleData | null>(null);

    // Load products for live preview
    useEffect(() => {
        getAllProducts().then(setAllProducts);
    }, []);

    // Update preview when text changes
    useEffect(() => {
        if (text.trim().length > 0 && allProducts.length > 0) {
            try {
                const parsed = parseOrderText(text, allProducts);
                setPreviewData(parsed);
            } catch (e) {
                console.error("Preview parse error", e);
            }
        } else {
            setPreviewData(null);
        }
    }, [text, allProducts]);

    const handleSubmit = async () => {
        if (!text.trim()) return;

        setStatus('loading');
        setMessage("");
        setLastSaleId(null);

        try {
            const result = await createSaleFromText(text);
            if (result.success) {
                setStatus('success');
                setMessage(`주문이 생성되었습니다! (${result.parsedData.customerName || '고객명 없음'}, ${result.parsedData.items.length}개 품목)`);
                setLastSaleId(result.id);
                setText(""); // Clear input on success
            }
        } catch (error) {
            console.error(error);
            setStatus('error');
            setMessage("오류가 발생했습니다. 다시 시도해주세요.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex flex-col">
            <div className="max-w-7xl mx-auto flex flex-col gap-8 w-full flex-1">
                {/* Header */}
                <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500 rounded-2xl text-white shadow-lg shadow-emerald-200">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight">⚡ 필몽 퀵 전송</h1>
                            <p className="text-sm font-bold text-slate-400">붙여넣은 내용을 즉시 정리하여 나열합니다.</p>
                        </div>
                    </div>
                </div>

                {/* Main Split Layout */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0 mb-8">
                    {/* Left Side: Input */}
                    <div className="flex flex-col gap-6 min-h-0">
                        <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden relative group focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-500/50 transition-all">
                            <textarea
                                className="w-full h-full p-8 text-lg leading-relaxed resize-none outline-none placeholder:text-slate-300 font-medium bg-transparent"
                                placeholder="주문 메시지나 예약 내용을 여기에 붙여넣으세요..."
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                disabled={status === 'loading'}
                            />
                            {text && status !== 'loading' && (
                                <button
                                    onClick={() => setText("")}
                                    className="absolute top-6 right-6 p-2 bg-slate-100 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                                >
                                    <Eraser className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        <div className="space-y-4 shrink-0">
                            <button
                                onClick={handleSubmit}
                                disabled={!text.trim() || status === 'loading'}
                                className={`w-full py-6 rounded-[2rem] font-black text-xl shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98]
                                    ${!text.trim()
                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                        : status === 'loading'
                                            ? 'bg-slate-800 text-slate-400 cursor-wait'
                                            : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-200 hover:-translate-y-1'
                                    }
                                `}
                            >
                                {status === 'loading' ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        <span>이대로 주문 전표 생성하기</span>
                                        <ArrowRight className="w-6 h-6" />
                                    </>
                                )}
                            </button>

                            {status === 'success' && (
                                <Link
                                    href="/sales"
                                    className="w-full py-5 bg-white border-2 border-emerald-500 text-emerald-600 rounded-[2rem] font-black text-lg text-center shadow-lg hover:bg-emerald-50 transition-all flex items-center justify-center gap-3 animate-in fade-in slide-in-from-bottom-2"
                                >
                                    <Receipt className="w-6 h-6" />
                                    <span>방금 추가한 전표 확인 / 인쇄</span>
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Right Side: Smart Preview */}
                    <div className="flex flex-col bg-slate-100/50 rounded-[3rem] border border-slate-200 overflow-hidden min-h-0">
                        <div className="p-6 bg-white/50 border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <List className="w-5 h-5 text-slate-400" />
                                <h3 className="font-black text-slate-600 uppercase tracking-widest text-sm">정리된 주문 정보 나열</h3>
                            </div>
                            {previewData ? (
                                <div className="text-[10px] font-black bg-blue-500 text-white px-2 py-1 rounded-full animate-pulse">
                                    LIVE PREVIEW
                                </div>
                            ) : (
                                <div className="text-[10px] font-black text-slate-400">
                                    {allProducts.length > 0 ? "상품 데이터 로드됨" : "상품 데이터 로드 중..."}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 no-scrollbar scroll-smooth">
                            {!previewData ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                                    <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-inner border border-slate-100">
                                        <List className="w-10 h-10 opacity-10" />
                                    </div>
                                    <p className="font-bold text-sm">내용을 입력하면 자동으로 정리됩니다</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Key Visual Summary */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {previewData.customerName && (
                                            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm animate-in zoom-in-95">
                                                <div className="text-[10px] font-black text-slate-400 mb-1">고객명</div>
                                                <div className="text-xl font-black text-slate-900 leading-none">{previewData.customerName}</div>
                                            </div>
                                        )}
                                        {previewData.customerPhone && (
                                            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm animate-in zoom-in-95 delay-75">
                                                <div className="text-[10px] font-black text-slate-400 mb-1">전화번호</div>
                                                <div className="text-xl font-black text-blue-600 leading-none">{previewData.customerPhone}</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Cleaned Listing Area */}
                                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl p-8 space-y-4">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-4 mb-4">나열된 메뉴 목록</h4>
                                        {text.split('\n').map((line, idx) => {
                                            const trimmed = line.trim();
                                            if (!trimmed) return null;

                                            // Determine if this line is an item
                                            const isItem = previewData.items.some(it =>
                                                (it.customName && trimmed.includes(it.customName)) ||
                                                (it.productId && allProducts.find(p => p.id === it.productId)?.name && trimmed.includes(allProducts.find(p => p.id === it.productId).name))
                                            );

                                            const isMetadata = (previewData.customerName && trimmed.includes(previewData.customerName)) ||
                                                (previewData.customerPhone && trimmed.includes(previewData.customerPhone)) ||
                                                (previewData.address && trimmed.includes(previewData.address));

                                            // Skip metadata to keep it clean, but keep other text
                                            if (isMetadata) return null;

                                            return (
                                                <div
                                                    key={idx}
                                                    className={`group relative flex items-center gap-4 transition-all duration-300
                                                        ${isItem ? 'scale-[1.02]' : 'opacity-40 hover:opacity-100'}
                                                    `}
                                                >
                                                    <div className={`w-2 h-2 rounded-full transition-colors ${isItem ? 'bg-emerald-500 shadow-lg shadow-emerald-200' : 'bg-slate-200'}`} />
                                                    <span className={`flex-1 text-lg leading-tight ${isItem ? 'font-black text-slate-800' : 'text-slate-600'}`}>
                                                        {trimmed}
                                                    </span>
                                                    {isItem && (
                                                        <div className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-1 rounded-lg border border-blue-100">
                                                            ITEM
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Address & Note Summary */}
                                    {(previewData.address || previewData.requestNote) && (
                                        <div className="space-y-3">
                                            {previewData.address && (
                                                <div className="flex items-start gap-4">
                                                    <div className="text-xs font-black text-slate-400 w-16 pt-1">배송지</div>
                                                    <div className="flex-1 font-bold text-slate-700">{previewData.address}</div>
                                                </div>
                                            )}
                                            {previewData.requestNote && (
                                                <div className="flex items-start gap-4">
                                                    <div className="text-xs font-black text-slate-400 w-16 pt-1">요청사항</div>
                                                    <div className="flex-1 font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-lg">{previewData.requestNote}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
