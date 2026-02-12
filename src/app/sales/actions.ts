"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { parseOrderText } from "@/lib/order-parser";
import { parseFlexibleDate } from "@/lib/date-utils";

export async function createSaleWithItems(data: {
    customerName?: string;
    customerPhone?: string;
    deliveryFee: number;
    discountValue: number;
    totalAmount: number;
    source: string;
    memo?: string;
    utilizationDate?: string;
    reservationNumber?: string;
    address?: string;
    requestNote?: string;
    visitor?: string;
    deliveryZone?: string;
    paymentStatus?: string;
    pickupType?: string;
    items: {
        productId?: string;
        customName?: string;
        quantity: number;
        price: number;
    }[];
}) {
    try {
        const sale = await prisma.sale.create({
            data: {
                customerName: data.customerName,
                customerPhone: data.customerPhone,
                deliveryFee: data.deliveryFee,
                discountValue: data.discountValue,
                totalAmount: data.totalAmount,
                source: data.source || "NAVER",
                memo: data.memo,
                reservationNumber: data.reservationNumber,
                address: data.address,
                requestNote: data.requestNote,
                visitor: data.visitor,
                deliveryZone: data.deliveryZone,
                paymentStatus: data.paymentStatus,
                pickupType: data.pickupType || (data.address ? "DELIVERY" : "PICKUP"),
                utilizationDate: parseFlexibleDate(data.utilizationDate),
                items: {
                    create: data.items.map(item => ({
                        productId: item.productId,
                        customName: item.customName,
                        quantity: item.quantity,
                        price: item.price
                    }))
                }
            }
        });

        revalidatePath("/sales");
        return { success: true, id: sale.id };
    } catch (error) {
        console.error("판매 기록 생성 실패:", error);
        throw error;
    }
}

/**
 * 상품명을 기준으로 상품 목록을 검색합니다.
 */
export async function getProductsByNames(names: string[]) {
    return await prisma.product.findMany({
        where: {
            name: { in: names }
        }
    });
}

/**
 * 모든 상품 목록을 가져옵니다.
 */
export async function getAllProducts() {
    return await prisma.product.findMany({
        where: { status: "SELLING" },
        select: { id: true, name: true, price: true }
    });
}

/**
 * 최근 판매 내역을 가져옵니다.
 */
export async function getRecentSales() {
    return await prisma.sale.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            items: {
                include: {
                    product: true
                }
            }
        },
    });
}

/**
 * ID 목록으로 판매 내역을 조회합니다.
 */
export async function getSalesByIds(ids: string[]) {
    if (!ids.length) return [];
    return await prisma.sale.findMany({
        where: { id: { in: ids } },
        include: {
            items: {
                include: {
                    product: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
}

/**
 * 판매 정보를 업데이트합니다.
 */
export async function updateSale(saleId: string, data: {
    customerName?: string;
    customerPhone?: string;
    deliveryFee?: number;
    discountValue?: number;
    memo?: string;
    reservationNumber?: string;
    pickupType?: string;
    address?: string;
    paymentStatus?: string;
    deliveryZone?: string;
    utilizationDate?: string | Date; // Allow string for flexibility
    requestNote?: string;
    items?: {
        productId?: string;
        customName?: string;
        quantity: number;
        price: number;
    }[];
}) {
    try {
        // 트랜잭션으로 처리하여 안전하게 업데이트
        await prisma.$transaction(async (tx) => {
            // 1. 기본 정보 업데이트
            await tx.sale.update({
                where: { id: saleId },
                data: {
                    customerName: data.customerName,
                    customerPhone: data.customerPhone,
                    deliveryFee: data.deliveryFee,
                    discountValue: data.discountValue,
                    memo: data.memo,
                    reservationNumber: data.reservationNumber,
                    pickupType: data.pickupType,
                    address: data.address,
                    paymentStatus: data.paymentStatus,
                    deliveryZone: data.deliveryZone,
                    requestNote: data.requestNote,
                    utilizationDate: parseFlexibleDate(data.utilizationDate)
                }
            });

            // 2. 아이템 정보가 제공된 경우에만 items 업데이트 수행
            if (data.items) {
                // 기존 아이템 모두 삭제
                await tx.saleItem.deleteMany({
                    where: { saleId: saleId }
                });

                // 새 아이템 생성
                if (data.items.length > 0) {
                    await tx.saleItem.createMany({
                        data: data.items.map(item => ({
                            saleId: saleId,
                            productId: item.productId,
                            customName: item.customName,
                            quantity: item.quantity,
                            price: item.price
                        }))
                    });
                }
            }

            // 3. 총 금액 재계산 (현재 DB 상태 기준)
            // 방금 업데이트된 내용을 포함하여 다시 조회
            const updatedSale = await tx.sale.findUnique({
                where: { id: saleId },
                include: { items: true }
            });

            if (updatedSale) {
                const itemsTotal = updatedSale.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                // data에 값이 있으면 그것을, 없으면 DB에 있는 값을 사용
                const delivery = data.deliveryFee ?? updatedSale.deliveryFee;
                const discount = data.discountValue ?? updatedSale.discountValue;
                const newTotalAmount = itemsTotal + delivery - discount;

                await tx.sale.update({
                    where: { id: saleId },
                    data: { totalAmount: newTotalAmount }
                });
            }
        });

        revalidatePath("/sales");
        return { success: true };
    } catch (error) {
        console.error("판매 정보 수정 실패:", error);
        throw error;
    }
}

/**
 * 텍스트를 파싱하여 자동으로 판매 정보를 생성합니다.
 */
export async function createSaleFromText(text: string) {
    try {
        // 1. 모든 상품 정보 로드
        const allProducts = await prisma.product.findMany({
            where: { status: "SELLING" }
        });

        // 2. 텍스트 파싱
        const parsedData = parseOrderText(text, allProducts);

        // 3. 총 금액 계산
        const itemsTotal = parsedData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const totalAmount = itemsTotal + parsedData.deliveryFee - parsedData.discountValue;

        // 4. DB 생성
        const sale = await prisma.sale.create({
            data: {
                source: "AUTO_PARSE",
                customerName: parsedData.customerName,
                customerPhone: parsedData.customerPhone,
                deliveryFee: parsedData.deliveryFee,
                discountValue: parsedData.discountValue,
                totalAmount: totalAmount,
                memo: parsedData.memo,
                pickupType: parsedData.pickupType,
                address: parsedData.address,
                paymentStatus: parsedData.paymentStatus,
                deliveryZone: parsedData.deliveryZone,
                requestNote: parsedData.requestNote,
                visitor: parsedData.visitor, // 추가
                utilizationDate: parseFlexibleDate(parsedData.utilizationDate),
                items: {
                    create: parsedData.items.map(item => ({
                        productId: item.productId,
                        customName: item.customName,
                        quantity: item.quantity,
                        price: item.price
                    }))
                }
            }
        });

        revalidatePath("/sales");
        return { success: true, id: sale.id, parsedData };
    } catch (error) {
        console.error("자동 파싱 주문 생성 실패:", error);
        throw error;
    }
}

/**
 * 판매 데이터를 초기화합니다.
 */
export async function resetSalesData(target: 'ALL' | 'AUTO_PARSE' = 'ALL') {
    try {
        const where = target === 'ALL' ? {} : { source: target };

        await prisma.sale.deleteMany({
            where
        });

        revalidatePath("/sales");
        return { success: true };
    } catch (error) {
        console.error("판매 데이터 초기화 실패:", error);
        return { success: false, error: "초기화 실패" };
    }
}
