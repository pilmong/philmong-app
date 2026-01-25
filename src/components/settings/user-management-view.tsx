'use client';

import { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '@/actions/users';
import { getLunchClients } from '@/actions/lunch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Users,
    UserPlus,
    Shield,
    Key,
    MoreVertical,
    Edit2,
    Trash2,
    CheckCircle2,
    XCircle,
    Building,
    Check
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const PERMISSION_OPTIONS = [
    { id: 'DASHBOARD', label: '통합 대시보드', group: '메인' },
    { id: 'ORDERS', label: '주문 관리', group: '운영' },
    { id: 'KITCHEN', label: '실시간 조리실', group: '운영' },
    { id: 'SUBDIVISION', label: '소분 및 포장', group: '운영' },
    { id: 'STATS', label: '매출 통계', group: '운영' },
    {
        id: 'LUNCH', label: '런치 및 정기배송', group: '운영', subPermissions: [
            { id: 'LUNCH_CLIENTS', label: '고객사 관리' },
            { id: 'LUNCH_MENU', label: '메뉴 기획' },
            { id: 'LUNCH_STATS', label: '런치 통계' },
            {
                id: 'LUNCH_WORK', label: '오늘의 작업 현황', subPermissions: [
                    { id: 'LUNCH_KITCHEN_DOC', label: '└ 조리실 작업지시서 보기' },
                    { id: 'LUNCH_LABELS', label: '└ 스티커 라벨 출력하기' },
                ]
            },
            { id: 'LUNCH_SETTLEMENT', label: '정산 및 명세서' },
        ]
    },
    { id: 'PRODUCTS', label: '상품 마스터', group: '설정' },
    { id: 'SETTINGS', label: '전역 환경 설정', group: '설정' },
    { id: 'USERS', label: '사용자 및 권한 관리', group: '설정' },
];

const ROLES = [
    { id: 'ADMIN', label: '최고 관리자', color: 'bg-red-100 text-red-700' },
    { id: 'MANAGER', label: '매니저', color: 'bg-blue-100 text-blue-700' },
    { id: 'KITCHEN', label: '주방 스태프', color: 'bg-orange-100 text-orange-700' },
    { id: 'PACKING', label: '포장 스태프', color: 'bg-emerald-100 text-emerald-700' },
    { id: 'CLIENT', label: '고객사(식수입력)', color: 'bg-purple-100 text-purple-700' },
];

export function UserManagementView() {
    const [users, setUsers] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [formData, setFormData] = useState<any>({
        username: '',
        password: '',
        name: '',
        role: 'KITCHEN',
        permissions: [],
        clientId: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [usersData, clientsData] = await Promise.all([
                getUsers(),
                getLunchClients()
            ]);
            setUsers(usersData);
            setClients(clientsData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (user: any = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                username: user.username,
                password: '',
                name: user.name,
                role: user.role,
                permissions: JSON.parse(user.permissions || '[]'),
                clientId: user.clientId || '',
                status: user.status
            });
        } else {
            setEditingUser(null);
            setFormData({
                username: '',
                password: '',
                name: '',
                role: 'KITCHEN',
                permissions: [],
                clientId: ''
            });
        }
        setIsModalOpen(true);
    };

    const handlePermissionToggle = (permissionId: string) => {
        const newPermissions = formData.permissions.includes(permissionId)
            ? formData.permissions.filter((p: string) => p !== permissionId)
            : [...formData.permissions, permissionId];
        setFormData({ ...formData, permissions: newPermissions });
    };

    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleSubmit = async () => {
        setErrorMsg(null);
        if (!formData.username || !formData.name || (!editingUser && !formData.password)) {
            setErrorMsg('필수 정보(아이디, 성함, 비밀번호)를 모두 입력해 주세요.');
            return;
        }

        try {
            let result;
            if (editingUser) {
                result = await updateUser(editingUser.id, formData);
            } else {
                result = await createUser(formData);
            }

            if (result.success) {
                setIsModalOpen(false);
                loadData();
            } else {
                setErrorMsg(result.error);
            }
        } catch (error: any) {
            console.error(error);
            setErrorMsg('서버와 통신 중 오류가 발생했습니다.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('정말 이 계정을 삭제하시겠습니까?')) return;
        try {
            const result = await deleteUser(id);
            if (result.success) loadData();
        } catch (error) {
            console.error(error);
        }
    };

    const getGroupedPermissions = () => {
        const groups: any = {};
        PERMISSION_OPTIONS.forEach(opt => {
            if (!groups[opt.group]) groups[opt.group] = [];
            groups[opt.group].push(opt);
        });
        return groups;
    };

    if (loading) return <div className="p-10 text-center">불러오는 중...</div>;

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">사용자 및 권한 관리</h1>
                    <p className="text-slate-500">시스템 접근 계정 및 파트별 권한을 관리합니다.</p>
                </div>
                <Button onClick={() => handleOpenModal()} className="gap-2 bg-slate-900 rounded-xl px-6 h-12 shadow-lg shadow-slate-900/10">
                    <UserPlus className="h-5 w-5" /> 계정 추가하기
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((user) => (
                    <Card key={user.id} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-all">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between p-4 px-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-xl shadow-inner text-slate-400">
                                    <Users className="h-4 w-4" />
                                </div>
                                <div>
                                    <div className="text-sm font-black text-slate-900">{user.name}</div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">@{user.username}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleOpenModal(user)}>
                                    <Edit2 className="h-4 w-4 text-slate-400" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-50" onClick={() => handleDelete(user.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Badge className={cn("rounded-md border-none px-2 py-0.5 font-black text-[10px] uppercase", ROLES.find(r => r.id === user.role)?.color)}>
                                        {ROLES.find(r => r.id === user.role)?.label}
                                    </Badge>
                                    {user.role === 'ADMIN' && (
                                        <Badge variant="outline" className="border-red-200 text-red-600 bg-red-50 text-[9px] font-black gap-1 scale-90 origin-left">
                                            <Shield className="h-3 w-3" /> 시스템 보호됨
                                        </Badge>
                                    )}
                                </div>
                                {user.status === 'ACTIVE' ? (
                                    <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                                        <CheckCircle2 className="h-3 w-3" /> 활성 상태
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                                        <XCircle className="h-3 w-3" /> 정지됨
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <Shield className="h-3 w-3" /> 활성 권한 범위
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {(() => {
                                        // 모든 권한 옵션을 평탄화하여 매핑 딕셔너리 생성
                                        const getFlatMap = (options: any[]): Record<string, string> => {
                                            let map: Record<string, string> = {};
                                            options.forEach(opt => {
                                                map[opt.id] = opt.label;
                                                if (opt.subPermissions) {
                                                    map = { ...map, ...getFlatMap(opt.subPermissions) };
                                                }
                                            });
                                            return map;
                                        };
                                        const labelMap = getFlatMap(PERMISSION_OPTIONS);

                                        return JSON.parse(user.permissions || '[]').map((p: string) => (
                                            <span key={p} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 font-bold">
                                                {labelMap[p] || p}
                                            </span>
                                        ));
                                    })()}
                                    {JSON.parse(user.permissions || '[]').length === 0 && <span className="text-[10px] text-slate-300 italic">권한 없음</span>}
                                </div>
                            </div>

                            {user.role === 'CLIENT' && user.clientId && (
                                <div className="pt-2 border-t border-slate-50 flex items-center gap-2 text-[11px] text-purple-600 font-bold">
                                    <Building className="h-3 w-3" /> 연결된 업체: {clients.find(c => c.id === user.clientId)?.name || '알 수 없음'}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* User Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-2xl w-full flex flex-col max-h-[90vh] rounded-3xl p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-900">
                    <DialogHeader className="bg-slate-900 text-white p-8 flex-shrink-0">
                        <DialogTitle className="text-2xl font-black">{editingUser ? '계정 정보 수정' : '신규 계정 생성'}</DialogTitle>
                        <p className="text-slate-400 text-sm">사용자의 역할과 상세 권한을 설정합니다.</p>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase text-slate-500">아이디 (ID)</Label>
                                <Input
                                    disabled={!!editingUser}
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="h-12 rounded-xl border-slate-200"
                                    placeholder="admin_staff"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase text-slate-500">비밀번호 (PW)</Label>
                                <Input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="h-12 rounded-xl border-slate-200"
                                    placeholder={editingUser ? '변경시에만 입력' : '비밀번호 입력'}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase text-slate-500">성함 또는 별명</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="h-12 rounded-xl border-slate-200"
                                    placeholder="김필몽 주방님"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase text-slate-500">기본 역할</Label>
                                <select
                                    value={formData.role}
                                    className="w-full h-12 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    {ROLES.map(role => <option key={role.id} value={role.id}>{role.label}</option>)}
                                </select>
                            </div>
                        </div>

                        {formData.role === 'CLIENT' && (
                            <div className="space-y-2 bg-purple-50 p-4 rounded-2xl border border-purple-100 dark:bg-purple-950/20 dark:border-purple-900/30">
                                <Label className="text-xs font-black uppercase text-purple-600">연결할 고객사 선택</Label>
                                <select
                                    value={formData.clientId}
                                    className="w-full h-10 rounded-xl border border-purple-200 px-3 text-sm bg-white dark:bg-slate-800 dark:border-purple-900/50"
                                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                >
                                    <option value="">고객사 선택 안함</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} {c.status !== 'ACTIVE' ? '(비활성)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="space-y-4">
                            <Label className="text-xs font-black uppercase text-slate-500 flex items-center gap-2">
                                <Shield className="h-4 w-4" /> 상세 접근 권한 커스터마이징
                            </Label>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {Object.entries(getGroupedPermissions()).map(([group, options]: [any, any]) => (
                                    <Card key={group} className="border-slate-100 shadow-none bg-slate-50/50 rounded-2xl overflow-hidden dark:bg-slate-800/50 dark:border-slate-800">
                                        <CardHeader className="py-2 px-4 bg-slate-100 dark:bg-slate-800">
                                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">{group}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-2 space-y-1">
                                            {options.map((opt: any) => (
                                                <div key={opt.id} className="space-y-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handlePermissionToggle(opt.id)}
                                                        className={cn(
                                                            "w-full flex items-center justify-between p-2.5 rounded-xl text-sm transition-all",
                                                            formData.permissions.includes(opt.id)
                                                                ? "bg-white text-blue-600 font-bold shadow-sm ring-1 ring-blue-100 dark:bg-slate-700 dark:ring-blue-900"
                                                                : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                                                        )}
                                                    >
                                                        {opt.label}
                                                        {formData.permissions.includes(opt.id) && <Check className="h-4 w-4" />}
                                                    </button>

                                                    {/* 하위 권한 1단계 */}
                                                    {opt.subPermissions && (
                                                        <div className="pl-4 space-y-1">
                                                            {opt.subPermissions.map((sub1: any) => (
                                                                <div key={sub1.id} className="space-y-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handlePermissionToggle(sub1.id)}
                                                                        className={cn(
                                                                            "w-full flex items-center justify-between p-2 rounded-xl text-xs transition-all",
                                                                            formData.permissions.includes(sub1.id)
                                                                                ? "bg-white text-blue-500 font-bold shadow-sm ring-1 ring-blue-50 dark:bg-slate-700 dark:ring-blue-800"
                                                                                : "text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-700/50"
                                                                        )}
                                                                    >
                                                                        {sub1.label}
                                                                        {formData.permissions.includes(sub1.id) && <Check className="h-3 w-3" />}
                                                                    </button>

                                                                    {/* 하위 권한 2단계 */}
                                                                    {sub1.subPermissions && (
                                                                        <div className="pl-4 space-y-1">
                                                                            {sub1.subPermissions.map((sub2: any) => (
                                                                                <button
                                                                                    key={sub2.id}
                                                                                    type="button"
                                                                                    onClick={() => handlePermissionToggle(sub2.id)}
                                                                                    className={cn(
                                                                                        "w-full flex items-center justify-between p-1.5 rounded-lg text-[10px] transition-all font-medium",
                                                                                        formData.permissions.includes(sub2.id)
                                                                                            ? "bg-white text-slate-700 font-bold shadow-sm ring-1 ring-slate-100 dark:bg-slate-700 dark:ring-slate-600"
                                                                                            : "text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/30"
                                                                                    )}
                                                                                >
                                                                                    {sub2.label}
                                                                                    {formData.permissions.includes(sub2.id) && <Check className="h-3 w-3" />}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {editingUser && (
                            <div className="flex items-center gap-2 pt-4">
                                <Label className="text-xs font-black uppercase text-slate-500">계정 활성화 상태</Label>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status: formData.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-xs font-black transition-all",
                                        formData.status === 'ACTIVE' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-slate-200 text-slate-500 dark:bg-slate-800"
                                    )}
                                >
                                    {formData.status === 'ACTIVE' ? '활성화됨' : '정지됨'}
                                </button>
                            </div>
                        )}
                    </div>

                    {errorMsg && (
                        <div className="px-8 pb-4">
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                                <XCircle className="h-4 w-4" />
                                {errorMsg}
                            </div>
                        </div>
                    )}

                    <DialogFooter className="bg-slate-50 p-6 border-t border-slate-100 flex-shrink-0 dark:bg-slate-800/50 dark:border-slate-800">
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl px-6 font-bold text-slate-500">취소</Button>
                        <Button onClick={handleSubmit} className="bg-slate-900 rounded-xl px-10 font-black shadow-xl shadow-slate-900/10 dark:bg-blue-600 dark:shadow-blue-900/20">
                            {editingUser ? '정보 수정하기' : '계정 생성 완료'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
