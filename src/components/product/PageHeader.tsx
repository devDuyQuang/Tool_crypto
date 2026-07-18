"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type PageHeaderProps = {
    title: string;
    description?: string;
    eyebrow?: string;
    actions?: ReactNode;
    backHref?: string;
};

export function PageHeader({ title, description, eyebrow, actions, backHref }: PageHeaderProps) {
    return (
        <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 dark:border-gray-800 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
                {backHref ? (
                    <Link href={backHref} className="mb-3 inline-flex text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                        Quay lại
                    </Link>
                ) : null}
                {eyebrow ? <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{eyebrow}</div> : null}
                <h1 className="mt-1 text-2xl font-semibold text-gray-950 dark:text-white">{title}</h1>
                {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-300">{description}</p> : null}
            </div>
            {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
    );
}
