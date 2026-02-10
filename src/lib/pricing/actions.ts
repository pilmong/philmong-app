"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath, unstable_noStore } from "next/cache"

// ===== 레시피 액션 =====

export async function getPricingRecipes() {
    console.log("SERVER: Entering getPricingRecipes")
    unstable_noStore()
    const prismaAny = prisma as any
    if (!prismaAny.pricingRecipe) {
        return { success: false, error: "Prisma 클라이언트가 업데이트되지 않았습니다. npx prisma generate를 먼저 실행해주세요." }
    }
    try {
        const recipes = await prismaAny.pricingRecipe.findMany({
            include: {
                ingredients: true,
                overheads: true
            },
            orderBy: { createdAt: 'desc' }
        })
        return { success: true, data: JSON.parse(JSON.stringify(recipes)) }
    } catch (error) {
        console.error("Failed to fetch pricing recipes:", error)
        return { success: false, error: "레시피를 불러오지 못했습니다." }
    }
}

export async function createPricingRecipe(data: { name: string; servingSize: string; targetMargin: number }) {
    console.log("SERVER: Entering createPricingRecipe with data:", data)

    // 런타임 모델 가용성 체크
    const prismaAny = prisma as any
    if (!prismaAny.pricingRecipe) {
        const availableModels = Object.keys(prismaAny).filter(k => !k.startsWith('_') && !k.startsWith('$'))
        console.error("[V3-FIXED] SERVER ERROR: 'pricingRecipe' model is missing on Prisma client!")
        console.error("Available models:", availableModels)
        return {
            success: false,
            error: `[V3-FIXED] 'pricingRecipe' 모델을 찾을 수 없습니다. (가용 모델: ${availableModels.join(', ') || '없음'}). 서버를 재시작하고 'npx prisma generate'를 실행해야 할 수도 있습니다.`
        }
    }

    try {
        const recipe = await prismaAny.pricingRecipe.create({
            data: {
                name: data.name,
                servingSize: data.servingSize,
                targetMargin: data.targetMargin
            }
        })
        // 모든 관련 경로 및 레이아웃 무효화
        revalidatePath('/', 'layout')
        revalidatePath('/pricing', 'layout')

        console.log("SERVER: Successfully created recipe:", recipe.id)
        return { success: true, data: JSON.parse(JSON.stringify(recipe)) } // Serialization 보장
    } catch (error) {
        console.error("[V3-FIXED] SERVER CRITICAL: createPricingRecipe failed", error)
        return { success: false, error: `[V3-FIXED] ${(error as Error).message}` || "[V3-FIXED] 서버 내부 오류가 발생했습니다." }
    }
}

export async function updatePricingRecipe(id: string, data: { name?: string; servingSize?: string; targetMargin?: number }) {
    const prismaAny = prisma as any
    if (!prismaAny.pricingRecipe) return { success: false, error: "Prisma 클라이언트 미준비" }
    try {
        await prismaAny.pricingRecipe.update({
            where: { id },
            data
        })
        revalidatePath('/pricing')
        return { success: true }
    } catch (error) {
        return { success: false, error: "레시피 수정에 실패했습니다." }
    }
}

export async function deletePricingRecipe(id: string) {
    const prismaAny = prisma as any
    if (!prismaAny.pricingRecipe) return { success: false, error: "Prisma 클라이언트 미준비" }
    try {
        await prismaAny.pricingRecipe.delete({
            where: { id }
        })
        revalidatePath('/pricing')
        return { success: true }
    } catch (error) {
        return { success: false, error: "레시피 삭제에 실패했습니다." }
    }
}

// ===== 재료 액션 =====

export async function addPricingIngredient(data: {
    recipeId: string;
    name: string;
    purchasePrice: number;
    purchaseUnit: string;
    purchaseAmount: number;
    usageAmount: number;
    usageUnit: string;
}) {
    const prismaAny = prisma as any
    if (!prismaAny.pricingIngredient) return { success: false, error: "Prisma 클라이언트 미준비" }
    try {
        await prismaAny.pricingIngredient.create({
            data
        })
        revalidatePath('/pricing')
        return { success: true }
    } catch (error) {
        return { success: false, error: "재료 추가에 실패했습니다." }
    }
}

export async function updatePricingIngredient(id: string, data: any) {
    try {
        await (prisma as any).pricingIngredient.update({
            where: { id },
            data
        })
        revalidatePath('/pricing')
        return { success: true }
    } catch (error) {
        return { success: false, error: "재료 수정에 실패했습니다." }
    }
}

export async function deletePricingIngredient(id: string) {
    try {
        await (prisma as any).pricingIngredient.delete({
            where: { id }
        })
        revalidatePath('/pricing')
        return { success: true }
    } catch (error) {
        return { success: false, error: "재료 삭제에 실패했습니다." }
    }
}

// ===== 간접비 액션 =====

export async function addPricingOverhead(data: { recipeId: string; category: string; amount: number }) {
    const prismaAny = prisma as any
    if (!prismaAny.pricingOverhead) return { success: false, error: "Prisma 클라이언트 미준비" }
    try {
        await prismaAny.pricingOverhead.create({
            data
        })
        revalidatePath('/pricing')
        return { success: true }
    } catch (error) {
        return { success: false, error: "간접비 추가에 실패했습니다." }
    }
}

export async function deletePricingOverhead(id: string) {
    try {
        await (prisma as any).pricingOverhead.delete({
            where: { id }
        })
        revalidatePath('/pricing')
        return { success: true }
    } catch (error) {
        return { success: false, error: "간접비 삭제에 실패했습니다." }
    }
}

// ===== 설정 액션 =====

export async function getPricingSettings() {
    const prismaAny = prisma as any
    if (!prismaAny.pricingSettings) return { success: false, error: "Prisma 클라이언트 미준비" }
    try {
        let settings = await prismaAny.pricingSettings.findUnique({
            where: { id: "default" }
        })

        if (!settings) {
            settings = await prismaAny.pricingSettings.create({
                data: { id: "default" }
            })
        }

        return { success: true, data: JSON.parse(JSON.stringify(settings)) }
    } catch (error) {
        return { success: false, error: "설정값을 불러오지 못했습니다." }
    }
}

export async function updatePricingSettings(data: {
    monthlyLabor?: number;
    monthlyRent?: number;
    monthlyUtility?: number;
    monthlyOther?: number;
    dailySales?: number;
    workingDays?: number;
    perUnit?: number;
    defaultTargetMargin?: number;
}) {
    try {
        await (prisma as any).pricingSettings.update({
            where: { id: "default" },
            data
        })
        revalidatePath('/pricing')
        return { success: true }
    } catch (error) {
        return { success: false, error: "설정 저장에 실패했습니다." }
    }
}
