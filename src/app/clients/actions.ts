"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createClient(formData: FormData) {
    const name = formData.get("name") as string;
    const managerEmail = formData.get("managerEmail") as string;
    const contact = formData.get("contact") as string;
    const category = formData.get("category") as string;
    const isVatInclusive = formData.get("isVatInclusive") === "true";
    const note = formData.get("note") as string;

    try {
        await prisma.client.create({
            data: { name, managerEmail, contact, category, isVatInclusive, note },
        });
    } catch (error) {
        console.error("고객사 등록 실패:", error);
        return;
    }

    revalidatePath("/clients");
    redirect("/clients");
}

export async function updateClient(id: string, formData: FormData) {
    const name = formData.get("name") as string;
    const managerEmail = formData.get("managerEmail") as string;
    const contact = formData.get("contact") as string;
    const category = formData.get("category") as string;
    const isVatInclusive = formData.get("isVatInclusive") === "true";
    const note = formData.get("note") as string;

    console.log(`[updateClient] ID: ${id}, Name: ${name}, Category: ${category}`);

    try {
        await prisma.client.update({
            where: { id },
            data: { name, managerEmail, contact, category, isVatInclusive, note },
        });
    } catch (error) {
        console.error("고객사 수정 실패:", error);
        return;
    }

    revalidatePath(`/clients/${id}`);
    revalidatePath("/clients");
    redirect(`/clients/${id}`);
}

export async function setCustomPrice(clientId: string, productId: string, customPrice: number) {
    try {
        await prisma.clientProductPrice.upsert({
            where: {
                clientId_productId: { clientId, productId },
            },
            update: { customPrice },
            create: { clientId, productId, customPrice },
        });
        revalidatePath(`/clients/${clientId}`);
    } catch (error) {
        console.error("맞춤 단가 설정 실패:", error);
        return { error: "단가 설정 중 오류가 발생했습니다." };
    }
}

export async function removeCustomPrice(clientId: string, productId: string) {
    try {
        await prisma.clientProductPrice.delete({
            where: {
                clientId_productId: { clientId, productId },
            },
        });
        revalidatePath(`/clients/${clientId}`);
    } catch (error) {
        console.error("맞춤 단가 삭제 실패:", error);
    }
}
