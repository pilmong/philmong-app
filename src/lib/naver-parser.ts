export interface ParsedItem {
    name: string;
    quantity: number;
    price: number;
}

export interface ParsedSale {
    customerName?: string;
    customerPhone?: string;
    items: ParsedItem[];
    deliveryFee: number;
    discountValue: number;
    totalAmount: number;
    utilizationDate?: string; // 추가: 이용 일시
    reservationNumber?: string; // 추가: 예약 번호
    requestNote?: string; // 추가: 요청사항
    memo?: string;
}

/**
 * 네이버 예약 정보를 파싱하여 객체로 반환합니다.
 * @param text 네이버 예약 상세 정보 복사본
 */
export function parseNaverReservation(text: string): ParsedSale {
    const lines = text.split('\n');
    const result: ParsedSale = {
        items: [],
        deliveryFee: 0,
        discountValue: 0,
        totalAmount: 0,
        memo: ""
    };

    let isMenuSection = false;
    let isInputSection = false;
    let isPaymentSection = false;
    let deliveryStatus = "";
    let capturedAddress: string[] = [];
    let lastMenuIndex = -1;

    lines.forEach((line, index) => {
        let trimmed = line.trim();
        if (!trimmed) return;

        // 별표(*) 또는 도트(•) 등 기호 제거 (단, 마이너스(-) 기호는 가격/할인 표시이므로 보존)
        trimmed = trimmed.replace(/^[*•]\s*/, '').trim();
        if (!trimmed) return;

        // HTML 주석 및 태그, 특정 불필요한 라인 필터링
        if (trimmed.startsWith('<!--') || trimmed.startsWith('<') || trimmed.includes('자세히 보기') || trimmed.includes('스마트플레이스') || trimmed.includes('발신전용입니다') || trimmed.includes('고객센터')) return;

        // --- 섹션 탐지 (상태 머신) ---
        if (trimmed === "메뉴" || (trimmed.includes("예약내역") && !isMenuSection)) {
            isMenuSection = true; isInputSection = false; isPaymentSection = false;
            return;
        }
        if (trimmed.includes("예약자입력정보")) {
            isMenuSection = false; isInputSection = true; isPaymentSection = false;
            return;
        }
        if (trimmed.includes("결제정보")) {
            isMenuSection = false; isInputSection = false; isPaymentSection = true;
            return;
        }
        if (trimmed.includes("진행이력") || trimmed.includes("직원메모") || trimmed.includes("Copyright")) {
            isMenuSection = false; isInputSection = false; isPaymentSection = false;
        }

        // --- 1. 기본 정보 추출 (예약자, 연락처, 이용일시, 예약번호) ---
        if (trimmed.startsWith("예약자") && !trimmed.includes("입력정보")) {
            const val = trimmed.replace(/^예약자/, "").replace(/^[:：\s\t]+/, "").trim();
            if (val && !result.customerName) result.customerName = val;
        }
        if (trimmed.match(/^(전화번호|연락처)/)) {
            const val = trimmed.replace(/^(전화번호|연락처)/, "").replace(/^[:：\s\t]+/, "").trim();
            if (val && !result.customerPhone) result.customerPhone = val;
        }
        if (trimmed.includes("이용일시")) {
            const val = trimmed.replace("이용일시", "").replace(/^[:：\s\t]+/, "").trim();
            if (val) result.utilizationDate = val;
        }
        if (trimmed.startsWith("예약번호")) {
            const val = trimmed.replace("예약번호", "").replace(/^[:：\s\t]+/, "").trim();
            if (val) result.reservationNumber = val;
        }
        if (trimmed.startsWith("요청사항")) {
            const val = trimmed.replace("요청사항", "").replace(/^[:：\s\t]+/, "").trim();
            if (val) result.requestNote = val;
        }

        // --- 2. 예약자 입력 정보 (픽업/배달 및 주소) ---
        if (isInputSection || trimmed.includes("배달") || trimmed.includes("픽업")) {
            if (trimmed === "픽업" || trimmed === "배달") {
                deliveryStatus = trimmed;
            } else if (trimmed.includes("배달 받으실 주소를 기입해주세요") || (deliveryStatus === "배달" && trimmed.includes("동") && trimmed.includes("호"))) {
                // 주소 패턴인 경우 수집 (안내 문구 제외)
                if (!trimmed.includes("입력해주세요") && !trimmed.includes("정보 오기입") && !trimmed.includes("사고는 배상하지")) {
                    capturedAddress.push(trimmed);
                }
            } else if (isInputSection && !["확인", "배달 및 픽업 선택"].includes(trimmed)) {
                // 기타 예약자 입력값 수집 (주소 문구 필터링)
                const isGuideText = trimmed.includes("입력해주세요") || trimmed.includes("정보 오기입") || trimmed.includes("사고는 배상하지");
                if (deliveryStatus === "배달" && trimmed.length > 5 && !capturedAddress.includes(trimmed) && !isGuideText) {
                    capturedAddress.push(trimmed);
                }
            }
        }

        // --- 3. 메뉴 아이템 및 가격 추출 ---
        if (isMenuSection || isPaymentSection) {
            let name = "";
            let quantity = 1;

            const menuMatch = trimmed.match(/^(.+?)\s+(\d+)$/);
            if (menuMatch) {
                name = menuMatch[1].trim();
                quantity = parseInt(menuMatch[2]);
            } else {
                const bracketMatch = trimmed.match(/^(.+?)\((\d+)\)$/);
                if (bracketMatch) {
                    name = bracketMatch[1].trim();
                    quantity = parseInt(bracketMatch[2]);
                } else {
                    name = trimmed;
                }
            }

            if (name && !trimmed.endsWith("원")) {
                const invalidKeywords = ['상품', '이용일시', '인원', '메뉴', '인원수', '유입경로', '예약유형', '이메일', '쿠폰', '결제', '안내', 'Copyright', 'NPay', '주문번호', '상태', '수단'];
                // '예약번호' removed from invalidKeywords to allow parsing if it appears in a way that might be confused, 
                // but actually we handle it explicitly above. Still good to remove if we want to be safe or if it appears in item section by mistake.
                // Actually, let's keep it in invalidKeywords for item name protection, since we handle it explicitly in section 1.

                if (name.toLowerCase().includes('zone')) {
                    lastMenuIndex = -99;
                    return;
                }

                if (!invalidKeywords.some(k => name.includes(k)) && !name.includes('예약') && !name.startsWith('20')) {
                    // Added !name.startsWith('20') to avoid parsing dates as items just in case
                    const existing = result.items.find(item => item.name === name);
                    if (existing) {
                        lastMenuIndex = result.items.indexOf(existing);
                    } else if (name.length > 2) {
                        result.items.push({ name, quantity, price: 0 });
                        lastMenuIndex = result.items.length - 1;
                    }
                }
            }

            if (trimmed.endsWith("원") && lastMenuIndex !== -1) {
                const priceMatch = trimmed.match(/[\d,]+/);
                if (priceMatch) {
                    const price = parseInt(priceMatch[0].replace(/,/g, ''));
                    if (lastMenuIndex === -99) {
                        result.deliveryFee += price;
                    } else if (lastMenuIndex >= 0) {
                        result.items[lastMenuIndex].price = price;
                    }
                    lastMenuIndex = -1; // 가격 매칭 후 리셋
                }
            }
        }


        // --- 4. 결제 요약 정보 (할인, 총액 등) ---
        // 결제금액 라인에 아이템 목록이 포함된 경우 (예: Item(1)1000원 + Item(2)2000원 = 3000원)
        if ((trimmed.startsWith('결제금액') || trimmed.startsWith('결제액')) && trimmed.includes('+') && trimmed.includes('(')) {
            // 1. Total Amount Parse (after =)
            if (trimmed.includes('=')) {
                const totalPart = trimmed.split('=')[1].trim();
                const match = totalPart.match(/[\d,]+/);
                if (match) result.totalAmount = parseInt(match[0].replace(/[^0-9]/g, ''));
            }

            // 2. Items Parse (before =)
            let content = trimmed.replace(/^결제(금액|액)/, '').trim();
            if (content.includes('=')) {
                content = content.split('=')[0].trim();
            }

            const parts = content.split('+').map(p => p.trim());
            parts.forEach(part => {
                const match = part.match(/^(.+?)\((\d+)\)([\d,]+)원$/);
                if (match) {
                    const name = match[1].trim();
                    const quantity = parseInt(match[2]);
                    const price = parseInt(match[3].replace(/,/g, ''));

                    // 이미 존재하는지 확인 (중복 방지)
                    const existing = result.items.find(item => item.name === name);
                    if (!existing) {
                        result.items.push({ name, quantity, price });
                    }
                }
            });
            return; // 상세 파싱 성공 시 이후 일반 파싱 로직 건너뜀
        }

        const isDiscountLine = trimmed.includes('쿠폰') || trimmed.includes('할인') || (trimmed.startsWith('-') && trimmed.includes('원'));
        if (isDiscountLine || isPaymentSection) {
            if (isDiscountLine) {
                const match = trimmed.match(/[\d,]+/);
                if (match) {
                    const price = Math.abs(parseInt(match[0].replace(/[^0-9]/g, '')));
                    if (price > 0 && price < result.totalAmount) {
                        result.discountValue = price;
                    }
                }
            }
            if ((trimmed.includes('결제금액') || trimmed.includes('결제액')) && !trimmed.includes('상태')) {
                const match = trimmed.match(/[\d,]+/);
                if (match) result.totalAmount = parseInt(match[0].replace(/[^0-9]/g, ''));
            }
        }
    });

    const memoParts = [];
    if (deliveryStatus) memoParts.push(`[${deliveryStatus}]`);
    if (capturedAddress.length > 0) {
        const cleanAddress = capturedAddress
            .join(" ")
            .replace(/배달 받으실 주소를 기입해주세요/g, "")
            .replace(/정보 오기입 & 오선택 으로 인한 사고는 배상하지 않습니다\./g, "")
            .trim();
        if (cleanAddress) memoParts.push(cleanAddress);
    }

    // 예약번호 메모에 추가 (선택) - UI에 별도 표시하므로 메모에는 굳이 안 넣어도 되지만, 만약을 위해
    if (result.reservationNumber) {
        memoParts.push(`No.${result.reservationNumber}`);
    }

    if (result.utilizationDate) {
        const isoDate = parseKoreanDate(result.utilizationDate);
        if (isoDate) {
            result.utilizationDate = isoDate;
            memoParts.push(`이용: ${isoDate}`); // 메모에도 ISO 형식으로 저장 (선택사항)
        } else {
            // 파싱 실패 시 원본 유지
            memoParts.push(`이용: ${result.utilizationDate}`);
        }
    }

    memoParts.push("Naver Import: " + new Date().toLocaleDateString());
    result.memo = memoParts.join(" | ");

    return result;
}

function parseKoreanDate(dateStr: string): string | undefined {
    // Expected format: 2026.01.30.(금) 오후 7:00, 1명
    const regex = /(\d{4})\.(\d{1,2})\.(\d{1,2}).*?\s+(오전|오후)\s+(\d{1,2}):(\d{2})/;
    const match = dateStr.match(regex);

    if (match) {
        const year = match[1];
        const month = match[2].padStart(2, '0');
        const day = match[3].padStart(2, '0');
        const ampm = match[4];
        let hour = parseInt(match[5]);
        const minute = match[6];

        if (ampm === "오후" && hour < 12) {
            hour += 12;
        } else if (ampm === "오전" && hour === 12) {
            hour = 0;
        }

        const hourStr = hour.toString().padStart(2, '0');

        // Return structured string instead of ISO to prevent UTC shift on display
        return `${year}-${month}-${day} ${hourStr}:${minute}`;
    }
    return undefined;
}
