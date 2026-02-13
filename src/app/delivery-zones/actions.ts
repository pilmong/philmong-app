"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type DeliveryZoneInput = {
    name: string;
    areas: string[];
    price: number;
    isActive: boolean;
};

export async function getDeliveryZones() {
    try {
        const zones = await prisma.deliveryZone.findMany({
            orderBy: { price: 'asc' }
        });
        return { success: true, data: zones };
    } catch (error) {
        console.error("Failed to fetch zones:", error);
        return { success: false, error: "조회 실패" };
    }
}

export async function upsertDeliveryZone(id: string | null, data: DeliveryZoneInput) {
    try {
        if (id) {
            await prisma.deliveryZone.update({
                where: { id },
                data: {
                    name: data.name,
                    areas: data.areas,
                    price: data.price,
                    isActive: data.isActive
                }
            });
        } else {
            await prisma.deliveryZone.create({
                data: {
                    name: data.name,
                    areas: data.areas,
                    price: data.price,
                    isActive: data.isActive
                }
            });
        }

        revalidatePath('/delivery-zones');
        return { success: true };
    } catch (error) {
        console.error("Failed to upsert zone:", error);
        return { success: false, error: "저장 실패" };
    }
}

export async function deleteDeliveryZone(id: string) {
    try {
        await prisma.deliveryZone.delete({ where: { id } });
        revalidatePath('/delivery-zones');
        return { success: true };
    } catch (error) {
        return { success: false, error: "삭제 실패" };
    }
}
