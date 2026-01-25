'use client';

import { useState } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { updateLunchOrderStatus } from '@/actions/lunch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Truck, CheckCircle, Package, Utensils, MessageSquare, Info, ChevronLeft, ChevronRight, Calendar, XCircle, Undo2, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { updateLunchOrderCount } from '@/actions/lunch';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface WorkBoardProps {
    date: Date;
    dailyMenu: any;
    orders: any[];
    allClients: any[];
    user?: any;
}

export function WorkBoard({ date, dailyMenu, orders, allClients, user }: WorkBoardProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // 권한 확인 로직 (트리 구조 대응)
    const permissions = user?.permissions ? (typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions) : [];
    const isAdmin = user?.role === 'ADMIN';
    const hasKitchenDocAccess = isAdmin || permissions.includes('LUNCH_KITCHEN_DOC');
    const hasLabelAccess = isAdmin || permissions.includes('LUNCH_LABELS');

    const handleDateChange = (newDate: Date) => {
        const dateStr = format(newDate, 'yyyy-MM-dd');
        router.push(`/admin/lunch/work?date=${dateStr}`);
    };
    const totalLunchboxes = orders.reduce((sum, o) => sum + o.lunchboxCount, 0);
    const totalSalads = orders.reduce((sum, o) => sum + o.saladCount, 0);

    const lunchboxLayout = dailyMenu?.lunchboxLayout ? JSON.parse(dailyMenu.lunchboxLayout) : null;
    const saladLayout = dailyMenu?.saladLayout ? JSON.parse(dailyMenu.saladLayout) : null;

    // 모든 고객사와 주문 데이터 결합
    const displayOrders = allClients
        .filter(client => client.status === 'ACTIVE')
        .map(client => {
            const order = orders.find(o => o.clientId === client.id);
            if (order) return order;

            // 주문이 없는 경우 더미 객체 생성
            return {
                id: `none-${client.id}`,
                clientId: client.id,
                client: client,
                lunchboxCount: 0,
                saladCount: 0,
                status: 'PENDING',
                memo: '',
                isPlaceholder: true // 표시용 플래그
            };
        })
        .sort((a, b) => a.client.name.localeCompare(b.client.name));

    const handleStatusUpdate = async (orderId: string, newStatus: string) => {
        await updateLunchOrderStatus(orderId, newStatus);
        window.location.reload();
    };

    const [editingOrder, setEditingOrder] = useState<any>(null);
    const [editData, setEditData] = useState({ lunchboxCount: 0, saladCount: 0, memo: '' });
    const [isUpdating, setIsUpdating] = useState(false);

    const handleEditOpen = (order: any) => {
        setEditingOrder(order);
        setEditData({
            lunchboxCount: order.lunchboxCount,
            saladCount: order.saladCount,
            memo: order.memo || ''
        });
    };

    const handleUpdateOrder = async () => {
        if (!editingOrder) return;
        setIsUpdating(true);
        try {
            await updateLunchOrderCount(editingOrder.clientId, date, {
                ...editData,
                modifiedBy: user?.name || '관리자'
            });
            setEditingOrder(null);
            router.refresh();
            // 또는 window.location.reload();
        } catch (error) {
            console.error('Update Order Error:', error);
            alert('수정 중 오류가 발생했습니다.');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Navigation Bar */}
            <Card className="border-none shadow-sm bg-slate-900 text-white">
                <CardContent className="py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="hover:bg-slate-800 text-white" onClick={() => handleDateChange(subDays(date, 1))}>
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex flex-col items-center min-w-[150px]">
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{format(date, 'EEEE')}</span>
                            <span className="text-xl font-black">{format(date, 'yyyy년 MM월 dd일')}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="hover:bg-slate-800 text-white" onClick={() => handleDateChange(addDays(date, 1))}>
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-800 p-1 rounded-lg border border-slate-700">
                        <Calendar className="h-4 w-4 ml-2 text-slate-400" />
                        <Input
                            type="date"
                            className="bg-transparent border-none text-white focus-visible:ring-0 w-[150px]"
                            value={format(date, 'yyyy-MM-dd')}
                            onChange={(e) => handleDateChange(new Date(e.target.value))}
                        />
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleDateChange(new Date())}
                            className="text-xs font-bold"
                        >
                            오늘로 이동
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Row */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-blue-600 text-white border-none shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg opacity-80">전체 도시락</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-5xl font-black">{totalLunchboxes}</div>
                    </CardContent>
                </Card>
                <Card className="bg-green-600 text-white border-none shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg opacity-80">전체 샐러드</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-5xl font-black">{totalSalads}</div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 text-white border-none shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg opacity-80">배달 완료</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-5xl font-black">
                            {orders.filter(o => o.status === 'COMPLETED' || o.status === 'PAID').length} / {orders.length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions for Kitchen - 세분화된 권한 체크 */}
            <div className="flex flex-col md:flex-row gap-4 print:hidden">
                {hasKitchenDocAccess && (
                    <Link href={`/admin/lunch/work/kitchen?date=${format(date, 'yyyy-MM-dd')}`} className="flex-1">
                        <Button variant="outline" className="w-full h-16 text-lg font-bold gap-3 border-orange-200 bg-orange-50/50 hover:bg-orange-100 text-orange-700 shadow-sm">
                            <Utensils className="h-6 w-6" /> 조리실 작업지시서 보기
                        </Button>
                    </Link>
                )}
                {hasLabelAccess && (
                    <Link href={`/admin/lunch/work/labels?date=${format(date, 'yyyy-MM-dd')}`} className="flex-1">
                        <Button variant="outline" className="w-full h-16 text-lg font-bold gap-3 border-blue-200 bg-blue-50/50 hover:bg-blue-100 text-blue-700 shadow-sm">
                            <Package className="h-6 w-6" /> 스티커 라벨 출력하기
                        </Button>
                    </Link>
                )}
            </div>

            {/* Menu Guide Row */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-none shadow-sm">
                    <CardHeader className="bg-orange-50 dark:bg-orange-900/10">
                        <CardTitle className="flex items-center gap-2">
                            <Utensils className="h-5 w-5 text-orange-600" /> 도시락 조리 가이드
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 px-4 pb-4">
                        {lunchboxLayout ? (
                            <div className="relative w-full aspect-[265/195] max-w-[400px] mx-auto bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden shadow-inner border">
                                {/* 용기 배경 이미지 */}
                                <img
                                    src="/assets/lunchbox-tray.jpg"
                                    alt="Lunchbox Tray"
                                    className="w-full h-full object-cover opacity-80 mix-blend-multiply dark:mix-blend-overlay"
                                />

                                {/* 메뉴 오버레이 - 라벨 위치에 맞춰 배치 */}
                                <div className="absolute inset-0 p-2 pointer-events-none">
                                    {/* 반찬 1 */}
                                    <div className="absolute top-[8%] left-[6%] w-[18%] text-center">
                                        <div className="text-[10px] font-black text-slate-400 leading-none mb-1">반찬1</div>
                                        <div className="text-xs font-bold text-slate-900 bg-white/60 p-1 rounded backdrop-blur-sm line-clamp-2">{lunchboxLayout.banchan1 || '-'}</div>
                                    </div>

                                    {/* 메인 */}
                                    <div className="absolute top-[8%] left-[28%] w-[22%] text-center">
                                        <div className="text-[10px] font-black text-orange-500 leading-none mb-1">메인</div>
                                        <div className="text-sm font-black text-slate-900 bg-white/80 p-1 rounded backdrop-blur-sm border border-orange-200 line-clamp-2">{lunchboxLayout.main || '-'}</div>
                                    </div>

                                    {/* 반찬 2 */}
                                    <div className="absolute top-[8%] left-[53%] w-[18%] text-center">
                                        <div className="text-[10px] font-black text-slate-400 leading-none mb-1">반찬2</div>
                                        <div className="text-xs font-bold text-slate-900 bg-white/60 p-1 rounded backdrop-blur-sm line-clamp-2">{lunchboxLayout.banchan2 || '-'}</div>
                                    </div>

                                    {/* 반찬 3 */}
                                    <div className="absolute top-[8%] left-[75%] w-[18%] text-center">
                                        <div className="text-[10px] font-black text-slate-400 leading-none mb-1">반찬3</div>
                                        <div className="text-xs font-bold text-slate-900 bg-white/60 p-1 rounded backdrop-blur-sm line-clamp-2">{lunchboxLayout.banchan3 || '-'}</div>
                                    </div>

                                    {/* 밥 (왼쪽 아래 큰 칸) */}
                                    <div className="absolute top-[55%] left-[15%] w-[25%] text-center">
                                        <div className="text-[10px] font-black text-slate-400 leading-none mb-1">밥</div>
                                        <div className="text-sm font-bold text-slate-700 bg-white/40 p-1 rounded">흰쌀밥</div>
                                    </div>

                                    {/* 국 (오른쪽 아래 둥근 칸) */}
                                    <div className="absolute top-[55%] left-[58%] w-[28%] text-center">
                                        <div className="text-[10px] font-black text-blue-500 leading-none mb-1">오늘의 국</div>
                                        <div className="text-sm font-black text-slate-900 bg-blue-50/80 p-2 rounded-full border border-blue-200 backdrop-blur-sm line-clamp-2">{lunchboxLayout.soup || '-'}</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-center text-slate-500 py-8">메뉴 정보가 없습니다.</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader className="bg-green-50 dark:bg-green-900/10">
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-green-600" /> 샐러드 토핑 가이드
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {saladLayout ? (
                            <div className="space-y-3">
                                {(['top', 'middle', 'base'] as const).map((layer) => (
                                    <div key={layer} className="flex gap-2 items-center">
                                        <Badge variant="outline" className="w-16 justify-center capitalize">{layer}</Badge>
                                        <div className="flex flex-wrap gap-1">
                                            {saladLayout.layers[layer].filter(Boolean).map((item: string, i: number) => (
                                                <Badge key={i} variant="secondary">{item}</Badge>
                                            ))}
                                            {!saladLayout.layers[layer].filter(Boolean).length && <span className="text-xs text-slate-400">비어있음</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-slate-500 py-8">메뉴 정보가 없습니다.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Orders Table */}
            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle>고객사별 납품 현황</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900 border-y">
                                <tr>
                                    <th className="px-6 py-4">고객사</th>
                                    <th className="px-6 py-4">주문수량</th>
                                    <th className="px-6 py-4">상태</th>
                                    <th className="px-6 py-4 text-right">결제 금액</th>
                                    <th className="px-6 py-4">추가 메모</th>
                                    <th className="px-6 py-4 text-right">작업</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {displayOrders.map((order) => {
                                    const isDaily = order.client.paymentType === 'DAILY';
                                    const totalPrice = (order.lunchboxCount * order.client.lunchboxPrice) + (order.saladCount * order.client.saladPrice);

                                    return (
                                        <tr key={order.id} className={cn(
                                            "hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors",
                                            order.isPlaceholder && "opacity-60 grayscale-[0.5]"
                                        )}>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900 dark:text-white">{order.client.name}</div>
                                                <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                                    <Badge variant="outline" className="px-1 py-0 h-4 text-[9px] font-black border-slate-200 text-slate-400">
                                                        {order.client.paymentType === 'DAILY' ? '일일 결제' : '정기 정산'}
                                                    </Badge>
                                                    {order.client.address}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] text-slate-400 font-black uppercase">🍱 도시락</span>
                                                        <span className="font-black text-lg text-blue-600">{order.lunchboxCount}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] text-slate-400 font-black uppercase">🥗 샐러드</span>
                                                        <span className="font-black text-lg text-emerald-600">{order.saladCount}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={
                                                    order.status === 'PENDING' ? 'outline' :
                                                        order.status === 'PREPARING' ? 'secondary' :
                                                            order.status === 'DELIVERING' ? 'default' :
                                                                'outline'
                                                } className={cn(
                                                    "rounded-lg px-2 py-1 font-black text-[10px]",
                                                    order.status === 'COMPLETED' && "bg-blue-100 text-blue-700 border-none",
                                                    order.status === 'PAID' && "bg-emerald-100 text-emerald-700 border-none",
                                                )}>
                                                    {order.status === 'PENDING' && '📌 대기 중'}
                                                    {order.status === 'PREPARING' && '🔥 조리 중'}
                                                    {order.status === 'DELIVERING' && '🚚 배달 중'}
                                                    {order.status === 'COMPLETED' && '✅ 배달 완료'}
                                                    {order.status === 'PAID' && '💰 결제 완료'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {isDaily ? (
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-sm font-black text-slate-900 dark:text-white">
                                                            {totalPrice.toLocaleString()}원
                                                        </span>
                                                        <span className="text-[9px] text-emerald-600 font-bold">수금 필요</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 font-bold italic">기간별 정산</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {order.memo ? (
                                                    <div className="flex items-start gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 rounded-md text-slate-700 dark:text-slate-300">
                                                        <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0 text-yellow-600" />
                                                        <span className="text-sm font-medium leading-tight whitespace-pre-wrap">{order.memo}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end items-center gap-2">
                                                    {/* 수정 버튼 */}
                                                    <Dialog open={editingOrder?.id === order.id} onOpenChange={(open) => !open && setEditingOrder(null)}>
                                                        <DialogTrigger asChild>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-full"
                                                                onClick={() => handleEditOpen(order)}
                                                                title="수량 수정"
                                                            >
                                                                <Edit2 className="h-4 w-4" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="sm:max-w-[425px]">
                                                            <DialogHeader>
                                                                <DialogTitle>{order.client.name} 수량 수정</DialogTitle>
                                                                <DialogDescription>
                                                                    {format(date, 'MM월 dd일')} 납품 수량을 수정합니다.
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <div className="grid gap-4 py-4">
                                                                <div className="grid grid-cols-4 items-center gap-4">
                                                                    <Label htmlFor="lunchbox" className="text-right">🍱 도시락</Label>
                                                                    <Input
                                                                        id="lunchbox"
                                                                        type="number"
                                                                        className="col-span-3"
                                                                        value={editData.lunchboxCount}
                                                                        onChange={(e) => setEditData({ ...editData, lunchboxCount: parseInt(e.target.value) || 0 })}
                                                                    />
                                                                </div>
                                                                <div className="grid grid-cols-4 items-center gap-4">
                                                                    <Label htmlFor="salad" className="text-right">🥗 샐러드</Label>
                                                                    <Input
                                                                        id="salad"
                                                                        type="number"
                                                                        className="col-span-3"
                                                                        value={editData.saladCount}
                                                                        onChange={(e) => setEditData({ ...editData, saladCount: parseInt(e.target.value) || 0 })}
                                                                    />
                                                                </div>
                                                                <div className="grid grid-cols-4 items-center gap-4">
                                                                    <Label htmlFor="memo" className="text-right">📝 메모</Label>
                                                                    <Input
                                                                        id="memo"
                                                                        className="col-span-3"
                                                                        value={editData.memo}
                                                                        onChange={(e) => setEditData({ ...editData, memo: e.target.value })}
                                                                        placeholder="수정 사유 등"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <DialogFooter>
                                                                <Button variant="outline" onClick={() => setEditingOrder(null)} disabled={isUpdating}>취소</Button>
                                                                <Button onClick={handleUpdateOrder} disabled={isUpdating}>
                                                                    {isUpdating ? '저장 중...' : '변경 내용 저장'}
                                                                </Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>

                                                    {/* 되돌리기 버튼 (Rollback) */}
                                                    {order.status !== 'PENDING' && (
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-full"
                                                            onClick={() => {
                                                                const prevStatus =
                                                                    order.status === 'PAID' ? 'COMPLETED' :
                                                                        order.status === 'COMPLETED' ? 'DELIVERING' :
                                                                            order.status === 'DELIVERING' ? 'PREPARING' :
                                                                                'PENDING';
                                                                handleStatusUpdate(order.id, prevStatus);
                                                            }}
                                                            title="이전 단계로 되돌리기"
                                                        >
                                                            <Undo2 className="h-4 w-4" />
                                                        </Button>
                                                    )}

                                                    {/* 전진 버튼 (Forward) */}
                                                    {order.status === 'PENDING' && (
                                                        <Button size="sm" className="rounded-xl px-4 font-bold" onClick={() => handleStatusUpdate(order.id, 'PREPARING')}>작업 개시</Button>
                                                    )}
                                                    {order.status === 'PREPARING' && (
                                                        <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 rounded-xl px-4 font-bold bg-blue-50/50 hover:bg-blue-100" onClick={() => handleStatusUpdate(order.id, 'DELIVERING')}>
                                                            <Truck className="mr-2 h-4 w-4" /> 배달 출발
                                                        </Button>
                                                    )}
                                                    {order.status === 'DELIVERING' && (
                                                        <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 rounded-xl px-4 font-bold bg-emerald-50/50 hover:bg-emerald-100" onClick={() => handleStatusUpdate(order.id, 'COMPLETED')}>
                                                            <CheckCircle className="mr-2 h-4 w-4" /> 배달 완료
                                                        </Button>
                                                    )}
                                                    {order.status === 'COMPLETED' && order.client.paymentType === 'DAILY' && (
                                                        <Button size="sm" variant="ghost" className="text-slate-500 font-bold hover:text-slate-900" onClick={() => handleStatusUpdate(order.id, 'PAID')}>결제 완료 처리</Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {displayOrders.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                            등록된 고객사가 없습니다.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
