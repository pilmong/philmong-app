export interface ParsedOrderData {
    customerName?: string;
    customerContact?: string;
    pickupDate?: string;
    pickupTime?: string;
    pickupType: 'PICKUP' | 'DELIVERY';
    address?: string;
    request?: string;
    items: { name: string; quantity: number; price?: number }[];
    totalPrice?: number;
}

export function parseNaverOrderText(text: string): ParsedOrderData {
    // Pre-processing: If text has very few newlines (e.g. <= 1), try to insert newlines before keywords
    // This helps if the user pasted a single block of text without newlines
    let processedText = text;
    // Always split specific keywords to new lines to aid parsing, even if text has newlines
    processedText = processedText
    // Always split specific keywords to new lines to aid parsing, even if text has newlines
    processedText = processedText
        .replace(/전화번호/g, '\n전화번호')
        .replace(/연락처/g, '\n연락처')
        .replace(/이용일시/g, '\n이용일시')
        .replace(/주문일시/g, '\n주문일시')
        .replace(/예약자/g, '\n예약자')
        .replace(/주문자/g, '\n주문자')
        .replace(/요청사항/g, '\n요청사항')
        .replace(/결제금액/g, '\n결제금액')
        .replace(/배달 받으실/g, '\n배달 받으실')
        .replace(/메뉴/g, '\n메뉴')
        .replace(/예약내역/g, '\n예약내역')
        .replace(/예약번호/g, '\n예약번호')
        .replace(/유입경로/g, '\n유입경로')
        .replace(/쿠폰/g, '\n쿠폰')
        .replace(/결제정보/g, '\n결제정보')
        .replace(/결제수단/g, '\n결제수단')
        .replace(/주문해주셔서/g, '\n주문해주셔서')
        .replace(/정보 오기입/g, '\n정보 오기입')
        .replace(/([A-Z]\s*zone)/gi, '\n$1\n'); // Split Zone e.g., "D zone" -> "\nD zone\n"

    // Heuristic: Split "Name Qty" which often appears in "Menu" section without newlines.
    // e.g. "두바이 쫀득쿠키 2 흑임자..." -> "두바이 쫀득쿠키 2\n흑임자..."
    // Look for: Number followed by Space followed by Korean/English char (Start of next name)
    // Avoid splitting dates like "2026. 1. 26" (Dot protects it usually, but "1 26" is risky).
    // Text has "2026. 1. 26." -> dots.
    // "010-1234-5678 예약" -> "5678\n예약". Safe.
    // "301호 정보" -> "301호\n정보". Safe.
    // "쫀득쿠키 2 흑임자" -> "2\n흑임자". Safe.
    processedText = processedText.replace(/(\d+)\s+(?=[가-힣a-zA-Z])/g, '$1\n');

    const data: ParsedOrderData = {
        pickupType: 'PICKUP',
        items: [],
    };

    // ... (rest of parser logic remains similar until Item Extraction) ...
    // Note: I need to output the whole file content to ensure I don't break the flow
    // But since I'm using replace_file_content on a large range, I should be careful.
    // Wait, the tool instruction says "Replace...". I should only replace the pre-processing and item loop if possible.
    // But the user requested "Stop conditions" update earlier which shifts lines. 
    // Let's replace the whole `parseNaverOrderText` function body or relevant parts.
    // I'll stick to replacing the Item Extraction Loop mainly, and pre-processing.

    // Actually, I can allow the user's previous edits to remain by just targeting the pre-processing and items loop.
    // But pre-processing is at the top. Items loop is at the bottom. Two chunks.

    // No, I'll use multi_replace.
    // Wait, I am in replace_file_content tool call. I'll switch to multi_replace.
    // Cancelling to switch tool.


    // 1. Name & Contact
    // Use non-greedy match and stop at known keywords or newline
    // Regex explanation:
    // (?:예약자|주문자)\s*  -> Match "예약자" or "주문자" followed by whitespace
    // ([^\n\r]+?)          -> Capture 1+ chars non-greedily
    // (?= ... |$)          -> Lookahead: Stop if we see a keyword or End of String
    const nameMatch = processedText.match(/(?:예약자|주문자)\s*([^\n\r]+?)(?=\s*(전화번호|연락처|이용일시|주문일시|상품|결제금액|요청사항|배달|$))/);

    if (nameMatch) {
        // Fallback: if loopahead didn't catch, the [^\n\r] might still stop at newline.
        // But if it's one line, the lookahead is crucial.
        // Clean up just in case
        let name = nameMatch[1].trim();
        // Remove potential trailing noise if regex leaked
        ['전화번호', '연락처', '010', '011'].forEach(kw => {
            const idx = name.indexOf(kw);
            if (idx !== -1) name = name.substring(0, idx).trim();
        });
        data.customerName = name;
    } else {
        // Fallback for simple "Name" without label if strictly formatted, but risky.
        // Try strict regex only if we fail standard:
        // Maybe try capturing first few words?
        // For now, let's trust the label exists as per Naver format.
    }

    const phoneMatch = processedText.match(/(?:전화번호|연락처)\s*([\d\-\.\s]+)/);
    if (phoneMatch) data.customerContact = phoneMatch[1].trim();

    // 2. Date & Time
    // Format: 2026. 1. 26.(월) 오후 2:00
    const dateMatch = processedText.match(/(?:이용일시|주문일시)\s*(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\./);
    if (dateMatch) {
        const year = dateMatch[1];
        const month = dateMatch[2].padStart(2, '0');
        const day = dateMatch[3].padStart(2, '0');
        data.pickupDate = `${year}-${month}-${day}`;
    }

    const timeMatch = processedText.match(/(오전|오후)\s*(\d{1,2}):(\d{2})/);
    if (timeMatch) {
        let hour = parseInt(timeMatch[2]);
        const minute = timeMatch[3];
        const period = timeMatch[1];
        if (period === '오후' && hour !== 12) hour += 12;
        if (period === '오전' && hour === 12) hour = 0;
        data.pickupTime = `${String(hour).padStart(2, '0')}:${minute}`;
    }

    // 3. Pickup vs Delivery & Address
    if (processedText.includes("배달 받으실 주소를 기입해주세요")) {
        data.pickupType = 'DELIVERY';
        // Extract address: Look for text after "배달 받으실 주소를 기입해주세요" 
        // until we hit a known keyword (요청사항|결제금액|상품|예약확정|주문자 정보|$)

        // First, check if it's on the same line or next line(s)
        // We will match from the keyword until the next keyword.
        // Use [\s\S] to match across newlines if needed, but usually address is compact.
        // But since we pre-processed newlines, let's look for "배달 받으실..." and capture until next keyword.

        const addressMatch = processedText.match(/배달 받으실 주소를 기입해주세요\s*([\s\S]+?)(?=\s*(요청사항|결제금액|상품|예약|주문자|정보|오기입|문의|확인|결제|NPay|$))/);

        if (addressMatch) {
            data.address = addressMatch[1].trim();
        } else {
            // Fallback: Use line logic if regex fails (unlikely if keywords exist)
            const lines = processedText.split('\n');
            const addrIndex = lines.findIndex(l => l.includes("배달 받으실 주소를 기입해주세요"));
            if (addrIndex !== -1 && lines[addrIndex + 1]) {
                data.address = lines[addrIndex + 1].trim();
            }
        }
    } else {
        data.pickupType = 'PICKUP';
    }

    // 4. Request
    // Look for text after '요청사항' until we hit a stop-word
    const requestMatch = processedText.match(/요청사항\s*([\s\S]+?)(?=\s*(쿠폰|유입경로|예약번호|결제|$))/);
    if (requestMatch) data.request = requestMatch[1].trim();

    // 5. Items Extraction logic
    const lines = processedText.split('\n');
    const parsedItems: { name: string; quantity: number; price?: number }[] = [];
    const seenItems = new Set<string>(); // For deduplication

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Stop conditions - lines that definitely aren't items
        if (line.includes('예약확정 안내') ||
            line.includes('주문자 정보') ||
            line.includes('결제금액') ||
            line.includes('요청사항') ||
            line.includes('배달 받으실') ||
            line.includes('전화번호') ||
            line.includes('연락처') ||
            line.includes('이용일시') ||
            line.includes('주문일시') ||
            line.includes('예약자') ||
            line.includes('주문자')) continue;

        // Helper to extract price from current or next line
        const extractPrice = (currentLine: string, nextLine?: string): number => {
            // Check current line first
            const priceMatch = currentLine.match(/([\-\d,]+)원/);
            if (priceMatch) {
                return parseInt(priceMatch[1].replace(/,/g, ''));
            }
            // Check next line
            if (nextLine && nextLine.includes('원')) {
                const pMatch = nextLine.match(/([\-\d,]+)원/);
                if (pMatch) {
                    return parseInt(pMatch[1].replace(/,/g, ''));
                }
            }
            return 0;
        };

        // Item Logic - Global Scan
        // 1. Zone items (A zone, B zone...)
        const zoneMatch = line.match(/([A-Z]\s*zone)/i);
        if (zoneMatch) {
            const price = extractPrice(line, lines[i + 1]);
            parsedItems.push({ name: zoneMatch[1], quantity: 1, price });
        }
        // 2. Normal items with Qty: "Name(Qty)"
        // ex: 두바이 쫀득쿠키(2)
        else if (line.match(/.+\(\d+\)$/)) {
            const match = line.match(/(.+)\((\d+)\)$/);
            if (match) {
                const price = extractPrice(line, lines[i + 1]);
                parsedItems.push({ name: match[1].trim(), quantity: parseInt(match[2]), price });
            }
        }
        // 3. Coupon/Discount: "쿠폰 할인" or any "할인"
        else if (line.includes("할인")) {
            // Try to extract price
            let price = extractPrice(line, lines[i + 1]);

            // Enforce negative price for discounts
            if (price > 0) price = -price;

            // If price is found (even 0, but usually discount has value), add it. 
            // Determine name: Use "쿠폰 할인" if "쿠폰" exists, else "할인".
            const name = line.includes("쿠폰") ? "쿠폰 할인" : "할인";
            parsedItems.push({ name, quantity: 1, price });
        }
        // 4. "예약상품" followed by name?
        else if (line.includes('예약상품') || line.includes('상품명')) {
            const cleanName = line.replace(/예약상품|상품명|:/g, '').trim();
            if (cleanName) {
                parsedItems.push({ name: cleanName, quantity: 1, price: 0 });
            }
        }
        // 5. Space Separated Qty: "Name Qty" (e.g. "쫀득쿠키 2")
        else {
            const spaceQtyMatch = line.match(/^([가-힣a-zA-Z\s]+)\s+(\d+)$/);
            if (spaceQtyMatch) {
                const name = spaceQtyMatch[1].trim();
                const qty = parseInt(spaceQtyMatch[2]);

                // Filter out hallucinations
                const isInvalidName =
                    name.includes('완료') ||
                    name.includes('확정') ||
                    name.includes('접수') ||
                    name.includes('취소') ||
                    name.length < 2;

                if (!isInvalidName && qty < 100) {
                    const price = extractPrice(line, lines[i + 1]);
                    parsedItems.push({ name, quantity: qty, price });
                }
            }
        }
    }

    // Deduplication Logic
    // If we have multiple items with the same name:
    // 1. Prefer the one with a price > 0.
    // 2. If one has price 0 and another has price > 0, remove the one with price 0.
    const uniqueItems: { [key: string]: { name: string, quantity: number, price?: number } } = {};

    parsedItems.forEach(item => {
        // Normalize name for key
        const key = item.name.trim();

        if (!uniqueItems[key]) {
            uniqueItems[key] = item;
        } else {
            const existing = uniqueItems[key];
            const existingPrice = existing.price || 0;
            const currentPrice = item.price || 0;

            // Scenario: Existing has no price, current has price -> Replace
            if (existingPrice === 0 && currentPrice !== 0) {
                uniqueItems[key] = item;
            }
            // Scenario: Existing has price, current has no price -> Ignore current (it's likely a ghost)
            else if (existingPrice !== 0 && currentPrice === 0) {
                // do nothing
            }
            // Scenario: Both have prices (or both 0) - keep existing
        }
    });

    // Convert back to array
    if (Object.keys(uniqueItems).length > 0) {
        data.items = Object.values(uniqueItems);
    }

    // 6. Total Price
    const priceMatch = processedText.match(/결제금액\s*([\d,]+)원/);
    if (priceMatch) {
        data.totalPrice = parseInt(priceMatch[1].replace(/,/g, ''));
    }

    return data;
}

// Helper to find matching product
export const findMatchingProduct = (parsedName: string, products: any[], dateStr?: string) => {
    if (!products || products.length === 0) return null;

    let targetDate = null;
    if (dateStr) {
        targetDate = new Date(dateStr);
        targetDate.setHours(0, 0, 0, 0);
    }

    // Sort products by length desc to match longest name first
    const sortedProducts = [...products].sort((a, b) => b.name.length - a.name.length);

    for (const product of sortedProducts) {
        // 1. Name Match
        const pName = product.name.replace(/\s/g, '').toLowerCase();
        const tName = parsedName.replace(/\s/g, '').toLowerCase();

        if (!tName.includes(pName) && !pName.includes(tName)) {
            continue; // Name doesn't match
        }

        // 2. Date Match for Special Types
        if ((product.type === 'DAILY' || product.type === 'SPECIAL') && product.targetDate) {
            if (!targetDate) continue; // No date in order -> skip date-specific products?

            const pDate = new Date(product.targetDate);
            pDate.setHours(0, 0, 0, 0);

            if (pDate.getTime() !== targetDate.getTime()) {
                continue; // Date mismatch
            }
        }

        return product;
    }
    return null; // No match found
};
