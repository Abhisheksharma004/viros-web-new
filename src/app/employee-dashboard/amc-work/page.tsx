"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { Check, Loader2, ScanLine, Search, Settings } from "lucide-react";

const AssetBarcodeScanner = dynamic(() => import("@/components/employee-dashboard/AssetBarcodeScanner"), {
    ssr: false,
});

type AssetStatus = "Active" | "Inactive" | "Maintenance";

type AmcAsset = {
    id: number;
    tagCode: string;
    category: string;
    name: string;
    description: string;
    companyName: string;
    status: AssetStatus;
};

type AssetApiRow = {
    id?: number | string | null;
    tag_code?: string | null;
    category?: string | null;
    asset_name?: string | null;
    asset_description?: string | null;
    company_name?: string | null;
    status?: string | null;
};

function normalizeStatus(raw: string | undefined | null): AssetStatus {
    const s = (raw ?? "").trim();
    if (s === "Inactive") return "Inactive";
    if (s === "Maintenance") return "Maintenance";
    return "Active";
}

function mapApiRow(row: AssetApiRow): AmcAsset {
    const id = typeof row.id === "number" ? row.id : Number(row.id);
    return {
        id: Number.isFinite(id) ? id : 0,
        tagCode: typeof row.tag_code === "string" ? row.tag_code : "",
        category: typeof row.category === "string" ? row.category : "",
        name: typeof row.asset_name === "string" ? row.asset_name : "",
        description: typeof row.asset_description === "string" ? row.asset_description : "",
        companyName: typeof row.company_name === "string" ? row.company_name : "",
        status: normalizeStatus(row.status),
    };
}

function StatusBadge({ status }: { status: AssetStatus }) {
    const styles: Record<AssetStatus, string> = {
        Active: "bg-green-50 text-green-800 ring-1 ring-green-600/15",
        Inactive: "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
        Maintenance: "bg-amber-50 text-amber-800 ring-1 ring-amber-600/15",
    };
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
            {status === "Active" ? <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden /> : null}
            {status}
        </span>
    );
}

function DetailField({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs font-medium text-gray-500">{label}</p>
            <p className="mt-1 text-sm font-semibold text-gray-900 break-words">{value.trim() ? value : "—"}</p>
        </div>
    );
}

export default function AmcWorkPage() {
    const [scannerOpen, setScannerOpen] = useState(false);
    const [manualCode, setManualCode] = useState("");
    const [lookupBusy, setLookupBusy] = useState(false);
    const [lookupError, setLookupError] = useState("");
    const [scannedCode, setScannedCode] = useState("");
    const [asset, setAsset] = useState<AmcAsset | null>(null);

    const lookupAsset = useCallback(async (code: string) => {
        const trimmed = code.trim();
        if (!trimmed) return;

        setLookupBusy(true);
        setLookupError("");
        setScannedCode(trimmed);
        setAsset(null);

        try {
            const res = await fetch(
                `/api/employee/amc/assets/lookup?${new URLSearchParams({ code: trimmed })}`,
                { cache: "no-store" },
            );
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(
                    typeof (data as { message?: string }).message === "string"
                        ? (data as { message: string }).message
                        : "Asset not found",
                );
            }

            setAsset(mapApiRow(data as AssetApiRow));
        } catch (err) {
            setLookupError(err instanceof Error ? err.message : "Failed to look up asset");
        } finally {
            setLookupBusy(false);
        }
    }, []);

    const handleScan = useCallback(
        (code: string) => {
            setScannerOpen(false);
            void lookupAsset(code);
        },
        [lookupAsset],
    );

    const handleManualLookup = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        void lookupAsset(manualCode);
    };

    const handleScanAgain = () => {
        setAsset(null);
        setLookupError("");
        setScannedCode("");
        setManualCode("");
        setScannerOpen(true);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex flex-wrap items-center gap-2">
                    <Settings className="h-7 w-7 text-[#0d4f3c] shrink-0" aria-hidden />
                    AMC Work
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Scan an asset barcode or enter a tag / serial to load details from the AMC registry.
                </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setScannerOpen(true)}
                        disabled={lookupBusy}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0d4f3c] to-[#0a7c5c] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity disabled:opacity-60"
                    >
                        <ScanLine className="h-5 w-5 shrink-0" aria-hidden />
                        Scan barcode
                    </button>

                    <form onSubmit={handleManualLookup} className="flex flex-1 flex-col sm:flex-row gap-2 min-w-0">
                        <label htmlFor="manual-tag" className="sr-only">
                            Tag or serial number
                        </label>
                        <input
                            id="manual-tag"
                            type="text"
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            placeholder="Or enter tag / serial manually"
                            className="flex-1 min-w-0 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0d4f3c]/20 focus:border-[#0d4f3c]"
                        />
                        <button
                            type="submit"
                            disabled={lookupBusy || !manualCode.trim()}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-60"
                        >
                            <Search className="h-4 w-4 shrink-0" aria-hidden />
                            Look up
                        </button>
                    </form>
                </div>

                {lookupBusy ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600 py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-[#0d4f3c]" aria-hidden />
                        Looking up asset…
                    </div>
                ) : null}

                {lookupError ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {scannedCode ? (
                            <p className="font-medium">
                                No match for <span className="font-mono">{scannedCode}</span>
                            </p>
                        ) : null}
                        <p className={scannedCode ? "mt-1 text-red-700/90" : ""}>{lookupError}</p>
                    </div>
                ) : null}

                {asset ? (
                    <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-5 space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-[#0d4f3c]">
                                    Asset found
                                </p>
                                <h2 className="text-lg font-bold text-gray-900 mt-0.5">{asset.name}</h2>
                                {scannedCode ? (
                                    <p className="text-xs text-gray-500 mt-1 font-mono">Scanned: {scannedCode}</p>
                                ) : null}
                            </div>
                            <StatusBadge status={asset.status} />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <DetailField label="Tag / Serial" value={asset.tagCode} />
                            <DetailField label="Category" value={asset.category} />
                            <DetailField label="Company" value={asset.companyName} />
                            <DetailField label="Asset ID" value={String(asset.id)} />
                            <div className="sm:col-span-2">
                                <DetailField label="Description" value={asset.description} />
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleScanAgain}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50"
                        >
                            <ScanLine className="h-4 w-4 shrink-0" aria-hidden />
                            Scan another asset
                        </button>
                    </div>
                ) : !lookupBusy && !lookupError ? (
                    <p className="text-sm text-gray-500 text-center py-6">
                        Scan a barcode on the asset label or enter the tag code stored in the registry.
                    </p>
                ) : null}
            </div>

            {scannerOpen ? (
                <AssetBarcodeScanner
                    onScan={handleScan}
                    onClose={() => setScannerOpen(false)}
                    disabled={lookupBusy}
                />
            ) : null}
        </div>
    );
}
