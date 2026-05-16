"use client";

import { FileText } from "lucide-react";

export default function WithoutAmcReportPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex flex-wrap items-center gap-2">
                    <FileText className="h-7 w-7 text-[#06124f] shrink-0" aria-hidden />
                    Without AMC Report
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    View non-AMC work records — service visits outside annual maintenance contracts.
                </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
                <p className="text-sm text-gray-600">Without AMC report listing will appear here.</p>
            </div>
        </div>
    );
}
