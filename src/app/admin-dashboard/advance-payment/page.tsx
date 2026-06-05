"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Eye,
    IndianRupee,
    Loader2,
    Pencil,
    Plus,
    Search,
    Trash2,
    User,
    Wallet,
    X,
} from "lucide-react";

type AdvanceStatus = "pending" | "recovering" | "recovered" | "cancelled";
type PaymentMode = "bank_transfer" | "cash" | "cheque";

type AdvanceApiRow = {
    id: number;
    advance_id: string;
    employee_id: string;
    full_name: string;
    department: string;
    designation: string;
    employee_status: string;
    amount: number;
    recovered_amount: number;
    advance_date: string;
    recovery_start_month: string;
    monthly_deduction: number;
    emi_months: number;
    payment_mode: PaymentMode;
    status: AdvanceStatus;
    purpose: string;
    notes: string;
    created_at: string;
};

type AdvanceRecord = {
    id: number;
    advanceId: string;
    employeeId: string;
    employeeName: string;
    department: string;
    designation: string;
    employeeStatus: string;
    amount: number;
    recoveredAmount: number;
    advanceDate: string;
    recoveryStartMonth: string;
    monthlyDeduction: number;
    emiMonths: number;
    paymentMode: PaymentMode;
    status: AdvanceStatus;
    purpose: string;
    notes: string;
    createdAt: string;
};

type EmployeeLookupRow = {
    employee_id: string;
    full_name: string;
    department: string;
    designation: string;
    employee_status: string;
};

const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = {
    bank_transfer: "Bank transfer",
    cash: "Cash",
    cheque: "Cheque",
};

const STATUS_CONFIG: Record<
    AdvanceStatus,
    { label: string; badge: string }
> = {
    pending: { label: "Pending", badge: "bg-amber-50 text-amber-800 ring-1 ring-amber-600/15" },
    recovering: { label: "Recovering", badge: "bg-blue-50 text-blue-800 ring-1 ring-blue-600/15" },
    recovered: { label: "Recovered", badge: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/15" },
    cancelled: { label: "Cancelled", badge: "bg-gray-100 text-gray-600 ring-1 ring-gray-200" },
};

function apiToAdvance(row: AdvanceApiRow): AdvanceRecord {
    return {
        id: row.id,
        advanceId: row.advance_id,
        employeeId: row.employee_id,
        employeeName: row.full_name,
        department: row.department,
        designation: row.designation,
        employeeStatus: row.employee_status,
        amount: row.amount,
        recoveredAmount: row.recovered_amount,
        advanceDate: row.advance_date,
        recoveryStartMonth: row.recovery_start_month,
        monthlyDeduction: row.monthly_deduction,
        emiMonths: row.emi_months,
        paymentMode: row.payment_mode,
        status: row.status,
        purpose: row.purpose,
        notes: row.notes,
        createdAt: row.created_at,
    };
}

function formToApiBody(form: ReturnType<typeof emptyForm>, status: AdvanceStatus) {
    return {
        employee_id: form.employeeId.trim().toUpperCase(),
        amount: parseAmount(form.amount),
        advance_date: form.advanceDate,
        recovery_start_month: form.recoveryStartMonth.trim(),
        monthly_deduction: parseAmount(form.monthlyDeduction),
        emi_months: parseEmiMonths(form.emiMonths),
        payment_mode: form.paymentMode,
        status,
        purpose: form.purpose.trim(),
        notes: form.notes.trim(),
    };
}

const emptyForm = () => ({
    employeeId: "",
    employeeName: "",
    department: "",
    designation: "",
    employeeStatus: "",
    amount: "",
    advanceDate: new Date().toISOString().slice(0, 10),
    recoveryStartMonth: "",
    monthlyDeduction: "",
    emiMonths: "",
    paymentMode: "bank_transfer" as PaymentMode,
    status: "pending" as AdvanceStatus,
    purpose: "",
    notes: "",
});

function parseAmount(value: string): number {
    const n = Number(value.replace(/,/g, "").trim());
    return Number.isFinite(n) && n >= 0 ? n : 0;
}

function parseEmiMonths(value: string): number {
    const n = Number(value.trim());
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.min(120, n);
}

function roundToDecimals(value: number, decimals = 2): number {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}

function formatCalcNumber(value: number, decimals = 2): string {
    if (!Number.isFinite(value) || value <= 0) return "";
    return String(roundToDecimals(value, decimals));
}

function formatEmiMonthsDisplay(months: number): string {
    if (months <= 0) return "—";
    const rounded = roundToDecimals(months, 2);
    const label = rounded === 1 ? "month" : "months";
    const text = Number.isInteger(rounded)
        ? String(rounded)
        : rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
    return `${text} ${label}`;
}

function recoveryAmountFromForm(
    amount: string,
    editingId: number | null,
    records: AdvanceRecord[],
): number {
    const parsedAmount = parseAmount(amount);
    const existing = editingId !== null ? records.find((r) => r.id === editingId) : null;
    const recovered = existing?.recoveredAmount ?? 0;
    return Math.max(0, parsedAmount - recovered);
}

function calcEmiMonthsFromDeduction(recoveryAmount: number, monthlyDeduction: number): string {
    if (recoveryAmount <= 0 || monthlyDeduction <= 0) return "";
    return formatCalcNumber(Math.min(120, recoveryAmount / monthlyDeduction));
}

function calcMonthlyDeductionFromEmi(recoveryAmount: number, emiMonths: number): string {
    if (recoveryAmount <= 0 || emiMonths <= 0) return "";
    return formatCalcNumber(recoveryAmount / emiMonths);
}

function formatInr(amount: number): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}

