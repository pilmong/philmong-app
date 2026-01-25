'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Save, Layout, Grid3X3, Layers } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { upsertLunchDailyMenu } from '@/actions/lunch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface MenuBuilderProps {
    initialData: any;
    date: Date;
}

export function MenuBuilder({ initialData, date }: MenuBuilderProps) {
    const router = useRouter();
    const [lunchbox, setLunchbox] = useState({
        banchan1: '', main: '', banchan2: '', banchan3: '', rice: '백미밥', soup: '오늘의 국'
    });
    const [salad, setSalad] = useState({
        layers: {
            base: Array(9).fill(''),
            middle: Array(9).fill(''),
            top: Array(9).fill('')
        }
    });
    const [activeLayer, setActiveLayer] = useState<'base' | 'middle' | 'top'>('base');

    useEffect(() => {
        if (initialData) {
            if (initialData.lunchboxLayout) setLunchbox(JSON.parse(initialData.lunchboxLayout));
            if (initialData.saladLayout) setSalad(JSON.parse(initialData.saladLayout));
        }
    }, [initialData]);

    const handleSave = async () => {
        await upsertLunchDailyMenu(date, {
            lunchboxLayout: JSON.stringify(lunchbox),
            saladLayout: JSON.stringify(salad)
        });
        alert('메뉴가 저장되었습니다!');
    };

    const changeDate = (days: number) => {
        const newDate = new Date(date);
        newDate.setDate(newDate.getDate() + days);
        router.push(`/admin/lunch/menu?date=${format(newDate, 'yyyy-MM-dd')}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => changeDate(-1)}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-xl font-bold">{format(date, 'yyyy년 MM월 dd일')}</h2>
                    <Button variant="outline" size="icon" onClick={() => changeDate(1)}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <Button onClick={handleSave} className="gap-2">
                    <Save className="h-4 w-4" /> 기획 저장
                </Button>
            </div>

            <Tabs defaultValue="lunchbox">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="lunchbox" className="gap-2">
                        <Layout className="h-4 w-4" /> 도시락
                    </TabsTrigger>
                    <TabsTrigger value="salad" className="gap-2">
                        <Grid3X3 className="h-4 w-4" /> 샐러드
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="lunchbox" className="mt-6">
                    <Card className="border-none shadow-sm overflow-hidden">
                        <CardHeader>
                            <CardTitle>도시락 메뉴 구성</CardTitle>
                            <CardDescription>각 칸을 클릭하여 메뉴를 입력하세요. (첨부 이미지 규격 반영)</CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center p-8 bg-slate-50 dark:bg-slate-950">
                            {/* Lunchbox Visual UI */}
                            <div className="w-full max-w-2xl aspect-[265/195] bg-[#3d2117] rounded-xl p-4 shadow-2xl relative border-8 border-[#2d1a12] font-sans">
                                <div className="grid grid-cols-4 gap-3 h-[45%] mb-4">
                                    {['banchan1', 'main', 'banchan2', 'banchan3'].map((key) => (
                                        <div key={key} className={cn(
                                            "bg-[#2d1a12] rounded-lg p-2 flex flex-col items-center justify-center border",
                                            key === 'main' ? "border-orange-500/40" : "border-[#4d3228]"
                                        )}>
                                            <span className={cn("text-[10px] mb-1 font-bold", key === 'main' ? "text-orange-400" : "text-slate-500")}>
                                                {key === 'banchan1' ? '반찬1' : key === 'main' ? '메인' : key === 'banchan2' ? '반찬2' : '반찬3'}
                                            </span>
                                            <input
                                                className="bg-transparent text-white text-center text-sm w-full outline-none focus:text-yellow-400 font-bold"
                                                value={lunchbox[key as keyof typeof lunchbox]}
                                                onChange={(e) => setLunchbox({ ...lunchbox, [key]: e.target.value })}
                                                placeholder="..."
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-2 gap-3 h-[45%] font-sans">
                                    <div className="bg-[#2d1a12] rounded-lg p-4 flex flex-col items-center justify-center border border-[#4d3228]">
                                        <span className="text-xs text-slate-500 mb-2 font-bold">밥</span>
                                        <textarea
                                            className="bg-transparent text-white text-center text-sm w-full outline-none resize-none h-16 focus:text-yellow-400 font-bold"
                                            value={lunchbox.rice}
                                            onChange={(e) => setLunchbox({ ...lunchbox, rice: e.target.value })}
                                        />
                                    </div>
                                    <div className="bg-[#2d1a12] rounded-full aspect-square p-4 flex flex-col items-center justify-center border border-blue-500/30 mx-auto w-[80%]">
                                        <span className="text-xs text-blue-400 mb-2 font-bold">국</span>
                                        <input
                                            className="bg-transparent text-white text-center text-sm w-full outline-none focus:text-yellow-400 font-bold"
                                            value={lunchbox.soup}
                                            onChange={(e) => setLunchbox({ ...lunchbox, soup: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="salad" className="mt-6">
                    <Card className="border-none shadow-sm overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>샐러드 레이어 구성</CardTitle>
                                <CardDescription>3x3 그리드에 3개 층을 쌓아 구성합니다.</CardDescription>
                            </div>
                            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                {(['base', 'middle', 'top'] as const).map((layer) => (
                                    <Button
                                        key={layer}
                                        variant={activeLayer === layer ? 'default' : 'ghost'}
                                        size="sm"
                                        onClick={() => setActiveLayer(layer)}
                                        className="capitalize"
                                    >
                                        {layer === 'base' ? '1층 (Bottom)' : layer === 'middle' ? '2층 (Middle)' : '3층 (Top)'}
                                    </Button>
                                ))}
                            </div>
                        </CardHeader>
                        <CardContent className="flex justify-center p-8 bg-slate-50 dark:bg-slate-950">
                            {/* Salad Visual UI - 3x3 Grid */}
                            <div className="w-full max-w-xl aspect-[1.5/1] bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 border-4 border-slate-200 dark:border-slate-800 relative">
                                <div className="absolute top-2 right-4 flex items-center gap-2">
                                    <Layers className="h-4 w-4 text-blue-500" />
                                    <span className="text-xs font-bold text-blue-500 uppercase">{activeLayer} Layer Editing</span>
                                </div>
                                <div className="grid grid-cols-3 grid-rows-3 gap-4 h-full">
                                    {salad.layers[activeLayer].map((item, idx) => (
                                        <div key={idx} className={cn(
                                            "rounded-xl border-2 flex flex-col items-center justify-center p-2 transition-all group",
                                            item ? "border-green-200 bg-green-50 dark:bg-green-900/20" : "border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400"
                                        )}>
                                            <span className="text-[10px] text-slate-400 mb-1">Slot {idx + 1}</span>
                                            <input
                                                className="bg-transparent text-center text-sm w-full outline-none font-medium focus:text-blue-600 dark:focus:text-blue-400"
                                                value={item}
                                                onChange={(e) => {
                                                    const newLayers = { ...salad.layers };
                                                    newLayers[activeLayer][idx] = e.target.value;
                                                    setSalad({ ...salad, layers: newLayers });
                                                }}
                                                placeholder="..."
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                        <div className="px-8 pb-8 flex gap-4 overflow-x-auto">
                            {/* Layer Previes */}
                            {(['base', 'middle', 'top'] as const).map((l) => (
                                <div key={l} className={cn(
                                    "min-w-[120px] p-2 rounded-lg border text-center text-xs cursor-pointer hover:border-blue-500",
                                    activeLayer === l ? "bg-blue-50 border-blue-500 dark:bg-blue-900/30" : "bg-slate-50 dark:bg-slate-800"
                                )} onClick={() => setActiveLayer(l)}>
                                    <div className="font-bold mb-1">{l === 'base' ? '1F' : l === 'middle' ? '2F' : '3F'}</div>
                                    <div className="text-slate-500 truncate">
                                        {salad.layers[l].filter(Boolean).length}개 항목
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
