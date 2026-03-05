"use client";

export function TableToolbar(props: {
    search: string;
    onChangeSearch: (v: string) => void;
    onSubmitSearch: () => void;
    limit: number;
    onChangeLimit: (v: number) => void;
}) {
    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
                <input
                    className="border rounded-lg p-2 w-[260px]"
                    placeholder="Search..."
                    value={props.search}
                    onChange={(e) => props.onChangeSearch(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault(); // ✅ chống submit form
                            props.onSubmitSearch();
                        }
                    }}
                />

                <button
                    type="button" // ✅ quan trọng
                    className="px-4 py-2 rounded-lg bg-brand-500 text-white"
                    onClick={props.onSubmitSearch}
                >
                    Search
                </button>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Limit</span>
                <select
                    className="border rounded-lg p-2"
                    value={props.limit}
                    onChange={(e) => props.onChangeLimit(Number(e.target.value))}
                >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                </select>
            </div>
        </div>
    );
}
