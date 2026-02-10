"use client";

import { Building2, Mail, Phone, FileText, CheckCircle2, X } from "lucide-react";

interface ClientData {
    id?: string;
    name: string;
    managerEmail: string | null;
    contact: string | null;
    category: string | null;
    isVatInclusive: boolean;
    note: string | null;
}

export default function ClientForm({
    initialData,
    action
}: {
    initialData?: ClientData,
    action: (formData: FormData) => Promise<void>
}) {
    return (
        <form action={action} className="space-y-8">
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-8 md:p-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* 기본 정보 */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center">
                                <Building2 className="w-4 h-4 mr-2" />
                                고객사명 (필수)
                            </label>
                            <input
                                name="name"
                                type="text"
                                defaultValue={initialData?.name}
                                className="w-full rounded-2xl border-2 border-slate-100 p-4 text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none bg-slate-50/50 font-bold"
                                placeholder="예: (주)필몽푸드"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center">
                                <FileText className="w-4 h-4 mr-2" />
                                고객사 분류
                            </label>
                            <select
                                name="category"
                                defaultValue={initialData?.category || "일반기업"}
                                className="w-full rounded-2xl border-2 border-slate-100 p-4 text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none bg-slate-50/50 font-medium"
                            >
                                <option value="일반기업">일반기업</option>
                                <option value="학교">학교</option>
                                <option value="병원">병원</option>
                                <option value="관공서">관공서</option>
                                <option value="기타">기타</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center">
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                부가세 설정
                            </label>
                            <div className="flex p-1 bg-slate-100 rounded-2xl">
                                <label className="flex-1 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="isVatInclusive"
                                        value="true"
                                        defaultChecked={initialData?.isVatInclusive !== false}
                                        className="sr-only peer"
                                    />
                                    <div className="text-center py-3 rounded-xl text-sm font-bold text-slate-500 peer-checked:bg-white peer-checked:text-blue-600 peer-checked:shadow-sm transition-all">
                                        부가세 포함
                                    </div>
                                </label>
                                <label className="flex-1 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="isVatInclusive"
                                        value="false"
                                        defaultChecked={initialData?.isVatInclusive === false}
                                        className="sr-only peer"
                                    />
                                    <div className="text-center py-3 rounded-xl text-sm font-bold text-slate-500 peer-checked:bg-white peer-checked:text-blue-600 peer-checked:shadow-sm transition-all">
                                        부가세 별도
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* 연락처 및 기타 */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center">
                                <Mail className="w-4 h-4 mr-2" />
                                담당자 이메일
                            </label>
                            <input
                                name="managerEmail"
                                type="email"
                                defaultValue={initialData?.managerEmail || ""}
                                className="w-full rounded-2xl border-2 border-slate-100 p-4 text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none bg-slate-50/50"
                                placeholder="example@email.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center">
                                <Phone className="w-4 h-4 mr-2" />
                                연락처
                            </label>
                            <input
                                name="contact"
                                type="text"
                                defaultValue={initialData?.contact || ""}
                                className="w-full rounded-2xl border-2 border-slate-100 p-4 text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none bg-slate-50/50"
                                placeholder="010-0000-0000"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center">
                                <FileText className="w-4 h-4 mr-2" />
                                특이사항 (비고)
                            </label>
                            <textarea
                                name="note"
                                defaultValue={initialData?.note || ""}
                                className="w-full h-24 rounded-2xl border-2 border-slate-100 p-4 text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none bg-slate-50/50 resize-none"
                                placeholder="배송 시 주의사항, 선호 메뉴 등..."
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="px-8 py-4 rounded-2xl font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all flex items-center"
                    >
                        <X className="w-5 h-5 mr-2" />
                        취소하고 돌아가기
                    </button>
                    <button
                        type="submit"
                        className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 active:scale-[0.98] transition-all shadow-xl shadow-slate-200 flex items-center"
                    >
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        {initialData ? "고객사 정보 수정 완료" : "고객사 신규 등록 완료"}
                    </button>
                </div>
            </div>
        </form>
    );
}
