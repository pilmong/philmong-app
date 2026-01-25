import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseNaverOrderText } from '@/lib/naver-parser';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { text } = body;

        if (!text) {
            return NextResponse.json({ success: false, error: 'No text provided' }, { status: 400 });
        }

        // 1. Parse the text using our shared utility
        const parsedData = parseNaverOrderText(text);

        if (!parsedData.customerName) {
            return NextResponse.json({ success: false, error: 'Failed to parse order (No name found)' }, { status: 400 });
        }

        // 2. Create Order in DB
        // Determine status: If coming from extension, maybe 'PENDING' for review? 
        // User said: "접수 대기 상태로 쌓아두면 확인 후..." -> PENDING

        const order = await prisma.order.create({
            data: {
                type: 'RESERVATION', // Default to RESERVATION for Naver imports
                channel: 'NAVER',
                customerName: parsedData.customerName,
                customerContact: parsedData.customerContact,
                pickupType: parsedData.pickupType,
                pickupDate: parsedData.pickupDate ? new Date(parsedData.pickupDate) : new Date(),
                pickupTime: parsedData.pickupTime,
                address: parsedData.address,
                request: parsedData.request,
                items: JSON.stringify(parsedData.items),
                totalPrice: parsedData.totalPrice || 0,
                status: 'PENDING', // As requested: pending review
                memo: text, // Store original text for reference
            },
        });

        return NextResponse.json({ success: true, order });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
