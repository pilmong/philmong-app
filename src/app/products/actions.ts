"use server";

import { prisma } from "@/lib/prisma";
import { ProductType, WorkDivision, ProductStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createProduct(formData: FormData) {
    const name = formData.get("name") as string;
    const price = parseInt(formData.get("price") as string) || 0;
    const type = formData.get("type") as ProductType;
    let workDivision = formData.get("workDivision") as WorkDivision;

    if (type !== "REGULAR") {
        workDivision = "COOKING";
    }
    const status = formData.get("status") as ProductStatus;

    const standardQuantity = formData.get("standardQuantity")
        ? parseInt(formData.get("standardQuantity") as string)
        : null;
    const sellingDateStr = formData.get("sellingDate") as string;
    const sellingDate = sellingDateStr ? new Date(sellingDateStr) : null;
    const description = formData.get("description") as string;
    const plannedQuantity = formData.get("plannedQuantity")
        ? parseInt(formData.get("plannedQuantity") as string)
        : null;

    // 런치박스 슬롯 데이터 수집 (A~AA)
    const layoutType = formData.get("layoutType") as string || "LUNCH_BOX";
    const slotNames = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").concat(["AA"]);
    const slots: any = {};
    slotNames.forEach(s => {
        slots[`slot${s}`] = formData.get(`slot${s}`) as string;
    });

    try {
        const product = await prisma.product.create({
            data: {
                name,
                price,
                type,
                workDivision,
                status,
                standardQuantity,
                sellingDate,
                description,
                plannedQuantity,
                ...(type === 'LUNCH_BOX' ? {
                    lunchBoxConfig: {
                        create: {
                            layoutType,
                            ...slots
                        }
                    }
                } : {})
            },
        });

        console.log("상품 등록 완료:", product.id);
    } catch (error) {
        console.error("상품 등록 실패:", error);
        return;
    }

    revalidatePath("/products");
    redirect("/products");
}

export async function updateProduct(id: string, formData: FormData) {
    const name = formData.get("name") as string;
    const price = parseInt(formData.get("price") as string) || 0;
    const type = formData.get("type") as ProductType;
    let workDivision = formData.get("workDivision") as WorkDivision;

    if (type !== "REGULAR") {
        workDivision = "COOKING";
    }
    const status = formData.get("status") as ProductStatus;

    const standardQuantity = formData.get("standardQuantity")
        ? parseInt(formData.get("standardQuantity") as string)
        : null;
    const sellingDateStr = formData.get("sellingDate") as string;
    const sellingDate = sellingDateStr ? new Date(sellingDateStr) : null;
    const description = formData.get("description") as string;
    const plannedQuantity = formData.get("plannedQuantity")
        ? parseInt(formData.get("plannedQuantity") as string)
        : null;

    // 런치박스 슬롯 데이터 수집 (A~AA)
    const layoutType = formData.get("layoutType") as string || "LUNCH_BOX";
    const slotNames = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").concat(["AA"]);
    const slots: any = {};
    slotNames.forEach(s => {
        slots[`slot${s}`] = formData.get(`slot${s}`) as string;
    });

    try {
        await prisma.product.update({
            where: { id },
            data: {
                name,
                price,
                type,
                workDivision,
                status,
                standardQuantity,
                sellingDate,
                description,
                plannedQuantity,
                ...(type === 'LUNCH_BOX' ? {
                    lunchBoxConfig: {
                        upsert: {
                            create: { layoutType, ...slots },
                            update: { layoutType, ...slots }
                        }
                    }
                } : {})
            },
        });
    } catch (error) {
        console.error("상품 수정 실패:", error);
        return;
    }

    revalidatePath("/products");
    redirect("/products");
}

export async function deleteProduct(id: string) {
    try {
        await prisma.product.delete({ where: { id } });
    } catch (error) {
        console.error("상품 삭제 실패:", error);
    }
    revalidatePath("/products");
}

export async function createBulkProducts(productsData: any[]) {
    try {
        await prisma.$transaction(
            productsData.map(data => prisma.product.create({ data }))
        );
        revalidatePath("/products");
    } catch (error) {
        console.error("일괄 등록 실패:", error);
        throw error;
    }
}
