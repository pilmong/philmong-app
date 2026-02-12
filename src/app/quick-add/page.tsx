"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createSaleWithItems, getAllProducts } from "@/app/sales/actions";
import {
    Loader2, ArrowRight, Eraser, Sparkles,
    Hash, User, Phone, MapPin, MessageSquare,
    ShoppingBasket, Calendar, CreditCard, ChevronRight,
    Truck, TicketPercent, Receipt, CheckCircle2, ArrowLeft, Printer, Save
} from "lucide-react";

// 매핑 표준 필드 정의
const FORM_FIELDS = [
    { id: 'customerName', label: '고객명', icon: User, color: 'text-blue-600', placeholder: '이름/성함' },
    { id: 'customerPhone', label: '연락처', icon: Phone, color: 'text-cyan-600', placeholder: '010-...' },
    { id: 'utilizationDate', label: '이용일시', icon: Calendar, color: 'text-amber-600', placeholder: '날짜/시간' },
    { id: 'deliveryZone', label: '배달구역', icon: Truck, color: 'text-indigo-600', placeholder: '구역/Zone' },
    { id: 'address', label: '배송지', icon: MapPin, color: 'text-rose-600', placeholder: '상세주소' },
    { id: 'discountValue', label: '쿠폰 할인', icon: TicketPercent, color: 'text-emerald-600', placeholder: '할인금액' },
    { id: 'requestNote', label: '요청사항', icon: MessageSquare, color: 'text-slate-600', placeholder: '메모/요청' },
    { id: 'visitor', label: '방문자', icon: User, color: 'text-teal-600', placeholder: '수령인' },
    { id: 'paymentStatus', label: '결제상태', icon: CreditCard, color: 'text-purple-600', placeholder: '결제완료/미입금' },
    { id: 'items', label: '품목 줄 번호', icon: ShoppingBasket, color: 'text-orange-600', placeholder: '예: 8, 9, 10' },
];

