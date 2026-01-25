'use server';

import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import { parseNaverOrderText, findMatchingProduct } from '@/lib/naver-parser';
import { createOrder, getOrders } from '@/actions/orders';
import { getProducts } from '@/actions/products';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function syncOrdersFromEmail() {
    const config = {
        imap: {
            user: process.env.GMAIL_USER || '',
            password: process.env.GMAIL_APP_PASSWORD || '',
            host: 'imap.gmail.com',
            port: 993,
            tls: true,
            authTimeout: 3000,
            tlsOptions: { rejectUnauthorized: false }
        }
    };

    try {
        const connection = await imaps.connect(config);
        await connection.openBox('INBOX');

        // Search for UNSEEN messages from Naver notifications or mentioning [네이버 예약]
        const searchCriteria = ['UNSEEN', ['OR', ['HEADER', 'FROM', 'marketing@naver.com'], ['SUBJECT', '[네이버 예약]']]];
        const fetchOptions = {
            bodies: ['HEADER', 'TEXT', ''],
            markSeen: true
        };

        const messages = await connection.search(searchCriteria, fetchOptions);
        console.log(`Found ${messages.length} new potential order emails.`);

        let successCount = 0;
        const products = await getProducts();

        for (const item of messages) {
            const all = item.parts.find(part => part.which === '');
            const id = item.attributes.uid;
            const idHeader = `EMAIL_UID_${id}`;

            // Basic duplicate check using request field or memo? 
            // In a real app, we should have an 'externalId' or 'emailUid' field in the Order table.
            // For now, let's check if an order with this specific memo (email content) exists.

            if (all) {
                const mail = await simpleParser(all.body);
                const text = mail.text || '';

                if (text.includes('예약자')) {
                    const result = parseNaverOrderText(text);
                    if (result.customerName) {

                        // Apply product matching
                        const matchedItems = result.items?.map((item: any) => {
                            const match = findMatchingProduct(item.name, products, result.pickupDate);
                            if (match) {
                                return {
                                    name: match.name,
                                    quantity: item.quantity,
                                    price: match.price
                                };
                            }
                            return item;
                        });

                        const payload = {
                            type: 'RESERVATION',
                            channel: 'NAVER',
                            customerName: result.customerName,
                            customerContact: result.customerContact || '',
                            pickupType: result.pickupType || 'PICKUP',
                            pickupDate: result.pickupDate ? new Date(result.pickupDate) : null,
                            pickupTime: result.pickupTime || '',
                            address: result.address || '',
                            request: result.request || '',
                            items: matchedItems || [],
                            totalPrice: result.totalPrice || 0,
                            status: 'PENDING',
                            memo: text // Store original email text as memo
                        };

                        await createOrder(payload);
                        successCount++;
                    }
                }
            }
        }

        connection.end();
        return { success: true, count: successCount };
    } catch (error) {
        console.error('Email sync error:', error);
        return { success: false, error: String(error) };
    }
}
