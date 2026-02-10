"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useState, useEffect } from "react";
import { updateSale, getAllProducts } from "@/app/sales/actions";
import { Eye, EyeOff, ClipboardPaste, ListChecks, ArrowDown, ChevronUp, ChevronDown, User, Phone, MapPin, Bike, CreditCard, Coins, Calendar, MessageSquare } from "lucide-react";

interface SaleDetailModalProps {
    sale: any;
    products: any[];
    onClose: () => void;
}

interface PrintSettings {
    hideCustomer: boolean;
    hidePrice: boolean;
}

// Line Metadata Interface
interface LineMetadata {
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export default function SaleDetailModal({ sale, products, onClose }: SaleDetailModalProps) {
    const [formData, setFormData] = useState({
        customerName: sale.customerName || "",
        customerPhone: sale.customerPhone || "",
        deliveryFee: sale.deliveryFee || 0,
        discountValue: sale.discountValue || 0,
        memo: sale.memo || "",
        deliveryZone: sale.deliveryZone || "",
        reservationNumber: sale.reservationNumber || "",
        address: sale.address || "",
        pickupType: sale.pickupType || "PICKUP", // Default to PICKUP
        paymentStatus: sale.paymentStatus || "",
        utilizationDate: sale.utilizationDate ? format(new Date(sale.utilizationDate), "yyyy-MM-dd HH:mm") : "",
        requestNote: sale.requestNote || "",
        visitor: sale.visitor || "",
    });

    // Product DB Integration
    const [allProducts, setAllProducts] = useState<any[]>([]); // Using any for simplicity as interface was skipped
    const [detectedTotal, setDetectedTotal] = useState(0); // Auto-calculated item total

    // Line-by-line metadata state
    const [lineMetadata, setLineMetadata] = useState<(LineMetadata | null)[]>([]);

    // 텍스트 모드를 위한 상태
    // 초기값: memo에 내용이 있으면 그것을 쓰고, items가 있으면 items를 우선시할 수도 있지만
    // 사용자가 "그대로 전표로" 모드이므로 memo가 핵심 컨텐츠가 됨.
    // 만약 items가 있다면 그것을 텍스트로 변환해서 초기값으로 넣어줄 수도 있음.
    const [rawTextLines, setRawTextLines] = useState<string[]>([]);
    const [checkedLines, setCheckedLines] = useState<boolean[]>([]);

    // 라인 타입 정의 및 분석 함수
    type LineType = 'NAME' | 'PHONE' | 'ADDRESS' | 'MENU' | 'PRICE' | 'META' | 'PAYMENT' | 'NOTE' | 'ZONE' | 'UNKNOWN';

    const analyzeLineType = (line: string): LineType => {
        const normLine = line.replace(/\s+/g, "");
        if (!normLine) return 'UNKNOWN';

        // 1. META (Header labels)
        if (/^(예약자|주문자|전화번호|주소|배송지|결제상태|요청사항|예약번호|유입경로|주문상태|결제수단)$/.test(normLine)) return 'META';
        if (normLine.includes("입력정보") || normLine.includes("상세정보")) return 'META';

        // 2. Exact Match with Sale Fields (Reverse Lookup)
        // Address
        if (sale.address && normLine.includes(sale.address.replace(/\s+/g, ""))) return 'ADDRESS';
        if (line.includes("주소") || line.includes("배송지")) {
            // If header matches, valid value might be next line, handled in next step or if value is in same line
            if (sale.address && (line.includes(sale.address) || normLine.includes(sale.address.replace(/\s+/g, "")))) return 'ADDRESS';
        }

        // Phone
        if (sale.customerPhone && (normLine.includes(sale.customerPhone.replace(/-/g, "")) || line.includes(sale.customerPhone))) return 'PHONE';
        if (/010-\d{3,4}-\d{4}/.test(line)) return 'PHONE';

        // Name
        if (sale.customerName && normLine.includes(sale.customerName.replace(/\s+/g, ""))) return 'NAME';

        // Payment Status
        if (sale.paymentStatus && normLine.includes(sale.paymentStatus.replace(/\s+/g, ""))) return 'PAYMENT';
        if (line.includes("결제상태") || line.includes("입금상태")) return 'PAYMENT'; // Heuristic

        // Delivery Zone / Fee
        if ((line.includes("배달팁") || line.includes("배달료")) && /\d/.test(line)) return 'ZONE';
        if (sale.deliveryZone && normLine.includes(sale.deliveryZone.replace(/\s+/g, ""))) return 'ZONE';

        // Request Note
        // Note: requestNote often is long, so partial match might be tricky.
        if (sale.requestNote && normLine.includes(sale.requestNote.replace(/\s+/g, ""))) return 'NOTE';

        // 3. MENU & PRICE
        // Check Price pattern
        if (/[0-9,]+원$/.test(line.trim())) return 'PRICE';

        // Check Product Name Match
        if (allProducts.some(p => normLine.includes(p.name.replace(/\s+/g, "")))) return 'MENU';

        return 'UNKNOWN';
    };

    // 타입에 따른 아이콘 렌더링 컴포넌트
    const LineTypeIcon = ({ line }: { line: string }) => {
        const type = analyzeLineType(line);
        switch (type) {
            case 'NAME': return <div className="mt-1.5 p-0.5 bg-blue-100 rounded text-blue-600 shrink-0" title="이름으로 인식됨"><User className="w-3 h-3" /></div>;
            case 'PHONE': return <div className="mt-1.5 p-0.5 bg-green-100 rounded text-green-600 shrink-0" title="전화번호로 인식됨"><Phone className="w-3 h-3" /></div>;
            case 'ADDRESS': return <div className="mt-1.5 p-0.5 bg-purple-100 rounded text-purple-600 shrink-0" title="주소로 인식됨"><MapPin className="w-3 h-3" /></div>;
            case 'MENU': return <div className="mt-1.5 p-0.5 bg-amber-100 rounded text-amber-600 shrink-0" title="메뉴로 인식됨"><Bike className="w-3 h-3" /></div>;
            case 'PRICE': return <div className="mt-1.5 p-0.5 bg-slate-100 rounded text-slate-400 shrink-0" title="가격 정보"><Coins className="w-3 h-3" /></div>;
            case 'PAYMENT': return <div className="mt-1.5 p-0.5 bg-emerald-100 rounded text-emerald-600 shrink-0" title="결제정보"><CreditCard className="w-3 h-3" /></div>;
            case 'NOTE': return <div className="mt-1.5 p-0.5 bg-orange-100 rounded text-orange-600 shrink-0" title="요청사항"><MessageSquare className="w-3 h-3" /></div>;
            case 'META': return <div className="mt-1.5 p-0.5 bg-slate-100 rounded text-slate-400 shrink-0" title="메타 정보(헤더)"><ListChecks className="w-3 h-3" /></div>;
            case 'ZONE': return <div className="mt-1.5 p-0.5 bg-slate-100 rounded text-slate-500 shrink-0" title="배달팁/구역"><Coins className="w-3 h-3" /></div>;
            default: return <div className="w-4 h-4 shrink-0" />;
        }
    };

    // items가 존재하면 그것을 텍스트 줄로 변환해서 보여줄지, 아니면 memo를 보여줄지 결정
    useEffect(() => {
        if (sale.memo && sale.memo.trim().length > 0) {
            const lines = sale.memo.split('\n');
            setRawTextLines(lines);

            // [Smart Init] 타입 분석 기반 체크 해제 로직
            const initialChecks = lines.map((line: string) => {
                const type = analyzeLineType(line);

                // 정보성 라인들은 모두 숨김(체크 해제)하여 전표 본문을 깔끔하게 유지
                // Address, Payment, Note, Zone added
                if (['NAME', 'PHONE', 'ADDRESS', 'META', 'PAYMENT', 'NOTE', 'ZONE'].includes(type)) return false;

                // 가격 정보도 보통 메뉴 옆에 표시되거나 합계에 포함되므로 텍스트 라인에서는 숨김
                if (type === 'PRICE') return false;

                // 메뉴는 전표에 표시하는 것이 기본
                if (type === 'MENU') return true;

                // 알 수 없는 라인은 표시 (혹시 중요한 메모일 수 있으므로)
                return true;
            });
            setCheckedLines(initialChecks);

        } else if (sale.items && sale.items.length > 0) {
            // 기존 아이템이 있다면 텍스트로 변환해서 초기 세팅
            const lines = sale.items.map((item: any) =>
                `${item.product ? item.product.name : (item.customName || "알 수 없는 상품")} ${item.quantity > 1 ? ` ${item.quantity}개` : ""}  ${item.price > 0 ? (item.price * item.quantity).toLocaleString() + "원" : ""}`
            );
            setRawTextLines(lines);
            setCheckedLines(new Array(lines.length).fill(true));
        }
    }, [sale, allProducts]);

    const [pasteText, setPasteText] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Print Settings State
    const [printSettings, setPrintSettings] = useState<PrintSettings>({
        hideCustomer: false,
        hidePrice: false,
    });

    // Load settings from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("print_settings_v2");
        if (saved) {
            try {
                setPrintSettings(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse print settings", e);
            }
        }
    }, []);

