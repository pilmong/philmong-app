import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';

// 1. 보호할 경로 정의
const protectedRoutes = ['/admin'];
const publicRoutes = ['/login', '/lunch/order']; // 런치 주문 페이지는 공개

export default async function middleware(req: NextRequest) {
    // 2. 현재 경로가 보호된 경로인지 확인
    const path = req.nextUrl.pathname;
    const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
    const isPublicRoute = publicRoutes.some(route => path.startsWith(route));

    // 3. 세션 쿠키 가져오기 및 복호화
    const cookie = req.cookies.get('session')?.value;
    const session = cookie ? await decrypt(cookie).catch(() => null) : null;

    // 4. 인증되지 않은 사용자가 보호된 경로에 접근할 경우 로그인 페이지로 리다이렉트
    if (isProtectedRoute && !session) {
        return NextResponse.redirect(new URL('/login', req.nextUrl));
    }

    // 5. 고객사 계정(`CLIENT`)인데 연결된 업체가 비활성화된 경우 차단
    // (참고: 정밀한 실시간 체크를 위해 페이지 접근 시 DB 체크를 수행하도록 설계됨)

    // 5. 이미 로그인된 사용자가 로그인 페이지에 접근할 경우 대시보드로 리다이렉트
    if (isPublicRoute && session && !path.startsWith('/lunch/order')) {
        return NextResponse.redirect(new URL('/admin/dashboard', req.nextUrl));
    }

    // 6. 역할별 상세 권한 제어 (나중에 확장 가능)
    // 예: if (path.startsWith('/admin/settings') && session?.role !== 'ADMIN') ...

    return NextResponse.next();
}

// Routes Middleware should not run on
export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
