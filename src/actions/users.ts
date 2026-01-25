'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { getCurrentUser } from './auth';

export async function getUsers() {
    try {
        return await (prisma as any).user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                username: true,
                name: true,
                role: true,
                permissions: true,
                clientId: true,
                status: true,
                createdAt: true
            }
        });
    } catch (error) {
        console.error('Failed to fetch users:', error);
        return [];
    }
}

export async function createUser(data: any) {
    try {
        const executor = await getCurrentUser();
        if (!executor) return { success: false, error: '인증이 필요합니다.' };

        // 매니저 등 하위 권한은 ADMIN을 생성할 수 없음
        if (data.role === 'ADMIN' && executor.role !== 'ADMIN') {
            return { success: false, error: '관리자 계정을 생성할 권한이 없습니다.' };
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        // ADMIN일 경우 모든 권한 자동 부여
        const permissions = data.role === 'ADMIN'
            ? ["DASHBOARD", "ORDERS", "KITCHEN", "SUBDIVISION", "STATS", "LUNCH", "PRODUCTS", "SETTINGS", "USERS", "LUNCH_CLIENTS", "LUNCH_MENU", "LUNCH_STATS", "LUNCH_WORK", "LUNCH_KITCHEN_DOC", "LUNCH_LABELS", "LUNCH_SETTLEMENT"]
            : (data.permissions || []);

        await (prisma as any).user.create({
            data: {
                username: data.username,
                password: hashedPassword,
                name: data.name,
                role: data.role,
                permissions: JSON.stringify(permissions),
                clientId: data.clientId || null,
                status: 'ACTIVE'
            }
        });
        revalidatePath('/admin/users');
        return { success: true };
    } catch (error: any) {
        console.error('Failed to create user:', error);
        return { success: false, error: error.message };
    }
}

export async function updateUser(id: string, data: any) {
    try {
        const executor = await getCurrentUser();
        if (!executor) return { success: false, error: '인증이 필요합니다.' };

        // 수정 대상 사용자 조회
        const targetUser = await (prisma as any).user.findUnique({ where: { id } });
        if (!targetUser) return { success: false, error: '사용자를 찾을 수 없습니다.' };

        // 1. 매니저는 ADMIN 계정을 수정할 수 없음
        if (targetUser.role === 'ADMIN' && executor.role !== 'ADMIN') {
            return { success: false, error: '관리자 계정을 수정할 권한이 없습니다.' };
        }

        // 2. 매니저는 타인을 ADMIN으로 승격시킬 수 없음
        if (data.role === 'ADMIN' && executor.role !== 'ADMIN') {
            return { success: false, error: '관리자 권한을 부여할 수 없습니다.' };
        }

        // ADMIN일 경우 모든 권한 강제 유지 (실수 방지 및 하위 권한 포함)
        const permissions = data.role === 'ADMIN'
            ? ["DASHBOARD", "ORDERS", "KITCHEN", "SUBDIVISION", "STATS", "LUNCH", "PRODUCTS", "SETTINGS", "USERS", "LUNCH_CLIENTS", "LUNCH_MENU", "LUNCH_STATS", "LUNCH_WORK", "LUNCH_KITCHEN_DOC", "LUNCH_LABELS", "LUNCH_SETTLEMENT"]
            : (data.permissions || []);

        const updateData: any = {
            name: data.name,
            role: data.role,
            permissions: JSON.stringify(permissions),
            clientId: data.clientId || null,
            status: data.status
        };

        if (data.password) {
            updateData.password = await bcrypt.hash(data.password, 10);
        }

        await (prisma as any).user.update({
            where: { id },
            data: updateData
        });
        revalidatePath('/admin/users');
        return { success: true };
    } catch (error: any) {
        console.error('Failed to update user:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteUser(id: string) {
    try {
        const executor = await getCurrentUser();
        if (!executor) return { success: false, error: '인증이 필요합니다.' };

        // 삭제 대상 사용자 조회
        const targetUser = await (prisma as any).user.findUnique({ where: { id } });
        if (!targetUser) return { success: false, error: '사용자를 찾을 수 없습니다.' };

        // 매니저는 ADMIN 계정을 삭제할 수 없음
        if (targetUser.role === 'ADMIN' && executor.role !== 'ADMIN') {
            return { success: false, error: '관리자 계정을 삭제할 권한이 없습니다.' };
        }

        await (prisma as any).user.delete({
            where: { id }
        });
        revalidatePath('/admin/users');
        return { success: true };
    } catch (error: any) {
        console.error('Failed to delete user:', error);
        return { success: false, error: error.message };
    }
}
