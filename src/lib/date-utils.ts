/**
 * 다양한 포맷의 날짜 문자열을 Date 객체로 변환합니다.
 * 특히 한국어 날짜 포맷(예: 2025. 12. 31. 오후 2:00)을 강력하게 지원하며,
 * 명시적 오프셋이 없는 경우 한국 시간(KST)으로 해석합니다.
 */
export function parseFlexibleDate(dateStr: string | undefined | null | Date): Date | undefined {
    if (!dateStr) return undefined;
    if (dateStr instanceof Date) {
        return !isNaN(dateStr.getTime()) ? dateStr : undefined;
    }

    // 문자열 정제
    let cleanStr = dateStr.toString().trim();

    // 이미 ISO 포맷(T 포함)인 경우, 바로 파싱 시도
    if (cleanStr.includes('T')) {
        const simpleDate = new Date(cleanStr);
        if (!isNaN(simpleDate.getTime())) return simpleDate;
    }

    // 괄호 내용 제거 (예: (수), (목))
    cleanStr = cleanStr.replace(/\(.*?\)/g, "").trim();

    // 한국어 AM/PM 처리 (오전/오후)
    const amPmMatch = cleanStr.match(/(오전|오후)\s*(\d+):(\d+)/);
    if (amPmMatch) {
        const [_, amPm, hourStr, minStr] = amPmMatch;
        let hour = parseInt(hourStr, 10);
        const min = parseInt(minStr, 10);

        if (amPm === "오후" && hour < 12) hour += 12;
        if (amPm === "오전" && hour === 12) hour = 0;

        // "오후 2:00" -> "14:00" 변환
        cleanStr = cleanStr.replace(/(오전|오후)\s*\d+:\d+/, `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
    }

    // 날짜 구분자 표준화 (2025. 12. 31. -> 2025-12-31)
    cleanStr = cleanStr.replace(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.?/, "$1-$2-$3");

    // 시간 부분이 없으면 00:00:00 추가 (날짜만 있는 경우)
    if (!cleanStr.includes(':')) {
        cleanStr += " 00:00:00";
    }

    // KST(UTC+9) 강제 적용 시도
    // YYYY-MM-DD HH:mm:ss 형태이고 +가 없으면 +09:00을 붙여서 파싱
    if (cleanStr.match(/^\d{4}-\d{1,2}-\d{1,2}\s+\d{1,2}:\d{1,2}/) && !cleanStr.includes('+')) {
        // "2025-01-31 14:00" -> "2025-01-31T14:00:00+09:00"
        cleanStr = cleanStr.replace(' ', 'T');
        if (cleanStr.split(':').length === 2) cleanStr += ":00"; // 초 단위 부재 시 추가
        cleanStr += "+09:00";
    }

    const dateObj = new Date(cleanStr);
    return !isNaN(dateObj.getTime()) ? dateObj : undefined;
}
