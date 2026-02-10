// 금전출납부 - 거래 내역 관리
// Cash Book - Transactions Management

import { TransactionType, UsageType } from './account-categories'

export interface Transaction {
    id: string
    date: string                 // YYYY-MM-DD
    type: TransactionType
    usageType: UsageType         // BUSINESS | PERSONAL
    majorCategory: string
    minorCategory: string
    description: string          // 내용
    counterparty: string         // 거래대상
    amount: number
    note?: string
    createdAt: string
}

// localStorage 키
const STORAGE_KEY = 'philmong_cashbook_transactions'

// 거래 내역 불러오기
export function loadTransactions(): Transaction[] {
    if (typeof window === 'undefined') return []

    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    try {
        const parsed = JSON.parse(stored) as any[]
        // 데이터 구조 확장 마이그레이션: usageType이 없는 기존 데이터는 BUSINESS로 간주
        return parsed.map(t => ({
            ...t,
            usageType: t.usageType || 'BUSINESS'
        })) as Transaction[]
    } catch (e) {
        console.error('Failed to load transactions', e)
        return []
    }
}

// 거래 내역 저장
export function saveTransactions(transactions: Transaction[]): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions))
}

// 거래 추가
export function addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
    const transactions = loadTransactions()
    const newTransaction: Transaction = {
        ...transaction,
        id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString()
    }
    transactions.push(newTransaction)
    saveTransactions(transactions)
    return newTransaction
}

// 거래 수정
export function updateTransaction(id: string, updates: Partial<Transaction>): void {
    const transactions = loadTransactions()
    const index = transactions.findIndex(t => t.id === id)
    if (index !== -1) {
        transactions[index] = { ...transactions[index], ...updates }
        saveTransactions(transactions)
    }
}

// 거래 삭제
export function deleteTransaction(id: string): void {
    const transactions = loadTransactions()
    const filtered = transactions.filter(t => t.id !== id)
    saveTransactions(filtered)
}

// 날짜별 거래 조회
export function getTransactionsByDate(date: string): Transaction[] {
    const transactions = loadTransactions()
    return transactions
        .filter(t => t.date === date)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

// 기간별 거래 조회
export function getTransactionsByDateRange(startDate: string, endDate: string): Transaction[] {
    const transactions = loadTransactions()
    return transactions
        .filter(t => t.date >= startDate && t.date <= endDate)
        .sort((a, b) => {
            if (a.date !== b.date) return b.date.localeCompare(a.date)
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
}

// 월별 거래 조회
export function getTransactionsByMonth(year: number, month: number): Transaction[] {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`
    return getTransactionsByDateRange(startDate, endDate)
}

// 계정과목별 집계
export function getTransactionsByCategory(
    type: TransactionType,
    majorCategory?: string,
    minorCategory?: string,
    usageType?: UsageType
): Transaction[] {
    const transactions = loadTransactions()
    return transactions.filter(t => {
        if (t.type !== type) return false
        if (majorCategory && t.majorCategory !== majorCategory) return false
        if (minorCategory && t.minorCategory !== minorCategory) return false
        if (usageType && t.usageType !== usageType) return false
        return true
    })
}

// 합계 계산
export function calculateTotal(transactions: Transaction[]): number {
    return transactions.reduce((sum, t) => sum + t.amount, 0)
}

// 잔액 계산 (수입 - 지출)
export function calculateBalance(transactions: Transaction[], initialBalance: number = 0): number {
    const income = calculateTotal(transactions.filter(t => t.type === 'INCOME'))
    const expense = calculateTotal(transactions.filter(t => t.type === 'EXPENSE'))
    return initialBalance + income - expense
}

// 계정과목별 집계 데이터
export interface CategorySummary {
    type: TransactionType
    majorCategory: string
    minorCategory?: string
    count: number
    total: number
}

// 대분류별 집계
export function summarizeByMajorCategory(transactions: Transaction[]): CategorySummary[] {
    const summary = new Map<string, CategorySummary>()

    transactions.forEach(t => {
        const key = `${t.type}-${t.majorCategory}`
        if (!summary.has(key)) {
            summary.set(key, {
                type: t.type,
                majorCategory: t.majorCategory,
                count: 0,
                total: 0
            })
        }
        const item = summary.get(key)!
        item.count++
        item.total += t.amount
    })

    return Array.from(summary.values()).sort((a, b) => b.total - a.total)
}

// 소분류별 집계
export function summarizeByMinorCategory(
    transactions: Transaction[],
    majorCategory: string
): CategorySummary[] {
    const summary = new Map<string, CategorySummary>()

    transactions
        .filter(t => t.majorCategory === majorCategory)
        .forEach(t => {
            const key = `${t.type}-${t.majorCategory}-${t.minorCategory}`
            if (!summary.has(key)) {
                summary.set(key, {
                    type: t.type,
                    majorCategory: t.majorCategory,
                    minorCategory: t.minorCategory,
                    count: 0,
                    total: 0
                })
            }
            const item = summary.get(key)!
            item.count++
            item.total += t.amount
        })

    return Array.from(summary.values()).sort((a, b) => b.total - a.total)
}
