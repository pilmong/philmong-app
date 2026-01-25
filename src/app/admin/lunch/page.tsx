

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Users, Calendar, ClipboardList, TrendingUp, Settings, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { getCurrentUser } from '@/actions/auth';
import { redirect } from 'next/navigation';

export default async function LunchAdminPage() {
    const user = await getCurrentUser();

    // 권한 정보 파싱
    const permissions = user?.permissions ? (typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions) : [];
    const isAdmin = user?.role === 'ADMIN';

    const allMenus = [
        {
            title: '고객사 관리',
            description: '납품 고객사 등록, 단가 및 마감 시간 설정',
            href: '/admin/lunch/clients',
            icon: Users,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
            permission: 'LUNCH_CLIENTS'
        },
        {
            title: '런치 통계 분석',
            description: '기간별 매출 추이 및 메뉴 선호도 리포트',
            href: '/admin/lunch/stats',
            icon: TrendingUp,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
            permission: 'LUNCH_STATS'
        },
        {
            title: '메뉴 기획',
            description: '도시락 및 샐러드 데일리 구성 관리',
            href: '/admin/lunch/menu',
            icon: Calendar,
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-100',
            permission: 'LUNCH_MENU'
        },
        {
            title: '오늘의 작업',
            description: '전체 주문 수량 확인 및 배달 상태 관리',
            href: '/admin/lunch/work',
            icon: ClipboardList,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100',
            permission: 'LUNCH_WORK'
        },
        {
            title: '정산 및 명세서',
            description: '기간별 매출 확인 및 A4 명세서 출력',
            href: '/admin/lunch/settlement',
            icon: TrendingUp,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
            permission: 'LUNCH_SETTLEMENT'
        },
        {
            title: '전역 환경 설정',
            description: '회사 이름, 사업자 번호, 계좌 정보 관리',
            href: '/admin/settings',
            icon: Settings,
            color: 'text-slate-600',
            bgColor: 'bg-slate-100',
            permission: 'SETTINGS'
        },
    ];

    // 권한 필터링
    const filteredMenus = allMenus.filter(item =>
        isAdmin || permissions.includes(item.permission) || permissions.some((p: string) => p.startsWith(item.permission + '_'))
    );

    // 권한이 딱 하나라면 해당 페이지로 즉시 이동 (사용 편의성)
    if (filteredMenus.length === 1 && !isAdmin) {
        redirect(filteredMenus[0].href);
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">런치 납품 관리 센터</h1>
                <p className="text-muted-foreground">매일 진행되는 런치 납품의 모든 프로세스를 원스톱으로 통제합니다.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredMenus.map((item) => (
                    <Link key={item.title} href={item.href}>
                        <Card className="hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer h-full border-none shadow-sm overflow-hidden bg-white dark:bg-slate-900 group">
                            <CardHeader className="flex flex-row items-center space-y-0 pb-4">
                                <div className={`${item.bgColor} p-3 rounded-2xl mr-4 group-hover:scale-110 transition-transform`}>
                                    <item.icon className={`h-6 w-6 ${item.color}`} />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-black">{item.title}</CardTitle>
                                    <CardDescription className="text-xs mt-1 leading-tight">{item.description}</CardDescription>
                                </div>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* 어드민 또는 통계 권한이 있을 때만 핵심 요약 표시 */}
            {(isAdmin || permissions.includes('LUNCH_STATS') || permissions.includes('LUNCH_SETTLEMENT')) && (
                <div className="grid gap-6 md:grid-cols-2 mt-12 bg-slate-900/5 p-8 rounded-[2rem] border-2 border-dashed border-slate-200 dark:bg-white/5 dark:border-white/10">
                    <Card className="border-none shadow-none bg-transparent">
                        <CardHeader className="p-0 pb-4">
                            <CardTitle className="text-lg font-black flex items-center gap-2">
                                <ClipboardList className="h-5 w-5 text-blue-600" /> 실시간 주문 요약
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="text-4xl font-black text-slate-900 dark:text-white">합계 0건</div>
                            <p className="text-sm text-slate-500 font-bold mt-2">오늘 납품될 전체 수량입니다.</p>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-none bg-transparent">
                        <CardHeader className="p-0 pb-4">
                            <CardTitle className="text-lg font-black flex items-center gap-2">
                                <Info className="h-5 w-5 text-emerald-600" /> 공지 및 업무 가이드
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                                각 메뉴의 정해진 마감 시간과 소분 기준을 준수해 주세요.<br />
                                특정 요청사항은 고객사 관리 탭에서 확인할 수 있습니다.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
