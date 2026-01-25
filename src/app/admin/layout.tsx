'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, Package, Menu, X, Home, ChefHat, TrendingUp, Settings as SettingsIcon, LogOut, User as UserIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { getCurrentUser, logout } from '@/actions/auth';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [companyName, setCompanyName] = useState('필몽');
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        async function loadData() {
            // 1. Load Company Info
            try {
                const { getSystemSettings } = await import('@/actions/settings');
                const settings = await getSystemSettings();
                if (settings?.companyName) {
                    setCompanyName(settings.companyName);
                }
            } catch (error) {
                console.error('Failed to load company name in sidebar:', error);
            }

            // 2. Load User Info
            const currentUser = await getCurrentUser();
            setUser(currentUser);
        }
        loadData();
    }, []);

    const navGroups = [
        {
            group: '메인',
            items: [
                { name: '통합 대시보드', href: '/admin/dashboard', icon: LayoutDashboard, permission: 'DASHBOARD' },
            ]
        },
        {
            group: '일반 주문 운영',
            items: [
                { name: '주문 관리', href: '/admin/orders', icon: ShoppingBag, permission: 'ORDERS' },
                { name: '실시간 조리실', href: '/admin/orders/kitchen', icon: ChefHat, permission: 'KITCHEN' },
                { name: '소분 및 포장', href: '/admin/orders/subdivision', icon: Package, permission: 'SUBDIVISION' },
                { name: '매출 통계', href: '/admin/orders/stats', icon: TrendingUp, permission: 'STATS' },
            ]
        },
        {
            group: '전문 서비스',
            items: [
                { name: '런치 및 정기배송', href: '/admin/lunch', icon: Package, permission: 'LUNCH' },
            ]
        },
        {
            group: '시스템 설정',
            items: [
                { name: '상품 마스터', href: '/admin/products', icon: Package, permission: 'PRODUCTS' },
                { name: '전역 환경 설정', href: '/admin/settings', icon: SettingsIcon, permission: 'SETTINGS' },
                { name: '사용자 및 권한', href: '/admin/users', icon: UserIcon, permission: 'USERS' },
            ]
        }
    ];

    // 권한 정보 파싱 (안전장치 추가)
    const getUserPermissions = () => {
        if (!user || !user.permissions) return [];
        try {
            return typeof user.permissions === 'string'
                ? JSON.parse(user.permissions)
                : user.permissions;
        } catch (e) {
            console.error('Permission parse error:', e);
            return [];
        }
    };

    const userPermissions = getUserPermissions();

    const filteredGroups = navGroups.map(group => ({
        ...group,
        items: group.items.filter((item: any) =>
            user?.role === 'ADMIN' ||
            userPermissions.includes(item.permission) ||
            userPermissions.some((p: string) => p.startsWith(item.permission + '_'))
        )
    })).filter(group => group.items.length > 0);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="font-bold text-lg">{companyName} Admin</span>
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                    {isSidebarOpen ? <X /> : <Menu />}
                </button>
            </div>

            <div className="flex">
                {/* Sidebar */}
                <aside
                    className={cn(
                        "fixed inset-y-0 left-0 z-50 w-64 transform bg-slate-900 text-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 dark:bg-slate-900 overflow-y-auto",
                        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                    )}
                >
                    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800">
                        <div className="flex h-16 items-center justify-center border-b border-slate-800 text-xl font-bold uppercase tracking-tighter shrink-0">
                            {companyName}
                        </div>

                        <nav className="flex-1 mt-6 px-4 space-y-8 overflow-y-auto scrollbar-hide">
                            {filteredGroups.map((group) => (
                                <div key={group.group} className="space-y-2">
                                    <h3 className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        {group.group}
                                    </h3>
                                    <div className="space-y-1">
                                        {group.items.map((item) => {
                                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                                            return (
                                                <Link
                                                    key={item.name}
                                                    href={item.href}
                                                    className={cn(
                                                        "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold transition-all",
                                                        isActive
                                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                                                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                                    )}
                                                    onClick={() => setIsSidebarOpen(false)}
                                                >
                                                    <item.icon className={cn("h-4 w-4", isActive ? "text-white" : "text-slate-500")} />
                                                    {item.name}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </nav>

                        {/* User Profile & Logout */}
                        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
                            <div className="flex items-center gap-3 px-2 mb-4">
                                <div className="p-2 bg-slate-800 rounded-full text-blue-400">
                                    <UserIcon className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-white leading-none mb-1">{user?.name || '관리자'}</span>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{user?.role || 'ADMIN'}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => logout()}
                                className="flex items-center gap-3 w-full rounded-xl px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all border border-red-500/10"
                            >
                                <LogOut className="h-4 w-4" />
                                로그아웃
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Overlay for mobile */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Main Content */}
                <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}
