"use client";

export default function PrintButton() {
    return (
        <div className="fixed bottom-8 right-8 print:hidden">
            <button
                onClick={() => window.print()}
                className="bg-slate-900 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-2xl hover:scale-110 transition-transform active:rotate-12"
            >
                🖨️
            </button>
        </div>
    );
}
