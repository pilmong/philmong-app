"use client";

import { deleteProduct } from "../actions";

export default function DeleteProductButton({ id }: { id: string }) {
    async function handleDelete() {
        if (confirm("정말로 이 상품을 삭제하시겠습니까? (삭제된 데이터는 복구할 수 없습니다.)")) {
            await deleteProduct(id);
        }
    }

    return (
        <button
            onClick={handleDelete}
            className="text-red-600 hover:text-red-900 ml-3"
        >
            삭제
        </button>
    );
}
