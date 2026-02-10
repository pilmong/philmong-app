import { prisma } from "@/lib/prisma";
import { updateClient } from "../../actions";
import ClientForm from "../../components/ClientForm";
import { notFound } from "next/navigation";

export default async function EditClientPage({ params }: { params: { id: string } }) {
    const { id } = await params;
    const client = await prisma.client.findUnique({
        where: { id }
    });

    if (!client) notFound();

    const clientData = {
        ...client,
        id: client.id
    };

    const updateClientWithId = updateClient.bind(null, id);

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-10 text-center">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">고객사 정보 수정</h2>
                <p className="text-slate-500 mt-2">고객사의 최신 정보와 설정을 업데이트하세요.</p>
            </div>

            <ClientForm initialData={clientData} action={updateClientWithId} />
        </div>
    );
}
