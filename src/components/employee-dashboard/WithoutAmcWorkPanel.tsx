"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { Check, FileText, Loader2, ScanLine, Search } from "lucide-react";

const AssetBarcodeScanner = dynamic(() => import("@/components/employee-dashboard/AssetBarcodeScanner"), {
    ssr: false,
});

type LookupMode = "idle" | "found" | "manual_new";

type WorkRecordRow = {
    id?: number | string | null;
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
};

type PreviousWorkRecord = {
    userIssueReportingDate: string;
    userKnownIssue: string;
    engineerRemarks: string;
    engineerRemarksDateTime: string;
};

type NewWorkNotesForm = {
    userIssueReportingDate: string;
    userKnownIssue: string;
    engineerRemarks: string;
};

type CompanyOption = { id: number; name: string };

type ManualAssetForm = {
    companyId: string;
    assetName: string;
    assetDescription: string;
    tagCode: string;
    category: string;
};

type AssetStatus = "Active" | "Inactive" | "Maintenance";

const emptyNewWorkNotes = (): NewWorkNotesForm => ({
    userIssueReportingDate: "",
    userKnownIssue: "",
    engineerRemarks: "",
});

const emptyManualAsset = (serial: string): ManualAssetForm => ({
    companyId: "",
    assetName: "",
    assetDescription: "",
    tagCode: serial,
    category: "",
});

const btnPrimary =
    "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0d4f3c] to-[#0a7c5c] px-4 py-3.5 min-h-[3rem] text-base font-semibold text-white shadow-sm transition active:scale-[0.98] touch-manipulation hover:opacity-90 disabled:opacity-60 disabled:active:scale-100 sm:py-3 sm:text-sm";
const btnSecondary =
    "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3.5 min-h-[3rem] text-base font-semibold text-gray-800 shadow-sm transition active:scale-[0.98] touch-manipulation hover:bg-gray-50 disabled:opacity-60 disabled:active:scale-100 sm:py-2.5 sm:text-sm";
const inputField =
    "w-full min-h-[3rem] rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-800 outline-none transition focus:ring-2 focus:ring-[#0d4f3c]/20 focus:border-[#0d4f3c] sm:py-2.5 sm:text-sm";
const textareaField =
    "w-full min-h-[6.5rem] rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-800 outline-none transition resize-y focus:ring-2 focus:ring-[#0d4f3c]/20 focus:border-[#0d4f3c] sm:min-h-[5.5rem] sm:py-2.5 sm:text-sm";

function formatDisplayDateTime(raw: unknown): string {
    if (raw === null || raw === undefined) return "";
    const d = raw instanceof Date ? raw : new Date(String(raw));
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function formatDisplayDate(raw: string): string {
    if (!raw.trim()) return "";
    const d = new Date(`${raw}T12:00:00`);
    if (Number.isNaN(d.getTime())) return raw;
    return d.toLocaleDateString(undefined, { dateStyle: "medium" });
}

function toDateInputValue(raw: unknown): string {
    if (raw === null || raw === undefined) return "";
    if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
        return raw.toISOString().slice(0, 10);
    }
    const s = String(raw).trim();
    if (!s) return "";
    const match = s.match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : "";
}

function str(value: unknown): string {
    return typeof value === "string" ? value.trim() : value === null || value === undefined ? "" : String(value).trim();
}

function previousFromRow(row: WorkRecordRow): PreviousWorkRecord | null {
    const userKnownIssue = str(row.user_known_issue);
    const userIssueReportingDate = toDateInputValue(row.user_issue_reporting_date);
    const engineerRemarks = str(row.engineer_remarks);
    const engineerRemarksDateTime = formatDisplayDateTime(row.engineer_remarks_date_time);
    if (!userKnownIssue && !userIssueReportingDate && !engineerRemarks && !engineerRemarksDateTime) {
        return null;
    }
    return { userKnownIssue, userIssueReportingDate, engineerRemarks, engineerRemarksDateTime };
}

function hasNewWorkEntry(notes: NewWorkNotesForm): boolean {
    return Boolean(
        notes.userKnownIssue.trim() ||
            notes.userIssueReportingDate.trim() ||
            notes.engineerRemarks.trim(),
    );
}

function normalizeStatus(raw: string): AssetStatus {
    const s = raw.trim();
    if (s === "Inactive") return "Inactive";
    if (s === "Maintenance") return "Maintenance";
    return "Active";
}

