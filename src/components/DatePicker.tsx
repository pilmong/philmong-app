"use client";

import { useRouter } from "next/navigation";

export default function DatePicker({ defaultValue }: { defaultValue: string }) {
    const router = useRouter();

    return (
        <input
            type="date"
            defaultValue={defaultValue}
            className="border-none focus:ring-0 text-slate-700 font-bold px-4 py-2"
            onChange={(e) => {
                router.push(`/planning?date=${e.target.value}`);
            }}
        />
    );
}
