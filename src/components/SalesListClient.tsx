"use client";

import Link from "next/link";
import { Plus, Download, Filter, ShoppingCart, User, Calendar, Receipt, Trash2, Sparkles, LayoutGrid, Clock, PackageCheck, Truck, CheckCircle, XCircle } from "lucide-react";
import { useState, useMemo } from "react";
import SaleDetailModal from "@/components/SaleDetailModal";
import SaleVoucherCard from "@/components/SaleVoucherCard";
import { resetSalesData } from "@/app/sales/actions";

const TABS = [
    { id: 'ALL', label: '모든 전표', icon: LayoutGrid, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'STANDBY', label: '접수대기', icon: Clock, color: 'text-slate-600', bg: 'bg-slate-100' },
    { id: 'ACCEPTED', label: '주문접수', icon: Receipt, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'PACKING', label: '포장중', icon: PackageCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'DELIVERY_READY', label: '전달대기', icon: Truck, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'COMPLETED', label: '전달완료', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'CANCELLED', label: '취소', icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
];

export default function SalesListClient({ sales, products }: { sales: any[], products: any[] }) {
    const [selectedSale, setSelectedSale] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredSales = useMemo(() => {
        let result = sales;

        // 1. Status Filter
        if (activeTab !== 'ALL') {
            result = result.filter(s => s.status === activeTab);
        }

        // 2. Search Filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(s =>
                (s.customerName?.toLowerCase().includes(query)) ||
                (s.customerPhone?.includes(query)) ||
                (s.id.toLowerCase().includes(query))
            );
        }

        return result;
    }, [sales, activeTab, searchQuery]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {selectedSale && (
                <SaleDetailModal
                    sale={selectedSale}
                    products={products}
                    onClose={() => setSelectedSale(null)}
                />
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">Operation Dashboard</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <LayoutGrid className="w-10 h-10 text-indigo-600" />
                        주문 및 전표 관리
                    </h1>
                    <p className="text-slate-500 font-bold mt-2 ml-1">발행된 전표의 진행 상태를 실시간으로 관리하세요.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/sales/manual"
                        className="bg-white text-indigo-600 border-2 border-indigo-500 px-6 py-3.5 rounded-2xl text-base font-black shadow-lg shadow-indigo-100 hover:bg-indigo-50 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        수기 주문 등록
                    </Link>
                    <Link
                        href="/quick-add"
                        className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl text-base font-black shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <Sparkles className="w-5 h-5" />
                        텍스트로 전표 발행 (Quick)
                    </Link>
                    <button
                        onClick={async () => {
                            if (confirm("정말로 모든 주문 내역을 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.")) {
                                const result = await resetSalesData();
                                if (result.success) {
                                    alert("초기화되었습니다.");
                                } else {
                                    alert("초기화 실패");
                                }
                            }
                        }}
                        className="bg-white text-slate-300 border border-slate-200 p-3.5 rounded-2xl hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all"
                        title="데이터 초기화"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row gap-6 mb-10 items-center justify-between">
                {/* Status Tabs */}
                <div className="flex flex-wrap gap-2">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        const count = tab.id === 'ALL' ? sales.length : sales.filter(s => s.status === tab.id).length;

                        if (count === 0 && tab.id !== 'ALL' && tab.id !== 'STANDBY' && tab.id !== 'COMPLETED') return null;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black transition-all border-2 ${isActive
                                    ? `${tab.bg} ${tab.color} border-current`
                                    : 'bg-white text-slate-400 border-transparent hover:border-slate-200 hover:text-slate-600'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                                <span className={`ml-1 text-[10px] font-black opacity-60 underline underline-offset-4`}>{count}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-80">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="고객명, 번호로 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-100 rounded-2xl font-bold text-sm focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-20">
                {filteredSales.length === 0 ? (
                    <div className="md:col-span-2 xl:col-span-3 bg-white/50 border-4 border-dashed border-slate-200 rounded-[4rem] p-32 flex flex-col items-center justify-center text-center backdrop-blur-sm">
                        <div className="w-24 h-24 bg-slate-100 rounded-[2.5rem] flex items-center justify-center mb-8 rotate-12">
                            <Receipt className="w-12 h-12 text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-400 mb-2">
                            {searchQuery ? "검색 결과가 없습니다." : "해당 상태의 전표가 없습니다."}
                        </h3>
                        <p className="text-slate-400 font-bold mb-10">
                            {searchQuery ? "검색어를 다시 확인해 보시겠어요?" : "필터 조건을 확인해 보세요."}
                        </p>
                        {(activeTab !== 'ALL' || searchQuery) && (
                            <button
                                onClick={() => { setActiveTab('ALL'); setSearchQuery(''); }}
                                className="text-indigo-600 font-black underline underline-offset-8 decoration-2 hover:text-indigo-700 transition-colors"
                            >
                                필터 초기화하고 모든 전표 보기
                            </button>
                        )}
                    </div>
                ) : (
                    filteredSales.map((sale: any) => (
                        <SaleVoucherCard
                            key={sale.id}
                            sale={sale}
                            onClick={() => setSelectedSale(sale)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
