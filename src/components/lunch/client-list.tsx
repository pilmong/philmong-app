'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Clock, DollarSign, User, ExternalLink, Copy, Share2, MessageCircle, Key } from 'lucide-react';
import { upsertLunchClient } from '@/actions/lunch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface LunchClient {
    id?: string;
    name: string;
    contactName: string;
    contactNumber: string;
    address: string;
    defaultStaffCount: number;
    deadlineTime: string;
    lunchboxPrice: number;
    saladPrice: number;
    paymentType: string; // DAILY, PERIODIC
    status: string; // ACTIVE, INACTIVE
}

export function ClientList({ initialClients }: { initialClients: LunchClient[] }) {
    const [clients, setClients] = useState(initialClients);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<LunchClient | null>(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [sharingClient, setSharingClient] = useState<LunchClient | null>(null);

    const handleCopyText = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('메시지가 복사되었습니다!');
    };

    const getShareContent = (client: LunchClient) => {
        const url = `${window.location.origin}/lunch/order/${client.id}`;
        return `[필몽 런치] ${client.name} 담당자님, 내일 주문 수량을 입력해 주세요.\n\n- 마감시간: ${client.deadlineTime}\n- 주문링크: ${url}`;
    };

    const handleOpenShare = (client: LunchClient) => {
        setSharingClient(client);
        setIsShareModalOpen(true);
    };

    const handleCopyLink = (clientId: string) => {
        const url = `${window.location.origin}/lunch/order/${clientId}`;
        navigator.clipboard.writeText(url);
        alert('주문 링크가 복사되었습니다!');
    };

    const handleOpenModal = (client?: LunchClient) => {
        setEditingClient(client || {
            name: '',
            contactName: '',
            contactNumber: '',
            address: '',
            defaultStaffCount: 0,
            deadlineTime: '10:00',
            lunchboxPrice: 8000,
            saladPrice: 8000,
            paymentType: 'DAILY',
            status: 'ACTIVE'
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            ...editingClient,
            name: formData.get('name') as string,
            contactName: formData.get('contactName') as string,
            contactNumber: formData.get('contactNumber') as string,
            address: formData.get('address') as string,
            defaultStaffCount: parseInt(formData.get('defaultStaffCount') as string),
            deadlineTime: formData.get('deadlineTime') as string,
            lunchboxPrice: parseInt(formData.get('lunchboxPrice') as string),
            saladPrice: parseInt(formData.get('saladPrice') as string),
            paymentType: formData.get('paymentType') as string,
        };

        const result = await upsertLunchClient({
            ...data,
            status: formData.get('status') as string,
        });
        if (result.success) {
            setIsModalOpen(false);
            window.location.reload(); // Simple refresh for now
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={() => handleOpenModal()} className="gap-2">
                    <Plus className="h-4 w-4" /> 고객사 추가
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {clients.map((client) => (
                    <Card key={client.id} className="overflow-hidden">
                        <CardHeader className="bg-slate-50 dark:bg-slate-900 pb-3">
                            <div className="flex items-start justify-between">
                                <CardTitle className="text-lg">{client.name}</CardTitle>
                                <Button variant="ghost" size="icon" onClick={() => handleOpenModal(client)}>
                                    <Edit className="h-4 w-4 text-slate-500" />
                                </Button>
                            </div>
                            <div className="flex gap-2 mt-1">
                                <Badge variant={client.paymentType === 'PERIODIC' ? 'default' : 'secondary'}>
                                    {client.paymentType === 'PERIODIC' ? '기간별 정산' : '일일 결제'}
                                </Badge>
                                <Badge variant={client.status === 'ACTIVE' ? 'outline' : 'destructive'} className={cn(client.status === 'ACTIVE' ? "border-emerald-200 text-emerald-700 bg-emerald-50" : "")}>
                                    {client.status === 'ACTIVE' ? '정상 납품' : '계약 종료'}
                                </Badge>
                                <Badge variant="outline">{client.deadlineTime} 마감</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-3">
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <User className="h-4 w-4" />
                                <span>{client.contactName || '담당자 미정'} ({client.contactNumber || '-'})</span>
                            </div>

                            {/* 연결된 시스템 계정 표시 */}
                            <div className="pt-2 pb-1">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <Key className="h-3 w-3" /> 연결된 관리 계정
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {(client as any).linkedUsers?.map((u: any) => (
                                        <Badge key={u.id} variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-100 font-bold px-1.5 py-0">
                                            {u.name} (@{u.username})
                                        </Badge>
                                    ))}
                                    {(!(client as any).linkedUsers || (client as any).linkedUsers.length === 0) && (
                                        <span className="text-[10px] text-slate-300 italic">연결된 계정 없음</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <Clock className="h-4 w-4" />
                                <span>기본 {client.defaultStaffCount}명</span>
                            </div>
                            <div className="pt-4 border-t flex flex-col gap-2">
                                <div className="flex justify-between items-center text-sm font-medium">
                                    <div className="flex items-center gap-1">
                                        <DollarSign className="h-4 w-4 text-green-600" />
                                        <span>도시락: {client.lunchboxPrice.toLocaleString()}원</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <DollarSign className="h-4 w-4 text-blue-600" />
                                        <span>샐러드: {client.saladPrice.toLocaleString()}원</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 pt-2">
                                    <Button variant="outline" size="sm" className="gap-2" onClick={() => handleCopyLink(client.id!)}>
                                        <Copy className="h-3 w-3" /> 링크 복사
                                    </Button>
                                    <Link href="/admin/users" className="w-full">
                                        <Button variant="outline" size="sm" className="w-full gap-2 border-slate-200 text-slate-600 hover:bg-slate-50">
                                            <Key className="h-3 w-3" /> 계정 관리
                                        </Button>
                                    </Link>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={client.status !== 'ACTIVE'}
                                        className="gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-30"
                                        onClick={() => handleOpenShare(client)}
                                    >
                                        <Share2 className="h-3 w-3" /> 공유/전송
                                    </Button>
                                    <Link href={`/lunch/order/${client.id}`} className="w-full">
                                        <Button variant="secondary" size="sm" className="w-full gap-2">
                                            <ExternalLink className="h-3 w-3" /> 미리보기
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <Card className="w-full max-w-lg">
                        <CardHeader>
                            <CardTitle>{editingClient?.id ? '고객사 수정' : '새 고객사 등록'}</CardTitle>
                        </CardHeader>
                        <form onSubmit={handleSubmit}>
                            <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">고객사명</label>
                                    <Input name="name" defaultValue={editingClient?.name} required placeholder="회사명을 입력하세요" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">담당자</label>
                                        <Input name="contactName" defaultValue={editingClient?.contactName} placeholder="담당자 성함" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">연락처</label>
                                        <Input name="contactNumber" defaultValue={editingClient?.contactNumber} placeholder="담당자 연락처" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">배달 주소</label>
                                    <Input name="address" defaultValue={editingClient?.address} placeholder="상세 주소를 입력하세요" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">입력 마감 시간</label>
                                        <Input type="time" name="deadlineTime" defaultValue={editingClient?.deadlineTime} required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">기본 인원</label>
                                        <Input type="number" name="defaultStaffCount" defaultValue={editingClient?.defaultStaffCount} required />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">도시락 단가</label>
                                        <Input type="number" name="lunchboxPrice" defaultValue={editingClient?.lunchboxPrice} required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">샐러드 단가</label>
                                        <Input type="number" name="saladPrice" defaultValue={editingClient?.saladPrice} required />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">결제 방식</label>
                                        <select name="paymentType" defaultValue={editingClient?.paymentType} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                            <option value="DAILY">일일 결제 (직접)</option>
                                            <option value="PERIODIC">기간별 정산 (후불)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">상태 설정</label>
                                        <select name="status" defaultValue={editingClient?.status} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                            <option value="ACTIVE">활성 (납품 중)</option>
                                            <option value="INACTIVE">비활성 (계약 종료)</option>
                                        </select>
                                    </div>
                                </div>
                            </CardContent>
                            <div className="flex justify-end gap-2 p-4 pt-0">
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>취소</Button>
                                <Button type="submit">저장</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
            {isShareModalOpen && sharingClient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Share2 className="h-5 w-5" /> 공유 및 전송
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-center">
                            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg text-left text-sm border border-slate-200 dark:border-slate-800 whitespace-pre-wrap">
                                {getShareContent(sharingClient)}
                            </div>

                            <div className="grid grid-cols-1 gap-2">
                                <Button onClick={() => handleCopyText(getShareContent(sharingClient))} className="w-full h-12 gap-2">
                                    <Copy className="h-4 w-4" /> 전체 메시지 복사
                                </Button>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button variant="outline" onClick={() => {
                                        const text = getShareContent(sharingClient);
                                        const smsUrl = `sms:${sharingClient.contactNumber}?body=${encodeURIComponent(text)}`;
                                        window.location.href = smsUrl;
                                    }} className="h-12 gap-2">
                                        <MessageCircle className="h-4 w-4" /> 문자 전송
                                    </Button>
                                    <Button variant="outline" onClick={() => {
                                        const text = getShareContent(sharingClient);
                                        const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
                                        if (isMobile) {
                                            // Mobile: Try direct scheme
                                            window.location.href = `kakaotalk://send?text=${encodeURIComponent(text)}`;
                                        } else {
                                            // Desktop: Localhost preview error workaround (Copy & Notify)
                                            handleCopyText(text);
                                            alert('카카오톡 PC버전은 보안 및 로컬 환경 제약으로 직접 연결이 어려울 수 있습니다.\n\n안내 메시지가 복사되었으니, 카카오톡 채팅창에 붙여넣기(Ctrl+V) 해주세요! 😊');
                                        }
                                    }} className="h-12 gap-2 border-yellow-200 text-yellow-800 hover:bg-yellow-50">
                                        카카오톡 공유
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                        <div className="flex justify-end p-4 pt-0">
                            <Button variant="ghost" onClick={() => setIsShareModalOpen(false)}>닫기</Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
