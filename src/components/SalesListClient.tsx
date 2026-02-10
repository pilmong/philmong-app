"use client";

import Link from "next/link";
import { Plus, Download, Filter, ShoppingCart, User, Calendar, Receipt, Trash2 } from "lucide-react";
import { useState } from "react";
import SaleDetailModal from "@/components/SaleDetailModal";
import { resetSalesData } from "@/app/sales/actions";

export default function SalesListClient({ sales, products }: { sales: any[], products: any[] }) {
    const [selectedSale, setSelectedSale] = useState<any>(null);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {selectedSale && (
                <SaleDetailModal
                    sale={selectedSale}
                    products={products}
                    onClose={() => setSelectedSale(null)}
                />
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">판매 및 주문 내역</h1>
                    <p className="text-slate-500 mt-1">네이버 예약 및 일반 판매 내역을 한눈에 관리하세요.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <Link
                        href="/sales/import"
                        className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 flex items-center"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        네이버 예약 가져오기
                    </Link>
                    <button className="bg-white text-slate-600 border border-slate-200 px-4 py-2.5 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all flex items-center">
                        <Download className="w-4 h-4 mr-2" />
                        엑셀 다운로드
                    </button>
                    <button
                        onClick={async () => {
                            if (confirm("정말로 '감시자'를 통해 불러들인 데이터를 포함한 모든 주문 내역을 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.")) {
                                const result = await resetSalesData();
                                if (result.success) {
                                    alert("초기화되었습니다.");
                                } else {
                                    alert("초기화 실패");
                                }
                            }
                        }}
                        className="bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-2xl text-sm font-bold hover:bg-red-100 transition-all flex items-center"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        데이터 초기화
                    </button>
                </div>
            </div>

            {/* 필터 섹션 */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 mb-8 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center text-sm font-bold text-slate-400 px-2 uppercase tracking-widest">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                    </div>
                    <select className="bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-slate-200">
                        <option>모든 소스 (네이버/직접)</option>
                        <option>네이버 예약</option>
                        <option>현장 판매</option>
                    </select>
                </div>
                <div className="text-sm font-medium text-slate-400">
                    총 <span className="text-slate-900 font-bold">{sales.length}</span>건의 주문이 조회되었습니다.
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {sales.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-20 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                            <Receipt className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">등록된 판매 내역이 없습니다.</h3>
                        <p className="text-slate-500 mb-8">네이버 예약 정보를 가져오거나 새로운 주문을 등록해 보세요.</p>
                        <Link
                            href="/sales/import"
                            className="btn-primary px-8"
                        >
                            첫 번째 주문 등록하기
                        </Link>
                    </div>
                ) : (
                    sales.map((sale: any) => (
                        <div key={sale.id} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                            <div className="flex flex-col lg:flex-row">
                                {/* 좌측: 주문 정보 */}
                                <div className="p-8 lg:w-1/3 border-b lg:border-b-0 lg:border-r border-slate-100 bg-slate-50/30">
                                    <div className="flex items-center justify-between mb-6">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${sale.source === 'NAVER' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {sale.source}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400 font-mono">{sale.id.slice(-8)}</span>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-white rounded-xl border border-slate-100 flex items-center justify-center mr-4 text-slate-400 group-hover:text-blue-600 transition-colors">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-400 font-bold uppercase tracking-tight">주문자</div>
                                                <div className="font-bold text-slate-900">{sale.customerName || "미입력"}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-white rounded-xl border border-slate-100 flex items-center justify-center mr-4 text-slate-400">
                                                <Calendar className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-400 font-bold uppercase tracking-tight">주문 일시</div>
                                                <div className="font-medium text-slate-700">{new Date(sale.createdAt).toLocaleString()}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 중앙: 상품 내역 */}
                                <div className="p-8 flex-1">
                                    <div className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                                        <ShoppingCart className="w-4 h-4 mr-2" />
                                        Ordered Items
                                    </div>
                                    <div className="space-y-3">
                                        {sale.items.map((item: any) => (
                                            <div key={item.id} className="flex justify-between items-center p-3 rounded-2xl bg-slate-50/50 border border-slate-100/50">
                                                <div className="flex items-center">
                                                    <span className="font-bold text-slate-800">
                                                        {item.product ? item.product.name : (item.customName || "알 수 없는 상품")}
                                                    </span>
                                                    <span className="ml-3 px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-500">x{item.quantity}</span>
                                                </div>
                                                <span className="font-mono text-sm text-slate-500">{(item.price * item.quantity).toLocaleString()}원</span>
                                            </div>
                                        ))}
                                    </div>
                                    {sale.memo && (
                                        <div className="mt-4 p-3 rounded-2xl bg-blue-50/50 border border-blue-100 text-xs text-blue-700">
                                            <b>Memo:</b> {sale.memo}
                                        </div>
                                    )}
                                </div>

                                {/* 우측: 결제 요약 */}
                                <div className="p-8 lg:w-1/4 bg-slate-900 text-white flex flex-col justify-between">
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between items-center opacity-60">
                                            <span>배달료</span>
                                            <span>+{sale.deliveryFee.toLocaleString()}원</span>
                                        </div>
                                        <div className="flex justify-between items-center opacity-60">
                                            <span>할인</span>
                                            <span className="text-rose-400">-{sale.discountValue.toLocaleString()}원</span>
                                        </div>
                                        <div className="h-px bg-white/10 my-2" />
                                        <div className="flex justify-between items-end">
                                            <span className="text-xs font-bold opacity-40 uppercase">Total Amount</span>
                                            <span className="text-2xl font-black text-emerald-400">{sale.totalAmount.toLocaleString()}원</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedSale(sale)}
                                        className="w-full mt-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all border border-white/5"
                                    >
                                        상세보기/전표인쇄
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div >
    );
}
