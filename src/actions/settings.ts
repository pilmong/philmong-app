'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getSystemSettings() {
    try {
        let settings = await (prisma as any).systemSettings.findFirst({
            where: { id: 'default' }
        });

        if (!settings) {
            settings = await (prisma as any).systemSettings.create({
                data: { id: 'default', companyName: '필몽' }
            });
        }

        return settings;
    } catch (error) {
        console.error('Failed to fetch system settings:', error);
        return { id: 'default', companyName: '필몽', companyRegNo: '', bankInfo: '' };
    }
}

export async function updateSystemSettings(data: {
    companyName: string,
    companyRegNo?: string,
    bankInfo?: string,
    defaultLunchboxCost?: number,
    defaultSaladCost?: number
}) {
    try {
        await (prisma as any).systemSettings.upsert({
            where: { id: 'default' },
            update: data,
            create: { id: 'default', ...data }
        });
        revalidatePath('/admin/settings');
        revalidatePath('/admin/lunch/settings');
        revalidatePath('/admin/lunch/settlement');
        return { success: true };
    } catch (error) {
        console.error('Failed to update system settings:', error);
        return { success: false, error: 'Failed to update settings' };
    }
}
