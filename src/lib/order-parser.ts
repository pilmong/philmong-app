import { Product } from "@prisma/client";

// Types for parsed result
export interface ParsedSaleData {
    customerName?: string;
    customerPhone?: string;
    visitor?: string;
    deliveryFee: number;
    discountValue: number;
    totalAmount: number; // 추가
    memo: string;
    pickupType: string;
    address?: string;
    paymentStatus?: string;
    deliveryZone?: string;
    utilizationDate?: string;
    requestNote?: string;
    items: {
        productId?: string;
        customName?: string;
        name: string; // 추가
        quantity: number;
        price: number;
    }[];
    matchedLines: number[];
}

/**
 * Normalizes text for loose matching (removes spaces)
 */
function normalize(text: string): string {
    return text.replace(/\s+/g, "").toLowerCase();
}

/**
 * Parses raw order text into structured sale data.
 */
export function parseOrderText(text: string, allProducts: any[]): ParsedSaleData {
    let rawLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    const result: ParsedSaleData = {
        deliveryFee: 0,
        discountValue: 0,
        totalAmount: 0, // 초기화
        memo: text,
        pickupType: "PICKUP",
        items: [],
        matchedLines: [],
        paymentStatus: ""
    };

    const linesToRemove: Set<number> = new Set();
    const processedFields: Set<string> = new Set();

    // =========================================================================
    // 0. Naver Reservation Template Engine (Priority)
    // =========================================================================
    const isNaverReservation = rawLines.some(l => l.includes("예약 상세정보") || l.includes("네이버 플레이스") || l.includes("예약자입력정보"));

    if (isNaverReservation) {
        // [1] Pickup Type Detection (Relative Logic)
        // Find "배달 및 픽업 선택"
        const typeIndex = rawLines.findIndex(l => l.includes("배달 및 픽업 선택"));
        if (typeIndex !== -1 && typeIndex + 1 < rawLines.length) {
            const typeValue = rawLines[typeIndex + 1].trim();
            linesToRemove.add(typeIndex);
            linesToRemove.add(typeIndex + 1);

            if (typeValue === "배달") {
                result.pickupType = "DELIVERY";

                // [2] Address Detection (Conditional)
                // Look for "배달 받으실 주소를 기입해주세요" AFTER the type definition
                for (let i = typeIndex + 1; i < rawLines.length; i++) {
                    if (rawLines[i].includes("배달 받으실 주소를 기입해주세요")) {
                        if (i + 1 < rawLines.length) {
                            result.address = rawLines[i + 1].trim();
                            linesToRemove.add(i);     // Label
                            linesToRemove.add(i + 1); // Value
                            linesToRemove.add(i + 2); // "정보 오기입..." warning usually follows
                            processedFields.add('address');
                        }
                        break;
                    }
                }
            } else {
                result.pickupType = "PICKUP";
            }
        }

        // [3] Standard Fields extracting via Anchors
        for (let i = 0; i < rawLines.length; i++) {
            const line = rawLines[i];
            const normLine = normalize(line);

            // Name: "예약자\t김채정" or "예약자" \n "김채정"
            if ((line.startsWith("예약자") || line.startsWith("주문자")) && !processedFields.has('customerName')) {
                // Try tab split first
                const parts = line.split('\t');
                if (parts.length > 1) {
                    const val = parts[parts.length - 1].trim();
                    if (val && val !== "예약자" && val !== "주문자") {
                        result.customerName = val;
                        linesToRemove.add(i);
                        processedFields.add('customerName');
                        continue;
                    }
                }
                // If value on next line? Check heuristics
                // Usually Naver copy is tab separated or single line "Key Value"
                // But let's check next line if current line is just "예약자"
                if (line.trim() === "예약자" && i + 1 < rawLines.length) {
                    result.customerName = rawLines[i + 1].trim();
                    linesToRemove.add(i);
                    linesToRemove.add(i + 1);
                    processedFields.add('customerName');
                    continue;
                }
            }

            // Phone: "전화번호\t010..."
            if (line.startsWith("전화번호") && !processedFields.has('customerPhone')) {
                const phoneMatch = line.match(/010-\d{3,4}-\d{4}/);
                if (phoneMatch) {
                    result.customerPhone = phoneMatch[0];
                    linesToRemove.add(i);
                    processedFields.add('customerPhone');
                    continue;
                }
                // Next line?
                if (i + 1 < rawLines.length) {
                    const nextMatch = rawLines[i + 1].match(/010-\d{3,4}-\d{4}/);
                    if (nextMatch) {
                        result.customerPhone = nextMatch[0];
                        linesToRemove.add(i);
                        linesToRemove.add(i + 1);
                        processedFields.add('customerPhone');
                        continue;
                    }
                }
            }

            // Utilization Date: "이용일시\t2026..."
            if (line.startsWith("이용일시") && !processedFields.has('utilizationDate')) {
                const dateVal = line.replace("이용일시", "").trim();
                if (dateVal.length > 5) {
                    result.utilizationDate = dateVal;
                    linesToRemove.add(i);
                    processedFields.add('utilizationDate');
                }
            }

            // Visitor: "방문자\t윤임수(010...)"
            if (line.startsWith("방문자") && !processedFields.has('visitor')) {
                const visitorVal = line.replace("방문자", "").trim();
                if (visitorVal) {
                    result.visitor = visitorVal;
                    linesToRemove.add(i);
                    processedFields.add('visitor');
                }
            }

            // Request Note: "요청사항\t문 앞에..."
            if (line.startsWith("요청사항")) {
                const noteVal = line.replace("요청사항", "").trim();
                // If empty, might be next line? Or just empty.
                if (noteVal) {
                    result.requestNote = noteVal;
                    linesToRemove.add(i);
                    processedFields.add('requestNote');
                }
            }

            // Payment Status: "결제상태\t결제완료"
            if (line.startsWith("결제상태")) {
                const payVal = line.replace("결제상태", "").trim();
                if (payVal) {
                    result.paymentStatus = payVal;
                    linesToRemove.add(i);
                    processedFields.add('paymentStatus');
                }
            }

            // Auto Clean known headers to reduce noise
            if (/^(예약번호|예약유형|이메일|예약내역|상품|인원|유입경로|예약자입력정보|결제\/환불정보|NPay주문번호|결제수단|원결제금액|예약확정 안내|직원메모|진행이력|파트너센터|확정|신청|완료)$/.test(line.replace(/[0-9\-\.\:\s]/g, ""))) {
                linesToRemove.add(i);
            }
            if (line.includes("정보 오기입") || line.includes("주문해주셔서 감사합니다")) {
                linesToRemove.add(i);
            }
        }

        // [4] Menu Extraction (Range Logic)
        // Find "메뉴" line
        // Content until next known section ("요청사항", "쿠폰", "유입경로" etc)
        const menuHeaderIdx = rawLines.findIndex(l => l === "메뉴" || l.startsWith("메뉴\t"));
        if (menuHeaderIdx !== -1) {
            linesToRemove.add(menuHeaderIdx);

            for (let i = menuHeaderIdx + 1; i < rawLines.length; i++) {
                const line = rawLines[i];
                // Stop conditions
                if (line.startsWith("요청사항") || line.startsWith("쿠폰") || line.startsWith("유입경로")) break;

                // Identify Item
                // Try to match with products
                const normalizedLine = normalize(line);
                let matched = false;

                // 1. Check for "D zone" explicitly as Delivery Zone
                if (line.toLowerCase().includes("zone") || line.includes("구역")) {
                    result.deliveryZone = line; // Or match product logic below
                    // Don't break, treat as item or zone. 
                    // If it's zone product, map it.
                }

                const sortedProducts = [...allProducts].sort((a, b) => b.name.length - a.name.length);
                for (const product of sortedProducts) {
                    const pName = normalize(product.name);
                    if (normalizedLine.includes(pName)) {
                        // Quantity logic: usually "ItemName space Quantity"
                        // e.g. "뚱 매콤꼬마어묵김밥 1"
                        const quantityMatch = line.match(/[\s\t](\d+)\s*$/);
                        let q = 1;
                        if (quantityMatch) {
                            q = parseInt(quantityMatch[1], 10);
                        }

                        result.items.push({
                            productId: product.id,
                            name: product.name, // 이름 추가
                            quantity: q,
                            price: product.basePrice
                        });
                        matched = true;

                        // Check if this is the "D zone" product
                        if (pName.includes("zone") || pName.includes("구역")) {
                            result.deliveryZone = product.name;
                            result.deliveryFee = product.basePrice;
                        }

                        linesToRemove.add(i);
                        result.matchedLines.push(i);
                        break;
                    }
                }

                // If not matched, it might be a modifier or option? 
                // Capture as Custom Item (Unmatched)
                if (!matched && line.length > 1) {
                    // Try to see if this is a price for the previous item
                    const priceMatch = line.match(/^([\d,]+)원$/);
                    if (priceMatch && result.items.length > 0) {
                        const price = parseInt(priceMatch[1].replace(/,/g, ''), 10);
                        // If previous item has 0 price, assign this price
                        const lastItem = result.items[result.items.length - 1];
                        if (lastItem.price === 0) {
                            lastItem.price = price;
                            linesToRemove.add(i);
                            matched = true;
                        }
                    }

                    if (!matched) {
                        // Quantity check for custom item
                        const quantityMatch = line.match(/[\s\t](\d+)\s*$/);
                        let q = 1;
                        if (quantityMatch) {
                            q = parseInt(quantityMatch[1], 10);
                        }

                        result.items.push({
                            customName: line.trim(),
                            name: line.trim(), // 이름 추가
                            quantity: q,
                            price: 0
                        });
                        linesToRemove.add(i);
                    }
                }
            }
        }
    }

    // =========================================================================
    // 1. General Heuristic Parsing (Fallback & Supplement)
    // =========================================================================
    for (let i = 0; i < rawLines.length; i++) {
        const line = rawLines[i];
        if (linesToRemove.has(i)) continue;

        // Phone Number (Priority: Pattern match is strong)
        if (!processedFields.has('customerPhone')) {
            const phoneMatch = line.match(/010-\d{3,4}-\d{4}/);
            if (phoneMatch) {
                result.customerPhone = phoneMatch[0];
                linesToRemove.add(i);
                processedFields.add('customerPhone');
            }
        }

        // Customer Name
        if (!processedFields.has('customerName')) {
            if (line.match(/(주문자|예약자|성함|이름)/)) {
                let namePart = line.replace(/(주문자|예약자|성함|이름|:)/g, "").trim();
                namePart = namePart.replace(/010-\d{3,4}-\d{4}/, "").trim();
                namePart = namePart.replace(/\s+/g, "");

                const isValidName = (n: string) => n.length > 1 && n.length < 10 && !/\d/.test(n) && !n.includes("입력") && !n.includes("정보");

                if (isValidName(namePart)) {
                    result.customerName = namePart;
                    linesToRemove.add(i);
                    processedFields.add('customerName');
                } else if (i + 1 < rawLines.length) {
                    const nextLine = rawLines[i + 1].trim().replace(/\s+/g, "");
                    if (isValidName(nextLine)) {
                        result.customerName = nextLine;
                        linesToRemove.add(i);
                        linesToRemove.add(i + 1);
                        processedFields.add('customerName');
                    }
                }
            }
        }

        // Address
        if (!processedFields.has('address') && line.match(/(주소|배송지)/)) {
            const addressPart = line.replace(/(주소|배송지|:)/g, "").trim();
            if (addressPart.length > 5) {
                result.address = addressPart;
                linesToRemove.add(i);
                processedFields.add('address');
            }
        }

        // Delivery Fee
        if (line.includes("배달팁") || line.includes("배달료") || line.includes("배달비")) {
            const feeMatch = line.replace(/[^0-9]/g, '');
            if (feeMatch) {
                result.deliveryFee = parseInt(feeMatch, 10);
                linesToRemove.add(i);
            }
            const zoneMatch = line.match(/([A-Z]\s*zone|[ABCD]\s*구역)/i);
            if (zoneMatch) {
                result.deliveryZone = zoneMatch[0];
            }
        }

        // Discount
        if (line.includes("할인") && (line.includes("금액") || line.includes("쿠폰"))) {
            const discountMatch = line.replace(/[^0-9]/g, '');
            if (discountMatch) {
                result.discountValue = parseInt(discountMatch, 10);
                linesToRemove.add(i);
            }
        }

        // Visitor
        if (!processedFields.has('visitor') && line.match(/(방문자|수령인)/)) {
            const visitorPart = line.replace(/(방문자|수령인|:)/g, "").trim();
            if (visitorPart.length > 1) {
                result.visitor = visitorPart;
                linesToRemove.add(i);
                processedFields.add('visitor');
            }
        }

        // Utilization Date
        if (!processedFields.has('utilizationDate') && line.match(/(일시|시간|날짜|이용)/)) {
            const dateVal = line.replace(/(일시|시간|날짜|이용|:|\[|\]|\(|\))/g, "").trim();
            if (dateVal.length > 5) {
                result.utilizationDate = dateVal;
                linesToRemove.add(i);
                processedFields.add('utilizationDate');
            }
        }

        // Request Note
        if (!processedFields.has('requestNote') && line.match(/(요청|메모|사항)/)) {
            const notePart = line.replace(/(요청|메모|사항|:)/g, "").trim();
            if (notePart.length > 2) {
                result.requestNote = notePart;
                linesToRemove.add(i);
                processedFields.add('requestNote');
            }
        }

        // Payment Status
        if (!processedFields.has('paymentStatus') && line.match(/(결제|입금|상태)/)) {
            const paymentPart = line.replace(/(결제|입금|상태|:)/g, "").trim();
            if (paymentPart) {
                result.paymentStatus = paymentPart;
                linesToRemove.add(i);
                processedFields.add('paymentStatus');
            }
        }

        // Delivery Type Detection (Fallback)
        if (!result.pickupType || result.pickupType === "PICKUP") {
            if (line.includes("배달") || line.includes("라이더")) {
                result.pickupType = "DELIVERY";
            }
        }

        // Delivery Zone Explicit Line (Fallback)
        if (!result.deliveryZone) {
            if (line.toLowerCase().includes("zone") || line.includes("구역")) {
                const matchedProduct = allProducts.find(p => {
                    const pName = normalize(p.name);
                    const lName = normalize(line);
                    return lName.includes(pName) || pName.includes(lName);
                });
                if (matchedProduct && matchedProduct.name.toLowerCase().includes("zone")) {
                    result.deliveryZone = matchedProduct.name;
                    result.deliveryFee = matchedProduct.basePrice;
                    linesToRemove.add(i);
                }
            }
        }
    }

    // 2. Product Matching (Items - Fallback for non-template lines)
    // Only run if template didn't already pick up items? 
    // Or run on remaining lines.
    const sortedProducts = [...allProducts].sort((a, b) => b.name.length - a.name.length);

    for (let i = 0; i < rawLines.length; i++) {
        if (linesToRemove.has(i)) continue; // Skip metadata lines
        const line = rawLines[i];
        const normalizedLine = normalize(line);

        for (const product of sortedProducts) {
            const normalizedProductName = normalize(product.name);

            if (normalizedLine.includes(normalizedProductName)) {
                // Match Found
                linesToRemove.add(i);
                result.matchedLines.push(i);

                // Quantity
                const quantityMatch = line.match(/[\s\t](\d+)\s*(개|ea|Box|박스|)?\s*$/i);
                let quantity = 1;

                if (quantityMatch) {
                    const parsed = parseInt(quantityMatch[1], 10);
                    if (parsed < 1000) quantity = parsed;
                } else {
                    const singleDigit = line.match(/[\s\t](\d+)[\s\t]/);
                    if (singleDigit) {
                        const parsed = parseInt(singleDigit[1], 10);
                        if (parsed < 1000) quantity = parsed;
                    }
                }

                result.items.push({
                    productId: product.id,
                    name: product.name, // 이름 추가
                    quantity: quantity,
                    price: product.basePrice
                });
                break; // One product per line
            }
        }
    }

    result.memo = rawLines.join('\n');

    // 최종 금액 계산
    const itemsTotal = result.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    result.totalAmount = itemsTotal + result.deliveryFee - result.discountValue;

    return result;
}
