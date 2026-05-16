"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Download, Eye, Loader2, Package, Pencil, Trash2, Upload, X } from "lucide-react";

type AssetStatus = "Active" | "Inactive" | "Maintenance";

type Asset = {
    id: number;
    name: string;
    description: string;
    tagCode: string;
    category: string;
    companyId: number | null;
    companyName: string;
    status: AssetStatus;
};

type CompanyOption = {
    id: number;
    name: string;
};

type AssetModalMode = "add" | "edit" | "view" | "importCsv" | null;

type CsvImportError = { row: number; message: string };

type CsvImportResult = {
    created: number;
    errors: CsvImportError[];
    message: string;
};

function escapeCsvCell(value: string): string {
    if (/[",\n\r]/.test(value)) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

function downloadAssetCsvTemplate() {
    const headers = ["tag_code", "category", "asset_name", "asset_description", "company_name", "status"];
    const sample = ["SN-1001", "Reader", "Example UHF reader", `Line 1 of notes, line 2`, "Acme Logistics", "Active"];
    const BOM = "\uFEFF";
    const body = `${headers.map(escapeCsvCell).join(",")}\n${sample.map(escapeCsvCell).join(",")}\n`;
    const blob = new Blob([`${BOM}${body}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "assets-import-template.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

type AssetApiRow = {
    id: number | string | null | undefined;
    company_id?: number | string | null;
    asset_name?: string | null;
    asset_description?: string | null;
    tag_code?: string | null;
    category?: string | null;
    company_name?: string | null;
    status?: string | null;
};

function normalizeAssetStatus(raw: string | undefined | null): AssetStatus {
    const s = (raw ?? "").trim();
    if (s === "Inactive") return "Inactive";
    if (s === "Maintenance") return "Maintenance";
    return "Active";
}

function mapApiRowToAsset(row: AssetApiRow): Asset {
    const id = typeof row.id === "number" ? row.id : Number(row.id);
    let companyId: number | null = null;
    const raw = row.company_id;
    if (raw !== null && raw !== undefined && raw !== "") {
        const n = typeof raw === "number" ? raw : Number(raw);
        if (Number.isFinite(n)) companyId = n;
    }

    return {
        id: Number.isFinite(id) ? id : 0,
        name: typeof row.asset_name === "string" ? row.asset_name : "",
        description: typeof row.asset_description === "string" ? row.asset_description : "",
        tagCode: typeof row.tag_code === "string" ? row.tag_code : "",
        category: typeof row.category === "string" ? row.category : "",
        companyId,
        companyName: typeof row.company_name === "string" ? row.company_name : "",
        status: normalizeAssetStatus(row.status ?? undefined),
    };
}

function AssetStatusViewBadge({ status }: { status: AssetStatus }) {
    const tones: Record<
        AssetStatus,
        { badge: string; showCheck: boolean }
    > = {
        Active: { badge: "bg-green-50 text-green-800 ring-1 ring-green-600/15", showCheck: true },
        Inactive: { badge: "bg-gray-100 text-gray-700 ring-1 ring-gray-200", showCheck: false },
        Maintenance: { badge: "bg-amber-50 text-amber-800 ring-1 ring-amber-600/15", showCheck: false },
    };
    const t = tones[status];

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${t.badge}`}>
            {t.showCheck ? <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden /> : null}
            {status}
        </span>
    );
}

type CompanyApiRow = {
    id: number | string | null;
    company_name?: string | null;
};

export default function AddAssetPage() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [companyOptions, setCompanyOptions] = useState<CompanyOption[]>([]);
    const [modalMode, setModalMode] = useState<AssetModalMode>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [viewDetail, setViewDetail] = useState<Asset | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [formValues, setFormValues] = useState({
        assetName: "",
        assetDescription: "",
        tagCode: "",
        category: "",
        companyId: "",
        status: "Active" as AssetStatus,
    });
    const [csvImportBusy, setCsvImportBusy] = useState(false);
    const [csvImportLastResult, setCsvImportLastResult] = useState<CsvImportResult | null>(null);
    const csvFileInputRef = useRef<HTMLInputElement>(null);

    const assetStats = useMemo(() => {
        const total = assets.length;
        const active = assets.filter((a) => a.status === "Active").length;
        const inactive = assets.filter((a) => a.status === "Inactive").length;
        const maintenance = assets.filter((a) => a.status === "Maintenance").length;
        return [
            { label: "Total Assets", value: String(total), tone: "text-[#0a2a5e]" },
            { label: "Active", value: String(active), tone: "text-[#06b6d4]" },
            { label: "Maintenance", value: String(maintenance), tone: "text-amber-600" },
            { label: "Inactive", value: String(inactive), tone: "text-gray-700" },
        ];
    }, [assets]);

    useEffect(() => {
        const load = async () => {
            try {
                setLoadError("");
                const [assetRes, companyRes] = await Promise.all([
                    fetch("/api/admin/amc/assets", { cache: "no-store" }),
                    fetch("/api/admin/amc/companies", { cache: "no-store" }),
                ]);

                const assetData = await assetRes.json().catch(() => ({}));
                if (!assetRes.ok) {
                    throw new Error(
                        typeof assetData?.message === "string" ? assetData.message : "Failed to load assets",
                    );
                }
                const assetRows = Array.isArray(assetData) ? (assetData as AssetApiRow[]) : [];
                setAssets(assetRows.map(mapApiRowToAsset));

                let options: CompanyOption[] = [];
                if (companyRes.ok) {
                    const companyData = await companyRes.json().catch(() => []);
                    const companyRows = Array.isArray(companyData) ? (companyData as CompanyApiRow[]) : [];
                    options = companyRows.map((row) => {
                        const cid = typeof row.id === "number" ? row.id : Number(row.id);
                        return {
                            id: Number.isFinite(cid) ? cid : 0,
                            name: typeof row.company_name === "string" ? row.company_name : "",
                        };
                    }).filter((o) => o.id > 0 && o.name);
                }
                setCompanyOptions(options.sort((a, b) => a.name.localeCompare(b.name)));
            } catch (err) {
                console.error("Error loading assets:", err);
                const message = err instanceof Error ? err.message : "Failed to load assets";
                setLoadError(message);
                setAssets([]);
                setCompanyOptions([]);
            } finally {
                setIsLoading(false);
            }
        };

        void load();
    }, []);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = e.target;
        setFormValues((prev) => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormValues({
            assetName: "",
            assetDescription: "",
            tagCode: "",
            category: "",
            companyId: "",
            status: "Active",
        });
        setEditingId(null);
    };

    const closeModal = () => {
        setModalMode(null);
        setViewDetail(null);
        resetForm();
        setCsvImportLastResult(null);
    };

    const openCsvImportModal = () => {
        setCsvImportLastResult(null);
        setModalMode("importCsv");
    };

    const refreshAssetsFromApi = async () => {
        const assetRes = await fetch("/api/admin/amc/assets", { cache: "no-store" });
        const assetData = await assetRes.json().catch(() => ({}));
        if (!assetRes.ok) {
            throw new Error(
                typeof (assetData as { message?: string })?.message === "string"
                    ? (assetData as { message: string }).message
                    : "Failed to refresh asset list",
            );
        }
        const assetRows = Array.isArray(assetData) ? (assetData as AssetApiRow[]) : [];
        setAssets(assetRows.map(mapApiRowToAsset));
    };

    const handleCsvFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;

        let text: string;
        try {
            text = await file.text();
        } catch {
            alert("Unable to read the selected file. Please try another CSV.");
            return;
        }

        setCsvImportBusy(true);
        setCsvImportLastResult(null);

        try {
            const res = await fetch("/api/admin/amc/assets/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ csv: text }),
            });
            const dataUnknown: unknown = await res.json().catch(() => ({}));
            const dataRecord = dataUnknown && typeof dataUnknown === "object" ? (dataUnknown as Record<string, unknown>) : {};

            const created = typeof dataRecord.created === "number" ? dataRecord.created : 0;
            const rawErrs = Array.isArray(dataRecord.errors) ? dataRecord.errors : [];
            const errs: CsvImportError[] = rawErrs
                .map((item): CsvImportError | null => {
                    if (!item || typeof item !== "object") return null;
                    const obj = item as Record<string, unknown>;
                    const row = typeof obj.row === "number" ? obj.row : 0;
                    const msg = typeof obj.message === "string" ? obj.message : "Unknown error";
                    return { row, message: msg };
                })
                .filter((x): x is CsvImportError => x !== null);

            const serverMsg = typeof dataRecord.message === "string" ? dataRecord.message.trim() : "";
            const message =
                serverMsg ||
                (errs.length > 0 ? `Imported ${created} rows; ${errs.length} row(s) skipped.` : `${created} row(s) imported.`);

            setCsvImportLastResult({ created, errors: errs, message });

            if (created > 0) {
                try {
                    await refreshAssetsFromApi();
                } catch (refreshErr) {
                    console.error(refreshErr);
                }
                setLoadError("");
            }
        } catch (err) {
            console.error("CSV import request failed:", err);
            alert("Network error while importing. Please try again.");
        } finally {
            setCsvImportBusy(false);
        }
    };

    const openAddModal = () => {
        resetForm();
        setModalMode("add");
    };

    const openViewAsset = (a: Asset) => {
        setViewDetail(a);
        setModalMode("view");
    };

    const openEditAsset = (a: Asset) => {
        setFormValues({
            assetName: a.name,
            assetDescription: a.description,
            tagCode: a.tagCode,
            category: a.category,
            companyId: a.companyId !== null ? String(a.companyId) : "",
            status: a.status,
        });
        setEditingId(a.id);
        setModalMode("edit");
    };

    const handleDeleteAsset = async (a: Asset) => {
        const ok = window.confirm(`Delete asset “${a.name}”? This cannot be undone.`);
        if (!ok) return;

        try {
            setIsSubmitting(true);
            const res = await fetch(`/api/admin/amc/assets/${a.id}`, { method: "DELETE" });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Delete failed");
            }
            setAssets((prev) => prev.filter((x) => x.id !== a.id));
            if (viewDetail?.id === a.id) closeModal();
        } catch (err) {
            console.error("Error deleting asset:", err);
            alert("Unable to delete this asset. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveAsset = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const name = formValues.assetName.trim();
        if (!name) return;

        const body: Record<string, unknown> = {
            asset_name: name,
            asset_description: formValues.assetDescription.trim() || undefined,
            tag_code: formValues.tagCode.trim() || undefined,
            category: formValues.category.trim() || undefined,
            status: formValues.status,
            company_id: formValues.companyId.trim() ? Number(formValues.companyId.trim()) : null,
        };

        setIsSubmitting(true);
        try {
            const isEdit = editingId !== null;
            const res = await fetch(isEdit ? `/api/admin/amc/assets/${editingId}` : "/api/admin/amc/assets", {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Save failed");
            }
            const saved = mapApiRowToAsset(data as AssetApiRow);
            if (isEdit) {
                setAssets((prev) => prev.map((x) => (x.id === saved.id ? saved : x)));
            } else {
                setAssets((prev) => [saved, ...prev]);
            }
            closeModal();
        } catch (err) {
            console.error("Error saving asset:", err);
            alert(err instanceof Error ? err.message : "Unable to save asset. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusStyles = (status: AssetStatus) => {
        if (status === "Active") return "bg-green-50 text-green-700";
        if (status === "Maintenance") return "bg-amber-50 text-amber-700";
        return "bg-gray-100 text-gray-700";
    };

    const tableColSpan = 7;

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex flex-wrap items-center gap-2">
                        <Package className="h-7 w-7 text-[#0a2a5e] shrink-0" aria-hidden />
                        Assets
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Track hardware and linked companies for AMC and verification.
                    </p>
                    {loadError && <p className="text-xs text-amber-600 mt-2">{loadError}</p>}
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                    <input
                        ref={csvFileInputRef}
                        type="file"
                        accept=".csv,text/csv"
                        className="sr-only"
                        aria-label="Select CSV file with assets"
                        onChange={handleCsvFileSelected}
                    />
                    <button
                        type="button"
                        onClick={openCsvImportModal}
                        disabled={isLoading || csvImportBusy}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#0a2a5e] border border-gray-200 bg-white hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-60"
                    >
                        <Upload className="w-4 h-4 shrink-0" aria-hidden />
                        Import CSV
                    </button>
                    <button
                        type="button"
                        onClick={openAddModal}
                        disabled={isLoading}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#06124f] to-[#0a2a5e] hover:opacity-90 transition-opacity shadow-sm disabled:opacity-60"
                    >
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Asset
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {assetStats.map((item) => (
                    <div key={item.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{item.label}</p>
                        <p className={`text-3xl font-black mt-2 ${item.tone}`}>{item.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h2 className="text-base font-bold text-gray-900">Asset Registry</h2>
                    <div className="text-xs text-gray-500">Showing {assets.length} assets</div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Tag / Serial
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Category
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Asset name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Description
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Company
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading && (
                                <tr>
                                    <td className="px-6 py-8 text-sm text-gray-500" colSpan={tableColSpan}>
                                        Loading assets...
                                    </td>
                                </tr>
                            )}
                            {!isLoading && assets.length === 0 && (
                                <tr>
                                    <td className="px-6 py-8 text-sm text-gray-500" colSpan={tableColSpan}>
                                        {loadError || "No assets yet. Add an asset to get started."}
                                    </td>
                                </tr>
                            )}
                            {!isLoading &&
                                assets.map((a) => (
                                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                                            {a.tagCode.trim() ? a.tagCode : <span className="text-gray-400">—</span>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {a.category.trim() ? a.category : <span className="text-gray-400">—</span>}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{a.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700 max-w-[220px]">
                                            {a.description.trim() ? (
                                                <span className="line-clamp-2 break-words" title={a.description.trim()}>
                                                    {a.description.trim()}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 max-w-[180px] sm:max-w-xs">
                                            {a.companyName.trim() ? (
                                                <span className="break-words">{a.companyName}</span>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusStyles(a.status)}`}
                                            >
                                                {a.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => openViewAsset(a)}
                                                    disabled={isSubmitting}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                    title="View asset"
                                                    aria-label="View asset"
                                                >
                                                    <Eye className="h-4 w-4" aria-hidden />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openEditAsset(a)}
                                                    disabled={isSubmitting}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-[#0a2a5e] shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                    title="Edit asset"
                                                    aria-label="Edit asset"
                                                >
                                                    <Pencil className="h-4 w-4" aria-hidden />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => void handleDeleteAsset(a)}
                                                    disabled={isSubmitting}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-700 shadow-sm transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                    title="Delete asset"
                                                    aria-label="Delete asset"
                                                >
                                                    <Trash2 className="h-4 w-4" aria-hidden />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {modalMode === "view" && viewDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" aria-hidden onClick={closeModal} />
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="asset-view-title"
                        className="relative flex max-h-[min(90vh,680px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
                    >
                        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-100 px-6 py-5">
                            <h3 id="asset-view-title" className="text-lg font-bold tracking-tight text-[#001540]">
                                Asset details
                            </h3>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" strokeWidth={2} />
                            </button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Tag / Serial</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900 break-words">
                                        {viewDetail.tagCode.trim() || "—"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Category</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900 break-words">
                                        {viewDetail.category.trim() || "—"}
                                    </p>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-xs font-medium text-gray-500">Asset name</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900 break-words">{viewDetail.name}</p>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-xs font-medium text-gray-500">Asset description</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900 whitespace-pre-wrap break-words">
                                        {viewDetail.description.trim() || "—"}
                                    </p>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-xs font-medium text-gray-500">Company</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900 break-words">
                                        {viewDetail.companyName.trim() || "—"}
                                    </p>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-xs font-medium text-gray-500">Status</p>
                                    <div className="mt-1">
                                        <AssetStatusViewBadge status={viewDetail.status} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex shrink-0 justify-end border-t border-gray-100 px-6 py-4">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="rounded-lg bg-[#001540] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modalMode === "importCsv" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
                    <div
                        className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
                        aria-hidden
                        onClick={() => {
                            if (!csvImportBusy) closeModal();
                        }}
                    />
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="import-csv-title"
                        className="relative flex max-h-[min(90vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
                    >
                        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-100 px-6 py-5">
                            <h3 id="import-csv-title" className="text-lg font-bold tracking-tight text-[#001540]">
                                Import assets (CSV)
                            </h3>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!csvImportBusy) closeModal();
                                }}
                                className="shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" strokeWidth={2} />
                            </button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 space-y-4 text-sm text-gray-700">
                            <p>
                                Upload a comma-separated CSV with a header row. The column{" "}
                                <span className="font-semibold text-gray-900">asset_name</span>{" "}
                                (or <span className="font-semibold text-gray-900">name</span>) is{" "}
                                <span className="font-semibold text-gray-900">required</span>. Optional columns match the
                                form:{" "}
                                <span className="font-mono text-xs text-[#0a2a5e]">
                                    tag_code, category, asset_description, company_name / company_id, status
                                </span>
                                . Use <span className="font-mono text-xs text-[#0a2a5e]">Active</span>,{" "}
                                <span className="font-mono text-xs text-[#0a2a5e]">Inactive</span>, or{" "}
                                <span className="font-mono text-xs text-[#0a2a5e]">Maintenance</span> for status. Up to{" "}
                                <span className="font-semibold">2000</span> data rows per file.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={downloadAssetCsvTemplate}
                                    disabled={csvImportBusy}
                                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
                                >
                                    <Download className="h-4 w-4 shrink-0" aria-hidden />
                                    Download template
                                </button>
                                <button
                                    type="button"
                                    onClick={() => csvFileInputRef.current?.click()}
                                    disabled={csvImportBusy}
                                    className="inline-flex items-center gap-2 rounded-xl bg-[#001540] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                                >
                                    {csvImportBusy ? (
                                        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                                    ) : (
                                        <Upload className="h-4 w-4 shrink-0" aria-hidden />
                                    )}
                                    Choose CSV…
                                </button>
                            </div>
                            {csvImportLastResult && (
                                <div
                                    className={`rounded-xl border px-4 py-3 text-sm ${
                                        csvImportLastResult.created > 0
                                            ? "border-green-200 bg-green-50 text-green-900"
                                            : "border-amber-200 bg-amber-50 text-amber-950"
                                    }`}
                                >
                                    <p className="font-semibold">{csvImportLastResult.message}</p>
                                    {csvImportLastResult.created > 0 ? (
                                        <p className="mt-1 text-green-900/90">Created {csvImportLastResult.created} asset(s).</p>
                                    ) : null}
                                    {csvImportLastResult.errors.length > 0 ? (
                                        <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs border-t border-current/10 pt-2">
                                            {csvImportLastResult.errors.map((err, idx) => (
                                                <li key={`${err.row}-${idx}`}>
                                                    {err.row > 0 ? `Row ${err.row}: ` : null}
                                                    {err.message}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : null}
                                </div>
                            )}
                        </div>
                        <div className="flex shrink-0 justify-end border-t border-gray-100 px-6 py-4">
                            <button
                                type="button"
                                onClick={() => {
                                    if (!csvImportBusy) closeModal();
                                }}
                                className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {(modalMode === "add" || modalMode === "edit") && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
                        aria-hidden
                        onClick={() => {
                            if (!isSubmitting) closeModal();
                        }}
                    />
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="add-asset-title"
                        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[min(90vh,720px)] flex flex-col"
                    >
                        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#06124f] to-[#0a2a5e] flex items-start justify-between gap-4 shrink-0">
                            <div className="min-w-0">
                                <h3 id="add-asset-title" className="text-lg font-bold text-white">
                                    {modalMode === "edit" ? "Edit asset" : "Add Asset"}
                                </h3>
                                <p className="text-xs text-cyan-100/90 mt-0.5">
                                    {modalMode === "edit"
                                        ? "Update asset details and save changes."
                                        : "Register hardware and optionally link it to a company."}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!isSubmitting) closeModal();
                                }}
                                className="shrink-0 text-white/70 hover:text-white rounded-lg p-1.5 hover:bg-white/10 transition-colors"
                                aria-label="Close"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSaveAsset} className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="ast-tag" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        Tag / Serial
                                    </label>
                                    <input
                                        id="ast-tag"
                                        name="tagCode"
                                        value={formValues.tagCode}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e]"
                                        placeholder="RFID / S/N"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="ast-cat" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        Category
                                    </label>
                                    <input
                                        id="ast-cat"
                                        name="category"
                                        value={formValues.category}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e]"
                                        placeholder="e.g. Reader, Tag"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="ast-name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Asset name
                                </label>
                                <input
                                    id="ast-name"
                                    name="assetName"
                                    value={formValues.assetName}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e]"
                                    placeholder="e.g. UHF Reader PR-902"
                                />
                            </div>

                            <div>
                                <label htmlFor="ast-description" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Asset description{" "}
                                    <span className="font-normal text-gray-400">(optional)</span>
                                </label>
                                <textarea
                                    id="ast-description"
                                    name="assetDescription"
                                    rows={3}
                                    value={formValues.assetDescription}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e] resize-none"
                                    placeholder="Specs, location, commissioning notes…"
                                />
                            </div>

                            <div>
                                <label htmlFor="ast-company" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Company{" "}
                                    <span className="font-normal text-gray-400">(optional)</span>
                                </label>
                                <select
                                    id="ast-company"
                                    name="companyId"
                                    value={formValues.companyId}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e] bg-white"
                                >
                                    <option value="">— None —</option>
                                    {companyOptions.map((c) => (
                                        <option key={c.id} value={String(c.id)}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="ast-status" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Status
                                </label>
                                <select
                                    id="ast-status"
                                    name="status"
                                    value={formValues.status}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e] bg-white"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100 -mx-6 px-6 -mb-2 pb-0 mt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!isSubmitting) closeModal();
                                    }}
                                    disabled={isSubmitting}
                                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#06124f] to-[#0a2a5e] hover:opacity-90 transition-opacity shadow-sm disabled:opacity-60"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
                                            Saving...
                                        </>
                                    ) : modalMode === "edit" ? (
                                        "Save changes"
                                    ) : (
                                        "Create asset"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
