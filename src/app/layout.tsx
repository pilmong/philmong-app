import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "필몽 업무 툴",
    description: "반찬가게 운영 통합 솔루션",
};

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { PollingProvider } from "@/context/PollingContext";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko">
            <body className={`${inter.className} bg-slate-50 text-slate-900`}>
                <PollingProvider>
                    <div className="min-h-screen flex flex-col">
                        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                                <Link href="/" className="text-xl font-black text-slate-900 tracking-tighter">FILMONG</Link>
                                <Navbar />
                            </div>
                        </header>
                        <main className="flex-1">
                            {children}
                        </main>
                    </div>
                </PollingProvider>
            </body>
        </html>
    );
}
