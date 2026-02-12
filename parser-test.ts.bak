import { parseNaverReservation } from './src/lib/naver-parser';

const trickyText = `
[네이버 예약] 2026. 1. 26.(월) 오후 2:00
예약자 홍길동 전화번호 010-1234-5678
배달 받으실 주소를 기입해주세요 서울특별시 강남구 역삼동 123-45 101동 202호 요청사항 문 앞에 놔주세요
결제금액 45,000원
A zone
15,000원
두바이 초콜릿(2)
30,000원
`;

console.log("--- TEST 1: Multiline ---");
console.log(JSON.stringify(parseNaverReservation(trickyText), null, 2));

const oneLineText = `[네이버 예약] 2026. 1. 26.(월) 오후 2:00 예약자 홍길동 전화번호 010-1234-5678 배달 받으실 주소를 기입해주세요 서울특별시 강남구 역삼동 123-45 101동 202호 요청사항 문 앞에 놔주세요 결제금액 45,000원 A zone 15,000원 두바이 초콜릿(2) 30,000원`;

console.log("\n--- TEST 2: Single Line (Simulated Bad Paste) ---");
console.log(JSON.stringify(parseNaverReservation(oneLineText), null, 2));
