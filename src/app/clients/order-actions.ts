"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * 전역 시스템 설정을 가져오거나 기본값을 생성합니다.
 */
async function getSystemSettings() {
    let settings = await prisma.systemSetting.findUnique({
        where: { id: "GLOBAL" }
    });

    if (!settings) {
        settings = await prisma.systemSetting.create({
            data: { id: "GLOBAL", deadlineHour: 15 }
        });
    }
    return settings;
}

/**
 * 발주 마감 시간을 업데이트합니다. (관리자용)
 */
export async function updateDeadlineHour(hour: number) {
    try {
        await prisma.systemSetting.upsert({
            where: { id: "GLOBAL" },
            update: { deadlineHour: hour },
            create: { id: "GLOBAL", deadlineHour: hour }
        });
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        return { error: "설정 저장 실패" };
    }
}

/**
 * 발주 요청을 저장하거나 수정합니다.
 * @param isAdmin 관리자 여부 (마감 시간 제한 우회용)
 */
export async function upsertOrderRequest(
    clientId: string,
    dateStr: string,
    quantity: number,
    options: {
        productId?: string;
        itemName?: string;
        itemCategory?: string;
        isAdmin?: boolean;
    }
) {
    try {
        const targetDate = new Date(dateStr);
        const { productId, itemName, itemCategory, isAdmin = false } = options;

        // 1. 배송 마감 체크 (관리자 제외)
        if (!isAdmin) {
            const settings = await getSystemSettings();
            const now = new Date();

            // 오늘 날짜 00:00:00
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // 발주 요청일 00:00:00
            const deliveryDay = new Date(targetDate);
            deliveryDay.setHours(0, 0, 0, 0);

            // [규칙 1] 당일 발주는 불가 (신선 식재료 조달 불가)
            if (deliveryDay.getTime() <= today.getTime()) {
                return { error: "당일 및 지난 날짜의 발주는 온라인으로 접수할 수 없습니다. 고객센터로 문의해 주세요." };
            }

            // [규칙 2] 내일(익일) 발주인 경우, 오늘 오후 N시 마감 체크
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            if (deliveryDay.getTime() === tomorrow.getTime()) {
                const deadline = new Date(today);
                deadline.setHours(settings.deadlineHour, 0, 0, 0);

                if (now > deadline) {
                    return { error: `내일 발주는 시스템상 오후 ${settings.deadlineHour}시에 마감되었습니다.` };
                }
            }
        }

        // 2. 해당 고객사의 해당 날짜 발주서(Header) 찾기 또는 생성
        let orderRequest = await prisma.orderRequest.findFirst({
            where: {
                clientId,
                targetDate
            }
        });

        if (!orderRequest) {
            orderRequest = await prisma.orderRequest.create({
                data: {
                    clientId,
                    targetDate
                }
            });
        }

        // 3. 해당 발주서 내의 특정 항목 찾기
        const existingItem = await prisma.orderRequestItem.findFirst({
            where: {
                orderId: orderRequest.id,
                OR: [
                    ...(productId ? [{ productId }] : []),
                    ...(itemName ? [{ itemName }] : []),
                    ...(itemCategory ? [{ itemCategory }] : [])
                ]
            }
        });

        if (existingItem) {
            if (quantity <= 0) {
                await prisma.orderRequestItem.delete({
                    where: { id: existingItem.id }
                });
            } else {
                await prisma.orderRequestItem.update({
                    where: { id: existingItem.id },
                    data: {
                        quantity,
                        productId: productId || existingItem.productId,
                        itemName: itemName || existingItem.itemName
                    }
                });
            }
        } else if (quantity > 0) {
            await prisma.orderRequestItem.create({
                data: {
                    orderId: orderRequest.id,
                    productId,
                    itemName,
                    itemCategory,
                    quantity
                }
            });
        }

        revalidatePath(`/clients/${clientId}/orders`);
        return { success: true };
    } catch (error) {
        console.error("발주 저장 실패:", error);
        return { error: "발주 정보 저장 중 오류가 발생했습니다." };
    }
}
