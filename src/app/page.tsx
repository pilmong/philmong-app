import Link from "next/link";
import { ArrowRight, Package, ShoppingBag, LayoutDashboard, UtensilsCrossed } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-5xl">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight sm:text-5xl mb-4">
            필몽 <span className="text-blue-600">Admin</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            매일의 주문과 상품을 쉽고 간편하게 관리하세요.
          </p>
        </header>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2">

          {/* Order Management Card */}
          <Link href="/admin/orders" className="group relative overflow-hidden rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-900/10 dark:bg-slate-900 dark:shadow-none dark:ring-slate-800">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <ShoppingBag className="h-48 w-48 text-blue-600" />
            </div>
            <div className="relative z-10">
              <div className="mb-6 inline-flex items-center justify-center rounded-2xl bg-blue-50 p-4 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <h2 className="mb-3 text-2xl font-bold text-slate-900 dark:text-white">주문 관리</h2>
              <p className="mb-8 text-slate-500 dark:text-slate-400 leading-relaxed">
                네이버 예약 및 전화 주문을 확인하고<br />상태를 변경합니다.
              </p>
              <div className="flex items-center text-base font-semibold text-blue-600 dark:text-blue-400">
                바로가기 <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-2" />
              </div>
            </div>
          </Link>

          {/* Product Management Card */}
          <Link href="/admin/products" className="group relative overflow-hidden rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-900/10 dark:bg-slate-900 dark:shadow-none dark:ring-slate-800">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <UtensilsCrossed className="h-48 w-48 text-emerald-600" />
            </div>
            <div className="relative z-10">
              <div className="mb-6 inline-flex items-center justify-center rounded-2xl bg-emerald-50 p-4 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <Package className="h-8 w-8" />
              </div>
              <h2 className="mb-3 text-2xl font-bold text-slate-900 dark:text-white">상품 관리</h2>
              <p className="mb-8 text-slate-500 dark:text-slate-400 leading-relaxed">
                메뉴 목록을 수정하고<br />품절 상태를 관리합니다.
              </p>
              <div className="flex items-center text-base font-semibold text-emerald-600 dark:text-emerald-400">
                바로가기 <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-2" />
              </div>
            </div>
          </Link>

        </div>

        <footer className="mt-16 text-center text-sm text-slate-400 dark:text-slate-600">
          © 2026 Philmong. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
