"use client";

import { useState } from "react";
import { ProductType, WorkDivision, ProductStatus } from "@prisma/client";
import { createProduct, updateProduct } from "../actions";

/**
 * 샐러드 27개 슬롯을 탭으로 나누어 보여주는 서브 컴포넌트
 */
function TabbedSaladGrid({ product }: { product?: any }) {
    const [activeLayer, setActiveLayer] = useState(0);
    const layers = [
        { label: "1층 BTM (Bottom - 베이스 채소/곡물)", slots: ['S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA'] },
        { label: "2층 MID (Middle - 메인 단백질/과일)", slots: ['J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R'] },
        { label: "3층 TOP (Top - 토핑/드레싱)", slots: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'] }
    ];

    return (
        <div className="max-w-2xl mx-auto bg-slate-800/95 rounded-[3rem] shadow-2xl border-x-4 border-slate-700 overflow-hidden">
            <div className="bg-slate-900/50 p-6 border-b border-slate-700/50">
                <div className="flex justify-center gap-2">
                    {layers.map((layer, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveLayer(idx)}
                            className={`px-6 py-2 rounded-2xl text-[11px] font-black transition-all ${activeLayer === idx ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}
                        >
                            {layer.label.split(' ')[0]} {layer.label.split(' ')[1]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[10px] font-black text-emerald-400">{activeLayer + 1}</span>
                    <label className="text-xs font-black text-emerald-100 uppercase tracking-widest">{layers[activeLayer].label}</label>
                </div>

                <div className="grid grid-cols-3 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {layers[activeLayer].slots.map((slot) => (
                        <div key={slot} className="bg-slate-900/80 rounded-2xl p-4 border border-slate-700/50 hover:border-emerald-500/50 transition-all group/cell shadow-inner">
                            <div className="flex justify-center items-center mb-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover/cell:bg-emerald-500 transition-colors" />
                            </div>
                            <input
                                name={`slot${slot}`}
                                type="text"
                                className="w-full border-none p-0 text-[11px] font-black text-emerald-50 outline-none focus:ring-0 bg-transparent placeholder:text-slate-800 text-center"
                                defaultValue={product?.lunchBoxConfig?.[`slot${slot}`] || ""}
                                placeholder="입력"
                            />
                        </div>
                    ))}
                </div>

                {/* 폼 전송을 위해 보이지 않는 나머지 층의 데이터 유지 */}
                <div className="hidden">
                    {layers.map((layer, lIdx) =>
                        lIdx !== activeLayer && layer.slots.map(slot => (
                            <input key={slot} name={`slot${slot}`} type="hidden" defaultValue={product?.lunchBoxConfig?.[`slot${slot}`] || ""} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ProductForm({ product }: { product?: any }) {
    const [productType, setProductType] = useState<ProductType>(product?.type || "REGULAR");
    const [layoutType, setLayoutType] = useState<string>(product?.lunchBoxConfig?.layoutType || "LUNCH_BOX");

    const formAction = product
        ? updateProduct.bind(null, product.id)
        : createProduct;

    const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const onlyNums = value.replace(/[^0-9]/g, '');
        e.target.value = onlyNums;
    };

    return (
        <form action={formAction} className="space-y-8">
            <div className="card">
                <h3 className="text-lg font-bold mb-4 border-b pb-2">기본 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">상품 카테고리</label>
                        <select
                            name="type"
                            className="input-field"
                            value={productType}
                            onChange={(e) => setProductType(e.target.value as ProductType)}
                            required
                        >
                            <option value="REGULAR">상시 판매 (Regular)</option>
                            <option value="DAILY">매일 변경 (Daily)</option>
                            <option value="SPECIAL">특별 운영 (Special)</option>
                            <option value="LUNCH_BOX">런치 박스 (Lunch Box)</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">상품명</label>
                        <input name="name" type="text" className="input-field" defaultValue={product?.name} placeholder="상품 이름을 입력하세요" required />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">판매 금액</label>
                        <div className="relative">
                            <input
                                name="price"
                                type="text"
                                className="input-field pr-12"
                                defaultValue={product?.price}
                                onChange={handleNumberInput}
                                placeholder="0"
                                required
                            />
                            <span className="absolute right-4 top-2 text-slate-400">원</span>
                        </div>
                    </div>

                    {productType === "REGULAR" && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">작업 구분</label>
                            <select name="workDivision" className="input-field" defaultValue={product?.workDivision}>
                                <option value="IMMEDIATE_SUB_PORTIONING">즉시 소분 (아웃소싱 후 바로 소분)</option>
                                <option value="COOKING">조리 상품 (직접 조리)</option>
                                <option value="PROCESSING">가공 상품 (아웃소싱 후 추가 작업)</option>
                            </select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">판매 상태</label>
                        <select name="status" className="input-field" defaultValue={product?.status}>
                            <option value="SELLING">판매 중</option>
                            <option value="NOT_SELLING">미 판매</option>
                            <option value="PENDING">보류 중</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* 카테고리별 상세 정보 */}
            <div className="card">
                <h3 className="text-lg font-bold mb-4 border-b pb-2">카테고리 상세 설정</h3>

                {productType === "REGULAR" && (
                    <div className="space-y-4">
                        <div className="space-y-2 w-full md:w-1/2">
                            <label className="text-sm font-medium text-slate-700">진열상품 기준 수량</label>
                            <input
                                name="standardQuantity"
                                type="text"
                                className="input-field"
                                defaultValue={product?.standardQuantity || ""}
                                onChange={handleNumberInput}
                                placeholder="0"
                            />
                            <p className="text-xs text-slate-400">* 작업지시서 생성 시 활용됩니다.</p>
                        </div>
                    </div>
                )}

                {(productType === "DAILY" || productType === "SPECIAL" || productType === "LUNCH_BOX") && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">
                                {productType === "SPECIAL" ? "판매 시작 날짜" : "판매 예정 날짜"}
                            </label>
                            <input
                                name="sellingDate"
                                type="date"
                                className="input-field"
                                defaultValue={product?.sellingDate ? new Date(product.sellingDate).toISOString().split('T')[0] : ""}
                                required
                            />
                        </div>

                        {productType === "SPECIAL" && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">판매 종료 날짜</label>
                                <input
                                    name="sellingEndDate"
                                    type="date"
                                    className="input-field"
                                    defaultValue={product?.sellingEndDate ? new Date(product.sellingEndDate).toISOString().split('T')[0] : ""}
                                    required
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">생산/판매 수량</label>
                            <input
                                name="plannedQuantity"
                                type="text"
                                className="input-field"
                                defaultValue={product?.plannedQuantity || ""}
                                onChange={handleNumberInput}
                                placeholder="0"
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-medium text-slate-700">메뉴 상세 설명</label>
                            <textarea name="description" className="input-field h-24" defaultValue={product?.description || ""} placeholder="메뉴에 대한 상세 설명을 입력하세요"></textarea>
                        </div>
                    </div>
                )}

                {productType === "LUNCH_BOX" && (
                    <div className="mt-8">
                        <div className="flex justify-between items-center mb-6">
                            <label className="text-sm font-bold text-slate-800 underline decoration-slate-300">내부 구성 실물 모형 선택</label>
                            <div className="flex p-1 bg-slate-100 rounded-2xl">
                                <button
                                    type="button"
                                    onClick={() => setLayoutType("LUNCH_BOX")}
                                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${layoutType === 'LUNCH_BOX' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    정기 도시락 (6칸)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLayoutType("SALAD")}
                                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${layoutType === 'SALAD' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    샐러드 (탭 UI)
                                </button>
                                <input type="hidden" name="layoutType" value={layoutType} />
                            </div>
                        </div>

                        {layoutType === "LUNCH_BOX" ? (
                            <div className="max-w-xl mx-auto bg-slate-200 p-4 rounded-[2.5rem] shadow-inner border-8 border-slate-300/50">
                                <div className="grid grid-cols-4 gap-3 mb-3">
                                    <div className="space-y-1 bg-white p-3 rounded-2xl shadow-sm">
                                        <label className="text-[10px] font-black text-rose-500 uppercase">반찬 1</label>
                                        <input name="slotC" type="text" className="w-full border-none p-0 text-sm font-bold text-slate-700 outline-none focus:ring-0 bg-transparent" defaultValue={product?.lunchBoxConfig?.slotC || ""} placeholder="입력..." />
                                    </div>
                                    <div className="space-y-1 bg-white p-3 rounded-2xl shadow-sm border-2 border-amber-200">
                                        <label className="text-[10px] font-black text-rose-500 uppercase">메인</label>
                                        <input name="slotD" type="text" className="w-full border-none p-0 text-sm font-bold text-slate-700 outline-none focus:ring-0 bg-transparent" defaultValue={product?.lunchBoxConfig?.slotD || ""} placeholder="주요리" />
                                    </div>
                                    <div className="space-y-1 bg-white p-3 rounded-2xl shadow-sm">
                                        <label className="text-[10px] font-black text-rose-500 uppercase">반찬 2</label>
                                        <input name="slotE" type="text" className="w-full border-none p-0 text-sm font-bold text-slate-700 outline-none focus:ring-0 bg-transparent" defaultValue={product?.lunchBoxConfig?.slotE || ""} placeholder="입력..." />
                                    </div>
                                    <div className="space-y-1 bg-white p-3 rounded-2xl shadow-sm">
                                        <label className="text-[10px] font-black text-rose-500 uppercase">반찬 3</label>
                                        <input name="slotF" type="text" className="w-full border-none p-0 text-sm font-bold text-slate-700 outline-none focus:ring-0 bg-transparent" defaultValue={product?.lunchBoxConfig?.slotF || ""} placeholder="입력..." />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 h-40">
                                    <div className="bg-white p-6 rounded-[2rem] shadow-sm flex flex-col justify-center border-l-8 border-slate-100">
                                        <label className="text-sm font-black text-rose-500 uppercase mb-2">밥</label>
                                        <input name="slotA" type="text" className="w-full border-none p-0 text-xl font-black text-slate-800 outline-none focus:ring-0 bg-transparent text-center" defaultValue={product?.lunchBoxConfig?.[`slotA`] || ""} placeholder="종류 입력" />
                                    </div>
                                    <div className="bg-white p-6 rounded-full shadow-sm flex flex-col justify-center border-4 border-slate-50 items-center overflow-hidden aspect-square mx-auto">
                                        <label className="text-sm font-black text-rose-500 uppercase mb-2">국</label>
                                        <input name="slotB" type="text" className="w-full border-none p-0 text-lg font-black text-slate-800 outline-none focus:ring-0 bg-transparent text-center" defaultValue={product?.lunchBoxConfig?.[`slotB`] || ""} placeholder="종류 입력" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <TabbedSaladGrid product={product} />
                        )}
                        <p className="text-center text-xs text-slate-400 mt-4 italic font-medium">※ 선택하신 용기 모양에 실시간으로 구성 정보가 매핑됩니다.</p>
                    </div>
                )}
            </div>

            <div className="flex justify-end space-x-4">
                <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="px-6 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                    취소
                </button>
                <button
                    type="submit"
                    className="btn-primary px-8"
                >
                    {product ? "상품 수정 완료" : "상품 등록 완료"}
                </button>
            </div>
        </form>
    );
}
