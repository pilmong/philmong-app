'use client'

import { useState, useEffect } from 'react'
import { BookOpen, Plus, Settings, TrendingUp, TrendingDown, Calendar, Home, Zap } from 'lucide-react'
import {
    loadAccountCategories,
    getMajorCategories,
    getMinorCategories,
    TransactionType,
    UsageType
} from '@/lib/cashbook/account-categories'
import {
    addTransaction,
    loadTransactions,
    getTransactionsByMonth,
    calculateBalance,
    Transaction
} from '@/lib/cashbook/transactions'

export default function CashbookApp() {
    // 현재 날짜
    const today = new Date()
    const [currentYear, setCurrentYear] = useState(today.getFullYear())
    const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1)

    // 거래 입력 폼
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [usageType, setUsageType] = useState<UsageType>('BUSINESS')
    const [transactionType, setTransactionType] = useState<TransactionType>('EXPENSE')
    const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0])
    const [majorCategory, setMajorCategory] = useState('')
    const [minorCategory, setMinorCategory] = useState('')
    const [description, setDescription] = useState('')
    const [counterparty, setCounterparty] = useState('')
    const [amount, setAmount] = useState('')
    const [note, setNote] = useState('')

    // 활성 탭 (BUSINESS | PERSONAL | ALL)
    const [activeTab, setActiveTab] = useState<UsageType | 'ALL'>('ALL')

    // 거래 내역
    const [transactions, setTransactions] = useState<Transaction[]>([])

    // 계정과목 목록
    const [majorCategories, setMajorCategories] = useState<string[]>([])
    const [minorCategories, setMinorCategories] = useState<string[]>([])

    // 초기 로드
    useEffect(() => {
        loadAccountCategories() // 계정과목 초기화
        loadMonthTransactions()
    }, [currentYear, currentMonth])

    // 거래 타입 또는 용도 변경 시 대분류 목록 업데이트
    useEffect(() => {
        const majors = getMajorCategories(transactionType, usageType)
        setMajorCategories(majors)
        setMajorCategory(majors[0] || '')
        setMinorCategory('')
    }, [transactionType, usageType])

    // 대분류 변경 시 소분류 목록 업데이트
    useEffect(() => {
        if (majorCategory) {
            const minors = getMinorCategories(transactionType, majorCategory, usageType)
            setMinorCategories(minors)
            setMinorCategory(minors[0] || '')
        } else {
            setMinorCategories([])
            setMinorCategory('')
        }
    }, [majorCategory, transactionType, usageType])

    // 월별 거래 내역 로드 및 필터링
    function loadMonthTransactions() {
        let txns = getTransactionsByMonth(currentYear, currentMonth)
        if (activeTab !== 'ALL') {
            txns = txns.filter(t => t.usageType === activeTab)
        }
        setTransactions(txns)
    }

    useEffect(() => {
        loadMonthTransactions()
    }, [currentYear, currentMonth, activeTab])

    // 폼 초기화
    function resetForm() {
        setSelectedDate(today.toISOString().split('T')[0])
        setDescription('')
        setCounterparty('')
        setAmount('')
        setNote('')
        // 대분류/소분류는 유지 (계속 추가 편의성)
    }

    // 거래 추가
    function handleAddTransaction(continueAdding: boolean = false) {
        if (!majorCategory || !minorCategory || !amount) {
            alert('필수 항목을 입력해주세요.')
            return
        }

        const amountNum = parseInt(amount.replace(/,/g, ''))
        if (isNaN(amountNum) || amountNum <= 0) {
            alert('올바른 금액을 입력해주세요.')
            return
        }

        addTransaction({
            date: selectedDate,
            type: transactionType,
            usageType,
            majorCategory,
            minorCategory,
            description,
            counterparty,
            amount: amountNum,
            note: note || undefined
        })

        loadMonthTransactions()

        if (continueAdding) {
            resetForm()
        } else {
            setIsModalOpen(false)
            resetForm()
        }
    }

    // 금액 포맷팅
    function formatAmount(value: string): string {
        const num = value.replace(/,/g, '')
        if (!num) return ''
        return parseInt(num).toLocaleString()
    }

    // 잔액 계산
    const balance = calculateBalance(transactions)
    const income = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0)
    const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0)

    return (
        <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Tab Navigation */}
                <div className="flex p-1 bg-slate-200/50 rounded-2xl w-fit">
                    <button
                        onClick={() => setActiveTab('ALL')}
                        className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${activeTab === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        전체 보기
                    </button>
                    <button
                        onClick={() => setActiveTab('BUSINESS')}
                        className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${activeTab === 'BUSINESS' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        🏢 사업자용
                    </button>
                    <button
                        onClick={() => setActiveTab('PERSONAL')}
                        className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${activeTab === 'PERSONAL' ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        🏠 가계용
                    </button>
                </div>

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <BookOpen className={`w-8 h-8 ${activeTab === 'PERSONAL' ? 'text-rose-500' : 'text-emerald-600'}`} />
                        금전출납부 <span className="text-sm font-normal text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                            {activeTab === 'ALL' ? '통합 관리' : activeTab === 'BUSINESS' ? '사업자 전용' : '가계 전용'}
                        </span>
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${activeTab === 'PERSONAL' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'} text-[10px] font-black ml-2`}>
                            <Zap className="w-3 h-3" />
                            <span>LAB - 3001</span>
                        </div>
                    </h1>

                    <div className="flex gap-2">
                        <a
                            href="/"
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 active:scale-95 transition-all mr-2"
                        >
                            <Home className="w-4 h-4" /> 필몽 허브
                        </a>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
                        >
                            <Plus className="w-5 h-5" />
                            거래 추가
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-600">수입</span>
                            <TrendingUp className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                            +{income.toLocaleString()}원
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-600">지출</span>
                            <TrendingDown className="w-5 h-5 text-red-500" />
                        </div>
                        <div className="text-2xl font-bold text-red-600">
                            -{expense.toLocaleString()}원
                        </div>
                    </div>

                    <div className={`bg-gradient-to-br ${activeTab === 'PERSONAL' ? 'from-rose-500 to-rose-600 shadow-rose-200' : 'from-emerald-500 to-emerald-600 shadow-emerald-200'} p-4 rounded-xl shadow-lg transition-all`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-white/90">현 잔액</span>
                            <Calendar className="w-5 h-5 text-white/90" />
                        </div>
                        <div className="text-2xl font-bold text-white">
                            {balance.toLocaleString()}원
                        </div>
                    </div>
                </div>

                {/* Transactions List */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-slate-800">
                            {currentYear}년 {currentMonth}월 거래 내역
                        </h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    if (currentMonth === 1) {
                                        setCurrentYear(prev => prev - 1)
                                        setCurrentMonth(12)
                                    } else {
                                        setCurrentMonth(prev => prev - 1)
                                    }
                                }}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600"
                            >
                                ◀
                            </button>
                            <span className="font-bold text-slate-700 min-w-20 text-center">{currentYear}. {currentMonth}</span>
                            <button
                                onClick={() => {
                                    if (currentMonth === 12) {
                                        setCurrentYear(prev => prev + 1)
                                        setCurrentMonth(1)
                                    } else {
                                        setCurrentMonth(prev => prev + 1)
                                    }
                                }}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600"
                            >
                                ▶
                            </button>
                        </div>
                    </div>

                    {transactions.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>거래 내역이 없습니다.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {transactions.map(txn => (
                                <div key={txn.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${txn.usageType === 'PERSONAL' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                {txn.usageType === 'PERSONAL' ? '가계' : '사업자'}
                                            </span>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${txn.type === 'INCOME' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                                {txn.type === 'INCOME' ? '수입' : '지출'}
                                            </span>
                                            <span className="text-sm font-medium text-slate-600">
                                                {txn.majorCategory} - {txn.minorCategory}
                                            </span>
                                            <span className="text-xs text-slate-400">{txn.date}</span>
                                        </div>
                                        <div className="text-sm text-slate-700">
                                            {txn.description} {txn.counterparty && `(${txn.counterparty})`}
                                        </div>
                                    </div>
                                    <div className={`text-lg font-bold ${txn.type === 'INCOME' ? 'text-blue-600' : 'text-red-600'}`}>
                                        {txn.type === 'INCOME' ? '+' : '-'}{txn.amount.toLocaleString()}원
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Transaction Input Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-bold text-lg text-slate-800">거래 추가</h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                            </div>

                            <form onSubmit={(e) => {
                                e.preventDefault()
                                handleAddTransaction(true)
                            }}>
                                <div className="p-6 space-y-4">
                                    {/* 용도 선택 */}
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">기록 용도</label>
                                        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                                            <button
                                                type="button"
                                                onClick={() => setUsageType('BUSINESS')}
                                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${usageType === 'BUSINESS' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                                            >
                                                🏢 사업자용
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setUsageType('PERSONAL')}
                                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${usageType === 'PERSONAL' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-500'}`}
                                            >
                                                🏠 가계용
                                            </button>
                                        </div>
                                    </div>

                                    {/* 날짜 */}
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">날짜</label>
                                        <input
                                            type="date"
                                            value={selectedDate}
                                            onChange={e => setSelectedDate(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>

                                    {/* 수입/지출 */}
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">구분</label>
                                        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                                            <button
                                                type="button"
                                                onClick={() => setTransactionType('INCOME')}
                                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${transactionType === 'INCOME' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                                            >
                                                💰 수입
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setTransactionType('EXPENSE')}
                                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${transactionType === 'EXPENSE' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}
                                            >
                                                💸 지출
                                            </button>
                                        </div>
                                    </div>

                                    {/* 대분류 */}
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">대분류</label>
                                        <select
                                            value={majorCategory}
                                            onChange={e => setMajorCategory(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        >
                                            {majorCategories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* 소분류 */}
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">소분류</label>
                                        <select
                                            value={minorCategory}
                                            onChange={e => setMinorCategory(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        >
                                            {minorCategories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* 내용 */}
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">내용</label>
                                        <input
                                            type="text"
                                            placeholder="예: 반찬 판매"
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>

                                    {/* 거래대상 */}
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">거래대상</label>
                                        <input
                                            type="text"
                                            placeholder="예: 새벽수산유통"
                                            value={counterparty}
                                            onChange={e => setCounterparty(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>

                                    {/* 금액 */}
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">금액</label>
                                        <input
                                            type="text"
                                            placeholder="0"
                                            value={formatAmount(amount)}
                                            onChange={e => setAmount(e.target.value.replace(/,/g, ''))}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-right font-bold"
                                        />
                                    </div>

                                    {/* 비고 */}
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">비고</label>
                                        <textarea
                                            rows={2}
                                            placeholder="추가 메모"
                                            value={note}
                                            onChange={e => setNote(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-white border border-emerald-200 text-emerald-700 py-3 rounded-lg font-bold hover:bg-emerald-50 transition-colors shadow-sm"
                                    >
                                        + 계속 추가 (Enter)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleAddTransaction(false)}
                                        className="flex-1 bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
                                    >
                                        저장 후 닫기
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
