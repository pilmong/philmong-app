export interface ParsedItem {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
}

interface Product {
    id: string;
    name: string;
    price: number;
}

/**
 * 네이버 예약 상세 텍스트를 파싱하여 주문 항목을 추출합니다.
 * @param text 붙여넣은 예약 상세 텍스트
 * @param products 데이터베이스에 있는 전체 상품 목록
 */
export function parseNaverOrderText(text: string, products: Product[]): ParsedItem[] {
    const lines = text.split('\n');
    const parsedItems: ParsedItem[] = [];

    // 상품명 별로 수량을 집계하기 위한 맵
    const itemMap = new Map<string, ParsedItem>();

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        // DB에 있는 상품이 해당 라인에 포함되어 있는지 확인
        // 긴 상품명부터 매칭하여 부분 일치 오류 최소화 (예: '아메리카노', '아이스 아메리카노')
        const sortedProducts = [...products].sort((a, b) => b.name.length - a.name.length);

        for (const product of sortedProducts) {
            if (trimmedLine.includes(product.name)) {
                // 수량 추출 시도 (예: "3개", "x3", "수량: 3")
                // 숫자가 명시적으로 없으면 1개로 가정할 수도 있지만, 보통은 수량이 같이 옴.
                // 일단은 단순하게 라인에서 발견된 숫자 중 가장 그럴다한 것을 찾거나, 
                // 네이버 예약 포맷 특성상 상품명 옆에 수량이 옴.

                let quantity = 1;

                // 1. "N개" 패턴 찾기
                const quantityMatch = trimmedLine.match(/(\d+)개/);
                if (quantityMatch) {
                    quantity = parseInt(quantityMatch[1], 10);
                } else {
                    // 2. "x N" 또는 "xN" 패턴
                    const xMatch = trimmedLine.match(/x\s*(\d+)/i);
                    if (xMatch) {
                        quantity = parseInt(xMatch[1], 10);
                    }
                }

                if (itemMap.has(product.id)) {
                    const existing = itemMap.get(product.id)!;
                    existing.quantity += quantity;
                } else {
                    itemMap.set(product.id, {
                        productId: product.id,
                        productName: product.name,
                        quantity: quantity,
                        price: product.price
                    });
                }

                // 한 줄에서 상품 하나를 찾으면 더 이상 찾지 않음 (중복 매칭 방지)
                // 필요하다면 한 줄 다중 매칭도 고려해야 함.
                break;
            }
        }
    }

    return Array.from(itemMap.values());
}
