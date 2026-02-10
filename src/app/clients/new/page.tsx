"use client";

import { createClient } from "../actions";
import ClientForm from "../components/ClientForm";

export default function NewClientPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-10 text-center">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">새 고객사 등록</h2>
                <p className="text-slate-500 mt-2">고객사(B2B) 정보를 정확하게 입력하여 효율적으로 관리하세요.</p>
            </div>

            <ClientForm action={createClient} />
        </div>
    );
}
