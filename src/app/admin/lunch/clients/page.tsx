'use server';

export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { LunchClient } from '@prisma/client';
import Link from 'next/link';
import { Plus, Users, Clock, DollarSign } from 'lucide-react';
import { getLunchClients } from '@/actions/lunch';
import { ClientList } from '@/components/lunch/client-list';

export default async function LunchClientsPage() {
    const clients = await getLunchClients();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">런치 고객사 관리</h1>
                    <p className="text-muted-foreground">납품 전용 고객사의 단가와 마감 시간을 관리합니다.</p>
                </div>
            </div>

            <ClientList initialClients={clients as any} />
        </div>
    );
}
