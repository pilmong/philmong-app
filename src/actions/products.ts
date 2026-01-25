'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Product } from '@prisma/client';

export type ProductType = 'REGULAR' | 'DAILY' | 'SPECIAL' | 'LUNCHBOX';
export type WorkType = 'SUBDIVISION' | 'COOKING';
export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';

export async function getProducts(type?: ProductType) {
    try {
        const products = await prisma.product.findMany({
            where: type ? { type } : undefined,
            orderBy: { createdAt: 'desc' },
        });
        return products;
    } catch (error) {
        console.error('Failed to fetch products:', error);
        return [];
    }
}

export async function createProduct(data: {
    type: ProductType;
    name: string;
    price: number;
    category?: string;
    status: ProductStatus;
    workType?: WorkType;
    description?: string;
    targetDate?: Date;
    displayQty?: number;
    productionQty?: number;
}) {
    try {
        const product = await prisma.product.create({
            data: {
                ...data,
            },
        });
        revalidatePath('/admin/products');
        return { success: true, data: product };
    } catch (error) {
        console.error('Failed to create product:', error);
        return { success: false, error: 'Failed to create product' };
    }
}

export async function updateProduct(id: string, data: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>) {
    try {
        const product = await prisma.product.update({
            where: { id },
            data: data,
        });
        revalidatePath('/admin/products');
        return { success: true, data: product };
    } catch (error) {
        console.error('Failed to update product:', error);
        return { success: false, error: 'Failed to update product' };
    }
}

export async function deleteProduct(id: string) {
    try {
        await prisma.product.delete({
            where: { id },
        });
        revalidatePath('/admin/products');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete product:', error);
        return { success: false, error: 'Failed to delete product' };
    }
}
