
// Mocking the parseNaverReservation function logic directly to avoid import issues
function parseNaverReservation(text) {
    const lines = text.split('\n');
    const result = {
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
    let capturedAddress = [];
    let lastMenuIndex = -1;

    lines.forEach((line, index) => {
        let trimmed = line.trim();
        if (!trimmed) return;

        trimmed = trimmed.replace(/^[*•]\s*/, '').trim();
        if (!trimmed) return;

        // Filter comments
        if (trimmed.startsWith('<!--') || trimmed.startsWith('<') || trimmed.includes('자세히 보기') || trimmed.includes('스마트플레이스') || trimmed.includes('발신전용입니다') || trimmed.includes('고객센터')) return;

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

        // --- PROPOSED FIX: Parse items from '결제금액' line ---
        if (trimmed.startsWith('결제금액') && trimmed.includes('+') && trimmed.includes('(')) {
            // Example: 결제금액	D zone(1)6,600원 + 오징어문어핫바 (2p)(1)4,900원 + ... = 46,100원
            let content = trimmed.replace('결제금액', '').trim();
            // Remove total part "= 46,100원"
            if (content.includes('=')) {
                content = content.split('=')[0].trim();
            }

            const parts = content.split('+').map(p => p.trim());
            parts.forEach(part => {
                // Try to match "Name(Qty)Price원"
                // This regex handles parentheses in name, but assumes (Qty) is the last parenthesis group before Price
                const match = part.match(/^(.+?)\((\d+)\)([\d,]+)원$/);
                if (match) {
                    const name = match[1].trim();
                    const quantity = parseInt(match[2]);
                    const price = parseInt(match[3].replace(/,/g, ''));

                    // Add to items
                    result.items.push({ name, quantity, price });
                }
            });
        }

        // --- Existing Logic (Simplified for this test context) ---
        // We still need to capture basic info to make the result look real
        if (trimmed.startsWith("예약자") && !trimmed.includes("입력정보")) {
            const val = trimmed.replace(/^예약자/, "").replace(/^[:：\s\t]+/, "").trim();
            if (val && !result.customerName) result.customerName = val;
        }

        // We skip the complex state machine menu parsing because we are testing the Payment Line logic specifically
        // But in real code, we'd keep both.
    });

    return result;
}

const sampleText = `
NAVER 예약
식탁곁들임 울산점
새로운 예약이 확정 되었습니다.
예약내역을 확인해 보세요.
예약자명	한*지님
예약신청 일시	2026.01.30. 07:31:01
예약내역
예약번호	1144267692 네이버 페이
예약상품	픽업 및 배달 예약
이용일시	2026.01.30.(금) 오후 7:00, 1명
결제상태	결제완료
결제수단	신용카드 간편결제
결제금액	D zone(1)6,600원 + 오징어문어핫바 (2p)(1)4,900원 + 깻잎멸치 간장지짐이(1)5,900원 + 모듬전(1)14,900원 + 시금치나물(1)4,000원 + 버섯볶음밥(1)4,900원 + 알타리김치(1)6,900원 = 46,100원
요청사항	종0477, 802호 문앞에 두시고 문자메시지 부탁드리니다
`;

console.log("Parsing Result:", JSON.stringify(parseNaverReservation(sampleText), null, 2));
