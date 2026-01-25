'use client';

import { useState, useEffect } from 'react';
import { getSystemSettings, updateSystemSettings } from '@/actions/settings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Building2, CreditCard, Shield, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function SystemSettingsView() {
    const [settings, setSettings] = useState({
        companyName: '',
        companyRegNo: '',
        bankInfo: '',
        defaultLunchboxCost: 0,
        defaultSaladCost: 0
    });
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await getSystemSettings();
            setSettings({
                companyName: data.companyName,
                companyRegNo: data.companyRegNo || '',
                bankInfo: data.bankInfo || '',
                defaultLunchboxCost: (data as any).defaultLunchboxCost || 0,
                defaultSaladCost: (data as any).defaultSaladCost || 0
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setUpdating(true);
        try {
            const result = await updateSystemSettings(settings);
            if (result.success) {
                alert('시스템 설정이 저장되었습니다.');
            }
        } catch (error) {
            console.error(error);
            alert('저장 중 오류가 발생했습니다.');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div className="text-center py-20">설정을 불러오는 중...</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">전역 시스템 환경 설정</h1>
                    <Badge variant="outline" className="border-red-200 text-red-600 bg-red-50 text-[10px] font-black gap-1 uppercase">
                        <Shield className="h-3.5 w-3.5" /> ADMIN ONLY
                    </Badge>
                </div>
                <p className="text-slate-500 dark:text-slate-400">시스템의 핵심 정보와 정산 계좌 등을 관리하는 최고 권한 설정입니다.</p>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-900 text-white">
                    <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        <CardTitle className="text-lg">기본 회사 정보</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                    <div className="space-y-2">
                        <Label htmlFor="companyName" className="font-bold">회사 이름 (공통 표시용)</Label>
                        <Input
                            id="companyName"
                            placeholder="예: 필몽 푸드"
                            value={settings.companyName}
                            onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                            className="rounded-lg"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="companyRegNo" className="font-bold">사업자 등록번호</Label>
                        <Input
                            id="companyRegNo"
                            placeholder="예: 123-45-67890"
                            value={settings.companyRegNo}
                            onChange={(e) => setSettings({ ...settings, companyRegNo: e.target.value })}
                            className="rounded-lg"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-orange-600 text-white">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        <CardTitle className="text-lg">수익성 분석 원가 설정</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <p className="text-xs text-slate-500 mb-2 italic">※ 재고 관리 없이 통계치 산출을 위해 사용되는 **표준 원가**입니다. (단위: 원)</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="defaultLunchboxCost" className="font-bold">도시락 기본 원가</Label>
                            <Input
                                id="defaultLunchboxCost"
                                type="number"
                                placeholder="0"
                                value={settings.defaultLunchboxCost}
                                onChange={(e) => setSettings({ ...settings, defaultLunchboxCost: parseInt(e.target.value) || 0 })}
                                className="rounded-lg font-black text-blue-600"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="defaultSaladCost" className="font-bold">샐러드 기본 원가</Label>
                            <Input
                                id="defaultSaladCost"
                                type="number"
                                placeholder="0"
                                value={settings.defaultSaladCost}
                                onChange={(e) => setSettings({ ...settings, defaultSaladCost: parseInt(e.target.value) || 0 })}
                                className="rounded-lg font-black text-emerald-600"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-emerald-600 text-white">
                    <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        <CardTitle className="text-lg">입금 및 정산 정보</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-2">
                        <Label htmlFor="bankInfo" className="font-bold">계좌 정보 (전표/명세서 하단 표시)</Label>
                        <Input
                            id="bankInfo"
                            placeholder="예: 국민은행 123-456789-01-012 (필몽)"
                            value={settings.bankInfo}
                            onChange={(e) => setSettings({ ...settings, bankInfo: e.target.value })}
                            className="rounded-lg"
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button
                    className="gap-2 px-10 py-7 rounded-2xl font-black text-xl shadow-xl hover:scale-105 transition-transform bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900"
                    onClick={handleSave}
                    disabled={updating}
                >
                    {updating ? '저장 중...' : (
                        <>
                            <Save className="h-6 w-6" /> 설정 저장하기
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
