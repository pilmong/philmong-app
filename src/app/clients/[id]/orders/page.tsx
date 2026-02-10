import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Calendar, ShoppingCart, Info } from "lucide-react";
import OrderInputSection from "../../components/OrderInputSection";

export default async function ClientOrderPage({ params, searchParams }: {
    params: { id: string },
    searchParams: Promise<{ admin?: string }>
}) {
    const { id } = await params;
    const { admin } = await searchParams;
    const isAdmin = admin === 'true';

    const client = await prisma.client.findUnique({
        where: { id }
    });

    if (!client) return <div>고객사를 찾을 수 없습니다.</div>;

    // 현재 날짜 기준 미래의 도시락 상품들 중 이 고객사에게 단가가 설정된 것만 가져오기
    const products = await prisma.product.findMany({
        where: {
            type: 'LUNCH_BOX',
            sellingDate: {
                gt: new Date(new Date().setHours(0, 0, 0, 0))
            },
            status: 'SELLING',
            prices: {
                some: {
                    clientId: id
                }
            }
        },
        include: {
            lunchBoxConfig: true
        },
        orderBy: {
            sellingDate: 'asc'
        }
    });

    // 시스템 설정 가져오기 (마감 시간 등)
    let settings = await prisma.systemSetting.findUnique({
        where: { id: "GLOBAL" }
    });
    if (!settings) {
        settings = await prisma.systemSetting.create({
            data: { id: "GLOBAL", deadlineHour: 15 }
        });
    }

    // 기존 발주 내역 가져오기 (내일 이후만)
    const orderRequests = await prisma.orderRequest.findMany({
        where: {
            clientId: id,
            targetDate: {
                gt: new Date(new Date().setHours(0, 0, 0, 0))
            }
        },
        include: {
            items: true
        }
    });

    const initialOrders = orderRequests.flatMap(or =>
        or.items.map(item => ({
            productId: item.productId,
            itemName: item.itemName,
            itemCategory: item.itemCategory,
            quantity: item.quantity,
            date: or.targetDate.toISOString().split('T')[0]
        }))
    );

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-10">
                <Link href={`/clients/${id}`} className="text-slate-400 hover:text-slate-600 font-bold text-sm mb-4 inline-flex items-center transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    나의 고객 정보로 돌아가기
                </Link>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-200">
                        <ShoppingCart className="w-8 h-8 text-white" />
                    </div>
                    주간 도시락 발주 센터
                </h1>
                <p className="text-slate-500 mt-2 text-lg font-medium">{client.name} 담당자님, 날짜별 도시락 수량을 예약해 주세요.</p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-12 rounded-r-[2.5rem] shadow-sm">
                <div className="flex items-center">
                    <Info className="h-6 w-6 text-blue-500 mr-4" />
                    <div>
                        <p className="text-blue-900 font-bold">안내사항</p>
                        <p className="text-blue-700 text-sm mt-1">
                            보여드리는 메뉴 리스트는 미리 구성된 도시락 라인업입니다. 수량을 입력하시면 자동으로 예약이 완료됩니다.
                            <br />관리자가 발주를 수락하기 전까지는 언제든 수량 수정이 가능합니다.
                        </p>
                    </div>
                </div>
            </div>

            <OrderInputSection
                clientId={id}
                isAdmin={isAdmin}
                deadlineHour={settings.deadlineHour}
                products={products.map(p => ({
                    id: p.id,
                    name: p.name,
                    sellingDate: p.sellingDate!,
                    lunchBoxConfig: p.lunchBoxConfig
                }))}
                initialOrders={initialOrders}
            />
        </div>
    );
}