function formatDateDisplay(iso: string): string {
    if (!iso) return "—";
    const d = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatMonthDisplay(ym: string): string {
    if (!/^\d{4}-\d{2}$/.test(ym)) return ym || "—";
    const d = new Date(`${ym}-01T12:00:00`);
    return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function remainingBalance(row: Pick<AdvanceRecord, "amount" | "recoveredAmount">): number {
    return Math.max(0, row.amount - row.recoveredAmount);
}

function deriveStatus(
    amount: number,
    recovered: number,
    selected: AdvanceStatus,
): AdvanceStatus {
    if (selected === "cancelled") return "cancelled";
    if (amount > 0 && recovered >= amount) return "recovered";
    if (recovered > 0) return "recovering";
    return selected === "recovered" ? "recovered" : selected;
}

function EmployeeStatusBadge({ status }: { status: string }) {
    const trimmed = status.trim() || "—";
    const isActive = trimmed === "Active";
    const tone = isActive
        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15"
        : "bg-gray-100 text-gray-600 ring-1 ring-gray-200";
    return (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
            {trimmed}
        </span>
    );
}

function AdvanceStatusBadge({ status }: { status: AdvanceStatus }) {
    const cfg = STATUS_CONFIG[status];
    return (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.badge}`}>
            {cfg.label}
        </span>
    );
}

function EmployeeDetailsBlock({
    employeeName,
    department,
    designation,
    employeeStatus,
}: {
    employeeName: string;
    department: string;
    designation: string;
    employeeStatus: string;
}) {
    return (
        <div className="rounded-md border border-[#0a2a5e]/15 bg-[#0a2a5e]/5 p-4">
            <p className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#0a2a5e]">
                <User className="h-3.5 w-3.5" aria-hidden />
                Employee details
            </p>
            <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                    <dt className="text-xs text-gray-500">Name</dt>
                    <dd className="mt-0.5 text-sm font-semibold text-gray-900">{employeeName || "—"}</dd>
                </div>
                <div>
                    <dt className="text-xs text-gray-500">Status</dt>
                    <dd className="mt-1">
                        {employeeStatus ? (
                            <EmployeeStatusBadge status={employeeStatus} />
                        ) : (
                            <span className="text-sm text-gray-900">—</span>
                        )}
                    </dd>
                </div>
                <div>
                    <dt className="text-xs text-gray-500">Department</dt>
                    <dd className="mt-0.5 text-sm font-semibold text-gray-900">{department || "—"}</dd>
                </div>
                <div>
                    <dt className="text-xs text-gray-500">Designation</dt>
                    <dd className="mt-0.5 text-sm font-semibold text-gray-900">{designation || "—"}</dd>
                </div>
            </dl>
        </div>
    );
}

export default function AdvancePaymentPage() {
    const [records, setRecords] = useState<AdvanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [viewDetail, setViewDetail] = useState<AdvanceRecord | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [formError, setFormError] = useState("");
    const [isLookingUpEmployee, setIsLookingUpEmployee] = useState(false);
    const [showEmployeeDetails, setShowEmployeeDetails] = useState(false);
    const [employeeLookupHint, setEmployeeLookupHint] = useState("");
    const lookupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchAdvancePayments = useCallback(async () => {
        try {
            setLoadError("");
            setIsLoading(true);
            const resp = await fetch("/api/admin/advance-payments", { cache: "no-store" });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(
                    typeof data.message === "string"
                        ? data.message
                        : "Failed to load advance payments",
                );
            }
            const rows: AdvanceApiRow[] = Array.isArray(data) ? data : [];
            setRecords(rows.map(apiToAdvance));
        } catch (error) {
            console.error("Error loading advance payments:", error);
            setLoadError(
                error instanceof Error ? error.message : "Failed to load advance payments",
            );
            setRecords([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchAdvancePayments();
    }, [fetchAdvancePayments]);

    const inputClass =
        "w-full rounded-md border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 disabled:bg-gray-50";
    const labelClass = "mb-1.5 block text-sm font-semibold text-gray-700";

    const lookupEmployeeById = useCallback(async (employeeId: string) => {
        const trimmed = employeeId.trim();
        if (!trimmed) {
            setShowEmployeeDetails(false);
            setEmployeeLookupHint("");
            setForm((prev) => ({
                ...prev,
                employeeName: "",
                department: "",
                designation: "",
                employeeStatus: "",
            }));
            return;
        }

        try {
            setIsLookingUpEmployee(true);
            setEmployeeLookupHint("");

            const resp = await fetch(
                `/api/admin/employees/lookup?employee_id=${encodeURIComponent(trimmed)}`,
                { cache: "no-store" },
            );

            if (!resp.ok) {
                if (resp.status === 404) {
                    setShowEmployeeDetails(false);
                    setEmployeeLookupHint("No employee found with this ID.");
                    setForm((prev) => ({
                        ...prev,
                        employeeName: "",
                        department: "",
                        designation: "",
                        employeeStatus: "",
                    }));
                    return;
                }
                const data = await resp.json().catch(() => ({}));
                throw new Error(typeof data.message === "string" ? data.message : "Lookup failed");
            }

            const data: EmployeeLookupRow = await resp.json();
            setShowEmployeeDetails(true);
            setEmployeeLookupHint("Employee details loaded.");
            setForm((prev) => ({
                ...prev,
                employeeName: data.full_name ?? "",
                department: data.department ?? "",
                designation: data.designation ?? "",
                employeeStatus: data.employee_status ?? "Active",
            }));
        } catch (error) {
            console.error("Employee lookup failed:", error);
            setShowEmployeeDetails(false);
            setEmployeeLookupHint("Could not load employee details. Try again.");
            setForm((prev) => ({
                ...prev,
                employeeName: "",
                department: "",
                designation: "",
                employeeStatus: "",
            }));
        } finally {
            setIsLookingUpEmployee(false);
        }
    }, []);

    useEffect(() => {
        if (!modalOpen) return;
        const trimmed = form.employeeId.trim();
        if (!trimmed) {
            setShowEmployeeDetails(false);
            setEmployeeLookupHint("");
            return;
        }
        if (lookupTimerRef.current) clearTimeout(lookupTimerRef.current);
        lookupTimerRef.current = setTimeout(() => {
            void lookupEmployeeById(trimmed);
        }, 400);
        return () => {
            if (lookupTimerRef.current) clearTimeout(lookupTimerRef.current);
        };
    }, [form.employeeId, modalOpen, lookupEmployeeById]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return records.filter((r) => {
            if (filterStatus && r.status !== filterStatus) return false;
            if (!q) return true;
            return (
                r.advanceId.toLowerCase().includes(q) ||
                r.employeeId.toLowerCase().includes(q) ||
                r.employeeName.toLowerCase().includes(q) ||
                r.department.toLowerCase().includes(q) ||
                r.purpose.toLowerCase().includes(q) ||
                STATUS_CONFIG[r.status].label.toLowerCase().includes(q)
            );
        });
    }, [records, search, filterStatus]);

    const stats = useMemo(() => {
        const active = records.filter((r) => r.status !== "cancelled");
        const outstanding = active.reduce((sum, r) => sum + remainingBalance(r), 0);
        const totalGiven = active.reduce((sum, r) => sum + r.amount, 0);
        const recovering = records.filter((r) => r.status === "recovering").length;
        const recovered = records.filter((r) => r.status === "recovered").length;
        return { total: records.length, outstanding, totalGiven, recovering, recovered };
    }, [records]);

    const resetEmployeeLookup = () => {
        setShowEmployeeDetails(false);
        setEmployeeLookupHint("");
        setIsLookingUpEmployee(false);
        if (lookupTimerRef.current) clearTimeout(lookupTimerRef.current);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingId(null);
        setForm(emptyForm());
        setFormError("");
        resetEmployeeLookup();
    };

    const closeViewModal = () => setViewDetail(null);

    const openAdd = () => {
        setForm(emptyForm());
        setEditingId(null);
        setFormError("");
        resetEmployeeLookup();
        setModalOpen(true);
    };

    const openEdit = (row: AdvanceRecord) => {
        setForm({
            employeeId: row.employeeId,
            employeeName: row.employeeName,
            department: row.department,
            designation: row.designation,
            employeeStatus: row.employeeStatus,
            amount: String(row.amount),
            advanceDate: row.advanceDate,
            recoveryStartMonth: row.recoveryStartMonth,
            monthlyDeduction: String(row.monthlyDeduction),
            emiMonths: row.emiMonths > 0 ? String(row.emiMonths) : "",
            paymentMode: row.paymentMode,
            status: row.status,
            purpose: row.purpose,
            notes: row.notes,
        });
        setEditingId(row.id);
        setShowEmployeeDetails(true);
        setEmployeeLookupHint("Employee details loaded.");
        setFormError("");
        setModalOpen(true);
    };

    const openView = (row: AdvanceRecord) => setViewDetail(row);

    const handleDelete = async (row: AdvanceRecord) => {
        if (!window.confirm(`Delete advance ${row.advanceId} for ${row.employeeName}?`)) return;
        try {
            const resp = await fetch(`/api/admin/advance-payments/${row.id}`, {
                method: "DELETE",
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Delete failed");
            }
            setRecords((prev) => prev.filter((r) => r.id !== row.id));
            if (viewDetail?.id === row.id) closeViewModal();
        } catch (error) {
            console.error("Delete advance failed:", error);
            alert(error instanceof Error ? error.message : "Failed to delete advance");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setFormError("");

        if (!form.employeeId.trim()) {
            setFormError("Employee ID is required.");
            return;
        }
        if (!showEmployeeDetails || !form.employeeName.trim()) {
            setFormError("Enter a valid Employee ID and wait for details to load.");
            return;
        }
        const amount = parseAmount(form.amount);
        if (amount <= 0) {
            setFormError("Advance amount must be greater than zero.");
            return;
        }
        if (!form.advanceDate) {
            setFormError("Advance date is required.");
            return;
        }

        const existing = editingId !== null ? records.find((r) => r.id === editingId) : null;
        const recoveredAmount = existing?.recoveredAmount ?? 0;
        const status = deriveStatus(amount, recoveredAmount, form.status);
        const isEdit = editingId !== null;
        const body = formToApiBody(form, status);

        try {
            setIsSubmitting(true);
            const resp = await fetch(
                isEdit ? `/api/admin/advance-payments/${editingId}` : "/api/admin/advance-payments",
                {
                    method: isEdit ? "PUT" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                },
            );
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Save failed");
            }
            const saved = apiToAdvance(data as AdvanceApiRow);
            if (isEdit) {
                setRecords((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
            } else {
                setRecords((prev) => [saved, ...prev]);
            }
            closeModal();
        } catch (error) {
            console.error("Save advance failed:", error);
            setFormError(error instanceof Error ? error.message : "Failed to save advance");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formRemaining = useMemo(() => {
        const amount = parseAmount(form.amount);
        const existing = editingId !== null ? records.find((r) => r.id === editingId) : null;
        const recovered = existing?.recoveredAmount ?? 0;
        return Math.max(0, amount - recovered);
    }, [form.amount, editingId, records]);

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {[
                    { label: "Total records", value: String(stats.total), tone: "text-[#0a2a5e]" },
                    { label: "Total given", value: formatInr(stats.totalGiven), tone: "text-[#06b6d4]" },
                    { label: "Outstanding", value: formatInr(stats.outstanding), tone: "text-amber-600" },
                    { label: "Recovering", value: String(stats.recovering), tone: "text-blue-600" },
                    { label: "Recovered", value: String(stats.recovered), tone: "text-emerald-600" },
                ].map((item) => (
                    <div
                        key={item.label}
                        className="rounded-md border border-gray-100 bg-white p-5 shadow-sm"
                    >
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            {item.label}
                        </p>
                        <p className={`mt-2 text-2xl font-black tabular-nums ${item.tone}`}>
                            {item.value}
                        </p>
                    </div>
                ))}
            </div>

            <div className="rounded-md border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative min-w-0 flex-1">
                        <Search
                            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                            aria-hidden
                        />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search advance ID, employee, purpose, status…"
                            className={`${inputClass} pl-10`}
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className={`${inputClass} w-full sm:w-44 shrink-0`}
                    >
                        <option value="">All statuses</option>
                        {(Object.keys(STATUS_CONFIG) as AdvanceStatus[]).map((key) => (
                            <option key={key} value={key}>
                                {STATUS_CONFIG[key].label}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={openAdd}
                        disabled={isLoading}
                        className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-md bg-[#0a2a5e] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60 sm:w-auto"
                    >
                        <Plus className="h-4 w-4" aria-hidden />
                        Add advance
                    </button>
                </div>
            </div>

            <div className="overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
                    <p className="text-sm font-semibold text-gray-900">Advance payment records</p>
                    <p className="mt-1 text-sm text-gray-500">
                        {isLoading ? "Loading…" : `Showing ${filtered.length} record(s)`}
                    </p>
                    {loadError ? (
                        <p className="mt-1 text-xs text-amber-600">{loadError}</p>
                    ) : null}
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 sm:px-6">
                                    Advance ID
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Employee
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Advance date
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Amount
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Recovered
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Balance
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Recovery
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 sm:px-6">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-10 text-center text-sm text-gray-500">
                                        <span className="inline-flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                            Loading advance records…
                                        </span>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-10 text-center text-sm text-gray-500">
                                        No advance records found.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50/80">
                                        <td className="whitespace-nowrap px-4 py-4 sm:px-6">
                                            <p className="text-sm font-bold text-[#0a2a5e]">
                                                {row.advanceId}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-sm font-semibold text-gray-900">
                                                {row.employeeName}
                                            </p>
                                            <p className="text-xs text-gray-500">{row.employeeId}</p>
                                            <p className="text-xs text-gray-400">{row.department}</p>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
                                            {formatDateDisplay(row.advanceDate)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-semibold tabular-nums text-gray-900">
                                            {formatInr(row.amount)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-right text-sm tabular-nums text-emerald-700">
                                            {formatInr(row.recoveredAmount)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-semibold tabular-nums text-amber-700">
                                            {formatInr(remainingBalance(row))}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-700">
                                            {row.monthlyDeduction > 0 || row.emiMonths > 0 ? (
                                                <>
                                                    {row.monthlyDeduction > 0 ? (
                                                        <p>{formatInr(row.monthlyDeduction)}/mo</p>
                                                    ) : null}
                                                    {row.emiMonths > 0 ? (
                                                        <p className="text-xs text-gray-600">
                                                            {formatEmiMonthsDisplay(row.emiMonths)} EMI
                                                        </p>
                                                    ) : null}
                                                    {row.recoveryStartMonth ? (
                                                        <p className="text-xs text-gray-500">
                                                            from {formatMonthDisplay(row.recoveryStartMonth)}
                                                        </p>
                                                    ) : null}
                                                </>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            <AdvanceStatusBadge status={row.status} />
                                        </td>
                                        <td className="px-4 py-4 text-right sm:px-6">
                                            <div className="inline-flex gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => openView(row)}
                                                    className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
                                                    aria-label="View advance"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openEdit(row)}
                                                    className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
                                                    aria-label="Edit advance"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(row)}
                                                    className="rounded-md p-2 text-red-500 hover:bg-red-50"
                                                    aria-label="Delete advance"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {viewDetail ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
                        aria-hidden
                        onClick={closeViewModal}
                    />
                    <div
                        role="dialog"
                        aria-modal="true"
                        className="relative flex max-h-[min(90vh,680px)] w-full max-w-lg flex-col overflow-hidden rounded-md border border-gray-200 bg-white shadow-2xl"
                    >
                        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-100 px-6 py-5">
                            <h3 className="text-lg font-bold text-[#001540]">Advance details</h3>
                            <button
                                type="button"
                                onClick={closeViewModal}
                                className="rounded-md p-2 text-gray-400 hover:bg-gray-100"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <div>
                                    <p className="text-xs text-gray-500">Advance ID</p>
                                    <p className="mt-1 text-sm font-bold text-[#0a2a5e]">
                                        {viewDetail.advanceId}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Employee ID</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">
                                        {viewDetail.employeeId}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Status</p>
                                    <div className="mt-1">
                                        <AdvanceStatusBadge status={viewDetail.status} />
                                    </div>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-xs text-gray-500">Employee</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">
                                        {viewDetail.employeeName}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Department</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">
                                        {viewDetail.department || "—"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Designation</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">
                                        {viewDetail.designation || "—"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Advance amount</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">
                                        {formatInr(viewDetail.amount)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Balance</p>
                                    <p className="mt-1 text-sm font-semibold text-amber-700">
                                        {formatInr(remainingBalance(viewDetail))}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Advance date</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">
                                        {formatDateDisplay(viewDetail.advanceDate)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Payment mode</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">
                                        {PAYMENT_MODE_LABELS[viewDetail.paymentMode]}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Monthly deduction</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">
                                        {viewDetail.monthlyDeduction > 0
                                            ? formatInr(viewDetail.monthlyDeduction)
                                            : "—"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Recovery from</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">
                                        {formatMonthDisplay(viewDetail.recoveryStartMonth)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Number of EMI months</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">
                                        {viewDetail.emiMonths > 0
                                            ? formatEmiMonthsDisplay(viewDetail.emiMonths)
                                            : "—"}
                                    </p>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-xs text-gray-500">Purpose</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900 whitespace-pre-wrap">
                                        {viewDetail.purpose || "—"}
                                    </p>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-xs text-gray-500">Notes</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900 whitespace-pre-wrap">
                                        {viewDetail.notes || "—"}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex shrink-0 justify-end border-t border-gray-100 px-6 py-4">
                            <button
                                type="button"
                                onClick={closeViewModal}
                                className="rounded-md bg-[#001540] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {modalOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
                        aria-hidden
                        onClick={closeModal}
                    />
                    <div
                        role="dialog"
                        aria-modal="true"
                        className="relative flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-md border border-gray-100 bg-white shadow-2xl"
                    >
                        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-100 bg-gradient-to-r from-[#06124f] to-[#0a2a5e] px-6 py-4">
                            <div>
                                <h3 className="text-lg font-bold text-white">
                                    {editingId !== null ? "Edit advance" : "Add advance"}
                                </h3>
                                <p className="mt-0.5 text-xs text-cyan-100/90">
                                    Record employee advance and salary recovery plan.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="rounded-md p-1.5 text-white/80 hover:bg-white/10"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                            <div className="flex-1 space-y-4 overflow-y-auto p-5">
                                {formError ? (
                                    <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                        {formError}
                                    </p>
                                ) : null}

                                <div>
                                    <label className={labelClass}>Employee ID</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={form.employeeId}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setForm((f) => ({
                                                    ...f,
                                                    employeeId: value,
                                                    employeeName: "",
                                                    department: "",
                                                    designation: "",
                                                    employeeStatus: "",
                                                }));
                                                setShowEmployeeDetails(false);
                                                setEmployeeLookupHint("");
                                            }}
                                            disabled={isLookingUpEmployee || editingId !== null}
                                            required
                                            placeholder="e.g. VIROS-001"
                                            className={`${inputClass} pr-10`}
                                        />
                                        {isLookingUpEmployee ? (
                                            <Loader2
                                                className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400"
                                                aria-hidden
                                            />
                                        ) : null}
                                    </div>
                                    {employeeLookupHint ? (
                                        <p
                                            className={`mt-1.5 text-xs ${
                                                employeeLookupHint.includes("loaded")
                                                    ? "text-emerald-600"
                                                    : "text-amber-600"
                                            }`}
                                        >
                                            {employeeLookupHint}
                                        </p>
                                    ) : null}
                                </div>

                                {showEmployeeDetails ? (
                                    <EmployeeDetailsBlock
                                        employeeName={form.employeeName}
                                        department={form.department}
                                        designation={form.designation}
                                        employeeStatus={form.employeeStatus}
                                    />
                                ) : null}

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelClass}>Advance amount</label>
                                        <div className="relative">
                                            <IndianRupee
                                                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                                                aria-hidden
                                            />
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={form.amount}
                                                onChange={(e) =>
                                                    setForm((f) => {
                                                        const amount = e.target.value;
                                                        const recoveryAmount = recoveryAmountFromForm(
                                                            amount,
                                                            editingId,
                                                            records,
                                                        );
                                                        const parsedMonths = parseEmiMonths(f.emiMonths);
                                                        const parsedMonthly = parseAmount(f.monthlyDeduction);
                                                        let monthlyDeduction = f.monthlyDeduction;
                                                        let emiMonths = f.emiMonths;
                                                        if (recoveryAmount > 0) {
                                                            if (parsedMonths > 0) {
                                                                monthlyDeduction = calcMonthlyDeductionFromEmi(
                                                                    recoveryAmount,
                                                                    parsedMonths,
                                                                );
                                                            } else if (parsedMonthly > 0) {
                                                                emiMonths = calcEmiMonthsFromDeduction(
                                                                    recoveryAmount,
                                                                    parsedMonthly,
                                                                );
                                                            }
                                                        }
                                                        return { ...f, amount, monthlyDeduction, emiMonths };
                                                    })
                                                }
                                                required
                                                placeholder="e.g. 15000 or 15000.75"
                                                className={`${inputClass} pl-10`}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Advance date</label>
                                        <input
                                            type="date"
                                            value={form.advanceDate}
                                            onChange={(e) =>
                                                setForm((f) => ({ ...f, advanceDate: e.target.value }))
                                            }
                                            required
                                            className={inputClass}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelClass}>Payment mode</label>
                                        <select
                                            value={form.paymentMode}
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    paymentMode: e.target.value as PaymentMode,
                                                }))
                                            }
                                            className={inputClass}
                                        >
                                            {(Object.keys(PAYMENT_MODE_LABELS) as PaymentMode[]).map(
                                                (key) => (
                                                    <option key={key} value={key}>
                                                        {PAYMENT_MODE_LABELS[key]}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Status</label>
                                        <select
                                            value={form.status}
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    status: e.target.value as AdvanceStatus,
                                                }))
                                            }
                                            className={inputClass}
                                        >
                                            {(Object.keys(STATUS_CONFIG) as AdvanceStatus[]).map(
                                                (key) => (
                                                    <option key={key} value={key}>
                                                        {STATUS_CONFIG[key].label}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </div>
                                </div>

                                <div className="rounded-md border border-gray-200 bg-gray-50/80 p-4 space-y-3">
                                    <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                        <Wallet className="h-3.5 w-3.5" aria-hidden />
                                        Salary recovery plan
                                    </p>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div>
                                            <label className={labelClass}>Monthly deduction</label>
                                            <div className="relative">
                                                <IndianRupee
                                                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                                                    aria-hidden
                                                />
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={form.monthlyDeduction}
                                                    onChange={(e) =>
                                                        setForm((f) => {
                                                            const monthlyDeduction = e.target.value;
                                                            const recoveryAmount = recoveryAmountFromForm(
                                                                f.amount,
                                                                editingId,
                                                                records,
                                                            );
                                                            const parsedMonthly = parseAmount(monthlyDeduction);
                                                            return {
                                                                ...f,
                                                                monthlyDeduction,
                                                                emiMonths:
                                                                    parsedMonthly > 0 && recoveryAmount > 0
                                                                        ? calcEmiMonthsFromDeduction(
                                                                              recoveryAmount,
                                                                              parsedMonthly,
                                                                          )
                                                                        : f.emiMonths,
                                                            };
                                                        })
                                                    }
                                                    placeholder="e.g. 2500 or 2500.50"
                                                    className={`${inputClass} pl-10`}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Number of EMI months</label>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={form.emiMonths}
                                                onChange={(e) =>
                                                    setForm((f) => {
                                                        const emiMonths = e.target.value;
                                                        const recoveryAmount = recoveryAmountFromForm(
                                                            f.amount,
                                                            editingId,
                                                            records,
                                                        );
                                                        const parsedMonths = parseEmiMonths(emiMonths);
                                                        return {
                                                            ...f,
                                                            emiMonths,
                                                            monthlyDeduction:
                                                                parsedMonths > 0 && recoveryAmount > 0
                                                                    ? calcMonthlyDeductionFromEmi(
                                                                          recoveryAmount,
                                                                          parsedMonths,
                                                                      )
                                                                    : f.monthlyDeduction,
                                                        };
                                                    })
                                                }
                                                placeholder="e.g. 6 or 6.5"
                                                className={inputClass}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Recovery start month</label>
                                        <input
                                            type="month"
                                            value={form.recoveryStartMonth}
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    recoveryStartMonth: e.target.value,
                                                }))
                                            }
                                            className={inputClass}
                                        />
                                    </div>
                                    {editingId !== null ? (
                                        <p className="text-xs text-gray-600">
                                            Outstanding balance:{" "}
                                            <span className="font-semibold text-amber-700">
                                                {formatInr(formRemaining)}
                                            </span>
                                        </p>
                                    ) : null}
                                </div>

                                <div>
                                    <label className={labelClass}>Purpose</label>
                                    <input
                                        type="text"
                                        value={form.purpose}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, purpose: e.target.value }))
                                        }
                                        placeholder="e.g. Medical emergency, travel advance"
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>
                                        Notes <span className="font-normal text-gray-400">(optional)</span>
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={form.notes}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, notes: e.target.value }))
                                        }
                                        placeholder="Recovery instructions, approval reference…"
                                        className={`${inputClass} resize-none`}
                                    />
                                </div>
                            </div>

                            <div className="flex shrink-0 justify-end gap-2 border-t border-gray-100 bg-gray-50/80 px-5 py-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-md border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        isSubmitting ||
                                        !showEmployeeDetails ||
                                        !form.employeeName.trim()
                                    }
                                    className="inline-flex items-center justify-center gap-2 rounded-md bg-[#0a2a5e] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                            Saving…
                                        </>
                                    ) : editingId !== null ? (
                                        "Save changes"
                                    ) : (
                                        "Create advance"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
