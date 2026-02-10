'use client'

import { useState, useEffect, useRef } from 'react'
import { Calculator, Plus, Trash2, Save, Printer, ArrowLeft, ShoppingBag, Home, Zap } from 'lucide-react'
import {
    Recipe,
    Ingredient,
    RecipeWithDetails,
    loadRecipesFromDb,
    addRecipeToDb,
    updateRecipeInDb,
    deleteRecipeFromDb,
    addIngredientToDb,
    updateIngredientInDb,
    deleteIngredientFromDb,
    addOverheadToDb,
    deleteOverheadFromDb,
    loadSettingsFromDb,
    saveSettingsToDb,
    computeRecipeDetails
} from '@/lib/pricing/pricing-logic'
import { createPricingRecipe } from '@/lib/pricing/actions'

// 금액 포맷팅 함수 (소수점 작게 표시)
const formatPrice = (value: number) => {
    const parts = value.toFixed(3).split('.')
    const integerPart = parseInt(parts[0]).toLocaleString()
    const decimalPart = parts[1]

    // 모든 소수점이 0이면 표시하지 않음
    if (parseInt(decimalPart) === 0) {
        return <span className="font-bold">{integerPart}원</span>
    }

    // 뒤에서부터 0 제거 (9.070 -> 9.07)
    let cleanDecimal = decimalPart.replace(/0+$/, '')

    return (
        <span className="font-bold">
            {integerPart}
            <span className="text-[0.65em] opacity-40 inline-block translate-y-[-0.05em] font-normal font-sans">.{cleanDecimal}</span>
            <span className="ml-0.5">원</span>
        </span>
    )
}

// 입력용 콤마 추가 함수
const addCommas = (value: string) => {
    if (!value) return ''
    const parts = value.split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    return parts.join('.')
}

// 콤마 제거 함수
const removeCommas = (value: string) => value.replace(/,/g, '')

