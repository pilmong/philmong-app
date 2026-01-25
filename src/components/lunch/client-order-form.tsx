'use client';

import { useState } from 'react';
import { updateLunchOrderCount, updateLunchClientMemo } from '@/actions/lunch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, MessageSquare, Clock, Utensils, Save, Sparkles } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface WeeklyDataItem {
    date: Date;
    dailyMenu: any;
    order: any;
}

interface ClientOrderFormProps {
    client: any;
    weeklyData: WeeklyDataItem[];
}

export function ClientOrderForm({ client, weeklyData }: ClientOrderFormProps) {
    // 1. 고객사 전체 공통 메모 상태
    const [globalMemo, setGlobalMemo] = useState(client.memo || '');
    const [isGlobalMemoSaved, setIsGlobalMemoSaved] = useState(true);
    const [isGlobalUpdating, setIsGlobalUpdating] = useState(false);

    // 2. 날짜별 주문 상태
    const [orders, setOrders] = useState<Record<string, any>>(
        Object.fromEntries(
            weeklyData.map(item => [
                format(item.date, 'yyyy-MM-dd'),
                {
                    lunchboxCount: item.order?.lunchboxCount ?? client.defaultStaffCount,
                    saladCount: item.order?.saladCount ?? 0,
                    memo: item.order?.memo ?? '',
                    isSaved: !!item.order
                }
            ])
        )
    );

    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

    // 공통 메모 저장
    const handleUpdateGlobalMemo = async () => {
        setIsGlobalUpdating(true);
        try {
            const result = await updateLunchClientMemo(client.id, globalMemo);
            if (result.success) {
                setIsGlobalMemoSaved(true);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsGlobalUpdating(false);
        }
    };

    // 날짜별 주문 저장
    const handleUpdateOrder = async (dateStr: string) => {
        const item = weeklyData.find(d => format(d.date, 'yyyy-MM-dd') === dateStr);
        if (!item) return;

        setLoadingStates(prev => ({ ...prev, [dateStr]: true }));
        try {
            const data = orders[dateStr];
            const result = await updateLunchOrderCount(client.id, item.date, {
                lunchboxCount: data.lunchboxCount,
                saladCount: data.saladCount,
                memo: data.memo,
                modifiedBy: 'CLIENT_REP'
            });

            if (result.success) {
                setOrders(prev => ({
                    ...prev,
                    [dateStr]: { ...prev[dateStr], isSaved: true }
                }));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingStates(prev => ({ ...prev, [dateStr]: false }));
        }
    };

    const isDeadlinePassed = (date: Date) => {
        const [hours, minutes] = client.deadlineTime.split(':').map(Number);
        const deadline = new Date(date);
        deadline.setDate(deadline.getDate() - 1); // 전날 마감
        deadline.setHours(hours, minutes, 0, 0);
        return new Date() > deadline;
    };

    return (
        <div className="space-y-6">
            {/* 상단 안내 & 마감 정보 */}
            <Card className="border-none shadow-md overflow-hidden bg-slate-900 text-white">
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-orange-400" />
                        <span className="font-bold">입력 마감: 매일 {client.deadlineTime} (전일 기준)</span>
                    </div>
                    <Badge variant="outline" className="text-white border-white/20">
                        주간 통합 관리 모드
                    </Badge>
                </CardContent>
            </Card>

            {/* 고정 요청사항 (상시 적용) */}
            <Card className="border-none shadow-lg overflow-hidden bg-white dark:bg-slate-900 border-l-4 border-l-blue-500">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center justify-between">
                        <div className="flex items-center gap-2 text-blue-600">
                            <Save className="h-4 w-4" />
                            <span>기본 요청사항 (모든 날짜 공통 적용)</span>
                        </div>
                        <Button
                            size="sm"
                            variant={isGlobalMemoSaved ? "ghost" : "default"}
                            className={cn(
                                "h-8 px-4 rounded-full transition-all text-[11px] font-bold",
                                isGlobalMemoSaved ? "text-slate-400" : "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-100"
                            )}
                            onClick={handleUpdateGlobalMemo}
                            disabled={isGlobalUpdating || isGlobalMemoSaved}
                        >
                            {isGlobalUpdating ? '처리 중...' : isGlobalMemoSaved ? '저장됨' : '변경사항 저장하기'}
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pb-4 pt-0">
                    <Textarea
                        placeholder="매일 공통으로 적용될 요청사항을 적어주세요. (예: 수저세트 X, 특정 장소 배송 등)"
                        className="min-h-[60px] text-xs bg-blue-50/50 dark:bg-blue-900/10 border-none resize-none focus-visible:ring-1 focus-visible:ring-blue-200"
                        value={globalMemo}
                        onChange={(e) => {
                            setGlobalMemo(e.target.value);
                            setIsGlobalMemoSaved(false);
                        }}
                    />
                </CardContent>
            </Card>

            <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <Sparkles className="h-4 w-4 text-orange-500" />
                    <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300">날짜별 주문 및 당일 특별 요청</h3>
                </div>

                {weeklyData.map((item) => {
                    const dateStr = format(item.date, 'yyyy-MM-dd');
                    const config = orders[dateStr];
                    const isClosed = isDeadlinePassed(item.date);
                    const lunchboxLayout = item.dailyMenu?.lunchboxLayout ? JSON.parse(item.dailyMenu.lunchboxLayout) : null;

                    return (
                        <Card key={dateStr} className={cn(
                            "border-none shadow-lg overflow-hidden transition-all duration-300",
                            isClosed ? "opacity-75 grayscale-[0.5]" : "hover:scale-[1.01]"
                        )}>
                            <div className={cn(
                                "p-3 flex items-center justify-between border-b",
                                isClosed ? "bg-slate-100 dark:bg-slate-800" : "bg-slate-50 dark:bg-slate-900/50"
                            )}>
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold",
                                        isClosed ? "bg-slate-200 text-slate-500" : "bg-white text-blue-600 shadow-sm"
                                    )}>
                                        <span className="text-[10px] leading-none uppercase">{format(item.date, 'EEE', { locale: ko })}</span>
                                        <span className="text-lg leading-none">{format(item.date, 'd')}</span>
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900 dark:text-white">
                                            {format(item.date, 'M월 d일 (EEEE)', { locale: ko })}
                                        </div>
                                        <div className="text-xs text-slate-500 flex items-center gap-1">
                                            <Utensils className="h-3 w-3" />
                                            {lunchboxLayout ? `${lunchboxLayout.main || ''} / ${lunchboxLayout.soup || ''}` : '메뉴 준비 중'}
                                        </div>
                                    </div>
                                </div>
                                {isClosed ? (
                                    <Badge variant="secondary" className="gap-1 bg-slate-200 text-slate-600 border-none">
                                        <AlertCircle className="h-3 w-3" /> 입력 마감
                                    </Badge>
                                ) : (
                                    config.isSaved && <Badge className="bg-green-500 text-white border-none gap-1">
                                        <CheckCircle2 className="h-3 w-3" /> 저장됨
                                    </Badge>
                                )}
                            </div>

                            <CardContent className="p-5 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">도시락</label>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="h-10 w-10 rounded-lg"
                                                disabled={isClosed}
                                                onClick={() => setOrders(prev => ({
                                                    ...prev,
                                                    [dateStr]: { ...prev[dateStr], lunchboxCount: Math.max(0, prev[dateStr].lunchboxCount - 1), isSaved: false }
                                                }))}
                                            >-</Button>
                                            <Input
                                                type="number"
                                                className="text-center text-lg font-black h-10 bg-slate-50 dark:bg-slate-900 border-none shadow-inner"
                                                value={config.lunchboxCount}
                                                disabled={isClosed}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrders(prev => ({
                                                    ...prev,
                                                    [dateStr]: { ...prev[dateStr], lunchboxCount: parseInt(e.target.value) || 0, isSaved: false }
                                                }))}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="h-10 w-10 rounded-lg"
                                                disabled={isClosed}
                                                onClick={() => setOrders(prev => ({
                                                    ...prev,
                                                    [dateStr]: { ...prev[dateStr], lunchboxCount: prev[dateStr].lunchboxCount + 1, isSaved: false }
                                                }))}
                                            >+</Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">샐러드</label>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="h-10 w-10 rounded-lg"
                                                disabled={isClosed}
                                                onClick={() => setOrders(prev => ({
                                                    ...prev,
                                                    [dateStr]: { ...prev[dateStr], saladCount: Math.max(0, prev[dateStr].saladCount - 1), isSaved: false }
                                                }))}
                                            >-</Button>
                                            <Input
                                                type="number"
                                                className="text-center text-lg font-black h-10 bg-slate-50 dark:bg-slate-900 border-none shadow-inner"
                                                value={config.saladCount}
                                                disabled={isClosed}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrders(prev => ({
                                                    ...prev,
                                                    [dateStr]: { ...prev[dateStr], saladCount: parseInt(e.target.value) || 0, isSaved: false }
                                                }))}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="h-10 w-10 rounded-lg"
                                                disabled={isClosed}
                                                onClick={() => setOrders(prev => ({
                                                    ...prev,
                                                    [dateStr]: { ...prev[dateStr], saladCount: prev[dateStr].saladCount + 1, isSaved: false }
                                                }))}
                                            >+</Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                            <MessageSquare className="h-3 w-3" /> 당일 특별 요청
                                        </label>
                                        {!isClosed && (
                                            <Button
                                                size="sm"
                                                className={cn(
                                                    "h-7 text-[11px] font-bold px-4 rounded-full transition-all",
                                                    config.isSaved ? "bg-slate-100 text-slate-400" : "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200"
                                                )}
                                                onClick={() => handleUpdateOrder(dateStr)}
                                                disabled={loadingStates[dateStr] || config.isSaved}
                                            >
                                                {loadingStates[dateStr] ? '저장 중...' : config.isSaved ? '변경사항 없음' : '이 날짜 저장하기'}
                                            </Button>
                                        )}
                                    </div>
                                    <Textarea
                                        placeholder="이 날짜에만 적용될 특별한 요청사항이 있다면 적어주세요."
                                        className="min-h-[50px] text-xs bg-slate-50 dark:bg-slate-900 border-none resize-none focus-visible:ring-1 focus-visible:ring-slate-200"
                                        value={config.memo}
                                        disabled={isClosed}
                                        onChange={(e) => setOrders(prev => ({
                                            ...prev,
                                            [dateStr]: { ...prev[dateStr], memo: e.target.value, isSaved: false }
                                        }))}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="text-center text-[10px] text-slate-400 font-medium py-8 border-t border-dashed">
                PHILMONG LUNCH MANAGEMENT • {format(new Date(), 'yyyy')} ALL RIGHTS RESERVED
            </div>
        </div>
    );
}
