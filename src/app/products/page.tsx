import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DeleteProductButton from "./components/DeleteProductButton";
import ProductFilter from "./components/ProductFilter";
import DeadlineSetting from "./components/DeadlineSetting";
import { Prisma } from "@prisma/client";

const WORK_DIVISION_LABELS = {
    'COOKING': '조리',
    'PROCESSING': '가공',
    'IMMEDIATE_SUB_PORTIONING': '소분'
} as const;

interface PageProps {
    searchParams: Promise<{
        search?: string;
        type?: string;
        work?: string;
        sort?: string;
    }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
    const { search, type, work, sort } = await searchParams;

    // Prisma Where 조건 구성
    const where: Prisma.ProductWhereInput = {};

    if (search) {
        where.name = { contains: search };
    }

    if (type && type !== 'ALL') {
        where.type = type as any;
    }

    if (work && work !== 'ALL') {
        where.workDivision = work as any;
    }

    // Prisma OrderBy 조건 구성
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };

    if (sort === 'price_asc') {
        orderBy = { price: 'asc' };
    } else if (sort === 'price_desc') {
        orderBy = { price: 'desc' };
    } else if (sort === 'name_asc') {
        orderBy = { name: 'asc' };
    }

    const products = await prisma.product.findMany({
        where,
        orderBy
    });

    // 시스템 전역 설정 (마감 시간) 가져오기
    let settings = await prisma.systemSetting.findUnique({
        where: { id: "GLOBAL" }
    });
    if (!settings) {
        settings = await prisma.systemSetting.create({
            data: { id: "GLOBAL", deadlineHour: 15 }
        });
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">상품 관리</h2>
                    <p className="text-slate-500">전체 상품 목록을 조회하고 관리할 수 있습니다.</p>
                </div>
                <div className="flex space-x-3">
                    <Link href="/products/bulk" className="inline-flex items-center bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors">
                        일괄 등록
                    </Link>
                    <Link href="/products/new" className="inline-flex items-center bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors">
                        + 새 상품 등록
                    </Link>
                </div>
            </div>

            {/* 발주 마감 설정 섹션 */}
            <DeadlineSetting initialHour={settings.deadlineHour} />

            {/* 필터 섹션 */}
            <ProductFilter />

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">카테고리</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">상품명</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">판매금액</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">작업구분</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">상태</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">관리</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                                    {search || (type && type !== 'ALL') || (work && work !== 'ALL') ? "검색 결과가 없습니다." : "등록된 상품이 없습니다. 새 상품을 등록해 주세요."}
                                </td>
                            </tr>
                        ) : (
                            products.map((product) => (
                                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${product.type === 'REGULAR' ? 'bg-blue-100 text-blue-800' :
                                            product.type === 'DAILY' ? 'bg-green-100 text-green-800' :
                                                product.type === 'SPECIAL' ? 'bg-purple-100 text-purple-800' :
                                                    'bg-orange-100 text-orange-800'
                                            }`}>
                                            {product.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                                        {product.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                                        {product.price.toLocaleString()}원
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {{
                                            'COOKING': '조리',
                                            'PROCESSING': '가공',
                                            'IMMEDIATE_SUB_PORTIONING': '소분'
                                        }[product.workDivision as keyof typeof WORK_DIVISION_LABELS] || product.workDivision}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${product.status === 'SELLING' ? 'bg-emerald-100 text-emerald-800' :
                                            product.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                                                'bg-slate-100 text-slate-800'
                                            }`}>
                                            {product.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link href={`/products/${product.id}/edit`} className="text-slate-600 hover:text-slate-900 mr-3 font-bold">수정</Link>
                                        <DeleteProductButton id={product.id} />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