export default function PricingCalculator() {
    const [recipes, setRecipes] = useState<Recipe[]>([])
    const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)
    const [recipeDetails, setRecipeDetails] = useState<RecipeWithDetails | null>(null)
    const ingredientNameRef = useRef<HTMLInputElement>(null)

    // 레시피 입력 폼
    const [recipeName, setRecipeName] = useState('')
    const [servingSize, setServingSize] = useState('1인분')
    const [targetMargin, setTargetMargin] = useState(40)
    const [isLoaded, setIsLoaded] = useState(false)

    // 재료 입력 폼
    const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null)
    const [ingredientName, setIngredientName] = useState('')
    const [purchasePrice, setPurchasePrice] = useState('')
    const [purchaseAmount, setPurchaseAmount] = useState('')
    const [purchaseUnit, setPurchaseUnit] = useState('g')
    const [usageAmount, setUsageAmount] = useState('')
    const [usageUnit, setUsageUnit] = useState('g')

    // 간접비 설정 (DB 연동)
    const [monthlyLabor, setMonthlyLabor] = useState('')
    const [monthlyRent, setMonthlyRent] = useState('')
    const [monthlyUtility, setMonthlyUtility] = useState('')
    const [monthlyOther, setMonthlyOther] = useState('')
    const [dailySales, setDailySales] = useState('')
    const [workingDays, setWorkingDays] = useState('25')
    const [autoOverheadPerUnit, setAutoOverheadPerUnit] = useState(0)

    // 초기 로드 (DB에서 가져오기)
    useEffect(() => {
        async function init() {
            // 레시피 목록 로드
            const list = await loadRecipesFromDb()
            setRecipes(list)

            // 설정값 로드
            const settings = await loadSettingsFromDb()
            if (settings) {
                setMonthlyLabor(settings.monthlyLabor.toString())
                setMonthlyRent(settings.monthlyRent.toString())
                setMonthlyUtility(settings.monthlyUtility.toString())
                setMonthlyOther(settings.monthlyOther.toString())
                setDailySales(settings.dailySales.toString())
                setWorkingDays(settings.workingDays.toString())
                setAutoOverheadPerUnit(settings.perUnit)
                // 전역 기본 마진율 설정 반영
                if (settings.defaultTargetMargin) {
                    setTargetMargin(settings.defaultTargetMargin)
                }
            }
            setIsLoaded(true)
        }
        init()
    }, [])

    // 마진율 변경 시 실시간 저장 (레시피가 선택되어 있으면 레시피에, 아니면 전역 설정에)
    useEffect(() => {
        if (!isLoaded) return

        if (selectedRecipeId && selectedRecipeId !== 'new') {
            updateRecipeInDb(selectedRecipeId, { targetMargin })
        }

        // 전역 기본 설정으로도 저장 (디바운스로 성능 조절 가능하지만 일단 즉시 반영)
        saveSettingsToDb({ defaultTargetMargin: targetMargin })
    }, [targetMargin, selectedRecipeId, isLoaded])

    // 간접비 설정값 실시간 저장 (값이 있을 때만, 빈 값으로 덮어쓰기 방지)
    useEffect(() => {
        if (!isLoaded) return

        // 모든 값이 비어있으면 저장하지 않음 (초기화 방지)
        if (!monthlyLabor && !monthlyRent && !monthlyUtility && !monthlyOther && !dailySales) return

        const timer = setTimeout(() => {
            saveSettingsToDb({
                monthlyLabor: parseFloat(monthlyLabor) || 0,
                monthlyRent: parseFloat(monthlyRent) || 0,
                monthlyUtility: parseFloat(monthlyUtility) || 0,
                monthlyOther: parseFloat(monthlyOther) || 0,
                dailySales: parseFloat(dailySales) || 0,
                workingDays: parseFloat(workingDays) || 0,
                perUnit: autoOverheadPerUnit
            })
        }, 2000) // 저장 지연시간을 조금 더 늘림 (입력 도중 덮어쓰기 방지)
        return () => clearTimeout(timer)
    }, [monthlyLabor, monthlyRent, monthlyUtility, monthlyOther, dailySales, workingDays, autoOverheadPerUnit, isLoaded])

    // 레시피 선택 시 상세 정보 계산
    useEffect(() => {
        if (selectedRecipeId) {
            const recipe = recipes.find(r => r.id === selectedRecipeId)
            if (recipe) {
                // @ts-ignore - Prisma include data mapping
                const details = computeRecipeDetails(recipe, recipe.ingredients || [], recipe.overheads || [])
                setRecipeDetails(details)
                setRecipeName(recipe.name)
                setServingSize(recipe.servingSize)
                setTargetMargin(recipe.targetMargin)
            } else if (selectedRecipeId === 'new') {
                setRecipeDetails(null)
                setRecipeName('')
                setServingSize('1인분')
                // targetMargin은 리셋하지 않고 현재 값 유지 (사장님 요청사항)
            }
        } else {
            setRecipeDetails(null)
            // 기본 마진율 유지를 위해 targetMargin은 리셋하지 않음
        }
    }, [selectedRecipeId, recipes])

    async function loadRecipeList() {
        const list = await loadRecipesFromDb()
        setRecipes(list)
    }

    async function handleCreateRecipe() {
        if (!recipeName) return alert('상품명을 입력해주세요.')

        try {
            console.log("Attempting to create recipe:", recipeName)
            const result = await createPricingRecipe({
                name: recipeName,
                servingSize,
                targetMargin
            })

            console.log("Create recipe result:", result)

            if (result.success && result.data) {
                // 목록을 먼저 동기화한 후 선택 모드로 전환
                const list = await loadRecipesFromDb()
                setRecipes(list)

                // 새로운 ID로 전환 (상태 업데이트 후 실행되도록 지연 처리)
                setTimeout(async () => {
                    const newRecipeId = result.data!.id
                    setSelectedRecipeId(newRecipeId)

                    // 간접비 자동 연동 (설정된 간접비가 있으면 즉시 추가)
                    if (autoOverheadPerUnit > 0) {
                        await addOverheadToDb({
                            recipeId: newRecipeId,
                            category: '간접비(자동)',
                            amount: autoOverheadPerUnit
                        })
                        // 다시 목록 로드하여 간접비 반영
                        await loadRecipeList()
                    }

                    alert('새 레시피가 성공적으로 생성되었습니다!' + (autoOverheadPerUnit > 0 ? '\n(간접비가 자동으로 적용되었습니다)' : ''))
                }, 100)
            } else {
                alert('V3: 레시피 생성 실패 - ' + (result.error || '상세 사유를 알 수 없습니다.'))
            }
        } catch (err) {
            console.error("Client handleCreateRecipe Error:", err)
            alert('V3: 네트워크 오류 또는 서버 응답이 없습니다. (' + (err as Error).message + ')')
        }
    }

    async function handleUpdateRecipe() {
        if (!selectedRecipeId) return
        await updateRecipeInDb(selectedRecipeId, {
            name: recipeName,
            servingSize,
            targetMargin
        })
        await loadRecipeList()
    }

    async function handleDeleteRecipe() {
        if (!selectedRecipeId) return
        if (!confirm('이 레시피를 삭제하시겠습니까?')) return

        await deleteRecipeFromDb(selectedRecipeId)
        await loadRecipeList()
        setSelectedRecipeId(null)
        resetForm()
    }

    async function handleAddIngredient() {
        if (!selectedRecipeId) return
        if (!ingredientName || !purchasePrice || !purchaseAmount || !usageAmount) {
            alert('모든 항목을 입력해주세요.')
            return
        }

        const data = {
            recipeId: selectedRecipeId,
            name: ingredientName,
            purchasePrice: parseFloat(purchasePrice),
            purchaseAmount: parseFloat(purchaseAmount),
            purchaseUnit,
            usageAmount: parseFloat(usageAmount),
            usageUnit
        }

        if (editingIngredientId) {
            await updateIngredientInDb(editingIngredientId, data)
        } else {
            await addIngredientToDb(data)
        }

        resetIngredientForm()
        await loadRecipeList()
        // 재료 추가 후 다시 재료명 필드로 포커스 이동
        ingredientNameRef.current?.focus()
    }

    function handleEditIngredient(ingredient: Ingredient) {
        setEditingIngredientId(ingredient.id)
        setIngredientName(ingredient.name)
        setPurchasePrice(ingredient.purchasePrice.toString())
        setPurchaseAmount(ingredient.purchaseAmount.toString())
        setPurchaseUnit(ingredient.purchaseUnit)
        setUsageAmount(ingredient.usageAmount.toString())
        setUsageUnit(ingredient.usageUnit)
        // 폼으로 스크롤
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    function resetIngredientForm() {
        setEditingIngredientId(null)
        setIngredientName('')
        setPurchasePrice('')
        setPurchaseAmount('')
        setPurchaseUnit('g')
        setUsageAmount('')
        setUsageUnit('g')
    }

    function handlePurchaseUnitChange(unit: string) {
        setPurchaseUnit(unit)
        // 구매 단위에 따라 사용 단위 자동 설정
        if (unit === 'kg') {
            setUsageUnit('g')
        } else if (unit === 'L') {
            setUsageUnit('ml')
        } else {
            setUsageUnit(unit)
        }
    }

    async function handleDeleteIngredient(id: string) {
        await deleteIngredientFromDb(id)
        await loadRecipeList()
    }

    function calculateAutoOverhead() {
        const labor = parseFloat(monthlyLabor) || 0
        const rent = parseFloat(monthlyRent) || 0
        const utility = parseFloat(monthlyUtility) || 0
        const other = parseFloat(monthlyOther) || 0
        const daily = parseFloat(dailySales) || 0
        const days = parseFloat(workingDays) || 0

        if (daily === 0 || days === 0) {
            alert('1일 판매 개수와 월 근무일을 입력해주세요.')
            return
        }

        const totalMonthly = labor + rent + utility + other
        const monthlySales = daily * days
        const perUnit = Math.round(totalMonthly / monthlySales)
        setAutoOverheadPerUnit(perUnit)

        // 계산 시점에 즉시 저장 시도
        saveSettingsToDb({
            monthlyLabor: labor,
            monthlyRent: rent,
            monthlyUtility: utility,
            monthlyOther: other,
            dailySales: daily,
            workingDays: days,
            perUnit: perUnit
        })
    }

    async function handleLoadMasterSettings() {
        if (!confirm('저장된 마스터 간접비 설정을 불러오시겠습니까?\n현재 입력된 내용이 덮어씌워집니다.')) return

        const settings = await loadSettingsFromDb()
        if (settings) {
            setMonthlyLabor(settings.monthlyLabor.toString())
            setMonthlyRent(settings.monthlyRent.toString())
            setMonthlyUtility(settings.monthlyUtility.toString())
            setMonthlyOther(settings.monthlyOther.toString())
            setDailySales(settings.dailySales.toString())
            setWorkingDays(settings.workingDays.toString())
            setAutoOverheadPerUnit(settings.perUnit)
            alert('마스터 설정을 성공적으로 불러왔습니다.')
        } else {
            alert('저장된 설정이 없습니다.')
        }
    }

    async function handleSaveMasterSettings() {
        const labor = parseFloat(monthlyLabor) || 0
        const rent = parseFloat(monthlyRent) || 0
        const utility = parseFloat(monthlyUtility) || 0
        const other = parseFloat(monthlyOther) || 0
        const daily = parseFloat(dailySales) || 0
        const days = parseFloat(workingDays) || 0

        await saveSettingsToDb({
            monthlyLabor: labor,
            monthlyRent: rent,
            monthlyUtility: utility,
            monthlyOther: other,
            dailySales: daily,
            workingDays: days,
            perUnit: autoOverheadPerUnit
        })
        alert('현재 설정이 마스터 값으로 영구 저장되었습니다.')
    }

    async function applyAutoOverhead() {
        if (!selectedRecipeId) return
        if (autoOverheadPerUnit === 0) {
            alert('먼저 간접비를 계산해주세요.')
            return
        }

        // 기존 간접비 삭제
        if (recipeDetails) {
            for (const oh of recipeDetails.overheads) {
                await deleteOverheadFromDb(oh.id)
            }
        }

        // 자동 계산된 간접비 추가
        await addOverheadToDb({
            recipeId: selectedRecipeId,
            category: '간접비 (자동계산)',
            amount: autoOverheadPerUnit
        })

        await loadRecipeList()
    }

    async function handleDeleteOverhead(id: string) {
        await deleteOverheadFromDb(id)
        await loadRecipeList()
    }

    const [overheadAmount, setOverheadAmount] = useState('') // Re-add missing state if needed for form

    function resetForm() {
        setRecipeName('')
        setServingSize('1인분')
        // setTargetMargin은 유지 (사용자 요청: 고정값처럼 유지)
        setIngredientName('')
        setPurchasePrice('')
        setPurchaseAmount('')
        setUsageAmount('')
        setOverheadAmount('')
    }

    function handlePrint() {
        window.print()
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900 print:bg-white print:p-0">
            {/* Print Only Styles */}
            <style jsx global>{`
                @media print {
                    @page {
                        margin: 1cm;
                        size: A4;
                    }
                    body {
                        background: white !important;
                        font-size: 10pt;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-break-inside-avoid {
                        break-inside: avoid;
                    }
                    .print-shadow-none {
                        box-shadow: none !important;
                    }
                    .print-border {
                        border: 1px solid #e2e8f0 !important;
                    }
                }
            `}</style>

            <div className="max-w-6xl mx-auto space-y-6 print:space-y-4">
                {/* Print Only Header */}
                <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900">{recipeName || '상품 원가 분석표'}</h1>
                            <p className="text-slate-600 mt-1">제공량: {servingSize} | 산출일: {new Date().toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-slate-500">Philmong LAB</p>
                        </div>
                    </div>
                </div>

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Calculator className="w-8 h-8 text-orange-600" />
                        판매가 계산기 <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Philmong Pricing</span>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 text-[10px] font-black ml-2">
                            <Zap className="w-3 h-3" />
                            <span>LAB - 3001</span>
                        </div>
                    </h1>

                    <div className="flex items-center gap-2">
                        <a
                            href="/"
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 active:scale-95 transition-all mr-2"
                        >
                            <Home className="w-4 h-4" /> 필몽 허브
                        </a>

                        {selectedRecipeId && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setSelectedRecipeId(null)
                                        resetForm()
                                    }}
                                    className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold hover:bg-slate-50 transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    목록으로
                                </button>
                                <button
                                    onClick={handlePrint}
                                    className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold hover:bg-slate-50 transition-colors"
                                >
                                    <Printer className="w-5 h-5" />
                                    인쇄
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {!selectedRecipeId ? (
                    // 레시피 목록
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-slate-800">레시피 목록</h2>
                            <button
                                onClick={() => setSelectedRecipeId('new')}
                                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                            >
                                <Plus className="w-5 h-5" />
                                새 레시피
                            </button>
                        </div>

                        {recipes.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                <Calculator className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>레시피가 없습니다. 새 레시피를 만들어보세요!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {recipes.map(recipe => {
                                    // @ts-ignore - Prisma include data mapping
                                    const details = computeRecipeDetails(recipe, recipe.ingredients || [], recipe.overheads || [])
                                    return (
                                        <div
                                            key={recipe.id}
                                            onClick={() => setSelectedRecipeId(recipe.id)}
                                            className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer transition-all"
                                        >
                                            <h3 className="font-bold text-slate-800 mb-1">{recipe.name}</h3>
                                            <p className="text-sm text-slate-600 mb-2">{recipe.servingSize}</p>
                                            {details && (
                                                <div className="space-y-1 text-xs">
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-500">총 원가:</span>
                                                        <span className="font-bold text-slate-700">{formatPrice(details.totalCost)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-500">판매가:</span>
                                                        <span className="font-bold text-indigo-600">{formatPrice(details.suggestedPrice)}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    // 레시피 상세/편집
                    <div className="space-y-6">
                        {/* 기본 정보 */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                            <h2 className="text-lg font-bold text-slate-800 mb-4 no-print">기본 정보</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-1 block">상품명</label>
                                    <input
                                        type="text"
                                        value={recipeName}
                                        onChange={e => setRecipeName(e.target.value)}
                                        placeholder="예: 김치찌개"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-1 block">제공량</label>
                                    <input
                                        type="text"
                                        value={servingSize}
                                        onChange={e => setServingSize(e.target.value)}
                                        placeholder="예: 1인분"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-1 block">목표 마진율 (%)</label>
                                    <input
                                        type="text"
                                        value={addCommas(targetMargin.toString())}
                                        onChange={e => {
                                            const val = removeCommas(e.target.value).replace(/[^0-9.]/g, '')
                                            setTargetMargin(parseFloat(val) || 0)
                                        }}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-bold"
                                    />
                                </div>
                            </div>
                            <div className="mt-4 flex gap-2 no-print">
                                {selectedRecipeId === 'new' ? (
                                    <button
                                        onClick={handleCreateRecipe}
                                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors"
                                    >
                                        <Save className="w-5 h-5" />
                                        레시피 생성
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleUpdateRecipe}
                                            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors"
                                        >
                                            <Save className="w-5 h-5" />
                                            저장
                                        </button>
                                        <button
                                            onClick={handleDeleteRecipe}
                                            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700 transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                            삭제
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {selectedRecipeId !== 'new' && recipeDetails && (
                            <>
                                {/* 재료 원가 */}
                                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 print:border-none print:p-0 print:shadow-none">
                                    <h2 className="text-lg font-bold text-slate-800 mb-4 print:text-sm print:mb-2 print:border-l-4 print:border-slate-800 print:pl-2">📋 상세 재료 내역</h2>

                                    {/* 재료 추가 폼 (인쇄 시 숨김) */}
                                    <div className="mb-4 p-4 bg-slate-50 rounded-lg no-print">
                                        <div className="grid grid-cols-1 gap-3">
                                            <div>
                                                <label className="text-xs font-medium text-slate-600 mb-1 block">재료명</label>
                                                <input
                                                    ref={ingredientNameRef}
                                                    type="text"
                                                    placeholder="예: 배추김치"
                                                    value={ingredientName}
                                                    onChange={e => setIngredientName(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleAddIngredient()}
                                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                                />
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div>
                                                    <label className="text-xs font-medium text-slate-600 mb-1 block">구매가</label>
                                                    <input
                                                        type="text"
                                                        placeholder="5,000"
                                                        value={addCommas(purchasePrice)}
                                                        onChange={e => setPurchasePrice(removeCommas(e.target.value).replace(/[^0-9.]/g, ''))}
                                                        onKeyDown={e => e.key === 'Enter' && handleAddIngredient()}
                                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-slate-600 mb-1 block">구매 수량</label>
                                                    <input
                                                        type="text"
                                                        placeholder="1"
                                                        value={addCommas(purchaseAmount)}
                                                        onChange={e => setPurchaseAmount(removeCommas(e.target.value).replace(/[^0-9.]/g, ''))}
                                                        onKeyDown={e => e.key === 'Enter' && handleAddIngredient()}
                                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-slate-600 mb-1 block">구매 단위</label>
                                                    <select
                                                        value={purchaseUnit}
                                                        onChange={e => handlePurchaseUnitChange(e.target.value)}
                                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                                    >
                                                        <option value="g">g</option>
                                                        <option value="kg">kg</option>
                                                        <option value="ml">ml</option>
                                                        <option value="L">L</option>
                                                        <option value="개">개</option>
                                                        <option value="모">모</option>
                                                        <option value="단">단</option>
                                                        <option value="봉">봉</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-xs font-medium text-slate-600 mb-1 block">사용량</label>
                                                    <input
                                                        type="text"
                                                        placeholder="200"
                                                        value={addCommas(usageAmount)}
                                                        onChange={e => setUsageAmount(removeCommas(e.target.value).replace(/[^0-9.]/g, ''))}
                                                        onKeyDown={e => e.key === 'Enter' && handleAddIngredient()}
                                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-slate-600 mb-1 block">사용 단위</label>
                                                    <select
                                                        value={usageUnit}
                                                        onChange={e => setUsageUnit(e.target.value)}
                                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                                    >
                                                        <option value="kg">kg</option>
                                                        <option value="g">g</option>
                                                        <option value="L">L</option>
                                                        <option value="ml">ml</option>
                                                        <option value="개">개</option>
                                                        <option value="모">모</option>
                                                        <option value="단">단</option>
                                                        <option value="봉">봉</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleAddIngredient}
                                                    className={`flex-1 px-4 py-2 rounded-lg font-bold transition-colors text-sm ${editingIngredientId
                                                        ? 'bg-green-600 text-white hover:bg-green-700'
                                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                        }`}
                                                >
                                                    {editingIngredientId ? '✓ 수정 완료' : '+ 재료 추가'}
                                                </button>
                                                {editingIngredientId && (
                                                    <button
                                                        onClick={resetIngredientForm}
                                                        className="px-4 py-2 bg-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-400 transition-colors text-sm"
                                                    >
                                                        취소
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 재료 목록 (인쇄용 표 형식 적용) */}
                                    {recipeDetails.ingredients.length === 0 ? (
                                        <p className="text-center text-slate-400 py-4 no-print">재료를 추가해주세요.</p>
                                    ) : (
                                        <div className="overflow-hidden">
                                            <table className="w-full text-left border-collapse print:text-[9pt]">
                                                <thead>
                                                    <tr className="bg-slate-100 border-y border-slate-200 print:bg-slate-50">
                                                        <th className="px-4 py-2 font-bold text-slate-700 print:px-2">재료명</th>
                                                        <th className="px-4 py-2 font-bold text-slate-700 text-right print:px-2">구매 정보</th>
                                                        <th className="px-4 py-2 font-bold text-slate-700 text-right print:px-2">사용량</th>
                                                        <th className="px-4 py-2 font-bold text-indigo-600 text-right print:px-2">원가</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {recipeDetails.ingredients.map(ing => (
                                                        <tr key={ing.id} className="hover:bg-slate-50/50 print:hover:bg-transparent">
                                                            <td className="px-4 py-2 font-medium text-slate-800 print:px-2">{ing.name}</td>
                                                            <td className="px-4 py-2 text-slate-500 text-right italic print:px-2">
                                                                {ing.purchaseAmount}{ing.purchaseUnit} / {ing.purchasePrice.toLocaleString()}원
                                                            </td>
                                                            <td className="px-4 py-2 text-slate-600 text-right print:px-2">
                                                                {ing.usageAmount}{ing.usageUnit}
                                                            </td>
                                                            <td className="px-4 py-2 font-bold text-indigo-600 text-right print:px-2">
                                                                {formatPrice(ing.totalCost)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot>
                                                    <tr className="border-t-2 border-slate-200 bg-slate-50/30">
                                                        <td className="px-4 py-3 font-bold text-slate-600 text-right print:py-2">재료비 소계</td>
                                                        <td className="px-4 py-3 font-black text-indigo-700 text-right print:py-2">{formatPrice(recipeDetails.totalIngredientCost)}</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                {/* 간접비 */}
                                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 print:border-none print:p-0 print:shadow-none print:mt-4">
                                    <h2 className="text-lg font-bold text-slate-800 mb-4 print:text-sm print:mb-2 print:border-l-4 print:border-slate-800 print:pl-2">💼 간접비(고정비) 내역</h2>

                                    <div className="mb-4 p-4 bg-slate-50 rounded-lg space-y-3 no-print">
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="text-[10px] text-indigo-600 bg-indigo-50 p-2 rounded leading-relaxed flex-1">
                                                💡 <strong>간접비 설정:</strong> 가게의 <strong>한 달 고정비</strong>를 입력하세요.<br />
                                                예상 판매량으로 나누어 <strong>상품 1개당 비용</strong>을 산출해 드립니다.
                                            </div>
                                            <div className="flex gap-1 ml-2">
                                                <button
                                                    onClick={handleLoadMasterSettings}
                                                    className="px-2 py-1 text-[10px] bg-white border border-slate-200 text-slate-500 rounded hover:bg-slate-100 transition-colors flex items-center gap-1"
                                                    title="저장된 마스터 설정 불러오기"
                                                >
                                                    <Save className="w-3 h-3 rotate-180" /> 불러오기
                                                </button>
                                                <button
                                                    onClick={handleSaveMasterSettings}
                                                    className="px-2 py-1 text-[10px] bg-slate-800 text-white rounded hover:bg-slate-900 transition-colors flex items-center gap-1 font-bold"
                                                    title="현재 입력을 마스터로 저장"
                                                >
                                                    <Save className="w-3 h-3" /> 마스터 저장
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-xs font-medium text-slate-600 mb-1 block">월 인건비 총합</label>
                                                <input
                                                    type="text"
                                                    placeholder="3,000,000"
                                                    value={addCommas(monthlyLabor)}
                                                    onChange={e => setMonthlyLabor(removeCommas(e.target.value).replace(/[^0-9]/g, ''))}
                                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-slate-600 mb-1 block">월 임대료</label>
                                                <input
                                                    type="text"
                                                    placeholder="1,500,000"
                                                    value={addCommas(monthlyRent)}
                                                    onChange={e => setMonthlyRent(removeCommas(e.target.value).replace(/[^0-9]/g, ''))}
                                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-slate-600 mb-1 block">월 전기/가스</label>
                                                <input
                                                    type="text"
                                                    placeholder="200,000"
                                                    value={addCommas(monthlyUtility)}
                                                    onChange={e => setMonthlyUtility(removeCommas(e.target.value).replace(/[^0-9]/g, ''))}
                                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-slate-600 mb-1 block">월 기타비용 (통신비 등)</label>
                                                <input
                                                    type="text"
                                                    placeholder="300,000"
                                                    value={addCommas(monthlyOther)}
                                                    onChange={e => setMonthlyOther(removeCommas(e.target.value).replace(/[^0-9]/g, ''))}
                                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-xs font-medium text-slate-600 mb-1 block">1일 판매 예상 개수</label>
                                                <input
                                                    type="text"
                                                    placeholder="100"
                                                    value={addCommas(dailySales)}
                                                    onChange={e => setDailySales(removeCommas(e.target.value).replace(/[^0-9]/g, ''))}
                                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-slate-600 mb-1 block">월 근무일</label>
                                                <input
                                                    type="text"
                                                    placeholder="25"
                                                    value={addCommas(workingDays)}
                                                    onChange={e => setWorkingDays(removeCommas(e.target.value).replace(/[^0-9]/g, ''))}
                                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={calculateAutoOverhead}
                                                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors text-sm"
                                            >
                                                계산하기
                                            </button>
                                            {autoOverheadPerUnit > 0 && (
                                                <button
                                                    onClick={applyAutoOverhead}
                                                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors text-sm"
                                                >
                                                    적용 ({autoOverheadPerUnit.toLocaleString()}원/개)
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* 간접비 목록 */}
                                    {recipeDetails.overheads.length === 0 ? (
                                        <p className="text-center text-slate-400 py-4 no-print">간접비를 추가해주세요.</p>
                                    ) : (
                                        <div className="space-y-2 print:space-y-1">
                                            {recipeDetails.overheads.map(oh => (
                                                <div key={oh.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg print:p-1 print:bg-transparent print:border-b print:border-slate-100 print:rounded-none">
                                                    <span className="font-medium text-slate-800 print:text-[9pt]">{oh.category} (안분)</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-indigo-600 print:text-[9pt]">{formatPrice(oh.amount)}</span>
                                                        <button
                                                            onClick={() => handleDeleteOverhead(oh.id)}
                                                            className="text-red-500 hover:text-red-700 no-print"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="flex justify-end pt-2 print:pt-1">
                                                <span className="text-sm font-bold text-slate-700 print:text-[9pt]">
                                                    간접비 소계: {formatPrice(recipeDetails.totalOverheadCost)}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 최종 결과 (인쇄 최적화) */}
                                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white print:bg-white print:text-slate-900 print:shadow-none print:border-t-4 print:border-indigo-600 print:p-4 print:mt-6 print:rounded-none print-break-inside-avoid">
                                    <div className="flex justify-between items-start mb-6 print:mb-4 border-b border-white/20 print:border-slate-200 pb-4">
                                        <h2 className="text-xl font-black print:text-lg">💰 수익성 분석 결과</h2>
                                        <div className="text-right">
                                            <span className="text-xs text-indigo-100 print:text-slate-500 block mb-1">목표 마진율</span>
                                            <span className="text-2xl font-black print:text-indigo-600">{recipeDetails.recipe.targetMargin}%</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:gap-4">
                                        <div className="space-y-3 print:space-y-1">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-indigo-100 print:text-slate-500 font-medium">재료원가 + 간접비</span>
                                                <span className="font-semibold text-lg print:text-slate-800">{formatPrice(recipeDetails.totalCost)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-indigo-100 print:text-slate-500 font-medium">예상 마진 ({recipeDetails.recipe.targetMargin}%)</span>
                                                <span className="font-semibold text-lg print:text-slate-800">+ {formatPrice(Math.round(recipeDetails.totalCost * (recipeDetails.recipe.targetMargin / 100)))}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm pt-2 border-t border-white/20 print:border-slate-100">
                                                <span className="text-indigo-200 print:text-slate-400 font-medium">공급가액 소계</span>
                                                <span className="font-bold print:text-slate-700">{formatPrice(recipeDetails.supplyPrice)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-indigo-200 print:text-slate-400 font-medium">부가가치세 (10%)</span>
                                                <span className="font-bold print:text-slate-700">+ {formatPrice(recipeDetails.vat)}</span>
                                            </div>
                                        </div>

                                        <div className="bg-white/10 print:bg-indigo-50 p-6 rounded-2xl flex flex-col justify-center items-center print:p-4 print:rounded-lg">
                                            <span className="text-indigo-100 print:text-indigo-600 text-sm font-bold mb-1">최종 권장 판매가</span>
                                            <div className="text-4xl font-black text-white print:text-indigo-800 drop-shadow-lg print:drop-shadow-none">
                                                {formatPrice(recipeDetails.suggestedPrice)}
                                            </div>
                                            <div className="mt-4 w-full pt-4 border-t border-white/20 print:border-indigo-200 space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-indigo-100 print:text-indigo-600 font-bold">개당 예상 순이익</span>
                                                    <span className="text-xl font-black text-yellow-300 print:text-orange-600">
                                                        {formatPrice(Math.round(recipeDetails.totalCost * (recipeDetails.recipe.targetMargin / 100)))}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-indigo-100 print:text-indigo-500 font-bold">실질 이익률 (판매가 대비)</span>
                                                    <span className="text-lg font-black text-white print:text-slate-700">
                                                        {Math.round((recipeDetails.totalCost * (recipeDetails.recipe.targetMargin / 100)) / (recipeDetails.supplyPrice || 1) * 100)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div >
    )
}
