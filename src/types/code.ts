// src/types/code.ts
import type { Paginated, PageMeta } from "./common";

export interface Code {
    id?: string;
    _id?: string;

    name: string;

    createdAt?: string;
    updatedAt?: string;
}

export type CodePaginated = Paginated<Code>;
export type { Paginated, PageMeta }; // nếu nơi khác cần import từ "@/types/code"
