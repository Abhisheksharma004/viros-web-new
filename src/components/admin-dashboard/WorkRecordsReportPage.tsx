"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
    BarChart3,
    ChevronDown,
    ChevronUp,
    Eye,
    FileSpreadsheet,
    FileText,
    Filter,
    Loader2,
    Search,
    X,
} from "lucide-react";
import {
    exportAmcReportToExcel,
    exportAmcReportToPdf,
    exportWithoutAmcReportToExcel,
    exportWithoutAmcReportToPdf,
    type AmcReportExportRow,
} from "@/lib/amcReportExport";

export type WorkRecordsReportVariant = "amc" | "without_amc";

type VariantConfig = {
    title: string;
    description: string;
    icon: LucideIcon;
    apiPath: string;
    filtersId: string;
    loadingLabel: string;
    emptyLabel: string;
    loadErrorDefault: string;
    viewRecordTitle: (id: number) => string;
    exportExcel: (rows: AmcReportExportRow[]) => Promise<void>;
    exportPdf: (rows: AmcReportExportRow[]) => Promise<void>;
};

const VARIANT_CONFIG: Record<WorkRecordsReportVariant, VariantConfig> = {
    amc: {
        title: "AMC Report",
        description: "Work records from AMC service visits — saved from employee AMC Work scans.",
        icon: BarChart3,
        apiPath: "/api/admin/amc/work-records",
        filtersId: "amc-report-filters",
        loadingLabel: "Loading AMC reports…",
        emptyLabel: "No AMC work records yet.",
        loadErrorDefault: "Failed to load AMC reports",
        viewRecordTitle: (id) => `AMC work record #${id}`,
        exportExcel: exportAmcReportToExcel,
        exportPdf: exportAmcReportToPdf,
    },
    without_amc: {
        title: "Without AMC Report",
        description:
            "Work records from non-AMC service visits — saved from employee Without AMC Work.",
        icon: FileText,
        apiPath: "/api/admin/without-amc/work-records",
        filtersId: "without-amc-report-filters",
        loadingLabel: "Loading Without AMC reports…",
        emptyLabel: "No Without AMC work records yet.",
        loadErrorDefault: "Failed to load Without AMC reports",
        viewRecordTitle: (id) => `Without AMC work record #${id}`,
        exportExcel: exportWithoutAmcReportToExcel,
        exportPdf: exportWithoutAmcReportToPdf,
    },
};

type WorkRecord = {
    id: number;
    assetId: number;
    employeeId: string;
    employeeName: string;
    scannedTagCode: string;
    companyName: string;
    assetName: string;
    assetDescription: string;
    tagCode: string;
    category: string;
    status: string;
    userKnownIssue: string;
    userIssueReportingDate: string;
    engineerRemarks: string;
    engineerRemarksDateTime: string;
    savedAt: string;
    remarksSavedDate: string;
    companyId: number | null;
    workType: string;
    updatedAt: string;
};

type ReportFilters = {
    search: string;
    company: string;
    engineer: string;
    category: string;
    issueDateFrom: string;
    issueDateTo: string;
    remarksDateFrom: string;
    remarksDateTo: string;
};

const emptyFilters = (): ReportFilters => ({
    search: "",
    company: "",
    engineer: "",
    category: "",
    issueDateFrom: "",
    issueDateTo: "",
    remarksDateFrom: "",
    remarksDateTo: "",
});

type WorkRecordApiRow = {
    id?: number | string | null;
    asset_id?: number | string | null;
    employee_id?: string | null;
    employee_name?: string | null;
    scanned_tag_code?: string | null;
    company_name?: string | null;
    asset_name?: string | null;
    asset_description?: string | null;
    tag_code?: string | null;
    category?: string | null;
    status?: string | null;
    user_known_issue?: string | null;
    user_issue_reporting_date?: string | null;
    engineer_remarks?: string | null;
    engineer_remarks_date_time?: string | null;
    company_id?: number | string | null;
    work_type?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
};

const TABLE_COL_SPAN = 10;

function str(value: unknown): string {
    return typeof value === "string" ? value.trim() : value === null || value === undefined ? "" : String(value).trim();
}

function toDateOnly(raw: unknown): string {
    const s = str(raw);
    if (!s) return "";
    const match = s.match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : s;
}

