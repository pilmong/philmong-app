// 금전출납부 - 계정과목 관리
// Cash Book - Account Categories Management

export type TransactionType = 'INCOME' | 'EXPENSE'
export type UsageType = 'BUSINESS' | 'PERSONAL'

export interface AccountCategory {
    id: string
    type: TransactionType
    usageType: UsageType
    majorCategory: string
    minorCategory: string
    order: number
    isActive: boolean
}

// 기본 계정과목 데이터
export const DEFAULT_ACCOUNT_CATEGORIES: AccountCategory[] = [
    // ===== 수입 =====
    // 매출
    // 매출
    { id: 'income-sales-samsung', type: 'INCOME', usageType: 'BUSINESS', majorCategory: '매출', minorCategory: '삼성카드', order: 1, isActive: true },
    { id: 'income-sales-shinhan', type: 'INCOME', usageType: 'BUSINESS', majorCategory: '매출', minorCategory: '신한카드', order: 2, isActive: true },
    { id: 'income-sales-bc', type: 'INCOME', usageType: 'BUSINESS', majorCategory: '매출', minorCategory: 'BC카드', order: 3, isActive: true },
    { id: 'income-sales-hyundai', type: 'INCOME', usageType: 'BUSINESS', majorCategory: '매출', minorCategory: '현대카드', order: 4, isActive: true },
    { id: 'income-sales-kb', type: 'INCOME', usageType: 'BUSINESS', majorCategory: '매출', minorCategory: 'KB국민카드', order: 5, isActive: true },
    { id: 'income-sales-hana', type: 'INCOME', usageType: 'BUSINESS', majorCategory: '매출', minorCategory: '하나카드', order: 6, isActive: true },
    { id: 'income-sales-woori', type: 'INCOME', usageType: 'BUSINESS', majorCategory: '매출', minorCategory: '우리카드', order: 7, isActive: true },
    { id: 'income-sales-lotte', type: 'INCOME', usageType: 'BUSINESS', majorCategory: '매출', minorCategory: '롯데카드', order: 8, isActive: true },
    { id: 'income-sales-nh', type: 'INCOME', usageType: 'BUSINESS', majorCategory: '매출', minorCategory: 'NH농협카드', order: 9, isActive: true },
    { id: 'income-sales-naverpay', type: 'INCOME', usageType: 'BUSINESS', majorCategory: '매출', minorCategory: '네이버페이', order: 10, isActive: true },
    { id: 'income-sales-ulsanpay', type: 'INCOME', usageType: 'BUSINESS', majorCategory: '매출', minorCategory: '울산페이', order: 11, isActive: true },
    { id: 'income-sales-cash', type: 'INCOME', usageType: 'BUSINESS', majorCategory: '매출', minorCategory: '현금', order: 12, isActive: true },
    { id: 'income-sales-transfer', type: 'INCOME', usageType: 'BUSINESS', majorCategory: '매출', minorCategory: '계좌이체', order: 13, isActive: true },

    // 기타수입
    { id: 'income-other-misc', type: 'INCOME', usageType: 'BUSINESS', majorCategory: '기타수입', minorCategory: '기타', order: 100, isActive: true },

    // 차입금
    { id: 'income-loan-loan', type: 'INCOME', usageType: 'BUSINESS', majorCategory: '차입금', minorCategory: '대출', order: 200, isActive: true },

    // ===== 지출 (BUSINESS) =====
    // 재료비
    { id: 'expense-material-raw', type: 'EXPENSE', usageType: 'BUSINESS', majorCategory: '재료비', minorCategory: '원재료비', order: 1000, isActive: true },
    { id: 'expense-material-sub', type: 'EXPENSE', usageType: 'BUSINESS', majorCategory: '재료비', minorCategory: '부재료비', order: 1001, isActive: true },
    { id: 'expense-material-package', type: 'EXPENSE', usageType: 'BUSINESS', majorCategory: '재료비', minorCategory: '포장재비', order: 1002, isActive: true },

    // 인건비
    { id: 'expense-labor-salary', type: 'EXPENSE', usageType: 'BUSINESS', majorCategory: '인건비', minorCategory: '급여', order: 2000, isActive: true },
    { id: 'expense-labor-insurance', type: 'EXPENSE', usageType: 'BUSINESS', majorCategory: '인건비', minorCategory: '4대보험', order: 2001, isActive: true },
    { id: 'expense-labor-retirement', type: 'EXPENSE', usageType: 'BUSINESS', majorCategory: '인건비', minorCategory: '퇴직급여', order: 2002, isActive: true },

    // 경비
    { id: 'expense-expense-rent', type: 'EXPENSE', usageType: 'BUSINESS', majorCategory: '경비', minorCategory: '임차료', order: 3000, isActive: true },
    { id: 'expense-expense-utility', type: 'EXPENSE', usageType: 'BUSINESS', majorCategory: '경비', minorCategory: '수도광열비', order: 3001, isActive: true },
    { id: 'expense-expense-telecom', type: 'EXPENSE', usageType: 'BUSINESS', majorCategory: '경비', minorCategory: '통신비', order: 3002, isActive: true },
    { id: 'expense-expense-supplies', type: 'EXPENSE', usageType: 'BUSINESS', majorCategory: '경비', minorCategory: '소모품비', order: 3003, isActive: true },
    { id: 'expense-expense-repair', type: 'EXPENSE', usageType: 'BUSINESS', majorCategory: '경비', minorCategory: '수선비', order: 3004, isActive: true },
    { id: 'expense-expense-depreciation', type: 'EXPENSE', usageType: 'BUSINESS', majorCategory: '경비', minorCategory: '감가상각비', order: 3005, isActive: true },
    { id: 'expense-expense-advertising', type: 'EXPENSE', usageType: 'BUSINESS', majorCategory: '경비', minorCategory: '광고선전비', order: 3006, isActive: true },
    { id: 'expense-expense-welfare', type: 'EXPENSE', usageType: 'BUSINESS', majorCategory: '경비', minorCategory: '복리후생비', order: 3007, isActive: true },
    { id: 'expense-expense-entertainment', type: 'EXPENSE', usageType: 'BUSINESS', majorCategory: '경비', minorCategory: '접대비', order: 3008, isActive: true },
    { id: 'expense-expense-vehicle', type: 'EXPENSE', usageType: 'BUSINESS', majorCategory: '경비', minorCategory: '차량유지비', order: 3009, isActive: true },
    { id: 'expense-expense-commission', type: 'EXPENSE', usageType: 'BUSINESS', majorCategory: '경비', minorCategory: '지급수수료', order: 3010, isActive: true },
    { id: 'expense-expense-printing', type: 'EXPENSE', usageType: 'BUSINESS', majorCategory: '경비', minorCategory: '도서인쇄비', order: 3011, isActive: true },
    { id: 'expense-expense-training', type: 'EXPENSE', usageType: 'BUSINESS', majorCategory: '경비', minorCategory: '교육훈련비', order: 3012, isActive: true },
    { id: 'expense-expense-misc', type: 'EXPENSE', usageType: 'BUSINESS', majorCategory: '경비', minorCategory: '잡비', order: 3013, isActive: true },

    // 금융비용
    { id: 'expense-finance-interest', type: 'EXPENSE', usageType: 'BUSINESS', majorCategory: '금융비용', minorCategory: '이자비용', order: 4000, isActive: true },

    // 차입금상환
    { id: 'expense-repayment-principal', type: 'EXPENSE', usageType: 'BUSINESS', majorCategory: '차입금상환', minorCategory: '원금상환', order: 5000, isActive: true },

    // ===== 수입 (PERSONAL) =====
    { id: 'per-income-salary', type: 'INCOME', usageType: 'PERSONAL', majorCategory: '수입', minorCategory: '급여', order: 10000, isActive: true },
    { id: 'per-income-bonus', type: 'INCOME', usageType: 'PERSONAL', majorCategory: '수입', minorCategory: '상여금', order: 10001, isActive: true },
    { id: 'per-income-pocket', type: 'INCOME', usageType: 'PERSONAL', majorCategory: '수입', minorCategory: '용돈', order: 10002, isActive: true },
    { id: 'per-income-finance', type: 'INCOME', usageType: 'PERSONAL', majorCategory: '수입', minorCategory: '금융수익', order: 10003, isActive: true },
    { id: 'per-income-misc', type: 'INCOME', usageType: 'PERSONAL', majorCategory: '수입', minorCategory: '기타', order: 10004, isActive: true },

    // ===== 지출 (PERSONAL) =====
    { id: 'per-expense-food-meal', type: 'EXPENSE', usageType: 'PERSONAL', majorCategory: '식비', minorCategory: '식사비', order: 20000, isActive: true },
    { id: 'per-expense-food-cafe', type: 'EXPENSE', usageType: 'PERSONAL', majorCategory: '식비', minorCategory: '카페/간식', order: 20001, isActive: true },
    { id: 'per-expense-food-mart', type: 'EXPENSE', usageType: 'PERSONAL', majorCategory: '식비', minorCategory: '마트/식재료', order: 20002, isActive: true },

    { id: 'per-expense-house-rent', type: 'EXPENSE', usageType: 'PERSONAL', majorCategory: '주거/통신', minorCategory: '월세', order: 21000, isActive: true },
    { id: 'per-expense-house-util', type: 'EXPENSE', usageType: 'PERSONAL', majorCategory: '주거/통신', minorCategory: '관리비/공과금', order: 21001, isActive: true },
    { id: 'per-expense-house-tele', type: 'EXPENSE', usageType: 'PERSONAL', majorCategory: '주거/통신', minorCategory: '통신비', order: 21002, isActive: true },

    { id: 'per-expense-trans-bus', type: 'EXPENSE', usageType: 'PERSONAL', majorCategory: '교통', minorCategory: '대중교통', order: 22000, isActive: true },
    { id: 'per-expense-trans-taxi', type: 'EXPENSE', usageType: 'PERSONAL', majorCategory: '교통', minorCategory: '택시', order: 22001, isActive: true },
    { id: 'per-expense-trans-fuel', type: 'EXPENSE', usageType: 'PERSONAL', majorCategory: '교통', minorCategory: '연료비', order: 22002, isActive: true },

    { id: 'per-expense-health-med', type: 'EXPENSE', usageType: 'PERSONAL', majorCategory: '의료/건강', minorCategory: '병원/약국', order: 23000, isActive: true },
    { id: 'per-expense-health-fit', type: 'EXPENSE', usageType: 'PERSONAL', majorCategory: '의료/건강', minorCategory: '운동/건강관리', order: 23001, isActive: true },

    { id: 'per-expense-life-fest', type: 'EXPENSE', usageType: 'PERSONAL', majorCategory: '경조사/문화', minorCategory: '경조사비', order: 24000, isActive: true },
    { id: 'per-expense-life-culture', type: 'EXPENSE', usageType: 'PERSONAL', majorCategory: '경조사/문화', minorCategory: '문화/취미', order: 24001, isActive: true },
    { id: 'per-expense-life-gift', type: 'EXPENSE', usageType: 'PERSONAL', majorCategory: '경조사/문화', minorCategory: '선물', order: 24002, isActive: true },

    { id: 'per-expense-edu-fee', type: 'EXPENSE', usageType: 'PERSONAL', majorCategory: '교육', minorCategory: '수강료', order: 25000, isActive: true },
    { id: 'per-expense-edu-book', type: 'EXPENSE', usageType: 'PERSONAL', majorCategory: '교육', minorCategory: '교재/도서', order: 25001, isActive: true },

    { id: 'per-expense-beauty-cloth', type: 'EXPENSE', usageType: 'PERSONAL', majorCategory: '의류/미용', minorCategory: '의류/신발', order: 26000, isActive: true },
    { id: 'per-expense-beauty-hair', type: 'EXPENSE', usageType: 'PERSONAL', majorCategory: '의류/미용', minorCategory: '헤어/뷰티', order: 26001, isActive: true },

    { id: 'per-expense-save-ins', type: 'EXPENSE', usageType: 'PERSONAL', majorCategory: '저축/보험', minorCategory: '보험료', order: 27000, isActive: true },
    { id: 'per-expense-save-bank', type: 'EXPENSE', usageType: 'PERSONAL', majorCategory: '저축/보험', minorCategory: '적금/저축', order: 27001, isActive: true },
]

