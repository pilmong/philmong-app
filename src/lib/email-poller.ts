import 'server-only';
// @ts-ignore
import Imap from 'node-imap';
import { simpleParser, ParsedMail } from 'mailparser';
import { parseOrderText } from '@/lib/order-parser';
import { prisma } from '@/lib/prisma';

export interface EmailPollResult {
    success: boolean;
    processedCount: number;
    createdSaleIds: string[];
    errors: string[];
    skipped: string[]; // 추가
}

export async function checkEmails(): Promise<EmailPollResult> {
    // 상품 목록 미리 로드 (파싱 시 매칭용)
    const allProducts = await prisma.product.findMany();

    return new Promise((resolve) => {
        const errors: string[] = [];
        const createdSaleIds: string[] = [];
        const skipped: string[] = []; // 추가
        let processedCount = 0;

        const imapConfig: Imap.Config = {
            user: process.env.EMAIL_USER,
            password: process.env.EMAIL_PASSWORD,
            host: 'imap.gmail.com',
            port: 993,
            tls: true,
            tlsOptions: { rejectUnauthorized: false },
            authTimeout: 10000, // 10 seconds
        };

        if (!imapConfig.user || !imapConfig.password) {
            resolve({ success: false, processedCount: 0, createdSaleIds: [], errors: ['EMAIL_USER or EMAIL_PASSWORD not set'], skipped: [] });
            return;
        }

        const imap = new Imap(imapConfig);

        imap.once('ready', () => {
            imap.openBox('INBOX', false, (err: Error, box: Imap.Box) => {
                if (err) {
                    errors.push(err.message);
                    imap.end();
                    return;
                }

                imap.search(['UNSEEN'], (err: Error, results: number[]) => {
                    if (err) {
                        errors.push(err.message);
                        imap.end();
                        return;
                    }

                    if (!results || results.length === 0) {
                        imap.end();
                        return;
                    }

                    const f = imap.fetch(results, { bodies: '' });

                    let pending = results.length;

                    f.on('message', (msg: Imap.ImapMessage, seqno: number) => {
                        msg.on('body', (stream: any, info: any) => {
                            simpleParser(stream, async (err: Error | null, parsed: ParsedMail) => {
                                if (err) {
                                    errors.push(`Parse error for seq ${seqno}: ${err.message}`);
                                    checkDone();
                                    return;
                                }

                                const subject = parsed.subject || "No Subject";
                                // const from = parsed.from?.text || "Unknown";

                                // 네이버 예약 확인 (제목 또는 본문)
                                const isNaverReservation = subject.includes('네이버 예약') || (parsed.text && parsed.text.includes('네이버 예약'));

                                if (isNaverReservation) {
                                    try {
                                        const content = parsed.text || parsed.html || "";
                                        const saleData = parseOrderText(content as string, allProducts);

                                        if (saleData.items.length > 0) {
                                            const validItems = saleData.items.map(item => {
                                                if (!item.productId) return null;
                                                return {
                                                    productId: item.productId,
                                                    quantity: item.quantity,
                                                    price: item.price
                                                };
                                            }).filter((item): item is { productId: string; quantity: number; price: number } => item !== null);

                                            if (validItems.length > 0) {
                                                const { createSaleWithItems } = await import('@/app/sales/actions');
                                                const result = await createSaleWithItems({
                                                    customerName: saleData.customerName,
                                                    customerPhone: saleData.customerPhone,
                                                    deliveryFee: saleData.deliveryFee,
                                                    discountValue: saleData.discountValue,
                                                    totalAmount: saleData.totalAmount,
                                                    memo: saleData.memo,
                                                    utilizationDate: saleData.utilizationDate,
                                                    visitor: saleData.visitor,
                                                    pickupType: saleData.pickupType,
                                                    address: saleData.address,
                                                    paymentStatus: saleData.paymentStatus,
                                                    items: validItems,
                                                    source: 'NAVER_EMAIL',
                                                });
                                                processedCount++;
                                                if (result && (result as any).id) {
                                                    createdSaleIds.push((result as any).id);
                                                }
                                                console.log(`[EmailPoller] Created sale from: ${subject}`);
                                            } else {
                                                const msg = `Skipped (no matching products): ${subject}`;
                                                console.log(`[EmailPoller] ${msg}`);
                                                skipped.push(msg);
                                            }
                                        } else {
                                            const msg = `Skipped (no items parsed): ${subject}`;
                                            console.log(`[EmailPoller] ${msg}`);
                                            skipped.push(msg);
                                        }
                                    } catch (e: any) {
                                        errors.push(`Process error for ${subject}: ${e.message}`);
                                    }
                                } else {
                                    // Not a Naver reservation
                                    // skipped.push(`Ignored: ${subject}`); // Too noisy?
                                }
                                checkDone();
                            });
                        });
                    });

                    f.once('error', (err: Error) => {
                        errors.push(`Fetch error: ${err.message}`);
                    });

                    f.once('end', () => {
                        // Fetch stream ended
                    });

                    function checkDone() {
                        pending--;
                        if (pending === 0) {
                            imap.end();
                        }
                    }
                });
            });
        });

        imap.once('error', (err: any) => {
            errors.push(`IMAP error: ${err.message}`);
            resolve({ success: false, processedCount, createdSaleIds, errors, skipped });
        });

        imap.once('end', () => {
            resolve({ success: errors.length === 0, processedCount, createdSaleIds, errors, skipped });
        });

        imap.connect();
    });
}
