'use server';

import { prisma } from '@/lib/prisma';

export async function parseSmartOrder(text: string) {
    // 실무적으로는 LLM을 쓰는 게 가장 좋지만, 우선은 정규표현식과 규칙 기반으로 구현합니다.
    // 향후 확장이 가능하도록 구조화합니다.

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    let customerName = '알수없음';
    let customerContact = '';
    let pickupDate = new Date();
    let pickupTime = '12:00';
    let items: any[] = [];
    let memo = '';

    // 간단한 패턴 매칭 (네이버, 문자 등 흔한 양식)
    lines.forEach(line => {
        // 이름 추출: [성함/이름/고객] : 김철수
        if (line.includes('성함') || line.includes('이름') || line.includes('고객')) {
            customerName = line.split(/[:\s]+/).pop() || customerName;
        }
        // 연락처 추출
        if (line.match(/010[-.\s]?\d{4}[-.\s]?\d{4}/)) {
            customerContact = line.match(/010[-.\s]?\d{4}[-.\s]?\d{4}/)?.[0] || '';
        }
        // 시간 추출
        if (line.match(/\d{2}:\d{2}/)) {
            pickupTime = line.match(/\d{2}:\d{2}/)?.[0] || '12:00';
        }
        // 메뉴 추출 (상품 마스터와 대조하여 지능적 파싱)
        // 예: "낙지볶음 1개", "시금치 2"
    });

    // 상품 마스터를 가져와서 텍스트와 매칭 시도
    const products = await prisma.product.findMany({ where: { status: 'ACTIVE' } });

    lines.forEach(line => {
        products.forEach(p => {
            if (line.includes(p.name)) {
                // 수량 파악 (상품명 뒤의 숫자나 '개', '팩' 등)
                const qtyMatch = line.match(new RegExp(`${p.name}\\s*(\\d+)`)) || line.match(new RegExp(`${p.name}\\s*(\\d+)\\s*[개팩]`));
                const quantity = qtyMatch ? parseInt(qtyMatch[1]) : 1;

                items.push({
                    name: p.name,
                    quantity,
                    price: p.price
                });
            }
        });
    });

    let channel = 'TEXT';
    if (text.includes('네이버')) channel = 'NAVER';
    if (text.includes('밴드')) channel = 'BAND';

    return {
        type: 'RESERVATION',
        salesType: 'RESERVATION',
        pickupType: 'PICKUP', // Default to PICKUP
        status: 'PENDING',
        channel,
        customerName,
        customerContact,
        pickupDate,
        pickupTime,
        items,
        totalPrice: items.reduce((sum, i) => sum + (i.price * i.quantity), 0),
        memo: `[Smart Parsed] ${text.slice(0, 50)}...`,
        request: text // Keep original text as request for reference
    };
}
