'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// ----------------------------------------------------------------------
// DATA BACKUP
// ----------------------------------------------------------------------

export async function getDatabaseBackup() {
    try {
        const [
            systemSettings, systemPolicies, accounts, vendors, holidays, deliveryZones,
            products, clients, pricingRecipes, pricingSettings,
            sales, purchases,
            lunchBoxConfigs, clientProductPrices, orderRequests,
            pricingIngredients, pricingOverheads, saleItems, purchaseItems, orderRequestItems
        ] = await Promise.all([
            prisma.systemSetting.findMany(),
            (prisma as any).systemPolicy.findMany(),
            prisma.account.findMany(),
            (prisma as any).vendor.findMany(),
            (prisma as any).holiday.findMany(),
            (prisma as any).deliveryZone.findMany(),
            prisma.product.findMany(),
            prisma.client.findMany(),
            prisma.pricingRecipe.findMany(),
            prisma.pricingSettings.findMany(),
            prisma.sale.findMany(),
            prisma.purchase.findMany(),
            prisma.lunchBoxConfig.findMany(),
            prisma.clientProductPrice.findMany(),
            prisma.orderRequest.findMany(),
            prisma.pricingIngredient.findMany(),
            prisma.pricingOverhead.findMany(),
            prisma.saleItem.findMany(),
            prisma.purchaseItem.findMany(),
            prisma.orderRequestItem.findMany(),
        ]);

        const backupData = {
            timestamp: new Date().toISOString(),
            version: "1.0",
            data: {
                systemSetting: systemSettings,
                systemPolicy: systemPolicies,
                account: accounts,
                vendor: vendors,
                holiday: holidays,
                deliveryZone: deliveryZones,
                product: products,
                client: clients,
                pricingRecipe: pricingRecipes,
                pricingSettings: pricingSettings,
                sale: sales,
                purchase: purchases,
                lunchBoxConfig: lunchBoxConfigs,
                clientProductPrice: clientProductPrices,
                orderRequest: orderRequests,
                pricingIngredient: pricingIngredients,
                pricingOverhead: pricingOverheads,
                saleItem: saleItems,
                purchaseItem: purchaseItems,
                orderRequestItem: orderRequestItems
            }
        };

        return { success: true, data: backupData };
    } catch (error) {
        console.error("Backup failed:", error);
        return { success: false, error: "데이터 백업 중 오류가 발생했습니다." };
    }
}

// ----------------------------------------------------------------------
// DATA RESTORE
// ----------------------------------------------------------------------

export async function restoreDatabase(backupData: any) {
    if (!backupData || !backupData.data) {
        return { success: false, error: "유효하지 않은 백업 파일입니다." };
    }

    const { data } = backupData;
    let restoreCount = 0;

    try {
        // Transaction might be too large for Vercel timeout limits if allow massive data.
        // We will do sequential restores for robustness, acknowledging strict consistency might be slightly risky if it fails halfway.
        // But for an admin tool, usually fine.

        // 1. Level 1: Independent Tables
        if (data.systemSetting?.length) {
            for (const item of data.systemSetting) await prisma.systemSetting.upsert({ where: { id: item.id }, update: item, create: item });
        }
        if (data.systemPolicy?.length) {
            for (const item of data.systemPolicy) await (prisma as any).systemPolicy.upsert({ where: { key: item.key }, update: item, create: item });
        }
        if (data.account?.length) {
            for (const item of data.account) await prisma.account.upsert({ where: { id: item.id }, update: item, create: item });
        }
        if (data.vendor?.length) {
            for (const item of data.vendor) await (prisma as any).vendor.upsert({ where: { id: item.id }, update: item, create: item });
        }
        if (data.holiday?.length) {
            for (const item of data.holiday) await (prisma as any).holiday.upsert({ where: { id: item.id }, update: item, create: item });
        }
        if (data.deliveryZone?.length) {
            for (const item of data.deliveryZone) await (prisma as any).deliveryZone.upsert({ where: { id: item.id }, update: item, create: item });
        }
        if (data.product?.length) {
            for (const item of data.product) await prisma.product.upsert({ where: { id: item.id }, update: item, create: item });
        }
        if (data.client?.length) {
            for (const item of data.client) await prisma.client.upsert({ where: { id: item.id }, update: item, create: item });
        }
        if (data.pricingRecipe?.length) {
            for (const item of data.pricingRecipe) await prisma.pricingRecipe.upsert({ where: { id: item.id }, update: item, create: item });
        }
        if (data.pricingSettings?.length) {
            for (const item of data.pricingSettings) await prisma.pricingSettings.upsert({ where: { id: item.id }, update: item, create: item });
        }

        // Sales & Purchases (Independent of others mostly, except logic)
        if (data.sale?.length) {
            for (const item of data.sale) await prisma.sale.upsert({ where: { id: item.id }, update: item, create: item });
        }
        if (data.purchase?.length) {
            for (const item of data.purchase) await prisma.purchase.upsert({ where: { id: item.id }, update: item, create: item });
        }

        // 2. Level 2: First-level Dependents
        if (data.lunchBoxConfig?.length) {
            for (const item of data.lunchBoxConfig) await prisma.lunchBoxConfig.upsert({ where: { id: item.id }, update: item, create: item });
        }
        if (data.clientProductPrice?.length) {
            for (const item of data.clientProductPrice) await prisma.clientProductPrice.upsert({ where: { id: item.id }, update: item, create: item });
        }
        if (data.orderRequest?.length) {
            for (const item of data.orderRequest) await prisma.orderRequest.upsert({ where: { id: item.id }, update: item, create: item });
        }
        if (data.pricingIngredient?.length) {
            for (const item of data.pricingIngredient) await prisma.pricingIngredient.upsert({ where: { id: item.id }, update: item, create: item });
        }
        if (data.pricingOverhead?.length) {
            for (const item of data.pricingOverhead) await prisma.pricingOverhead.upsert({ where: { id: item.id }, update: item, create: item });
        }
        if (data.saleItem?.length) {
            for (const item of data.saleItem) await prisma.saleItem.upsert({ where: { id: item.id }, update: item, create: item });
        }
        if (data.purchaseItem?.length) {
            for (const item of data.purchaseItem) await prisma.purchaseItem.upsert({ where: { id: item.id }, update: item, create: item });
        }

        // 3. Level 3: Deep Dependents
        if (data.orderRequestItem?.length) {
            for (const item of data.orderRequestItem) await prisma.orderRequestItem.upsert({ where: { id: item.id }, update: item, create: item });
        }

        revalidatePath('/');
        return { success: true, message: "복원이 완료되었습니다." };

    } catch (error) {
        console.error("Restore failed:", error);
        return { success: false, error: "데이터 복원 중 오류가 발생했습니다." };
    }
}
