"use client";

export function Pagination(props: {
    page: number;
    totalPages: number;
    onChangePage: (p: number) => void;
}) {
    const page = props.page;
    const totalPages = props.totalPages || 1; // ✅ phòng khi backend trả 0/null

    return (
        <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
                Page {page} / {totalPages}
            </div>

            <div className="flex gap-2">
                <button
                    type="button" // ✅ quan trọng
                    className="px-3 py-2 border rounded-lg disabled:opacity-50"
                    disabled={page <= 1}
                    onClick={() => props.onChangePage(page - 1)}
                >
                    Prev
                </button>

                <button
                    type="button" // ✅ quan trọng
                    className="px-3 py-2 border rounded-lg disabled:opacity-50"
                    disabled={page >= totalPages}
                    onClick={() => props.onChangePage(page + 1)}
                >
                    Next
                </button>
            </div>
        </div>
    );
}
