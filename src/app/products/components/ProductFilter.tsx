"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Search, Filter, ArrowUpDown, X } from "lucide-react";

export default function ProductFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // 로컬 상태 (디바운싱을 위해)
    const [search, setSearch] = useState(searchParams.get("search") || "");

    const updateFilters = useCallback((params: Record<string, string | null>) => {
        const newParams = new URLSearchParams(searchParams.toString());

        Object.entries(params).forEach(([key, value]) => {
            if (value === null || value === "" || value === "ALL") {
                newParams.delete(key);
            } else {
                newParams.set(key, value);
            }
        });

        router.push(`/products?${newParams.toString()}`);
    }, [router, searchParams]);

    // 검색어 디바운싱
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (searchParams.get("search") || "")) {
                updateFilters({ search });
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [search, searchParams, updateFilters]);

    const clearFilters = () => {
        setSearch("");
        router.push("/products");
    };

    const hasActiveFilters = searchParams.toString().length > 0;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* 검색어 입력 */}
                <div className="lg:col-span-2 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="상품명으로 검색..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all outline-none text-sm"
                    />
                </div>

                {/* 카테고리 필터 */}
                <div className="relative">
                    <select
                        value={searchParams.get("type") || "ALL"}
                        onChange={(e) => updateFilters({ type: e.target.value })}
                        className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl appearance-none focus:ring-2 focus:ring-slate-900 transition-all outline-none text-sm font-medium text-slate-700"
                    >
                        <option value="ALL">전체 카테고리</option>
                        <option value="REGULAR">일반 반찬</option>
                        <option value="DAILY">데일리 메뉴</option>
                        <option value="SPECIAL">스페셜 메뉴</option>
                        <option value="LUNCH_BOX">도시락</option>
                    </select>
                    <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3 pointer-events-none" />
                </div>

                {/* 작업 구분 필터 */}
                <div className="relative">
                    <select
                        value={searchParams.get("work") || "ALL"}
                        onChange={(e) => updateFilters({ work: e.target.value })}
                        className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl appearance-none focus:ring-2 focus:ring-slate-900 transition-all outline-none text-sm font-medium text-slate-700"
                    >
                        <option value="ALL">전체 작업구분</option>
                        <option value="COOKING">조리</option>
                        <option value="PROCESSING">가공</option>
                        <option value="IMMEDIATE_SUB_PORTIONING">소분</option>
                    </select>
                    <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3 pointer-events-none" />
                </div>

                {/* 정렬 필터 */}
                <div className="relative">
                    <select
                        value={searchParams.get("sort") || "newest"}
                        onChange={(e) => updateFilters({ sort: e.target.value })}
                        className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl appearance-none focus:ring-2 focus:ring-slate-900 transition-all outline-none text-sm font-medium text-slate-700"
                    >
                        <option value="newest">최신순</option>
                        <option value="price_desc">비싼순</option>
                        <option value="price_asc">저렴한순</option>
                        <option value="name_asc">이름순</option>
                    </select>
                    <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3 pointer-events-none" />
                </div>
            </div>

            {hasActiveFilters && (
                <div className="flex items-center mt-4 pt-4 border-t border-slate-100">
                    <button
                        onClick={clearFilters}
                        className="flex items-center text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors"
                    >
                        <X className="w-3 h-3 mr-1" />
                        필터 초기화
                    </button>
                    <div className="ml-auto text-[10px] text-slate-400 font-medium">
                        Search Results for:
                        <span className="ml-1 text-slate-900 font-bold">
                            {[
                                searchParams.get("search"),
                                searchParams.get("type"),
                                searchParams.get("work"),
                                searchParams.get("sort")
                            ].filter(Boolean).join(", ") || "None"}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
