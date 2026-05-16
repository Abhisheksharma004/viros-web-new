"use client";

import { FileText } from "lucide-react";

export default function WithoutAmcWorkPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex flex-wrap items-center gap-2">
                    <FileText className="h-7 w-7 text-[#0d4f3c] shrink-0" aria-hidden />
                    Without AMC Work
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    View and manage service work outside annual maintenance contracts.
                </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                <p className="text-sm text-gray-600">Non-AMC work list and actions will appear here.</p>
            </div>
        </div>
    );
}
