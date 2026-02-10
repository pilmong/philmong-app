// 판매가 계산기 - 데이터 구조 및 로직
// Pricing Calculator - Data Structures and Logic

import {
    getPricingRecipes,
    createPricingRecipe,
    updatePricingRecipe,
    deletePricingRecipe,
    addPricingIngredient,
    updatePricingIngredient,
    deletePricingIngredient,
    addPricingOverhead,
    deletePricingOverhead,
    getPricingSettings,
    updatePricingSettings
} from './actions'

export interface Recipe {
    id: string
    name: string
    servingSize: string
    targetMargin: number
    createdAt: Date
    updatedAt: Date
    ingredients?: Ingredient[]
    overheads?: Overhead[]
}

export interface Ingredient {
    id: string
    recipeId: string
    name: string
    purchasePrice: number
    purchaseUnit: string
    purchaseAmount: number
    usageAmount: number
    usageUnit: string
    unitCost: number
    totalCost: number
}

export interface Overhead {
    id: string
    recipeId: string
    category: string
    amount: number
}

export interface RecipeWithDetails {
    recipe: Recipe
    ingredients: Ingredient[]
    overheads: Overhead[]
    totalIngredientCost: number
    totalOverheadCost: number
    totalCost: number
    supplyPrice: number
    vat: number
    suggestedPrice: number
}

// ===== 레시피 관리 (서버 연동) =====

export async function loadRecipesFromDb(): Promise<Recipe[]> {
    const result = await getPricingRecipes()
    return (result.success && result.data ? result.data : []) as Recipe[]
}

export async function addRecipeToDb(recipe: { name: string; servingSize: string; targetMargin: number }) {
    const result = await createPricingRecipe(recipe)
    return result.success ? result.data : null
}

export async function updateRecipeInDb(id: string, updates: any) {
    await updatePricingRecipe(id, updates)
}

export async function deleteRecipeFromDb(id: string) {
    await deletePricingRecipe(id)
}

// ===== 재료 관리 (서버 연동) =====

export async function addIngredientToDb(ingredient: any) {
    const result = await addPricingIngredient(ingredient)
    return result.success ? true : null
}

export async function updateIngredientInDb(id: string, updates: any) {
    await updatePricingIngredient(id, updates)
}

export async function deleteIngredientFromDb(id: string) {
    await deletePricingIngredient(id)
}

// ===== 간접비 관리 (서버 연동) =====

export async function addOverheadToDb(overhead: any) {
    const result = await addPricingOverhead(overhead)
    return result.success ? true : null
}

export async function deleteOverheadFromDb(id: string) {
    await deletePricingOverhead(id)
}

// ===== 설정 관리 (서버 연동) =====

export async function loadSettingsFromDb() {
    const result = await getPricingSettings()
    return result.success ? result.data : null
}

export async function saveSettingsToDb(settings: any) {
    await updatePricingSettings(settings)
}

// ===== 계산 로직 (순수 함수) =====

const UNIT_CONVERSIONS: Record<string, Record<string, number>> = {
    'kg': { 'kg': 1, 'g': 1000 },
    'g': { 'kg': 0.001, 'g': 1 },
    'L': { 'L': 1, 'ml': 1000 },
    'ml': { 'L': 0.001, 'ml': 1 },
    '개': { '개': 1 },
    '모': { '모': 1 },
    '단': { '단': 1 },
    '봉': { '봉': 1 },
}

export function calculateIngredientCost(
    purchasePrice: number,
    purchaseAmount: number,
    purchaseUnit: string,
    usageAmount: number,
    usageUnit: string
): { unitCost: number; totalCost: number } {
    if (purchaseUnit === usageUnit) {
        const unitCost = purchasePrice / purchaseAmount
        const totalCost = unitCost * usageAmount
        return { unitCost, totalCost }
    }

    const conversion = UNIT_CONVERSIONS[purchaseUnit]?.[usageUnit]
    if (conversion) {
        const purchaseInUsageUnit = purchaseAmount * conversion
        const unitCost = purchasePrice / purchaseInUsageUnit
        const totalCost = unitCost * usageAmount
        return { unitCost, totalCost }
    }

    const unitCost = purchasePrice / purchaseAmount
    const totalCost = unitCost * usageAmount
    return { unitCost, totalCost }
}

export function computeRecipeDetails(recipe: any, ingredients: any[], overheads: any[]): RecipeWithDetails {
    const processedIngredients = ingredients.map(ing => {
        const { unitCost, totalCost } = calculateIngredientCost(
            ing.purchasePrice,
            ing.purchaseAmount,
            ing.purchaseUnit,
            ing.usageAmount,
            ing.usageUnit
        )
        return { ...ing, unitCost, totalCost }
    })

    const totalIngredientCost = processedIngredients.reduce((sum, i) => sum + i.totalCost, 0)
    const totalOverheadCost = overheads.reduce((sum, o) => sum + o.amount, 0)
    const totalCost = totalIngredientCost + totalOverheadCost

    const supplyPrice = Math.ceil(totalCost * (1 + recipe.targetMargin / 100) / 100) * 100
    const vat = Math.round(supplyPrice * 0.1)
    const suggestedPrice = Math.ceil((supplyPrice + vat) / 100) * 100

    return {
        recipe,
        ingredients: processedIngredients,
        overheads,
        totalIngredientCost,
        totalOverheadCost,
        totalCost,
        supplyPrice,
        vat,
        suggestedPrice
    }
}
