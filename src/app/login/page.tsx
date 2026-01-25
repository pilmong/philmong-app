'use client';

import { useState } from 'react';
import { login } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, User, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const result = await login(formData);

        if (result?.error) {
            setError(result.error);
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
            <Card className="w-full max-w-md border-none shadow-2xl overflow-hidden">
                <CardHeader className="bg-slate-900 text-white text-center py-10">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-blue-600 rounded-2xl shadow-lg ring-4 ring-blue-600/20">
                            <Lock className="w-8 h-8" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-black tracking-tight uppercase">Philmong Admin</CardTitle>
                    <CardDescription className="text-slate-400 font-medium">관리자 시스템에 로그인하세요</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-10">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <Alert variant="destructive" className="bg-red-50 border-red-200">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-red-800 font-bold">{error}</AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="username">아이디</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    id="username"
                                    name="username"
                                    placeholder="admin"
                                    required
                                    className="pl-10 h-12 rounded-xl border-slate-200 focus:ring-blue-600 transition-all"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">비밀번호</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="pl-10 h-12 rounded-xl border-slate-200 focus:ring-blue-600 transition-all"
                                />
                            </div>
                        </div>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 rounded-xl bg-slate-900 hover:bg-black text-white font-black text-lg shadow-xl shadow-slate-900/10 transition-all"
                        >
                            {loading ? '로그인 중...' : '시작하기'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="bg-slate-50 border-t border-slate-100 p-6 flex justify-center">
                    <p className="text-xs text-slate-400 font-medium">
                        © 2026 Philmong Catering Service. All rights reserved.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