// localStorage 키
const STORAGE_KEY = 'philmong_cashbook_categories'

// 계정과목 불러오기
export function loadAccountCategories(): AccountCategory[] {
    if (typeof window === 'undefined') return DEFAULT_ACCOUNT_CATEGORIES

    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
        // 처음 사용 시 기본 데이터 저장
        saveAccountCategories(DEFAULT_ACCOUNT_CATEGORIES)
        return DEFAULT_ACCOUNT_CATEGORIES
    }

    try {
        return JSON.parse(stored)
    } catch (e) {
        console.error('Failed to load account categories', e)
        return DEFAULT_ACCOUNT_CATEGORIES
    }
}

// 계정과목 저장
export function saveAccountCategories(categories: AccountCategory[]): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories))
}

// 대분류 목록 가져오기
export function getMajorCategories(type: TransactionType, usageType?: UsageType): string[] {
    const categories = loadAccountCategories()
    const filtered = categories.filter(c =>
        c.type === type &&
        c.isActive &&
        (!usageType || c.usageType === usageType)
    )
    const unique = Array.from(new Set(filtered.map(c => c.majorCategory)))
    return unique.sort((a, b) => {
        const aOrderList = filtered.filter(c => c.majorCategory === a).map(c => c.order)
        const bOrderList = filtered.filter(c => c.majorCategory === b).map(c => c.order)
        const aOrder = aOrderList.length > 0 ? Math.min(...aOrderList) : 99999
        const bOrder = bOrderList.length > 0 ? Math.min(...bOrderList) : 99999
        return aOrder - bOrder
    })
}

