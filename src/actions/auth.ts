'use server';

import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/auth';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    try {
        // @ts-ignore - Prisma 모델 참조 오류 방어
        const user = await (prisma as any).user.findUnique({
            where: { username }
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return { error: '아이디 또는 비밀번호가 올바르지 않습니다.' };
        }

        if (user.status !== 'ACTIVE') {
            return { error: '비활성화된 계정입니다. 관리자에게 문의하세요.' };
        }

        // 고객사 계정일 경우, 연결된 업체의 계약 상태 확인
        if (user.role === 'CLIENT' && user.clientId) {
            const client = await prisma.lunchClient.findUnique({
                where: { id: user.clientId }
            });
            if (!client || client.status !== 'ACTIVE') {
                return { error: '사용 가능한 주문 채널이 아닙니다. (계약 종료 또는 비활성화)' };
            }
        }

        // 세션 생성
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간
        const session = await encrypt({
            userId: user.id,
            username: user.username,
            role: user.role,
            name: user.name,
            permissions: user.permissions, // 권한 정보 추가
            expires
        });

        // 쿠키 설정
        (await cookies()).set('session', session, { expires, httpOnly: true });

        revalidatePath('/');
        redirect('/admin/dashboard');
    } catch (error: any) {
        if (error.message === 'NEXT_REDIRECT') throw error; // redirect()는 에러를 던져야 작동함
        console.error('Login Error:', error);
        return { error: '로그인 도중 서버 오류가 발생했습니다.' };
    }
}

export async function logout() {
    (await cookies()).set('session', '', { expires: new Date(0) });
    redirect('/login');
}

export async function getCurrentUser() {
    const sessionCookie = (await cookies()).get('session')?.value;
    if (!sessionCookie) return null;

    try {
        const { decrypt } = await import('@/lib/auth');
        const decrypted = await decrypt(sessionCookie);
        if (!decrypted || !decrypted.userId) return null;

        // DB에서 최신 정보 조회 (특히 permissions 확인을 위해)
        // @ts-ignore - Prisma 모델 참조 오류 방어
        const user = await (prisma as any).user.findUnique({
            where: { id: decrypted.userId as string },
            select: {
                id: true,
                username: true,
                role: true,
                name: true,
                permissions: true,
                status: true
            }
        });

        if (!user || user.status !== 'ACTIVE') return null;
        return user;
    } catch (error) {
        console.error('getCurrentUser Error:', error);
        return null;
    }
}
