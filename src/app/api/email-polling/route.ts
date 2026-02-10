import { NextResponse } from 'next/server';
import { checkEmails } from '@/lib/email-poller';

export const dynamic = 'force-dynamic'; // Prevent caching

export async function POST() {
    try {
        const result = await checkEmails();
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