export default function QuickAddPage() {
    const router = useRouter();
    const [viewMode, setViewMode] = useState<'mapping' | 'voucher'>('mapping');
    const [text, setText] = useState("");
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState("");
    const [allProducts, setAllProducts] = useState<any[]>([]);

    // 단순 키워드가 아닌 '문맥(Pattern)'을 저장
    const [learnedPatterns, setLearnedPatterns] = useState<any>({});

    const [mappings, setMappings] = useState<any>({
        customerName: "", customerPhone: "", utilizationDate: "",
        deliveryZone: "", address: "", discountValue: "",
        requestNote: "", visitor: "", paymentStatus: "", items: ""
    });

    const lines = useMemo(() => text.split('\n').map(l => l.trim()), [text]);

    useEffect(() => {
        getAllProducts().then(setAllProducts);
        // 저장된 문맥 패턴 불러오기
        const saved = localStorage.getItem('philmong_context_patterns');
        if (saved) setLearnedPatterns(JSON.parse(saved));
    }, []);

    // 지능형 문맥 학습 함수
    const learnPatterns = () => {
        const newPatterns = { ...learnedPatterns };
        let changed = false;

        Object.entries(mappings).forEach(([field, lineNum]) => {
            if (!lineNum || field === 'items') return;
            const idx = parseInt(lineNum as string) - 1;
            if (lines[idx]) {
                const currentLine = lines[idx];
                const label = currentLine.match(/^([^:：\t]+)[:：\t]/)?.[1] || "";
                const above = lines[idx - 1] || "__START__";
                const below = lines[idx + 1] || "__END__";

                const pattern = { label, above, below };

                if (!newPatterns[field]) newPatterns[field] = [];

                // 이미 동일한 문맥이 저장되어 있는지 확인
                const exists = newPatterns[field].some((p: any) =>
                    p.label === pattern.label && p.above === pattern.above && p.below === pattern.below
                );

                if (!exists) {
                    newPatterns[field].push(pattern);
                    changed = true;
                }
            }
        });

        if (changed) {
            setLearnedPatterns(newPatterns);
            localStorage.setItem('philmong_context_patterns', JSON.stringify(newPatterns));
        }
    };

    // 문맥 기반 자동 매핑 엔진
    useEffect(() => {
        if (!text) return;
        const newMappings = {
            customerName: "", customerPhone: "", utilizationDate: "",
            deliveryZone: "", address: "", discountValue: "",
            requestNote: "", visitor: "", paymentStatus: "", items: ""
        };

        let inItemSection = false;
        let itemsCaptured = false;

        lines.forEach((line, idx) => {
            const num = (idx + 1).toString();
            const above = lines[idx - 1] || "__START__";
            const below = lines[idx + 1] || "__END__";

            // 엄격한 품목 섹션 제어 (첫 번째로 발견되는 '메뉴' ~ '요청사항' 구간만 사용)
            if (!itemsCaptured && (line.includes("메뉴") || line.includes("주문상품"))) {
                inItemSection = true;
                return;
            }
            if (inItemSection && (line.includes("요청사항") || line.includes("결제금액"))) {
                inItemSection = false;
                itemsCaptured = true; // 한 번 캡처 완료하면 다시는 열지 않음
            }

            // 1. 학습된 문맥(Context) 대조 우선
            Object.entries(learnedPatterns).forEach(([field, patterns]: [string, any]) => {
                if (newMappings[field as keyof typeof newMappings]) return;

                patterns.forEach((p: any) => {
                    let score = 0;
                    if (p.above && above === p.above) score += 2;
                    if (p.below && below === p.below) score += 2;
                    if (p.label && line.includes(p.label)) score += 1;

                    if (score >= 3 || (p.above === "__START__" && score >= 2)) {
                        (newMappings as any)[field] = num;
                    }
                });
            });

            // 2. 기본 하드코딩 키워드 (보조)
            if (!newMappings.customerName && (line.includes("예약자") || line.includes("주문자") || line.includes("성함"))) newMappings.customerName = num;
            if (!newMappings.customerPhone && (line.match(/010-\d{3,4}-\d{4}/) || line.includes("연락처"))) newMappings.customerPhone = num;

            // 주소 인식 강화 (특정 안내문구 다음 줄을 주소로 인식)
            if (line.includes("배달 받으실 주소를 기입해주세요")) {
                const nextNum = (idx + 2).toString();
                if (lines[idx + 1] && lines[idx + 1].trim() !== "") {
                    newMappings.address = nextNum;
                }
            } else if (!newMappings.address && (line.includes("주소") || line.includes("배송지")) && !line.includes("기입해주세요")) {
                newMappings.address = num;
            }

            if (!newMappings.utilizationDate && (line.includes("일시") || line.includes("시간"))) newMappings.utilizationDate = num;

            // 3. 품목 감지 (오직 지정된 범위 내의 유효한 줄만 수집)
            if (inItemSection && line.trim() !== "") {
                const isAlreadyOccupied = Object.entries(newMappings).some(([f, n]: [string, any]) => f !== 'items' && n === num);
                if (!isAlreadyOccupied) {
                    newMappings.items = newMappings.items ? `${newMappings.items},${num}` : num;
                }
            }
        });
        setMappings(newMappings);
    }, [text, allProducts, learnedPatterns]);

    const finalData = useMemo(() => {
        const getValue = (idxStr: string) => {
            const idx = parseInt(idxStr) - 1;
            if (isNaN(idx) || !lines[idx]) return "";
            return lines[idx].replace(/^[^:：\t]+[:：\t]\s*/, "").trim();
        };

        const getNumber = (idxStr: string) => {
            const val = getValue(idxStr);
            const num = val.replace(/[^0-9]/g, '');
            return num ? parseInt(num, 10) : 0;
        };

        const itemLines = (mappings.items || "").split(',')
            .map((s: string) => parseInt(s.trim()) - 1)
            .filter((idx: number) => !isNaN(idx) && lines[idx]);

        // 1. 우선 모든 매칭된 아이템을 가져옴
        const rawMappedItems = itemLines.map((idx: number) => {
            const line = lines[idx];
            const matchedProduct = allProducts.find(p => line.includes(p.name));
            const quantityMatch = line.match(/(\d+)(개|ea|박스)?\s*$/);
            const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;

            return {
                id: matchedProduct?.id,
                name: matchedProduct?.name || line,
                quantity,
                price: matchedProduct?.price || 0,
                // 'zone' (대소문자 무관) 또는 '배달비' 키워드 감지
                isZone: matchedProduct?.category === 'ZONE' ||
                    /zone|배달비/i.test(matchedProduct?.name || "") ||
                    /zone|배달비/i.test(line)
            };
        });

        const deliveryZoneTextInput = getValue(mappings.deliveryZone);
        const zoneProductFromInput = allProducts.find(p => deliveryZoneTextInput.includes(p.name));

        // 2. 실제 품목 목록(items)에서 배달구역 상품은 제외
        const finalItems = rawMappedItems.filter((it: any) => !it.isZone).map((it: any) => ({
            productId: it.id,
            customName: it.id ? undefined : it.name,
            quantity: it.quantity,
            price: it.price
        }));

        // 3. 배달비 정보 추출 (품목 중에 섞여있던 배달비 아이템 우선)
        const zoneProductInItems = rawMappedItems.find((it: any) => it.isZone);
        const deliveryFee = zoneProductFromInput?.price || zoneProductInItems?.price || 0;
        const deliveryZone = deliveryZoneTextInput || zoneProductInItems?.name || "";

        return {
            customerName: getValue(mappings.customerName),
            customerPhone: getValue(mappings.customerPhone),
            utilizationDate: getValue(mappings.utilizationDate),
            deliveryZone,
            address: getValue(mappings.address),
            discountValue: getNumber(mappings.discountValue),
            requestNote: getValue(mappings.requestNote),
            visitor: getValue(mappings.visitor),
            paymentStatus: getValue(mappings.paymentStatus),
            items: finalItems,
            deliveryFee,
            totalAmount: finalItems.reduce((sum: number, it: any) => sum + (it.price * it.quantity), 0) + deliveryFee - getNumber(mappings.discountValue)
        };
    }, [mappings, lines, allProducts]);

    const handleSave = async () => {
        if (status === 'loading') return;
        learnPatterns(); // 문맥과 위아래 정보를 학습!
        setStatus('loading');
        try {
            const res = await createSaleWithItems({
                ...finalData,
                source: "MANUAL_MAPPING",
                memo: text
            });
            if (res.success) {
                setStatus('success');
                setMessage("전표가 성공적으로 저장됐으며 문맥을 학습했습니다! 잠시 후 판매 내역으로 이동합니다...");
                setTimeout(() => {
                    setStatus('idle');
                    router.push('/sales');
                }, 2000);
            }
        } catch (e) {
            setStatus('error');
            setMessage("저장 중 오류가 발생했습니다.");
        }
    };

    return (
        <div className="min-h-screen bg-[#F1F5F9] p-4 lg:p-12 font-sans text-slate-900 overflow-x-hidden">
            <div className="max-w-[1400px] mx-auto">
                {viewMode === 'mapping' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                    <Sparkles className="w-10 h-10 text-indigo-600" />
                                    필몽 라인 매퍼 💡
                                </h1>
                                <p className="text-slate-500 font-bold mt-2 ml-1">주문서의 위/아래 문맥을 학습하여 자동으로 찾아냅니다.</p>
                            </div>
                            <div className="p-2 bg-white rounded-2xl shadow-sm border border-slate-200 flex gap-2">
                                <button onClick={() => setText("")} className="px-4 py-2 text-sm font-black text-slate-400 hover:text-rose-50 transition-colors flex items-center gap-2">
                                    <Eraser className="w-4 h-4" /> 리셋
                                </button>
                                <button
                                    onClick={() => setViewMode('voucher')}
                                    disabled={!text || finalData.items.length === 0}
                                    className="px-8 py-2 bg-indigo-600 text-white rounded-xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:bg-slate-200 transition-all flex items-center gap-2"
                                >
                                    <span>전표 확인 & 학습하기</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </header>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start h-[calc(100vh-250px)]">
                            <div className="lg:col-span-6 bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-200 flex flex-col overflow-hidden h-full">
                                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 font-mono">
                                        [01] SOURCE TEXT
                                    </h3>
                                </div>
                                <textarea
                                    className="w-full p-8 text-lg font-bold bg-white focus:bg-indigo-50/10 outline-none resize-none h-32 border-b border-slate-100 transition-colors shrink-0"
                                    placeholder="여기에 주문 내용을 붙여넣으세요..."
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                />
                                <div className="flex-1 p-8 overflow-y-auto space-y-2 bg-[#FDFDFF] font-mono text-base custom-scrollbar">
                                    {lines.length > 0 && lines[0] !== "" ? lines.map((line, i) => (
                                        <div key={i} className="flex gap-6 group items-center">
                                            <span className="w-8 h-8 flex items-center justify-center text-indigo-600 font-black text-xs bg-indigo-50 rounded-full shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                                {i + 1}
                                            </span>
                                            <span className={`whitespace-pre-wrap ${line ? 'text-slate-800' : 'text-slate-200 italic'}`}>
                                                {line || "(빈 줄)"}
                                            </span>
                                        </div>
                                    )) : (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-300 py-20">
                                            <Hash className="w-12 h-12 opacity-10 mb-4" />
                                            <p className="font-black">텍스트를 붙여넣어 주세요.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="lg:col-span-6 space-y-4 h-full overflow-y-auto no-scrollbar pb-10">
                                <div className="p-2 ml-4">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 font-mono">
                                        [02] FIELD MAPPING
                                    </h3>
                                </div>
                                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-200 p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {FORM_FIELDS.map((f) => (
                                        <div key={f.id} className={`flex flex-col gap-1 p-4 rounded-3xl border-2 transition-all ${mappings[f.id] ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-50 bg-slate-50/50'}`}>
                                            <div className="flex items-center gap-2">
                                                <f.icon className={`w-3.5 h-3.5 ${f.color}`} />
                                                <span className="text-[10px] font-black text-slate-500 uppercase">{f.label}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <input
                                                    type="text"
                                                    className="bg-transparent text-xl font-black outline-none placeholder:text-slate-200"
                                                    placeholder="줄 번호"
                                                    value={mappings[f.id]}
                                                    onChange={(e) => setMappings({ ...mappings, [f.id]: e.target.value })}
                                                />
                                                {mappings[f.id] && lines[parseInt(mappings[f.id]) - 1] && (
                                                    <div className="text-[10px] font-bold text-indigo-500 truncate bg-indigo-50/50 px-2 py-0.5 rounded-lg mt-1 animate-in fade-in slide-in-from-left-1 border border-indigo-100">
                                                        {lines[parseInt(mappings[f.id]) - 1].replace(/^[^:：\t]+[:：\t]\s*/, "").trim()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <div className="md:col-span-2 pt-6">
                                        <button
                                            onClick={() => setViewMode('voucher')}
                                            disabled={!text || finalData.items.length === 0}
                                            className="w-full h-20 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-2xl rounded-[2rem] shadow-xl shadow-emerald-100 transition-all flex items-center justify-center gap-4 active:scale-[0.98]"
                                        >
                                            <span>전표 발행 및 학습</span>
                                            <ArrowRight className="w-8 h-8" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {viewMode === 'voucher' && (
                    <div className="max-w-4xl mx-auto space-y-8 animate-in zoom-in-95 duration-500">
                        {/* 80mm 영수증 프린터 최적화 스타일 */}
                        <style jsx global>{`
                            @media print {
                                @page {
                                    size: 80mm auto;
                                    margin: 0;
                                }
                                * {
                                    box-sizing: border-box !important;
                                    overflow-wrap: break-word !important;
                                    -webkit-print-color-adjust: exact !important;
                                    print-color-adjust: exact !important;
                                    image-rendering: auto !important;
                                    -webkit-font-smoothing: none !important;
                                    color: #000 !important;
                                    background-color: transparent !important; /* 배경색 인쇄 방지 */
                                }
                                body {
                                    background: white !important;
                                    padding: 0 !important;
                                    margin: 0 !important;
                                    width: 80mm !important;
                                    font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif !important;
                                }
                                .print-receipt-container {
                                    width: 80mm !important;
                                    max-width: 80mm !important;
                                    margin: 0 !important;
                                    padding: 2mm 4mm !important;
                                    border: none !important;
                                    box-shadow: none !important;
                                    border-radius: 0 !important;
                                }
                                .print-receipt-container > div {
                                    max-width: 72mm !important;
                                    margin: 0 auto !important;
                                }
                                
                                .print-receipt-container .p-12, 
                                .print-receipt-container .md\\:p-20 { padding: 1mm !important; }
                                .print-receipt-container .p-10 { padding: 2mm 0 !important; } /* 배경 제거 후 간격 조정 */
                                .print-receipt-container .space-y-12,
                                .print-receipt-container .space-y-6,
                                .print-receipt-container .space-y-4 { margin: 1mm 0 !important; gap: 0.5mm !important; }
                                
                                /* 요청사항 섹션 배경 제거 및 강조 */
                                .print-receipt-container .bg-slate-900 {
                                    background: transparent !important;
                                    padding: 2mm 0 !important;
                                    margin-top: 3mm !important;
                                    border-top: 1px dashed #000 !important;
                                }
                                .print-receipt-container .bg-slate-900 p {
                                    font-size: 14pt !important; /* 요청사항 크게 */
                                    font-weight: 900 !important;
                                    line-height: 1.3 !important;
                                }
                                
                                /* 배송 주소 강조 */
                                .print-receipt-container .text-2xl.leading-tight { 
                                    font-size: 15pt !important; /* 주소 아주 크게 */
                                    font-weight: 900 !important;
                                    line-height: 1.2 !important;
                                }

                                .print-receipt-container h2 { font-size: 18pt !important; font-weight: 900 !important; }
                                .print-receipt-container p { font-size: 10pt !important; font-weight: 700 !important; }
                                .print-receipt-container label { font-size: 8pt !important; font-weight: 800 !important; }
                                
                                .print-receipt-container .text-7xl { font-size: 22pt !important; font-weight: 900 !important; }
                                .print-receipt-container .text-6xl { font-size: 18pt !important; font-weight: 900 !important; }
                                .print-receipt-container .text-3xl { font-size: 12pt !important; font-weight: 800 !important; }
                                
                                .print-receipt-container .bg-indigo-600,
                                .print-receipt-container .border-8,
                                .print-receipt-container .opacity-10 { display: none !important; }
                                
                                .print-receipt-container .border-y-4 { border-top: 2px solid #000 !important; border-bottom: 2px solid #000 !important; padding: 2mm 0 !important; }
                                .print-receipt-container .border-b-2 { border-bottom: 1px solid #000 !important; padding-bottom: 1mm !important; }
                            }
                        `}</style>

                        <div className="flex items-center justify-between px-4 print:hidden">
                            <button onClick={() => setViewMode('mapping')} className="flex items-center gap-2 text-slate-500 font-black hover:text-slate-900 transition-all">
                                <ArrowLeft className="w-5 h-5" /> 매핑 수정
                            </button>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => window.print()}
                                    className="px-6 py-5 bg-white text-slate-700 border-4 border-slate-100 rounded-[2.5rem] font-black text-xl hover:bg-slate-50 transition-all flex items-center gap-3 shadow-xl"
                                >
                                    <Printer className="w-7 h-7" />
                                    <span>전표 인쇄</span>
                                </button>
                                <button onClick={handleSave} disabled={status === 'loading'} className="px-12 py-5 bg-indigo-600 text-white rounded-[2.5rem] font-black text-xl shadow-2xl shadow-indigo-200 hover:bg-indigo-500 hover:-translate-y-1 transition-all flex items-center gap-3">
                                    {status === 'loading' ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-7 h-7" /> <span>확인 완료 & 저장/학습</span></>}
                                </button>
                            </div>
                        </div>
                        {/* Receipt UI - print-receipt-container 클래스 추가 */}
                        <div className="bg-white rounded-[4rem] shadow-2xl border-8 border-white overflow-hidden font-mono print-receipt-container">
                            <div className="h-4 bg-indigo-600"></div>
                            <div className="p-8 md:p-14 space-y-8">
                                <div className="text-center border-b-2 border-slate-100 pb-6 mb-6">
                                    <div className="flex items-baseline justify-center gap-3">
                                        <span className="text-3xl font-black text-slate-900">{finalData.customerName || "???"}</span>
                                        <span className="text-2xl font-black text-indigo-500">{finalData.customerPhone || "NO PHONE"}</span>
                                    </div>
                                </div>

                                <div className="space-y-6 border-b-4 border-slate-100 border-double pb-8">
                                    {finalData.utilizationDate && (
                                        <div><p className="text-2xl font-black text-slate-700">{finalData.utilizationDate}</p></div>
                                    )}

                                    <div>
                                        <p className="text-3xl font-black leading-tight text-slate-900">{finalData.address || "매장 수령"}</p>

                                        {(finalData.visitor || finalData.paymentStatus) && (
                                            <div className="flex gap-6 mt-4">
                                                {finalData.visitor && (
                                                    <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                                                        <span className="text-xs font-black text-slate-400 block mb-0.5">방문자</span>
                                                        <p className="text-lg font-black text-slate-600">{finalData.visitor}</p>
                                                    </div>
                                                )}
                                                {finalData.paymentStatus && (
                                                    <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                                                        <span className="text-xs font-black text-slate-400 block mb-0.5">결제 상태</span>
                                                        <p className="text-lg font-black text-slate-600">{finalData.paymentStatus}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {finalData.items.map((item: any, i: number) => (
                                        <div key={i} className="flex justify-between items-end border-b border-slate-50 pb-3">
                                            <div>
                                                <span className="text-xl font-black text-slate-800">{item.customName || allProducts.find((p: any) => p.id === item.productId)?.name}</span>
                                                <p className="text-sm font-black text-indigo-400">수량: {item.quantity}</p>
                                            </div>
                                            <span className="text-2xl font-black text-slate-900">{(item.price * item.quantity).toLocaleString()} <span className="text-xs font-normal">원</span></span>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-6 space-y-2 border-t-2 border-slate-100">
                                    <div className="flex justify-between text-sm font-black text-slate-400 uppercase tracking-widest">
                                        <span>배달비 {finalData.deliveryZone && `(${finalData.deliveryZone})`}</span>
                                        <span>+{finalData.deliveryFee.toLocaleString()}원</span>
                                    </div>
                                    {finalData.discountValue > 0 && (
                                        <div className="flex justify-between text-sm font-black text-rose-500 uppercase tracking-widest">
                                            <span>할인 금액</span>
                                            <span>-{finalData.discountValue.toLocaleString()}원</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-baseline pt-4 border-t border-slate-50 mt-2">
                                        <span className="text-xl font-black text-slate-900">최종 결제 금액</span>
                                        <span className="text-5xl font-black text-indigo-600 tracking-tighter">
                                            {finalData.totalAmount.toLocaleString()}
                                            <span className="text-lg ml-1 font-black">원</span>
                                        </span>
                                    </div>
                                </div>

                                {finalData.requestNote && (
                                    <div className="bg-slate-900 text-white rounded-[2rem] p-8 mt-6 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10"><MessageSquare className="w-12 h-12" /></div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">요청사항 / 메모</label>
                                        <p className="text-xl font-bold leading-relaxed">{finalData.requestNote}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        {message && (
                            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white border-4 border-emerald-500 px-10 py-4 rounded-[3rem] shadow-2xl flex items-center gap-4 z-50 animate-in slide-in-from-bottom-10 print:hidden">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                <span className="text-xl font-black text-emerald-600">{message}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