// 소분류 목록 가져오기
export function getMinorCategories(type: TransactionType, majorCategory: string, usageType?: UsageType): string[] {
    const categories = loadAccountCategories()
    return categories
        .filter(c =>
            c.type === type &&
            c.majorCategory === majorCategory &&
            c.isActive &&
            (!usageType || c.usageType === usageType)
        )
        .sort((a, b) => a.order - b.order)
        .map(c => c.minorCategory)
}

// 계정과목 추가
export function addAccountCategory(category: Omit<AccountCategory, 'id'>): AccountCategory {
    const categories = loadAccountCategories()
    const newCategory: AccountCategory = {
        ...category,
        id: `${category.type.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    categories.push(newCategory)
    saveAccountCategories(categories)
    return newCategory
}

// 계정과목 수정
export function updateAccountCategory(id: string, updates: Partial<AccountCategory>): void {
    const categories = loadAccountCategories()
    const index = categories.findIndex(c => c.id === id)
    if (index !== -1) {
        categories[index] = { ...categories[index], ...updates }
        saveAccountCategories(categories)
    }
}

// 계정과목 삭제 (비활성화)
export function deleteAccountCategory(id: string): void {
    const categories = loadAccountCategories()
    const index = categories.findIndex(c => c.id === id)
    if (index !== -1) {
        categories[index].isActive = false
        saveAccountCategories(categories)
    }
}

// 계정과목 초기화 (기본값으로 리셋)
export function resetAccountCategories(): void {
    saveAccountCategories(DEFAULT_ACCOUNT_CATEGORIES)
}