function StatusBadge({ status }: { status: AssetStatus }) {
    const styles: Record<AssetStatus, string> = {
        Active: "bg-green-50 text-green-800 ring-1 ring-green-600/15",
        Inactive: "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
        Maintenance: "bg-amber-50 text-amber-800 ring-1 ring-amber-600/15",
    };
    return (
        <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold sm:px-2.5 sm:py-1 ${styles[status]}`}
        >
            {status === "Active" ? <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden /> : null}
            {status}
        </span>
    );
}

function DetailField({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-0 rounded-lg bg-white/80 p-3 sm:bg-transparent sm:p-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 sm:text-xs sm:font-medium sm:normal-case sm:tracking-normal">
                {label}
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-900 break-words">{value.trim() ? value : "—"}</p>
        </div>
    );
}

export default function WithoutAmcWorkPanel() {
    const [scannerOpen, setScannerOpen] = useState(false);
    const [manualCode, setManualCode] = useState("");
    const [lookupBusy, setLookupBusy] = useState(false);
    const [lookupError, setLookupError] = useState("");
    const [scannedCode, setScannedCode] = useState("");
    const [lookupMode, setLookupMode] = useState<LookupMode>("idle");
    const [existingRecord, setExistingRecord] = useState<WorkRecordRow | null>(null);
    const [manualAsset, setManualAsset] = useState<ManualAssetForm>(emptyManualAsset(""));
    const [previousRecord, setPreviousRecord] = useState<PreviousWorkRecord | null>(null);
    const [newWorkNotes, setNewWorkNotes] = useState<NewWorkNotesForm>(emptyNewWorkNotes);
    const [saveBusy, setSaveBusy] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");
    const [companyOptions, setCompanyOptions] = useState<CompanyOption[]>([]);

    useEffect(() => {
        const loadCompanies = async () => {
            try {
                const res = await fetch("/api/employee/amc/companies", { cache: "no-store" });
                const data = await res.json().catch(() => []);
                if (!res.ok || !Array.isArray(data)) {
                    setCompanyOptions([]);
                    return;
                }
                const options = (data as { id?: number | string; company_name?: string }[])
                    .map((row) => {
                        const id = typeof row.id === "number" ? row.id : Number(row.id);
                        const name = typeof row.company_name === "string" ? row.company_name.trim() : "";
                        return { id, name };
                    })
                    .filter((o) => Number.isFinite(o.id) && o.id > 0 && o.name);
                setCompanyOptions(options.sort((a, b) => a.name.localeCompare(b.name)));
            } catch {
                setCompanyOptions([]);
            }
        };
        void loadCompanies();
    }, []);

    const resetWorkState = () => {
        setLookupMode("idle");
        setExistingRecord(null);
        setManualAsset(emptyManualAsset(""));
        setPreviousRecord(null);
        setNewWorkNotes(emptyNewWorkNotes());
        setSaveMessage("");
    };

    const lookupSerial = useCallback(async (code: string) => {
        const trimmed = code.trim();
        if (!trimmed) return;

        setLookupBusy(true);
        setLookupError("");
        setScannedCode(trimmed);
        resetWorkState();

        try {
            const res = await fetch(
                `/api/employee/without-amc/work-records/lookup?${new URLSearchParams({ code: trimmed })}`,
                { cache: "no-store" },
            );
            const data = (await res.json().catch(() => ({}))) as {
                found?: boolean;
                serial?: string;
                record?: WorkRecordRow;
                message?: string;
            };

            if (!res.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Lookup failed");
            }

            if (data.found && data.record) {
                setLookupMode("found");
                setExistingRecord(data.record);
                setPreviousRecord(previousFromRow(data.record));
                setNewWorkNotes(emptyNewWorkNotes());
            } else {
                setLookupMode("manual_new");
                setManualAsset(emptyManualAsset(trimmed));
                setNewWorkNotes(emptyNewWorkNotes());
            }
        } catch (err) {
            setLookupError(err instanceof Error ? err.message : "Failed to look up serial");
            setLookupMode("idle");
        } finally {
            setLookupBusy(false);
        }
    }, []);

    const handleScan = useCallback(
        (code: string) => {
            setScannerOpen(false);
            void lookupSerial(code);
        },
        [lookupSerial],
    );

    const handleManualLookup = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        void lookupSerial(manualCode);
    };

    const resetForNewScan = useCallback(() => {
        setScannerOpen(false);
        setLookupError("");
        setScannedCode("");
        setManualCode("");
        resetWorkState();
    }, []);

    const handleScanAgain = () => {
        resetForNewScan();
        setScannerOpen(true);
    };

    const handleNewWorkNotesChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewWorkNotes((prev) => ({ ...prev, [name]: value }));
        setSaveMessage("");
    };

    const handleManualAssetChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => {
        const { name, value } = e.target;
        setManualAsset((prev) => ({ ...prev, [name]: value }));
        setSaveMessage("");
    };

    const handleSave = async () => {
        const serial = scannedCode.trim();
        if (!serial) return;

        if (lookupMode === "manual_new" && !manualAsset.assetName.trim()) {
            setSaveMessage("Asset name is required for a new serial number.");
            return;
        }

        if (!hasNewWorkEntry(newWorkNotes)) {
            setSaveMessage("Enter issue details and/or engineer remarks before saving.");
            return;
        }

        setSaveBusy(true);
        setSaveMessage("");

        try {
            const payload: Record<string, string | null> = {
                serial,
                scanned_tag_code: serial,
                user_known_issue: newWorkNotes.userKnownIssue.trim() || null,
                user_issue_reporting_date: newWorkNotes.userIssueReportingDate.trim() || null,
                engineer_remarks: newWorkNotes.engineerRemarks.trim() || null,
            };

            if (lookupMode === "manual_new") {
                const selectedCompany = companyOptions.find(
                    (c) => String(c.id) === manualAsset.companyId,
                );
                payload.company_id = manualAsset.companyId.trim() || null;
                payload.company_name = selectedCompany?.name ?? null;
                payload.asset_name = manualAsset.assetName.trim();
                payload.asset_description = manualAsset.assetDescription.trim() || null;
                payload.tag_code = manualAsset.tagCode.trim() || serial;
                payload.category = manualAsset.category.trim() || null;
                payload.status = "Active";
            }

            const res = await fetch("/api/employee/without-amc/work-records", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = (await res.json().catch(() => ({}))) as { message?: string };
            if (!res.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to save");
            }
            resetForNewScan();
        } catch (err) {
            setSaveMessage(err instanceof Error ? err.message : "Failed to save work record.");
        } finally {
            setSaveBusy(false);
        }
    };

    const showForm = lookupMode === "found" || lookupMode === "manual_new";
    const showMobileStickyBar = showForm;
    const foundAssetName = str(existingRecord?.asset_name);
    const foundStatus = normalizeStatus(str(existingRecord?.status) || "Active");

    return (
        <div
            className={`mx-auto w-full max-w-lg space-y-4 sm:max-w-2xl sm:space-y-6 ${showMobileStickyBar ? "pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] sm:pb-0" : ""}`}
        >
            <header className="px-0.5">
                <h1 className="text-xl font-black text-gray-900 flex items-center gap-2 sm:text-2xl">
                    <FileText className="h-6 w-6 text-[#0d4f3c] shrink-0 sm:h-7 sm:w-7" aria-hidden />
                    Without AMC Work
                </h1>
                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed sm:mt-1">
                    Scan or enter a serial number. Existing records load from Without AMC history; new serials can be
                    entered manually.
                </p>
            </header>

            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 space-y-4 sm:p-6 sm:space-y-5">
                    <div className="flex flex-col gap-3">
                        <button
                            type="button"
                            onClick={() => setScannerOpen(true)}
                            disabled={lookupBusy}
                            className={btnPrimary}
                        >
                            <ScanLine className="h-5 w-5 shrink-0" aria-hidden />
                            Scan barcode
                        </button>

                        <form onSubmit={handleManualLookup} className="flex flex-col gap-2">
                            <label htmlFor="manual-serial" className="text-xs font-semibold text-gray-600 sm:sr-only">
                                Serial number
                            </label>
                            <input
                                id="manual-serial"
                                type="text"
                                inputMode="text"
                                autoComplete="off"
                                autoCapitalize="characters"
                                value={manualCode}
                                onChange={(e) => setManualCode(e.target.value)}
                                placeholder="Enter serial number"
                                className={inputField}
                            />
                            <button
                                type="submit"
                                disabled={lookupBusy || !manualCode.trim()}
                                className={btnSecondary}
                            >
                                <Search className="h-5 w-5 shrink-0" aria-hidden />
                                Look up
                            </button>
                        </form>
                    </div>

                    {lookupBusy ? (
                        <div
                            className="flex items-center justify-center gap-2 rounded-xl bg-gray-50 py-4 text-sm text-gray-600"
                            role="status"
                            aria-live="polite"
                        >
                            <Loader2 className="h-5 w-5 animate-spin text-[#0d4f3c]" aria-hidden />
                            Looking up serial…
                        </div>
                    ) : null}

                    {lookupError ? (
                        <div
                            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                            role="alert"
                        >
                            {lookupError}
                        </div>
                    ) : null}

                    {lookupMode === "found" && existingRecord ? (
                        <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4 space-y-4 sm:p-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#0d4f3c]">
                                        Record found
                                    </p>
                                    <h2 className="text-lg font-bold text-gray-900 mt-1 break-words sm:mt-0.5">
                                        {foundAssetName || "—"}
                                    </h2>
                                    {scannedCode ? (
                                        <p className="text-xs text-gray-500 mt-1.5 font-mono break-all">
                                            Serial: {scannedCode}
                                        </p>
                                    ) : null}
                                </div>
                                <StatusBadge status={foundStatus} />
                            </div>

                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4">
                                <DetailField label="Tag / Serial" value={str(existingRecord.tag_code) || scannedCode} />
                                <DetailField label="Category" value={str(existingRecord.category)} />
                                <DetailField label="Company" value={str(existingRecord.company_name)} />
                                <DetailField label="Record ID" value={String(existingRecord.id ?? "")} />
                                <div className="sm:col-span-2">
                                    <DetailField label="Description" value={str(existingRecord.asset_description)} />
                                </div>
                            </div>

                            <div className="border-t border-gray-200 pt-4 space-y-5">
                                {previousRecord ? (
                                    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                                        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                                            Previous record
                                        </p>
                                        <p className="text-xs text-gray-500 leading-relaxed">
                                            From Without AMC history — add a new entry below.
                                        </p>
                                        {previousRecord.userIssueReportingDate ? (
                                            <DetailField
                                                label="Issue reporting date"
                                                value={formatDisplayDate(previousRecord.userIssueReportingDate)}
                                            />
                                        ) : null}
                                        {previousRecord.userKnownIssue ? (
                                            <DetailField label="Recorded issue" value={previousRecord.userKnownIssue} />
                                        ) : null}
                                        {previousRecord.engineerRemarks ? (
                                            <DetailField
                                                label="Engineer remarks"
                                                value={previousRecord.engineerRemarks}
                                            />
                                        ) : null}
                                        {previousRecord.engineerRemarksDateTime ? (
                                            <DetailField
                                                label="Remarks saved on"
                                                value={previousRecord.engineerRemarksDateTime}
                                            />
                                        ) : null}
                                    </div>
                                ) : null}

                                <WorkNotesForm
                                    newWorkNotes={newWorkNotes}
                                    onChange={handleNewWorkNotesChange}
                                    saveBusy={saveBusy}
                                    lookupBusy={lookupBusy}
                                    saveMessage={saveMessage}
                                    onSave={() => void handleSave()}
                                    showDesktopSave
                                />
                            </div>
                        </div>
                    ) : null}

                    {lookupMode === "manual_new" ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-4 sm:p-5">
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wide text-amber-800">
                                    New serial number
                                </p>
                                <p className="text-sm text-amber-900/90 mt-1 leading-relaxed">
                                    No Without AMC record for{" "}
                                    <span className="font-mono font-semibold">{scannedCode}</span>. Enter asset details
                                    and work notes below — nothing is loaded from AMC data.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <FormField label="Company">
                                    <select
                                        name="companyId"
                                        value={manualAsset.companyId}
                                        onChange={handleManualAssetChange}
                                        className={inputField}
                                    >
                                        <option value="">Select company</option>
                                        {companyOptions.map((company) => (
                                            <option key={company.id} value={String(company.id)}>
                                                {company.name}
                                            </option>
                                        ))}
                                    </select>
                                </FormField>
                                <FormField label="Asset name" required>
                                    <input
                                        name="assetName"
                                        value={manualAsset.assetName}
                                        onChange={handleManualAssetChange}
                                        className={inputField}
                                        placeholder="Asset name"
                                        required
                                    />
                                </FormField>
                                <FormField label="Tag / Serial">
                                    <input
                                        name="tagCode"
                                        value={manualAsset.tagCode}
                                        onChange={handleManualAssetChange}
                                        className={inputField}
                                        placeholder="Serial number"
                                    />
                                </FormField>
                                <FormField label="Category">
                                    <input
                                        name="category"
                                        value={manualAsset.category}
                                        onChange={handleManualAssetChange}
                                        className={inputField}
                                        placeholder="Category"
                                    />
                                </FormField>
                                <div className="sm:col-span-2">
                                    <FormField label="Description">
                                        <textarea
                                            name="assetDescription"
                                            rows={3}
                                            value={manualAsset.assetDescription}
                                            onChange={handleManualAssetChange}
                                            className={textareaField}
                                            placeholder="Asset description"
                                        />
                                    </FormField>
                                </div>
                            </div>

                            <div className="border-t border-amber-200/80 pt-4">
                                <WorkNotesForm
                                    newWorkNotes={newWorkNotes}
                                    onChange={handleNewWorkNotesChange}
                                    saveBusy={saveBusy}
                                    lookupBusy={lookupBusy}
                                    saveMessage={saveMessage}
                                    onSave={() => void handleSave()}
                                    showDesktopSave
                                />
                            </div>
                        </div>
                    ) : null}

                    {lookupMode === "idle" && !lookupBusy && !lookupError ? (
                        <p className="text-sm text-gray-500 text-center py-8 px-2 leading-relaxed">
                            Tap <span className="font-semibold text-gray-700">Scan barcode</span> or enter a serial
                            number above to get started.
                        </p>
                    ) : null}
                </div>
            </section>

            {showMobileStickyBar ? (
                <div
                    className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur-md shadow-[0_-4px_24px_rgba(0,0,0,0.08)] sm:hidden"
                    style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
                >
                    <div className="mx-auto max-w-lg px-4 pt-3 space-y-2">
                        {saveMessage ? (
                            <p className="text-center text-xs font-medium text-red-600" role="status">
                                {saveMessage}
                            </p>
                        ) : null}
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={handleScanAgain}
                                disabled={lookupBusy || saveBusy}
                                className={`${btnSecondary} !py-3 !min-h-[2.75rem] !text-sm`}
                            >
                                <ScanLine className="h-4 w-4 shrink-0" aria-hidden />
                                <span className="truncate">Scan again</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => void handleSave()}
                                disabled={saveBusy || lookupBusy}
                                className={`${btnPrimary} !py-3 !min-h-[2.75rem] !text-sm`}
                            >
                                {saveBusy ? (
                                    <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
                                ) : null}
                                <span className="truncate">{saveBusy ? "Saving…" : "Save"}</span>
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

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

function FormField({
    label,
    required,
    children,
}: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">
                {label}
                {required ? <span className="text-red-600"> *</span> : null}
            </label>
            {children}
        </div>
    );
}

function WorkNotesForm({
    newWorkNotes,
    onChange,
    saveBusy,
    lookupBusy,
    saveMessage,
    onSave,
    showDesktopSave,
}: {
    newWorkNotes: NewWorkNotesForm;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    saveBusy: boolean;
    lookupBusy: boolean;
    saveMessage: string;
    onSave: () => void;
    showDesktopSave: boolean;
}) {
    return (
        <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[#0d4f3c]">Work entry</p>
            <div>
                <label htmlFor="new-issue-reporting-date" className="block text-xs font-semibold text-gray-600 mb-2">
                    Issue reporting date
                </label>
                <input
                    id="new-issue-reporting-date"
                    name="userIssueReportingDate"
                    type="date"
                    value={newWorkNotes.userIssueReportingDate}
                    onChange={onChange}
                    className={inputField}
                />
            </div>
            <div>
                <label htmlFor="new-issue" className="block text-xs font-semibold text-gray-600 mb-2">
                    User issue
                </label>
                <textarea
                    id="new-issue"
                    name="userKnownIssue"
                    rows={4}
                    value={newWorkNotes.userKnownIssue}
                    onChange={onChange}
                    placeholder="Describe the issue reported by the user…"
                    className={textareaField}
                />
            </div>
            <div>
                <label htmlFor="new-engineer-remarks" className="block text-xs font-semibold text-gray-600 mb-2">
                    Engineer remarks
                </label>
                <textarea
                    id="new-engineer-remarks"
                    name="engineerRemarks"
                    rows={4}
                    value={newWorkNotes.engineerRemarks}
                    onChange={onChange}
                    placeholder="Your observations, actions taken, parts used…"
                    className={textareaField}
                />
            </div>
            {showDesktopSave ? (
                <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:gap-3">
                    <button
                        type="button"
                        onClick={onSave}
                        disabled={saveBusy || lookupBusy}
                        className={`${btnPrimary} !w-auto sm:min-w-[10rem]`}
                    >
                        {saveBusy ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
                                Saving…
                            </>
                        ) : (
                            "Save"
                        )}
                    </button>
                    {saveMessage ? (
                        <p className="text-sm text-red-600" role="status">
                            {saveMessage}
                        </p>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
