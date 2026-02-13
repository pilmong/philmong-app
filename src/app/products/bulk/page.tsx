"use client";

import { useState } from "react";
import { ProductType, WorkDivision } from "@prisma/client";
import { createBulkProducts } from "../actions";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, HelpCircle } from "lucide-react";

interface BulkRow {
    name: string;
    price: string;
    type: ProductType;
    workDivision: WorkDivision;
    description: string;
    sellingDate: string;
    sellingEndDate: string;
    plannedQuantity: string;
}

export default function BulkProductPage() {
    const router = useRouter();
    const [rows, setRows] = useState<BulkRow[]>([
        {
            name: "",
            price: "",
            type: "REGULAR",
            workDivision: "IMMEDIATE_SUB_PORTIONING" as WorkDivision,
            description: "",
            sellingDate: "",
            sellingEndDate: "",
            plannedQuantity: ""
        }
    ]);
    const [isPending, setIsPending] = useState(false);

    const addRow = () => {
        const lastRow = rows[rows.length - 1];
        setRows([...rows, {
            name: "",
            price: "",
            type: lastRow?.type || "REGULAR",
            workDivision: lastRow?.workDivision || "IMMEDIATE_SUB_PORTIONING" as WorkDivision,
            description: "",
            sellingDate: lastRow?.sellingDate || "",
            sellingEndDate: lastRow?.sellingEndDate || "",
            plannedQuantity: ""
        }]);
    };

    const removeRow = (index: number) => {
        if (rows.length === 1) return;
        const newRows = [...rows];
        newRows.splice(index, 1);
        setRows(newRows);
    };

    const updateRow = (index: number, field: keyof BulkRow, value: any) => {
        const newRows = [...rows];
        let newValue = value;

        // 숫자 필드인 경우 필터링
        if (field === "price" || field === "plannedQuantity") {
            newValue = value.replace(/[^0-9]/g, '');
        }

        newRows[index] = { ...newRows[index], [field]: newValue };

        // 타입이 REGULAR가 아닌 경우 작업구분 자동 COOKING 고정
        if (field === "type" && newValue !== "REGULAR") {
            newRows[index].workDivision = "COOKING" as WorkDivision;
        }

        setRows(newRows);
    };

    const handleSave = async () => {
        setIsPending(true);
        try {
            const dataToSave = rows
                .filter(row => row.name.trim() !== "")
                .map(row => {
                    const { price, plannedQuantity, sellingDate, sellingEndDate, ...rest } = row;
                    return {
                        ...rest,
                        price: parseInt(price) || 0,
                        plannedQuantity: plannedQuantity ? parseInt(plannedQuantity) : null,
                        sellingDate: sellingDate ? new Date(sellingDate) : null,
                        sellingEndDate: sellingEndDate ? new Date(sellingEndDate) : null,
                        status: "SELLING" as const
                    };
                });

            if (dataToSave.length === 0) {
                alert("등록할 상품 정보를 입력해주세요.");
                return;
            }

            await createBulkProducts(dataToSave);
            alert(`${dataToSave.length}개의 상품이 등록되었습니다.`);
            router.push("/products");
        } catch (error) {
            alert("일괄 등록 중 오류가 발생했습니다.");
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">상품 일괄 등록</h2>
                    <p className="text-slate-500 mt-2">여러 상품을 요청하신 순서대로 빠르게 등록하세요. (값 유지 기능 포함)</p>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isPending}
                        className="btn-primary px-8 shadow-lg shadow-blue-500/20"
                    >
                        {isPending ? "저장 중..." : "전체 저장하기"}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">상품명</th>
                                <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">판매금액</th>
                                <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">상세 설명</th>
                                <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">계획 수량</th>
                                <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">카테고리</th>
                                <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">예정 일자</th>
                                <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">마감 일자</th>
                                <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">작업구분</th>
                                <th className="px-4 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-16">기능</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {rows.map((row, index) => (
                                <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-3 py-3">
                                        <input
                                            type="text"
                                            className="input-field text-sm font-bold"
                                            value={row.name}
                                            onChange={(e) => updateRow(index, "name", e.target.value)}
                                            placeholder="상품명"
                                        />
                                    </td>
                                    <td className="px-3 py-3 w-32">
                                        <input
                                            type="text"
                                            className="input-field text-sm font-mono"
                                            value={row.price}
                                            onChange={(e) => updateRow(index, "price", e.target.value)}
                                            placeholder="0"
                                        />
                                    </td>
                                    <td className="px-3 py-3">
                                        <input
                                            type="text"
                                            className="input-field text-sm bg-slate-50 focus:bg-white transition-all disabled:opacity-30"
                                            value={row.description}
                                            onChange={(e) => updateRow(index, "description", e.target.value)}
                                            placeholder={(row.type as string) === 'REGULAR' || (row.type as string) === 'ZONE' || (row.type as string) === 'DISCOUNT' ? "입력 생략 가능" : "데일리 메뉴 설명 입력"}
                                            disabled={(row.type as string) === 'REGULAR' || (row.type as string) === 'ZONE' || (row.type as string) === 'DISCOUNT'}
                                        />
                                    </td>
                                    <td className="px-4 py-4">
                                        <input
                                            type="text"
                                            value={row.plannedQuantity}
                                            onChange={(e) => updateRow(index, "plannedQuantity", e.target.value)}
                                            className="w-full px-3 py-1.5 text-sm border-0 bg-slate-50 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                                            placeholder="0"
                                            disabled={(row.type as string) === 'ZONE' || (row.type as string) === 'DISCOUNT'}
                                        />
                                    </td>
                                    <td className="px-3 py-3 w-40">
                                        <select
                                            className="input-field text-sm font-medium"
                                            value={row.type}
                                            onChange={(e) => updateRow(index, "type", e.target.value)}
                                        >
                                            <option value="REGULAR">상시 판매</option>
                                            <option value="DAILY">매일 변경</option>
                                            <option value="SPECIAL">특별 운영</option>
                                            <option value="LUNCH_BOX">런치 박스</option>
                                            <option value="ZONE">배달 구역</option>
                                            <option value="DISCOUNT">쿠폰/할인</option>
                                        </select>
                                    </td>
                                    <td className="px-3 py-3 w-44">
                                        <input
                                            type="date"
                                            className="input-field text-sm disabled:opacity-30"
                                            value={row.sellingDate}
                                            onChange={(e) => updateRow(index, "sellingDate", e.target.value)}
                                            disabled={(row.type as string) === 'REGULAR' || (row.type as string) === 'ZONE' || (row.type as string) === 'DISCOUNT'}
                                        />
                                    </td>
                                    <td className="px-3 py-3 w-44">
                                        <input
                                            type="date"
                                            className="input-field text-sm disabled:opacity-30"
                                            value={row.sellingEndDate}
                                            onChange={(e) => updateRow(index, "sellingEndDate", e.target.value)}
                                            disabled={(row.type as string) === 'REGULAR' || (row.type as string) === 'ZONE' || (row.type as string) === 'DISCOUNT'}
                                        />
                                    </td>
                                    <td className="px-3 py-3 w-40">
                                        <select
                                            className="input-field text-sm"
                                            value={row.workDivision}
                                            onChange={(e) => updateRow(index, "workDivision", e.target.value)}
                                            disabled={row.type !== "REGULAR" && row.type !== "DAILY" && row.type !== "SPECIAL" && row.type !== "LUNCH_BOX"}
                                        >
                                            <option value="IMMEDIATE_SUB_PORTIONING">즉시 소분</option>
                                            <option value="COOKING">조리 상품</option>
                                            <option value="PROCESSING">가공 상품</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => removeRow(index)}
                                            className="text-slate-300 hover:text-rose-500 p-2 transition-colors"
                                            title="행 삭제"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-200">
                    <button
                        onClick={addRow}
                        className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 hover:bg-slate-100 hover:border-slate-400 hover:text-slate-700 transition-all font-bold flex items-center justify-center group"
                    >
                        <Plus className="w-5 h-5 mr-2 group-hover:scale-125 transition-transform" />
                        새로운 행 추가하기
                    </button>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-start">
                    <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center mr-4 text-blue-600 shrink-0">
                        <HelpCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="text-blue-900 font-bold mb-1 underline decoration-blue-200 underline-offset-4">상세 설명 필드 활용</h4>
                        <p className="text-blue-700/80 text-sm leading-relaxed">데일리 메뉴나 특별 운영 상품은 <b>[상세 설명]</b> 필드에 구성 메뉴(예: 소고기 무국, 콩나물 무침 등)를 입력하면 작업 지시서 생성 시 자동으로 연동되어 출력됩니다.</p>
                    </div>
                </div>

                <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 flex items-start shadow-xl shadow-slate-200">
                    <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center mr-4 text-white shrink-0">
                        📋
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-1">복사/붙여넣기 팁</h4>
                        <p className="text-slate-400 text-sm leading-relaxed">엑셀에서 데이터를 작성하신 뒤, 각 칸에 맞춰 붙여넣으시면 대량의 상품정보를 더욱 빠르게 입력할 수 있습니다. <b>수정</b> 버튼을 통해 개별 조정도 가능합니다.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