function formatDateTime(raw: unknown): string {
    if (raw === null || raw === undefined || raw === "") return "";
    const d = raw instanceof Date ? raw : new Date(String(raw));
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function datePartFromRaw(raw: unknown): string {
    if (raw === null || raw === undefined || raw === "") return "";
    const d = raw instanceof Date ? raw : new Date(String(raw));
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
}

function engineerKey(r: Pick<WorkRecord, "employeeId" | "employeeName">): string {
    return r.employeeId || r.employeeName;
}

function engineerLabel(key: string, records: WorkRecord[]): string {
    const match = records.find((r) => engineerKey(r) === key);
    if (!match) return key;
    return match.employeeName || match.employeeId || key;
}

function dateInRange(value: string, from: string, to: string): boolean {
    if (!from && !to) return true;
    if (!value) return false;
    if (from && value < from) return false;
    if (to && value > to) return false;
    return true;
}

function hasActiveFilters(filters: ReportFilters): boolean {
    return Boolean(
        filters.search.trim() ||
            filters.company ||
            filters.engineer ||
            filters.category ||
            filters.issueDateFrom ||
            filters.issueDateTo ||
            filters.remarksDateFrom ||
            filters.remarksDateTo,
    );
}

function formatDateDisplay(isoDate: string): string {
    if (!isoDate) return "";
    const d = new Date(`${isoDate}T12:00:00`);
    if (Number.isNaN(d.getTime())) return isoDate;
    return d.toLocaleDateString(undefined, { dateStyle: "medium" });
}

function mapApiRow(row: WorkRecordApiRow, variant: WorkRecordsReportVariant): WorkRecord {
    const id = typeof row.id === "number" ? row.id : Number(row.id);
    const assetId = typeof row.asset_id === "number" ? row.asset_id : Number(row.asset_id);
    const companyIdRaw = row.company_id;
    const companyIdNum =
        companyIdRaw === null || companyIdRaw === undefined ? null : Number(companyIdRaw);
    return {
        id: Number.isFinite(id) ? id : 0,
        assetId: Number.isFinite(assetId) ? assetId : 0,
        employeeId: str(row.employee_id),
        employeeName: str(row.employee_name),
        scannedTagCode: str(row.scanned_tag_code),
        companyId: Number.isFinite(companyIdNum) ? companyIdNum : null,
        companyName: str(row.company_name),
        assetName: str(row.asset_name),
        assetDescription: str(row.asset_description),
        tagCode: str(row.tag_code),
        category: str(row.category),
        status: str(row.status),
        userKnownIssue: str(row.user_known_issue),
        userIssueReportingDate: toDateOnly(row.user_issue_reporting_date),
        engineerRemarks: str(row.engineer_remarks),
        engineerRemarksDateTime: formatDateTime(row.engineer_remarks_date_time),
        savedAt: formatDateTime(row.created_at),
        remarksSavedDate: datePartFromRaw(row.engineer_remarks_date_time),
        workType: variant === "amc" ? str(row.work_type) || "amc" : "without_amc",
        updatedAt: formatDateTime(row.updated_at),
    };
}

function recordMatchesFilters(r: WorkRecord, filters: ReportFilters): boolean {
    if (filters.company && r.companyName !== filters.company) return false;
    if (filters.engineer && engineerKey(r) !== filters.engineer) return false;
    if (filters.category && r.category !== filters.category) return false;
    if (!dateInRange(r.userIssueReportingDate, filters.issueDateFrom, filters.issueDateTo)) return false;
    if (!dateInRange(r.remarksSavedDate, filters.remarksDateFrom, filters.remarksDateTo)) return false;

    const q = filters.search.trim().toLowerCase();
    if (!q) return true;

    const haystack = [
        r.employeeName,
        r.employeeId,
        r.companyName,
        r.assetName,
        r.tagCode,
        r.scannedTagCode,
        r.category,
        r.userKnownIssue,
        r.engineerRemarks,
    ]
        .join(" ")
        .toLowerCase();

    return haystack.includes(q);
}

function toExportRows(records: WorkRecord[]): AmcReportExportRow[] {
    return records.map((r, index) => ({
        countSerial: index + 1,
        recordId: r.id,
        engineerName: r.employeeName || r.employeeId,
        company: r.companyName,
        assetName: r.assetName,
        assetDescription: r.assetDescription,
        tagSerial: r.tagCode,
        category: r.category,
        assetStatus: r.status,
        issueReportingDate: r.userIssueReportingDate
            ? formatDateDisplay(r.userIssueReportingDate)
            : "",
        userIssue: r.userKnownIssue,
        engineerRemarks: r.engineerRemarks,
        remarksSavedOn: r.engineerRemarksDateTime,
        workType: r.workType,
        updatedAt: r.updatedAt,
    }));
}

function CellText({ value, maxWidth = "max-w-[200px]" }: { value: string; maxWidth?: string }) {
    if (!value.trim()) {
        return <span className="text-gray-400">—</span>;
    }
    return (
        <span className={`line-clamp-2 break-words ${maxWidth}`} title={value}>
            {value}
        </span>
    );
}

export default function WorkRecordsReportPage({ variant }: { variant: WorkRecordsReportVariant }) {
    const config = VARIANT_CONFIG[variant];
    const TitleIcon = config.icon;
    const [records, setRecords] = useState<WorkRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [viewDetail, setViewDetail] = useState<WorkRecord | null>(null);
    const [filters, setFilters] = useState<ReportFilters>(emptyFilters);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [exportBusy, setExportBusy] = useState<"excel" | "pdf" | null>(null);

    const loadRecords = useCallback(async () => {
        try {
            setLoadError("");
            setIsLoading(true);
            const res = await fetch(config.apiPath, { cache: "no-store" });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                const msg = typeof (data as { message?: string }).message === "string"
                    ? (data as { message: string }).message
                    : config.loadErrorDefault;
                throw new Error(msg);
            }

            const rows = Array.isArray(data) ? (data as WorkRecordApiRow[]) : [];
            setRecords(rows.map((row) => mapApiRow(row, variant)).filter((r) => r.id > 0));
        } catch (err) {
            setRecords([]);
            setLoadError(err instanceof Error ? err.message : config.loadErrorDefault);
        } finally {
            setIsLoading(false);
        }
    }, [config.apiPath, config.loadErrorDefault, variant]);

    useEffect(() => {
        void loadRecords();
    }, [loadRecords]);

    const filterOptions = useMemo(() => {
        const companies = [...new Set(records.map((r) => r.companyName).filter(Boolean))].sort((a, b) =>
            a.localeCompare(b),
        );
        const engineerKeys = [...new Set(records.map(engineerKey).filter(Boolean))].sort((a, b) =>
            engineerLabel(a, records).localeCompare(engineerLabel(b, records)),
        );
        const categories = [...new Set(records.map((r) => r.category).filter(Boolean))].sort((a, b) =>
            a.localeCompare(b),
        );
        return { companies, engineerKeys, categories };
    }, [records]);

    const filteredRecords = useMemo(
        () => records.filter((r) => recordMatchesFilters(r, filters)),
        [records, filters],
    );

    const filtersActive = hasActiveFilters(filters);

    const stats = useMemo(() => {
        const source = filtersActive ? filteredRecords : records;
        const total = source.length;
        const withIssue = source.filter((r) => r.userKnownIssue.trim()).length;
        const withRemarks = source.filter((r) => r.engineerRemarks.trim()).length;
        const companies = new Set(source.map((r) => r.companyName).filter(Boolean)).size;
        return [
            {
                label: filtersActive ? "Matching records" : "Total records",
                value: String(total),
                tone: "text-[#0a2a5e]",
            },
            { label: "With user issue", value: String(withIssue), tone: "text-[#06b6d4]" },
            { label: "With remarks", value: String(withRemarks), tone: "text-green-600" },
            { label: "Companies", value: String(companies), tone: "text-gray-700" },
        ];
    }, [records, filteredRecords, filtersActive]);

    const updateFilter = <K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const canExport = !isLoading && records.length > 0;
    const canExportFiltered = !isLoading && filteredRecords.length > 0;
    const exportRows = useMemo(() => toExportRows(records), [records]);
    const filteredExportRows = useMemo(() => toExportRows(filteredRecords), [filteredRecords]);

    const runExportExcel = async (rows: AmcReportExportRow[]) => {
        if (rows.length === 0) return;
        setExportBusy("excel");
        try {
            await config.exportExcel(rows);
        } catch (err) {
            window.alert(err instanceof Error ? err.message : "Failed to export Excel file.");
        } finally {
            setExportBusy(null);
        }
    };

    const runExportPdf = async (rows: AmcReportExportRow[]) => {
        if (rows.length === 0) return;
        setExportBusy("pdf");
        try {
            await config.exportPdf(rows);
        } catch (err) {
            window.alert(err instanceof Error ? err.message : "Failed to export PDF.");
        } finally {
            setExportBusy(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex flex-wrap items-center gap-2">
                        <TitleIcon className="h-7 w-7 text-[#06124f] shrink-0" aria-hidden />
                        {config.title}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">{config.description}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => void runExportExcel(exportRows)}
                        disabled={!canExport || exportBusy !== null}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                        title={canExport ? "Export all data to Excel" : "No data to export"}
                    >
                        {exportBusy === "excel" ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        ) : (
                            <FileSpreadsheet className="h-4 w-4 text-green-700" aria-hidden />
                        )}
                        Export Excel
                    </button>
                    <button
                        type="button"
                        onClick={() => void runExportPdf(exportRows)}
                        disabled={!canExport || exportBusy !== null}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                        title={canExport ? "Download all data as PDF" : "No data to export"}
                    >
                        {exportBusy === "pdf" ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        ) : (
                            <FileText className="h-4 w-4 text-red-700" aria-hidden />
                        )}
                        Export PDF
                    </button>
                    <button
                        type="button"
                        onClick={() => void loadRecords()}
                        disabled={isLoading || exportBusy !== null}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                        Refresh
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {stats.map((s) => (
                    <div
                        key={s.label}
                        className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
                    >
                        <p className="text-xs font-medium text-gray-500">{s.label}</p>
                        <p className={`mt-1 text-xl font-bold ${s.tone}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 p-4">
                    <button
                        type="button"
                        onClick={() => setFiltersOpen((open) => !open)}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 rounded-lg hover:bg-gray-50 px-1 py-0.5 -ml-1 transition"
                        aria-expanded={filtersOpen}
                        aria-controls={config.filtersId}
                    >
                        <Filter className="h-4 w-4 text-[#06124f] shrink-0" aria-hidden />
                        Filters
                        {filtersOpen ? (
                            <ChevronUp className="h-4 w-4 text-gray-500" aria-hidden />
                        ) : (
                            <ChevronDown className="h-4 w-4 text-gray-500" aria-hidden />
                        )}
                    </button>
                    <div className="flex flex-wrap items-center gap-2">
                        {filtersActive && !filtersOpen ? (
                            <span className="rounded-full bg-[#06124f]/10 px-2.5 py-1 text-xs font-semibold text-[#06124f]">
                                Filters active
                            </span>
                        ) : null}
                        {filtersActive && filtersOpen ? (
                            <p className="text-xs text-gray-500">
                                Showing {filteredRecords.length} of {records.length} records
                            </p>
                        ) : null}
                        <button
                            type="button"
                            onClick={() => setFiltersOpen((open) => !open)}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                            {filtersOpen ? "Hide" : "Show"}
                        </button>
                    </div>
                </div>

                <div
                    id={config.filtersId}
                    className={`grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none ${
                        filtersOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                >
                    <div className="min-h-0 overflow-hidden">
                        <div className="space-y-4 border-t border-gray-100 px-4 pb-4 pt-4">
                <div className="relative">
                    <Search
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                        aria-hidden
                    />
                    <input
                        type="search"
                        value={filters.search}
                        onChange={(e) => updateFilter("search", e.target.value)}
                        placeholder="Search engineer, company, asset, tag, issue, remarks…"
                        className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm text-gray-800 outline-none transition focus:border-[#06124f]/40 focus:ring-2 focus:ring-[#06124f]/10"
                    />
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                <FilterSelect
                        label="Company"
                        value={filters.company}
                        onChange={(v) => updateFilter("company", v)}
                        options={filterOptions.companies}
                    />
                    <FilterSelect
                        label="Engineer name"
                        value={filters.engineer}
                        onChange={(v) => updateFilter("engineer", v)}
                        options={filterOptions.engineerKeys}
                        formatOption={(key) => engineerLabel(key, records)}
                    />
                    <FilterSelect
                        label="Category"
                        value={filters.category}
                        onChange={(v) => updateFilter("category", v)}
                        options={filterOptions.categories}
                    />
                    <FilterDate
                        label="Issue date from"
                        value={filters.issueDateFrom}
                        onChange={(v) => updateFilter("issueDateFrom", v)}
                    />
                    <FilterDate
                        label="Issue date to"
                        value={filters.issueDateTo}
                        onChange={(v) => updateFilter("issueDateTo", v)}
                    />
                    <FilterDate
                        label="Remarks saved from"
                        value={filters.remarksDateFrom}
                        onChange={(v) => updateFilter("remarksDateFrom", v)}
                    />
                    <FilterDate
                        label="Remarks saved to"
                        value={filters.remarksDateTo}
                        onChange={(v) => updateFilter("remarksDateTo", v)}
                    />
                            </div>

                            <div className="flex flex-wrap justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => void runExportExcel(filteredExportRows)}
                                    disabled={!canExportFiltered || exportBusy !== null}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#06124f]/20 bg-[#06124f]/5 px-4 py-2 text-sm font-semibold text-[#06124f] shadow-sm transition hover:bg-[#06124f]/10 disabled:cursor-not-allowed disabled:opacity-50"
                                    title={
                                        canExportFiltered
                                            ? `Export ${filteredRecords.length} filtered record(s) to Excel`
                                            : "No matching records to export"
                                    }
                                >
                                    {exportBusy === "excel" ? (
                                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                    ) : (
                                        <FileSpreadsheet className="h-4 w-4" aria-hidden />
                                    )}
                                    Export Excel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void runExportPdf(filteredExportRows)}
                                    disabled={!canExportFiltered || exportBusy !== null}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#06124f]/20 bg-[#06124f]/5 px-4 py-2 text-sm font-semibold text-[#06124f] shadow-sm transition hover:bg-[#06124f]/10 disabled:cursor-not-allowed disabled:opacity-50"
                                    title={
                                        canExportFiltered
                                            ? `Export ${filteredRecords.length} filtered record(s) as PDF`
                                            : "No matching records to export"
                                    }
                                >
                                    {exportBusy === "pdf" ? (
                                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                    ) : (
                                        <FileText className="h-4 w-4" aria-hidden />
                                    )}
                                    Export PDF
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFilters(emptyFilters())}
                                    disabled={!filtersActive}
                                    className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Clear filters
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-[1100px] w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                                    Engineer Name
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                                    Company
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                                    Asset
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                                    Tag / Serial
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                                    Category
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                                    Issue date
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                                    User Issue
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                                    Engineer remarks
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                                    Remarks saved
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                                    View
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading && (
                                <tr>
                                    <td className="px-4 py-8 text-sm text-gray-500" colSpan={TABLE_COL_SPAN}>
                                        <span className="inline-flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin text-[#06124f]" aria-hidden />
                                            {config.loadingLabel}
                                        </span>
                                    </td>
                                </tr>
                            )}
                            {!isLoading && records.length === 0 && (
                                <tr>
                                    <td className="px-4 py-8 text-sm text-gray-500" colSpan={TABLE_COL_SPAN}>
                                        {loadError || config.emptyLabel}
                                    </td>
                                </tr>
                            )}
                            {!isLoading && records.length > 0 && filteredRecords.length === 0 && (
                                <tr>
                                    <td className="px-4 py-8 text-sm text-gray-500" colSpan={TABLE_COL_SPAN}>
                                        No records match your filters. Try adjusting or clearing filters.
                                    </td>
                                </tr>
                            )}
                            {!isLoading &&
                                filteredRecords.map((r) => (
                                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            <span className="font-medium block">{r.employeeName || r.employeeId || "—"}</span>
                                            {r.employeeName && r.employeeId ? (
                                                <span className="text-xs text-gray-500">{r.employeeId}</span>
                                            ) : null}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700">
                                            <CellText value={r.companyName} maxWidth="max-w-[140px]" />
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                            <CellText value={r.assetName} maxWidth="max-w-[160px]" />
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700 font-mono text-xs whitespace-nowrap">
                                            {(r.tagCode || r.scannedTagCode).trim() ? (
                                                r.tagCode || r.scannedTagCode
                                            ) : (
                                                <span className="text-gray-400 font-sans">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                                            {r.category.trim() ? r.category : <span className="text-gray-400">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                                            {r.userIssueReportingDate ? (
                                                formatDateDisplay(r.userIssueReportingDate)
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700">
                                            <CellText value={r.userKnownIssue} />
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700">
                                            <CellText value={r.engineerRemarks} />
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                                            {r.engineerRemarksDateTime || (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                type="button"
                                                onClick={() => setViewDetail(r)}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50"
                                                title="View full record"
                                                aria-label="View full record"
                                            >
                                                <Eye className="h-4 w-4" aria-hidden />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {viewDetail ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
                        aria-hidden
                        onClick={() => setViewDetail(null)}
                    />
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="work-record-view-title"
                        className="relative flex max-h-[min(90vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
                    >
                        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-100 px-6 py-5">
                            <h3 id="work-record-view-title" className="text-lg font-bold tracking-tight text-[#001540]">
                                {config.viewRecordTitle(viewDetail.id)}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setViewDetail(null)}
                                className="shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" strokeWidth={2} />
                            </button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <Detail label="Saved at" value={viewDetail.savedAt} />
                                <Detail label="Engineer Name" value={viewDetail.employeeName || viewDetail.employeeId} />
                                <Detail label="Company" value={viewDetail.companyName} />
                                <Detail label="Asset name" value={viewDetail.assetName} />
                                <Detail label="Tag / serial" value={viewDetail.tagCode || viewDetail.scannedTagCode} />
                                <Detail label="Scanned code" value={viewDetail.scannedTagCode} />
                                <Detail label="Category" value={viewDetail.category} />
                                <Detail label="Asset status" value={viewDetail.status} />
                                <Detail
                                    label="Issue reporting date"
                                    value={
                                        viewDetail.userIssueReportingDate
                                            ? formatDateDisplay(viewDetail.userIssueReportingDate)
                                            : ""
                                    }
                                />
                                <Detail label="Remarks saved on" value={viewDetail.engineerRemarksDateTime} />
                                <div className="sm:col-span-2">
                                    <Detail label="User Issue" value={viewDetail.userKnownIssue} multiline />
                                </div>
                                <div className="sm:col-span-2">
                                    <Detail label="Engineer remarks" value={viewDetail.engineerRemarks} multiline />
                                </div>
                                {viewDetail.assetDescription ? (
                                    <div className="sm:col-span-2">
                                        <Detail label="Asset description" value={viewDetail.assetDescription} multiline />
                                    </div>
                                ) : null}
                            </div>
                        </div>
                        <div className="flex shrink-0 justify-end border-t border-gray-100 px-6 py-4">
                            <button
                                type="button"
                                onClick={() => setViewDetail(null)}
                                className="rounded-lg bg-[#001540] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function FilterSelect({
    label,
    value,
    onChange,
    options,
    formatOption,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: string[];
    formatOption?: (value: string) => string;
}) {
    return (
        <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-[#06124f]/40 focus:ring-2 focus:ring-[#06124f]/10"
            >
                <option value="">All</option>
                {options.map((opt) => (
                    <option key={opt} value={opt}>
                        {formatOption ? formatOption(opt) : opt}
                    </option>
                ))}
            </select>
        </div>
    );
}

function FilterDate({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">{label}</label>
            <input
                type="date"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-[#06124f]/40 focus:ring-2 focus:ring-[#06124f]/10"
            />
        </div>
    );
}

function Detail({
    label,
    value,
    multiline = false,
}: {
    label: string;
    value: string;
    multiline?: boolean;
}) {
    const display = value.trim() || "—";
    return (
        <div>
            <p className="text-xs font-medium text-gray-500">{label}</p>
            <p
                className={`mt-1 text-sm font-semibold text-gray-900 break-words ${multiline ? "whitespace-pre-wrap" : ""}`}
            >
                {display}
            </p>
        </div>
    );
}