    // Save settings to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem("print_settings_v2", JSON.stringify(printSettings));
    }, [printSettings]);

    // Fetch Products on mount
    useEffect(() => {
        getAllProducts().then(products => {
            setAllProducts(products);
        });
    }, []);

    // Calculate Driven Amount whenever lines or products change
    useEffect(() => {
        if (allProducts.length === 0) return;

        let total = 0;
        const newMetadata: (LineMetadata | null)[] = new Array(rawTextLines.length).fill(null);

        // Sort products by name length descending to match longest names first
        const sortedProducts = [...allProducts].sort((a, b) => b.name.length - a.name.length);

        rawTextLines.forEach((line, idx) => {
            if (!checkedLines[idx]) return; // Skip unchecked lines

            // Normalize line: remove all spaces for loose matching
            const normalizedLine = line.replace(/\s+/g, "");

            for (const product of sortedProducts) {
                // Normalize product name
                const normalizedProductName = product.name.replace(/\s+/g, "");

                // Check if normalized line includes normalized product name
                if (normalizedLine.includes(normalizedProductName)) {
                    // Match Found!

                    // Quantity Extraction Strategy
                    // Look for digits at the end of the original line (e.g. "Item 2", "Item 2개")
                    const quantityMatch = line.match(/[\s\t](\d+)\s*(개|ea|Box|박스|)?\s*$/i);
                    let quantity = 1;

                    if (quantityMatch) {
                        const parsed = parseInt(quantityMatch[1], 10);
                        // Safety: ignore if it looks like a price (>= 1000)
                        if (parsed < 1000) {
                            quantity = parsed;
                        }
                    } else {
                        // Fallback: search for single digit 1-9 surrounded by spaces?
                        const singleDigit = line.match(/[\s\t](\d+)[\s\t]/);
                        if (singleDigit) {
                            const parsed = parseInt(singleDigit[1], 10);
                            if (parsed < 1000) quantity = parsed;
                        }
                    }

                    const linePrice = product.price * quantity;
                    total += linePrice;

                    newMetadata[idx] = {
                        productName: product.name,
                        quantity: quantity,
                        unitPrice: product.price,
                        totalPrice: linePrice
                    };

                    break; // Stop matching other products for this line
                }
            }
        });

        setDetectedTotal(total);
        setLineMetadata(newMetadata);
    }, [rawTextLines, checkedLines, allProducts]);

    const toggleSetting = (key: keyof PrintSettings) => {
        setPrintSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handlePrint = () => {
        window.print();
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // 체크된 라인만 합쳐서 memo로 저장
            const finalMemo = rawTextLines.filter((_, idx) => checkedLines[idx]).join('\n');

            await updateSale(sale.id, {
                ...formData,
                memo: finalMemo,
                // 텍스트 모드 저장 시 기존 items는 삭제 (빈 배열 전송)
                // 만약 기존 items를 유지하고 싶다면 sale.items를 그대로 보내거나 해야 하지만
                // "수기 전표" 컨셉상 텍스트가 메인이므로 items는 제거하는 것이 혼동이 없음.
                items: []
            });
            // Date handling for updateSale might need conversion if schema expects Date object for utilizationDate
            // Current implementation plan assumes text input but schema has DateTime?.
            // We need to parse it or pass it as string if the action handles it.
            // Let's check updateSale action signature or schema.
            // Oh, wait. formData.utilizationDate is string. Schema expects DateTime probably.
            // Let's check schema again. `utilizationDate DateTime?`.
            // So we need to convert string back to Date object before sending if updateSale expects plain object matching schema.
            // Or change updateSale to handle string.
            // Assuming updateSale uses server action that accepts partial Sale.
            // Let's peek at updateSale action to be safe.
            alert("저장되었습니다.");
        } catch (error) {
            console.error(error);
            alert("저장 중 오류가 발생했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    const [enableSmartParsing, setEnableSmartParsing] = useState(true);

    // Load smart parsing setting
    useEffect(() => {
        const saved = localStorage.getItem("smart_parsing_enabled");
        if (saved !== null) {
            setEnableSmartParsing(JSON.parse(saved));
        }
    }, []);

    // Save smart parsing setting
    useEffect(() => {
        localStorage.setItem("smart_parsing_enabled", JSON.stringify(enableSmartParsing));
    }, [enableSmartParsing]);

    const handleApplyText = () => {
        if (!pasteText.trim()) return;

        let lines = pasteText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        if (!enableSmartParsing) {
            // 스마트 파싱 꺼짐: 단순히 텍스트를 리스트에 추가
            const combinedLines = [...rawTextLines, ...lines];
            setRawTextLines(combinedLines);
            setCheckedLines([...checkedLines, ...new Array(lines.length).fill(true)]);
            setPasteText("");
            return;
        }

        // Metadata Extraction Logic
        const newFormData = { ...formData };
        const linesToRemove: Set<number> = new Set();

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // 1. Phone Number (010-xxxx-xxxx)
            const phoneMatch = line.match(/010-\d{3,4}-\d{4}/);
            let lineWithoutPhone = line;
            if (phoneMatch) {
                newFormData.customerPhone = phoneMatch[0];
                linesToRemove.add(i);
                // 전화번호를 지운 텍스트를 이름 추출용으로 준비
                lineWithoutPhone = line.replace(/010-\d{3,4}-\d{4}/, "").trim();
            }

            // 2. Customer Name
            if (line.match(/(주문자|예약자|성함|이름)/)) {
                // 시도 1: 같은 줄에서 추출 (전화번호가 제거된 텍스트 사용)
                let namePart = lineWithoutPhone.replace(/(주문자|예약자|성함|이름)/g, "").replace(/[:\(\)\[\]]/g, "").trim();

                // "홍 길 동" 처럼 이름 사이에 공백이 있는 경우 제거
                namePart = namePart.replace(/\s+/g, "");

                // 입력정보 등 placeholder 제외
                if (namePart.length > 1 && namePart.length < 10 && !/\d/.test(namePart) && !namePart.includes("입력정보")) {
                    newFormData.customerName = namePart;
                    linesToRemove.add(i);
                } else if (namePart.length === 0 || namePart.includes("입력정보")) {
                    // 시도 2: 값이 비어있다면 다음 줄 확인 (Label \n Value 형태)
                    // 단, 이 경우는 현재 줄에 전화번호가 없었거나, 이름만 따로 있는 경우에 유효
                    if (i + 1 < lines.length) {
                        const nextLine = lines[i + 1].trim().replace(/\s+/g, "");
                        if (nextLine.length > 1 && nextLine.length < 10 && !/\d/.test(nextLine)) {
                            newFormData.customerName = nextLine;
                            linesToRemove.add(i);     // Label line
                            linesToRemove.add(i + 1); // Value line
                            i++; // 다음 줄 처리했으므로 인덱스 건너뜀
                        }
                    }
                }
            }

            // 3. Delivery Fee
            if (line.includes("배달팁") || line.includes("배달료")) {
                const feeMatch = line.replace(/[^0-9]/g, '');
                if (feeMatch) {
                    newFormData.deliveryFee = parseInt(feeMatch, 10);
                    linesToRemove.add(i);
                }
            }

            // 4. Discount
            if (line.includes("할인") && (line.includes("금액") || line.includes("쿠폰"))) {
                const discountMatch = line.replace(/[^0-9]/g, '');
                if (discountMatch) {
                    newFormData.discountValue = parseInt(discountMatch, 10);
                    linesToRemove.add(i);
                }
            }
        }

        // Filter out metadata lines from the body text
        const filteredLines = lines.filter((_, idx) => !linesToRemove.has(idx));

        setFormData(newFormData);

        // Append remaining lines to existing ones
        const combinedLines = [...rawTextLines, ...filteredLines];
        setRawTextLines(combinedLines);
        setCheckedLines([...checkedLines, ...new Array(filteredLines.length).fill(true)]);
        setPasteText("");
    };

    const toggleLineCheck = (index: number) => {
        const newChecked = [...checkedLines];
        newChecked[index] = !newChecked[index];
        setCheckedLines(newChecked);
    };

    const handleLineChange = (index: number, value: string) => {
        const newLines = [...rawTextLines];
        newLines[index] = value;
        setRawTextLines(newLines);
    };

    const removeLine = (index: number) => {
        const newLines = rawTextLines.filter((_, i) => i !== index);
        const newChecked = checkedLines.filter((_, i) => i !== index);
        setRawTextLines(newLines);
        setCheckedLines(newChecked);
    };

    const moveLineUp = (index: number) => {
        if (index === 0) return;
        const newLines = [...rawTextLines];
        const newChecked = [...checkedLines];

        // Swap lines
        [newLines[index - 1], newLines[index]] = [newLines[index], newLines[index - 1]];
        // Swap checks
        [newChecked[index - 1], newChecked[index]] = [newChecked[index], newChecked[index - 1]];

        setRawTextLines(newLines);
        setCheckedLines(newChecked);
    };

    const moveLineDown = (index: number) => {
        if (index === rawTextLines.length - 1) return;
        const newLines = [...rawTextLines];
        const newChecked = [...checkedLines];

        // Swap lines
        [newLines[index + 1], newLines[index]] = [newLines[index], newLines[index + 1]];
        // Swap checks
        [newChecked[index + 1], newChecked[index]] = [newChecked[index], newChecked[index + 1]];

        setRawTextLines(newLines);
        setCheckedLines(newChecked);
    };

    const assignLineToField = (index: number, type: 'name' | 'phone' | 'address' | 'delivery' | 'payment' | 'fee' | 'date' | 'note') => {
        const line = rawTextLines[index];
        let assignedValue: string | number = line;

        if (type === 'name') {
            assignedValue = line.replace(/(주문자|예약자|성함|이름)/g, "").replace(/[:\(\)\[\]]/g, "").trim();
            if (!assignedValue) assignedValue = line;
            setFormData(prev => ({ ...prev, customerName: assignedValue as string }));
        } else if (type === 'phone') {
            const phoneMatch = line.match(/010-\d{3,4}-\d{4}/);
            if (phoneMatch) assignedValue = phoneMatch[0];
            setFormData(prev => ({ ...prev, customerPhone: assignedValue as string }));
        } else if (type === 'address') {
            assignedValue = line.replace(/(주소|배송지)/g, "").replace(/[:]/g, "").trim();
            setFormData(prev => ({ ...prev, address: assignedValue as string }));
        } else if (type === 'delivery') {
            if (line.includes("배달") || line.includes("라이더")) {
                assignedValue = "DELIVERY";
            } else {
                assignedValue = "PICKUP";
            }
            setFormData(prev => ({ ...prev, pickupType: assignedValue as string }));
        } else if (type === 'payment') {
            assignedValue = line.replace(/(결제|입금|상태)/g, "").replace(/[:]/g, "").trim();
            setFormData(prev => ({ ...prev, paymentStatus: assignedValue as string }));
        } else if (type === 'fee') {
            // Change: Assign to deliveryZone instead of deliveryFee (User Request)
            // Clean up common prefixes
            assignedValue = line.replace(/(배달팁|배달료|배달비|배달)/g, "").replace(/[:]/g, "").trim();
            setFormData(prev => ({ ...prev, deliveryZone: assignedValue as string }));
        } else if (type === 'date') {
            // Try to keep as is, or remove prefixes like "일시:", "시간:"
            assignedValue = line.replace(/(일시|시간|날짜|이용)/g, "").replace(/[:]/g, "").trim();
            setFormData(prev => ({ ...prev, utilizationDate: assignedValue as string }));
        } else if (type === 'note') {
            // Request note
            assignedValue = line.replace(/(요청|메모|사항)/g, "").replace(/[:]/g, "").trim();
            setFormData(prev => ({ ...prev, requestNote: assignedValue as string }));
        }

        // 라인 유지: 삭제 대신 체크를 해제하여 전표 본문에서는 숨김 처리
        const newChecked = [...checkedLines];
        newChecked[index] = false;
        setCheckedLines(newChecked);
        // removeLine(index);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === "deliveryFee" || name === "discountValue" ? Number(value) : value
        }));
    };

    // [New] Auto-set delivery fee based on deliveryZone
    useEffect(() => {
        if (!formData.deliveryZone || allProducts.length === 0) return;

        const zoneName = formData.deliveryZone.trim().replace(/\s+/g, "").toLowerCase(); // Normalize input

        // Find product that matches the zone name (loose match)
        // User example: "D zone" -> Product: "D zone" (price 6600)
        // Or "D zone 1" -> might match "D zone" if we check includes
        const matchedProduct = allProducts.find(p => {
            const pName = p.name.replace(/\s+/g, "").toLowerCase();
            return zoneName.includes(pName) || pName.includes(zoneName);
        });

        if (matchedProduct) {
            // Only update if fee is 0 or different? 
            // Better to update to reflect user intention, but maybe give feedback?
            // For now, simple auto-set. User can override manually if needed.
            setFormData(prev => {
                // If the fee is already set to this amount, don't trigger re-render loop (though setFormData handles this optimization)
                if (prev.deliveryFee === matchedProduct.price) return prev;
                return { ...prev, deliveryFee: matchedProduct.price };
            });
        }
    }, [formData.deliveryZone, allProducts]);

    // Calculate totals - 텍스트 모드에서는 자동 계산된 detectedTotal 사용
    const itemsTotal = detectedTotal;
    const totalAmount = itemsTotal + Number(formData.deliveryFee) - Number(formData.discountValue);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm print:bg-white print:static print:block overflow-hidden">
            <div className="bg-white w-full max-w-4xl mx-auto rounded-3xl shadow-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none print:rounded-none flex flex-col md:flex-row max-h-[85vh] min-h-0">

                {/* --- 왼쪽: 입력 및 설정 영역 (인쇄 시 숨김) --- */}
                <div className="w-full md:w-1/2 bg-slate-50 flex flex-col border-r border-slate-200 print:hidden min-h-0 overflow-hidden">
                    <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
                        <h2 className="font-bold text-lg">전표 내용 작성</h2>
                        <button onClick={onClose} className="md:hidden p-2">✕</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 overscroll-contain">
                        {/* 1. 텍스트 붙여넣기 */}
                        <div className="mb-6">
                            <label className="text-sm font-bold text-slate-700 mb-2 flex items-center justify-between">
                                <div className="flex items-center">
                                    <ClipboardPaste className="w-4 h-4 mr-2 text-emerald-500" />
                                    텍스트 붙여넣기 (Ctrl+V)
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="smartParsing"
                                        checked={enableSmartParsing}
                                        onChange={(e) => setEnableSmartParsing(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer mr-2"
                                    />
                                    <label htmlFor="smartParsing" className="text-xs font-medium text-slate-500 cursor-pointer select-none">
                                        스마트 자동 분류 사용
                                    </label>
                                </div>
                            </label>
                            <textarea
                                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none mb-2"
                                rows={4}
                                placeholder="네이버 예약 내용이나 주문 텍스트를 여기에 붙여넣으세요."
                                value={pasteText}
                                onChange={(e) => setPasteText(e.target.value)}
                            />
                            <button
                                onClick={handleApplyText}
                                disabled={!pasteText.trim()}
                                className="w-full py-3 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors disabled:opacity-50"
                            >
                                <ArrowDown className="w-4 h-4 inline mr-2" />
                                아래 리스트에 추가하기
                            </button>
                        </div>

                        <div className="border-t border-slate-200 my-6" />

                        {/* 2. 라인별 편집 및 선택 */}
                        <div>
                            <label className="text-sm font-bold text-slate-700 mb-2 flex items-center justify-between">
                                <div className="flex items-center">
                                    <ListChecks className="w-4 h-4 mr-2 text-blue-500" />
                                    전표에 표시할 내용 선택
                                </div>
                                <span className="text-xs text-slate-400 font-normal">체크 해제 시 인쇄 제외</span>
                            </label>

                            <div className="space-y-2 bg-white rounded-xl border border-slate-200 p-2 min-h-[200px]">
                                {rawTextLines.length === 0 ? (
                                    <div className="text-center text-slate-400 py-10 text-sm">
                                        표시할 내용이 없습니다.<br />위에서 텍스트를 추가해주세요.
                                    </div>
                                ) : (
                                    rawTextLines.map((line, idx) => (
                                        <div key={idx} className={`flex items-start gap-2 p-2 rounded-lg transition-colors ${checkedLines[idx] ? 'bg-blue-50/50' : 'bg-slate-50 opacity-50'}`}>
                                            <LineTypeIcon line={line} />
                                            <input
                                                type="checkbox"
                                                checked={checkedLines[idx]}
                                                onChange={() => toggleLineCheck(idx)}
                                                className="mt-1.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={line}
                                                onChange={(e) => handleLineChange(idx, e.target.value)}
                                                className="flex-1 bg-transparent border-none text-sm focus:ring-0 p-0" // outline-none removed to confirm focus
                                            />
                                            {/* 순서 변경 및 할당 버튼 */}
                                            <div className="flex flex-col gap-0.5 ml-2">
                                                {/* 순서 변경 */}
                                                <div className="flex gap-1 mb-1">
                                                    <button
                                                        onClick={() => moveLineUp(idx)}
                                                        disabled={idx === 0}
                                                        className="text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:cursor-not-allowed"
                                                        title="위로 이동"
                                                    >
                                                        <ChevronUp className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => moveLineDown(idx)}
                                                        disabled={idx === rawTextLines.length - 1}
                                                        className="text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:cursor-not-allowed"
                                                        title="아래로 이동"
                                                    >
                                                        <ChevronDown className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                {/* 수동 할당 */}
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => assignLineToField(idx, 'name')}
                                                        className="p-1 bg-slate-100 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
                                                        title="이 줄을 예약자 이름으로 지정"
                                                    >
                                                        <User className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => assignLineToField(idx, 'phone')}
                                                        className="p-1 bg-slate-100 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
                                                        title="이 줄을 전화번호로 지정"
                                                    >
                                                        <Phone className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => assignLineToField(idx, 'address')}
                                                        className="p-1 bg-slate-100 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
                                                        title="이 줄을 주소로 지정"
                                                    >
                                                        <MapPin className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => assignLineToField(idx, 'delivery')}
                                                        className="p-1 bg-slate-100 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
                                                        title="이 줄을 배달방법으로 지정"
                                                    >
                                                        <Bike className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => assignLineToField(idx, 'payment')}
                                                        className="p-1 bg-slate-100 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
                                                        title="이 줄을 결제상태로 지정"
                                                    >
                                                        <CreditCard className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => assignLineToField(idx, 'fee')}
                                                        className="p-1 bg-slate-100 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
                                                        title="이 줄을 배달구역(Zone)으로 지정"
                                                    >
                                                        <Coins className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => assignLineToField(idx, 'date')}
                                                        className="p-1 bg-slate-100 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
                                                        title="이 줄을 이용일시로 지정"
                                                    >
                                                        <Calendar className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => assignLineToField(idx, 'note')}
                                                        className="p-1 bg-slate-100 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
                                                        title="이 줄을 요청사항으로 지정"
                                                    >
                                                        <MessageSquare className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeLine(idx)}
                                                className="text-slate-300 hover:text-rose-500 p-0.5 self-center ml-1"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-500 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isSaving ? "저장 중..." : "💾 현재 상태 저장하기"}
                        </button>
                    </div>
                </div>


                {/* --- 오른쪽: 전표 미리보기 (인쇄 영역) --- */}
                <div className="w-full md:w-1/2 bg-white flex flex-col h-full min-h-0 overflow-hidden">
                    {/* PC 헤더 */}
                    <div className="hidden md:flex px-6 py-4 border-b border-slate-100 justify-between items-center print:hidden shrink-0">
                        <h2 className="font-bold text-slate-700">전표 미리보기</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={handlePrint}
                                className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800"
                            >
                                🖨️ 인쇄
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* 실제 전표 내용 */}
                    <div className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible overscroll-contain">
                        <div className="max-w-[380px] mx-auto print:max-w-none">
                            {/* 전표 헤더 */}
                            <div className="text-center mb-8 border-b-2 border-slate-900 pb-6 print:border-black">
                                <h1 className="text-2xl font-black mb-2 tracking-tight">주문 전표 (RECEIPT)</h1>
                                <p className="text-sm font-bold text-slate-500 print:text-black">
                                    {format(new Date(sale.createdAt), "yyyy-MM-dd HH:mm:ss", { locale: ko })}
                                </p>
                            </div>

                            {/* 기본 정보 */}
                            <div className="space-y-1 mb-6 text-sm">
                                <div className="flex justify-between">
                                    <span className="font-bold text-slate-500 print:text-black w-24">주문번호</span>
                                    <span className="font-mono font-bold flex-1 text-right">{sale.id.slice(-8).toUpperCase()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-slate-500 print:text-black w-24">예약번호</span>
                                    <input
                                        type="text"
                                        name="reservationNumber"
                                        value={formData.reservationNumber}
                                        onChange={handleChange}
                                        className="font-mono font-bold flex-1 text-right bg-transparent border-none p-0 focus:ring-0 text-right print:text-right w-full"
                                        placeholder="-"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-dashed border-slate-300 my-6 print:border-black" />

                            {/* 고객 정보 */}
                            <div className={`mb-6 relative group ${printSettings.hideCustomer ? 'print:hidden' : ''}`}>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 print:text-black">
                                        {formData.customerName ? `예약자 ${formData.customerName}` : "예약자"}
                                    </h3>
                                    <button
                                        onClick={() => toggleSetting('hideCustomer')}
                                        className="print:hidden text-slate-300 hover:text-slate-600 transition-colors"
                                    >
                                        {printSettings.hideCustomer ? <EyeOff className="w-4 h-4 text-rose-500" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <div className={`transition-opacity ${printSettings.hideCustomer ? 'opacity-50' : ''}`}>
                                    <div className="space-y-1">
                                        <input
                                            type="text"
                                            name="utilizationDate"
                                            value={formData.utilizationDate}
                                            onChange={handleChange}
                                            className="text-sm font-bold text-slate-500 w-full bg-transparent border-none p-0 focus:ring-0 print:text-black placeholder-slate-300 mb-2"
                                            placeholder="이용일시 (예: 2024-01-01 12:00)"
                                        />
                                        <div className="flex items-baseline gap-1 mb-2">
                                            <input
                                                type="text"
                                                name="customerName"
                                                value={formData.customerName}
                                                onChange={handleChange}
                                                className="font-black text-2xl w-full bg-transparent border-none p-0 focus:ring-0 placeholder-slate-300"
                                                placeholder="고객명"
                                            />
                                            <input
                                                type="text"
                                                name="visitor"
                                                value={formData.visitor}
                                                onChange={handleChange}
                                                className="text-sm font-bold text-slate-500 w-full bg-transparent border-none p-0 focus:ring-0 print:text-black placeholder-slate-300"
                                                placeholder="(방문자 정보)"
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-0.5 print:text-blue-600">전화번호</div>
                                            <input
                                                type="text"
                                                name="customerPhone"
                                                value={formData.customerPhone}
                                                onChange={handleChange}
                                                className="text-3xl font-black text-blue-600 w-full bg-transparent border-none p-0 focus:ring-0 print:text-blue-600 placeholder-slate-300"
                                                placeholder="연락처"
                                            />
                                        </div>

                                        {/* 요청사항 - 강조 */}
                                        <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 print:bg-white print:border-slate-300">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 print:text-black">요청사항</div>
                                            <textarea
                                                name="requestNote"
                                                value={formData.requestNote}
                                                onChange={handleChange}
                                                rows={2}
                                                className="text-xl font-black text-slate-800 w-full bg-transparent border-none p-0 focus:ring-0 print:text-black placeholder-slate-300 leading-tight"
                                                placeholder="요청사항을 입력하세요"
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex gap-4">
                                                <div className="flex-1">
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 print:text-black">구분</div>
                                                    <select
                                                        name="pickupType"
                                                        value={formData.pickupType}
                                                        onChange={(e) => setFormData({ ...formData, pickupType: e.target.value })}
                                                        className="w-full bg-transparent border-none p-0 text-lg focus:ring-0 cursor-pointer font-black text-slate-700 print:appearance-none print:text-black"
                                                    >
                                                        <option value="PICKUP">픽업/포장</option>
                                                        <option value="DELIVERY">배달</option>
                                                    </select>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 print:text-black">결제상태</div>
                                                    <input
                                                        type="text"
                                                        name="paymentStatus"
                                                        value={formData.paymentStatus}
                                                        onChange={handleChange}
                                                        className="w-full bg-transparent border-none p-0 text-lg focus:ring-0 font-black text-slate-700 placeholder-slate-300 print:text-black"
                                                        placeholder="미입력"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 print:text-black">배달 주소</div>
                                                <textarea
                                                    name="address"
                                                    value={formData.address}
                                                    onChange={handleChange}
                                                    rows={2}
                                                    className="text-2xl font-black text-slate-800 w-full bg-transparent border-none p-0 focus:ring-0 print:text-black placeholder-slate-300 leading-tight"
                                                    placeholder="주소 (입력 시 표시)"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={`border-t border-dashed border-slate-300 my-6 print:border-black ${printSettings.hideCustomer ? 'print:hidden' : ''}`} />

                            {/* 주문 상세 내용 (Main Content) */}
                            <div className="mb-6">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 print:text-black">주문 상세</h3>
                                <div className="text-sm font-medium leading-relaxed whitespace-pre-wrap font-sans">
                                    {rawTextLines.map((line, idx) => {
                                        if (!checkedLines[idx]) return null;

                                        const meta = lineMetadata[idx];
                                        // 원문에 이미 가격이 포함되어 있다면 중복 표시 방지
                                        const hasPriceInLine = meta && (line.includes(meta.totalPrice.toLocaleString()) || line.includes((meta.totalPrice / 1000).toString() + "k"));

                                        return (
                                            <div key={idx} className="group mb-2 last:mb-0 break-words flex justify-between items-start hover:bg-slate-50 p-1 -mx-1 rounded-lg transition-colors">
                                                <div className="flex gap-3 flex-1">
                                                    <div className="mt-2 w-1 h-1 rounded-full bg-slate-300 group-hover:bg-blue-400 shrink-0" />
                                                    <span className="text-slate-700 leading-snug">{line}</span>
                                                </div>
                                                {meta && !hasPriceInLine && (
                                                    <span className="font-black whitespace-nowrap ml-4 text-rose-500 print:text-rose-600">
                                                        {meta.totalPrice.toLocaleString()}원
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* 체크된 라인이 하나도 없을 때 안내 */}
                                    {rawTextLines.every((_, idx) => !checkedLines[idx]) && rawTextLines.length > 0 && (
                                        <p className="text-slate-300 text-center italic py-4 print:hidden">
                                            선택된 내용이 없습니다. 왼쪽에서 표시할 항목을 체크해주세요.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className={`border-t-2 border-slate-900 my-6 print:border-black ${printSettings.hidePrice ? 'print:hidden' : ''}`} />

                            {/* 결제 요약 */}
                            <div className={`space-y-2 text-sm mb-8 ${printSettings.hidePrice ? 'print:hidden' : ''}`}>
                                <div className="flex items-center justify-between mb-2 print:hidden">
                                    <span className="text-xs font-bold text-slate-400">결제 정보</span>
                                    <button
                                        onClick={() => toggleSetting('hidePrice')}
                                        className="text-slate-300 hover:text-slate-600 transition-colors"
                                    >
                                        {printSettings.hidePrice ? <EyeOff className="w-4 h-4 text-rose-500" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>

                                <div className={`transition-opacity ${printSettings.hidePrice ? 'opacity-50' : ''}`}>
                                    {/* 텍스트 모드이므로 총 주문금액 자동계산 불가 -> 보여주지 않거나, 사용자가 수동 입력하게 해야 함.
                                        여기서는 배달팁과 할인만 보여주고 합계는 배달/할인만 반영된 값으로 보여줌.
                                        필요하다면 '기본금액' 입력 필드를 추가할 수도 있음.
                                    */}
                                    <div className="flex justify-between items-center text-slate-500 print:text-black mb-1">
                                        <span className="w-24 text-xs">상품 합계</span>
                                        <span className="flex-1 text-right font-bold text-slate-700 print:text-black">
                                            {detectedTotal > 0 ? `${detectedTotal.toLocaleString()}원` : "-"}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center text-slate-500 print:text-black">
                                        <div className="flex items-center">
                                            <span className="mr-2 text-xs">배달구역:</span>
                                            <div className="w-24 relative">
                                                <input
                                                    type="text"
                                                    name="deliveryZone"
                                                    list="deliveryZones"
                                                    value={formData.deliveryZone || ""}
                                                    onChange={handleChange}
                                                    className="w-full bg-transparent border-none p-0 focus:ring-0 text-left placeholder-slate-400 print:placeholder-transparent"
                                                    placeholder="배달팁"
                                                />
                                                <div className="absolute left-0 bottom-0 h-px w-full bg-slate-200 print:hidden" />
                                                <datalist id="deliveryZones">
                                                    <option value="A zone" />
                                                    <option value="B zone" />
                                                    <option value="배달팁" />
                                                </datalist>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-end flex-1">
                                            <span className="mr-1 print:hidden">+</span>
                                            <input
                                                type="number"
                                                name="deliveryFee"
                                                value={formData.deliveryFee}
                                                onChange={handleChange}
                                                className="text-right w-24 bg-transparent border-none p-0 focus:ring-0 print:w-auto"
                                                placeholder="0"
                                            />
                                            <span className="ml-1">원</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-rose-500 print:text-black">
                                        <span className="w-24">할인금액</span>
                                        <div className="flex items-center justify-end flex-1">
                                            <span className="mr-1 print:hidden">-</span>
                                            <input
                                                type="number"
                                                name="discountValue"
                                                value={formData.discountValue}
                                                onChange={handleChange}
                                                className="text-right w-24 bg-transparent border-none p-0 focus:ring-0 text-rose-600 print:w-auto print:text-black"
                                                placeholder="0"
                                            />
                                            <span className="ml-1">원</span>
                                        </div>
                                    </div>

                                    {(Number(formData.deliveryFee) > 0 || Number(formData.discountValue) > 0 || detectedTotal > 0) && (
                                        <div className="flex justify-between items-end pt-4 border-t border-slate-100 mt-4 print:border-black">
                                            <span className="font-black text-xl">총 결제금액</span>
                                            <span className="font-black text-2xl text-emerald-600 print:text-black">{totalAmount.toLocaleString()}원</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
