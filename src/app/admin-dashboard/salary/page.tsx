"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Banknote,
    Eye,
    Loader2,
    Pencil,
    Plus,
    Save,
    Search,
    Trash2,
    User,
    X,
} from "lucide-react";

type EmployeeLookupRow = {
    employee_id: string;
    full_name: string;
    department: string;
    designation: string;
    official_email: string;
    employee_status: string;
};

type SalaryRecord = {
    id: number;
    employeeId: string;
    employeeName: string;
    department: string;
    designation: string;
    employeeStatus: string;
    basicSalary: number;
    hra: number;
    conveyance: number;
    specialAllowance: number;
    performanceAllowance: number;
    bonus: number;
    otherAllowance: number;
    pf: number;
    pfPercent: number;
    esi: number;
    tds: number;
    advanceDeduction: number;
    leaveDeduction: number;
    active: boolean;
    notes: string;
};

type SalaryFormState = {
    employeeId: string;
    employeeName: string;
    department: string;
    designation: string;
    employeeStatus: string;
    basicSalary: string;
    hra: string;
    conveyance: string;
    specialAllowance: string;
    performanceAllowance: string;
    bonus: string;
    otherAllowance: string;
    pf: string;
    pfPercent: string;
    esi: string;
    tds: string;
    advanceDeduction: string;
    leaveDeduction: string;
    active: boolean;
    notes: string;
};

type SalaryApiRow = {
    id: number;
    employee_id: string;
    full_name: string;
    department: string;
    designation: string;
    employee_status: string;
    basic_salary: number;
    hra: number;
    conveyance: number;
    special_allowance: number;
    performance_allowance: number;
    bonus: number;
    other_allowance: number;
    pf: number;
    pf_percent: number;
    esi: number;
    tds: number;
    advance_deduction: number;
    leave_deduction: number;
    is_active: boolean;
    notes: string;
};

function apiToSalary(row: SalaryApiRow): SalaryRecord {
    return {
        id: row.id,
        employeeId: row.employee_id,
        employeeName: row.full_name,
        department: row.department,
        designation: row.designation,
        employeeStatus: row.employee_status,
        basicSalary: row.basic_salary,
        hra: row.hra,
        conveyance: row.conveyance,
        specialAllowance: row.special_allowance,
        performanceAllowance: row.performance_allowance,
        bonus: row.bonus,
        otherAllowance: row.other_allowance,
        pf: row.pf,
        pfPercent: row.pf_percent,
        esi: row.esi,
        tds: row.tds,
        advanceDeduction: row.advance_deduction,
        leaveDeduction: row.leave_deduction,
        active: row.is_active,
        notes: row.notes,
    };
}

function formToApiBody(form: SalaryFormState) {
    return {
        employee_id: form.employeeId.trim().toUpperCase(),
        basic_salary: parseAmount(form.basicSalary),
        hra: parseAmount(form.hra),
        conveyance: parseAmount(form.conveyance),
        special_allowance: parseAmount(form.specialAllowance),
        performance_allowance: parseAmount(form.performanceAllowance),
        bonus: parseAmount(form.bonus),
        other_allowance: parseAmount(form.otherAllowance),
        pf: parseAmount(form.pf),
        pf_percent: parseAmount(form.pfPercent),
        esi: parseAmount(form.esi),
        tds: parseAmount(form.tds),
        advance_deduction: parseAmount(form.advanceDeduction),
        leave_deduction: parseAmount(form.leaveDeduction),
        is_active: form.active,
        notes: form.notes.trim(),
    };
}

function recordToApiBody(row: SalaryRecord) {
    return {
        basic_salary: row.basicSalary,
        hra: row.hra,
        conveyance: row.conveyance,
        special_allowance: row.specialAllowance,
        performance_allowance: row.performanceAllowance,
        bonus: row.bonus,
        other_allowance: row.otherAllowance,
        pf: row.pf,
        pf_percent: row.pfPercent,
        esi: row.esi,
        tds: row.tds,
        advance_deduction: row.advanceDeduction,
        leave_deduction: row.leaveDeduction,
        is_active: row.active,
        notes: row.notes,
    };
}

const emptyForm = (): SalaryFormState => ({
    employeeId: "",
    employeeName: "",
    department: "",
    designation: "",
    employeeStatus: "",
    basicSalary: "",
    hra: "",
    conveyance: "",
    specialAllowance: "",
    performanceAllowance: "",
    bonus: "",
    otherAllowance: "",
    pf: "",
    pfPercent: "12",
    esi: "",
    tds: "",
    advanceDeduction: "",
    leaveDeduction: "",
    active: true,
    notes: "",
});

function formatINR(amount: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount);
}

function parseAmount(value: string | number): number {
    if (typeof value === "number") return Math.max(0, value);
    return Math.max(0, Number(value) || 0);
}

function grossSalary(
    row: Pick<
        SalaryRecord,
        | "basicSalary"
        | "hra"
        | "conveyance"
        | "specialAllowance"
        | "performanceAllowance"
        | "bonus"
        | "otherAllowance"
    >,
) {
    return (
        row.basicSalary +
        row.hra +
        row.conveyance +
        row.specialAllowance +
        row.performanceAllowance +
        row.bonus +
        row.otherAllowance
    );
}

function totalDeductions(
    row: Pick<SalaryRecord, "pf" | "esi" | "tds" | "advanceDeduction" | "leaveDeduction">,
) {
    return row.pf + row.esi + row.tds + row.advanceDeduction + row.leaveDeduction;
}

function netSalary(row: SalaryRecord) {
    return grossSalary(row) - totalDeductions(row);
}

function grossFromForm(form: SalaryFormState) {
    return (
        parseAmount(form.basicSalary) +
        parseAmount(form.hra) +
        parseAmount(form.conveyance) +
        parseAmount(form.specialAllowance) +
        parseAmount(form.performanceAllowance) +
        parseAmount(form.bonus) +
        parseAmount(form.otherAllowance)
    );
}

function deductionsFromForm(form: SalaryFormState) {
    return (
        parseAmount(form.pf) +
        parseAmount(form.esi) +
        parseAmount(form.tds) +
        parseAmount(form.advanceDeduction) +
        parseAmount(form.leaveDeduction)
    );
}

const EARNING_FIELDS = [
    { key: "basicSalary" as const, label: "Basic Salary" },
    { key: "hra" as const, label: "HRA" },
    { key: "conveyance" as const, label: "Conveyance" },
    { key: "specialAllowance" as const, label: "Special Allowance" },
    { key: "performanceAllowance" as const, label: "Performance Allowance" },
    { key: "bonus" as const, label: "Bonus" },
    { key: "otherAllowance" as const, label: "Other Allowance" },
];

const DEDUCTION_FIELDS = [
    { key: "pf" as const, label: "PF" },
    { key: "esi" as const, label: "ESI" },
    { key: "tds" as const, label: "TDS" },
    { key: "advanceDeduction" as const, label: "Advance Deduction" },
    { key: "leaveDeduction" as const, label: "Leave Deduction" },
];

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

function sanitizeAmountInput(raw: string) {
    const cleaned = raw.replace(/,/g, "").trim();
    if (cleaned === "" || /^\d*\.?\d*$/.test(cleaned)) return cleaned;
    return null;
}

function sanitizePercentInput(raw: string) {
    const cleaned = raw.trim();
    if (cleaned === "" || /^\d*\.?\d*$/.test(cleaned)) return cleaned;
    return null;
}

function pfFromBasicAndPercent(basic: number, percent: number) {
    if (basic <= 0 || percent <= 0) return 0;
    return Math.round((basic * percent) / 100);
}

function derivePfPercent(row: Pick<SalaryRecord, "basicSalary" | "pf" | "pfPercent">) {
    if (row.pfPercent > 0) return row.pfPercent;
    if (row.basicSalary > 0 && row.pf > 0) {
        return Math.round((row.pf / row.basicSalary) * 1000) / 10;
    }
    return 12;
}

function SalaryAmountInput({
    value,
    onChange,
    disabled,
    inputClass,
}: {
    value: string;
    onChange?: (value: string) => void;
    disabled?: boolean;
    inputClass: string;
}) {
    return (
        <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
                ₹
            </span>
            <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={value}
                onChange={
                    onChange
                        ? (e) => {
                              const next = sanitizeAmountInput(e.target.value);
                              if (next !== null) onChange(next);
                          }
                        : undefined
                }
                onWheel={(e) => {
                    e.currentTarget.blur();
                }}
                disabled={disabled}
                readOnly={!onChange}
                className={`${inputClass} pl-8 text-right tabular-nums ${disabled || !onChange ? "bg-gray-50" : ""}`}
            />
        </div>
    );
}

function SalaryBreakdownPanel({
    mode,
    form,
    record,
    onFieldChange,
    gross,
    totalDeduction,
    net,
    pfPercent,
    onPfPercentChange,
    onApplyPfFromPercent,
    inputClass,
}: {
    mode: "edit" | "view";
    form?: SalaryFormState;
    record?: SalaryRecord;
    onFieldChange?: (field: keyof SalaryFormState, value: string) => void;
    gross: number;
    totalDeduction: number;
    net: number;
    pfPercent: string;
    onPfPercentChange?: (value: string) => void;
    onApplyPfFromPercent?: () => void;
    inputClass: string;
}) {
    const readOnly = mode === "view";

    const getValue = (key: keyof SalaryFormState): string => {
        if (mode === "edit" && form) return String(form[key] ?? "");
        if (record) {
            const map: Record<string, keyof SalaryRecord> = {
                basicSalary: "basicSalary",
                hra: "hra",
                conveyance: "conveyance",
                specialAllowance: "specialAllowance",
                performanceAllowance: "performanceAllowance",
                bonus: "bonus",
                otherAllowance: "otherAllowance",
                pf: "pf",
                esi: "esi",
                tds: "tds",
                advanceDeduction: "advanceDeduction",
                leaveDeduction: "leaveDeduction",
            };
            const recordKey = map[key];
            if (recordKey) return String(record[recordKey] ?? 0);
        }
        return "";
    };

    return (
        <div className="overflow-hidden rounded-md border border-gray-300 bg-white shadow-sm">
            <div className="border-b border-gray-300 bg-[#0a2a5e]/8 px-4 py-3 text-center">
                <h3 className="text-base font-bold text-[#0a2a5e] sm:text-lg">Salary Details</h3>
            </div>

            <table className="w-full border-collapse text-sm">
                <thead>
                    <tr className="border-b border-gray-300 bg-gray-50">
                        <th className="w-[55%] border-r border-gray-300 px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                            Earnings
                        </th>
                        <th className="px-4 py-2.5 text-right text-xs font-bold uppercase tracking-wide text-gray-700">
                            Amount
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {EARNING_FIELDS.map((row) => (
                        <tr key={row.key} className="border-b border-gray-200">
                            <td className="border-r border-gray-200 px-4 py-2 font-medium text-gray-800">
                                {row.label}
                            </td>
                            <td className="px-3 py-2">
                                <SalaryAmountInput
                                    value={getValue(row.key)}
                                    onChange={
                                        readOnly || !onFieldChange
                                            ? undefined
                                            : (v) => onFieldChange(row.key, v)
                                    }
                                    disabled={readOnly}
                                    inputClass={inputClass}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <table className="w-full border-collapse border-t border-gray-300 text-sm">
                <thead>
                    <tr className="border-b border-gray-300 bg-gray-50">
                        <th
                            colSpan={2}
                            className="border-r border-gray-300 px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-gray-700"
                        >
                            Deductions
                        </th>
                    </tr>
                    <tr className="border-b border-gray-300 bg-gray-50/80">
                        <th className="w-[55%] border-r border-gray-300 px-4 py-2 text-left text-xs font-bold uppercase tracking-wide text-gray-600">
                            Deductions
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-bold uppercase tracking-wide text-gray-600">
                            Amount
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {DEDUCTION_FIELDS.map((row) => (
                        <tr key={row.key} className="border-b border-gray-200">
                            <td className="border-r border-gray-200 px-4 py-2">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-medium text-gray-800">{row.label}</span>
                                    {row.key === "pf" && !readOnly && onPfPercentChange && onApplyPfFromPercent ? (
                                        <div className="flex shrink-0 items-center gap-1">
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={pfPercent}
                                                onChange={(e) => {
                                                    const next = sanitizePercentInput(e.target.value);
                                                    if (next !== null) onPfPercentChange(next);
                                                }}
                                                onBlur={onApplyPfFromPercent}
                                                onWheel={(e) => e.currentTarget.blur()}
                                                className="w-11 rounded-md border border-gray-200 bg-white px-1.5 py-1 text-[11px] font-semibold text-right tabular-nums text-gray-900 outline-none focus:border-[#06b6d4] focus:ring-1 focus:ring-[#06b6d4]/25"
                                                aria-label="PF percentage of basic salary"
                                            />
                                            <span className="text-[10px] font-medium text-gray-500">%</span>
                                            <span className="text-[10px] text-gray-400">of basic</span>
                                            <button
                                                type="button"
                                                onClick={onApplyPfFromPercent}
                                                className="text-[10px] font-semibold text-[#06b6d4] hover:underline"
                                            >
                                                Calc
                                            </button>
                                        </div>
                                    ) : row.key === "pf" && readOnly && record ? (
                                        <span className="shrink-0 text-[10px] text-gray-500">
                                            {derivePfPercent(record)}% of basic
                                        </span>
                                    ) : null}
                                </div>
                            </td>
                            <td className="px-3 py-2">
                                <SalaryAmountInput
                                    value={getValue(row.key)}
                                    onChange={
                                        readOnly || !onFieldChange
                                            ? undefined
                                            : (v) => onFieldChange(row.key, v)
                                    }
                                    disabled={readOnly}
                                    inputClass={inputClass}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <table className="w-full border-collapse border-t border-gray-300 text-sm">
                <thead>
                    <tr className="border-b border-gray-300 bg-[#06b6d4]/10">
                        <th
                            colSpan={2}
                            className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-[#0a2a5e]"
                        >
                            Final Calculation
                        </th>
                    </tr>
                    <tr className="border-b border-gray-300 bg-gray-50/80">
                        <th className="w-[55%] border-r border-gray-300 px-4 py-2 text-left text-xs font-bold uppercase tracking-wide text-gray-600">
                            Summary
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-bold uppercase tracking-wide text-gray-600">
                            Amount
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="border-b border-gray-200 bg-white">
                        <td className="border-r border-gray-200 px-4 py-2.5 font-semibold text-gray-800">
                            Gross Salary
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold tabular-nums text-gray-900">
                            {formatINR(gross)}
                        </td>
                    </tr>
                    <tr className="border-b border-gray-200 bg-white">
                        <td className="border-r border-gray-200 px-4 py-2.5 font-semibold text-gray-800">
                            Total Deduction
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold tabular-nums text-red-700">
                            {formatINR(totalDeduction)}
                        </td>
                    </tr>
                    <tr className="bg-[#0a2a5e]/5">
                        <td className="border-r border-gray-200 px-4 py-3 font-bold text-[#0a2a5e]">
                            Net Salary
                        </td>
                        <td className="px-4 py-3 text-right text-base font-black tabular-nums text-[#06b6d4]">
                            {formatINR(net)}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

export default function Page() {
    const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [viewDetail, setViewDetail] = useState<SalaryRecord | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState(emptyForm());
    const [formError, setFormError] = useState("");
    const [isLookingUpEmployee, setIsLookingUpEmployee] = useState(false);
    const [showEmployeeDetails, setShowEmployeeDetails] = useState(false);
    const [employeeLookupHint, setEmployeeLookupHint] = useState("");
    const lookupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchSalaries = useCallback(async () => {
        try {
            setLoadError("");
            setIsLoading(true);
            const resp = await fetch("/api/admin/salaries", { cache: "no-store" });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(
                    typeof data.message === "string" ? data.message : "Failed to load salaries",
                );
            }
            const rows: SalaryApiRow[] = Array.isArray(data) ? data : [];
            setSalaries(rows.map(apiToSalary));
        } catch (error) {
            console.error("Error loading salaries:", error);
            setLoadError(error instanceof Error ? error.message : "Failed to load salaries");
            setSalaries([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchSalaries();
    }, [fetchSalaries]);

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
            setEmployeeLookupHint("Could not load employee details.");
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
        if (!q) return salaries;
        return salaries.filter(
            (s) =>
                s.employeeId.toLowerCase().includes(q) ||
                s.employeeName.toLowerCase().includes(q) ||
                s.department.toLowerCase().includes(q) ||
                s.designation.toLowerCase().includes(q),
        );
    }, [salaries, search]);

    const stats = useMemo(() => {
        const active = salaries.filter((s) => s.active);
        const totalNet = active.reduce((sum, s) => sum + netSalary(s), 0);
        const avg = active.length > 0 ? Math.round(totalNet / active.length) : 0;
        return { total: salaries.length, active: active.length, totalNet, avg };
    }, [salaries]);

    const formGross = useMemo(() => grossFromForm(form), [form]);
    const formDeductions = useMemo(() => deductionsFromForm(form), [form]);
    const formNet = useMemo(() => formGross - formDeductions, [formGross, formDeductions]);

    const applyPfFromPercent = useCallback(() => {
        const basic = parseAmount(form.basicSalary);
        const pct = parseAmount(form.pfPercent);
        if (basic <= 0 || pct <= 0) return;
        setForm((f) => ({ ...f, pf: String(pfFromBasicAndPercent(basic, pct)) }));
    }, [form.basicSalary, form.pfPercent]);

    const updateFormField = (field: keyof SalaryFormState, value: string) => {
        setForm((f) => ({ ...f, [field]: value }));
        setFormError("");
    };

    const resetEmployeeLookup = () => {
        setShowEmployeeDetails(false);
        setEmployeeLookupHint("");
        setIsLookingUpEmployee(false);
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

    const openEdit = (row: SalaryRecord) => {
        setForm({
            employeeId: row.employeeId,
            employeeName: row.employeeName,
            department: row.department,
            designation: row.designation,
            employeeStatus: row.employeeStatus,
            basicSalary: String(row.basicSalary),
            hra: String(row.hra),
            conveyance: String(row.conveyance),
            specialAllowance: String(row.specialAllowance),
            performanceAllowance: String(row.performanceAllowance),
            bonus: String(row.bonus),
            otherAllowance: String(row.otherAllowance),
            pf: String(row.pf),
            pfPercent: String(derivePfPercent(row)),
            esi: String(row.esi),
            tds: String(row.tds),
            advanceDeduction: String(row.advanceDeduction),
            leaveDeduction: String(row.leaveDeduction),
            active: row.active,
            notes: row.notes,
        });
        setEditingId(row.id);
        setShowEmployeeDetails(true);
        setEmployeeLookupHint("Employee details loaded.");
        setFormError("");
        setModalOpen(true);
    };

    const openView = (row: SalaryRecord) => setViewDetail(row);

    const handleDelete = async (row: SalaryRecord) => {
        if (!window.confirm(`Remove salary setup for ${row.employeeName}?`)) return;
        try {
            const resp = await fetch(`/api/admin/salaries/${row.id}`, { method: "DELETE" });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Delete failed");
            }
            setSalaries((prev) => prev.filter((s) => s.id !== row.id));
        } catch (error) {
            console.error("Delete salary failed:", error);
            alert(error instanceof Error ? error.message : "Failed to delete salary");
        }
    };

    const toggleActive = async (row: SalaryRecord) => {
        const nextActive = !row.active;
        try {
            const resp = await fetch(`/api/admin/salaries/${row.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...recordToApiBody(row),
                    is_active: nextActive,
                }),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Update failed");
            }
            const saved = apiToSalary(data as SalaryApiRow);
            setSalaries((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
        } catch (error) {
            console.error("Toggle salary active failed:", error);
            alert(error instanceof Error ? error.message : "Failed to update status");
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
        if ((Number(form.basicSalary) || 0) <= 0) {
            setFormError("Basic salary must be greater than zero.");
            return;
        }

        const isEdit = editingId !== null;
        const body = formToApiBody(form);

        try {
            setIsSubmitting(true);
            const resp = await fetch(isEdit ? `/api/admin/salaries/${editingId}` : "/api/admin/salaries", {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Save failed");
            }
            const saved = apiToSalary(data as SalaryApiRow);
            if (isEdit) {
                setSalaries((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
            } else {
                setSalaries((prev) => [saved, ...prev]);
            }
            closeModal();
        } catch (error) {
            console.error("Save salary failed:", error);
            setFormError(error instanceof Error ? error.message : "Failed to save salary");
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass =
        "w-full rounded-md border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 disabled:bg-gray-50 disabled:text-gray-500";
    const labelClass = "mb-1.5 block text-sm font-semibold text-gray-700";

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                {loadError ? <p className="text-xs text-amber-600">{loadError}</p> : <span className="hidden sm:block" aria-hidden />}
                <button
                    type="button"
                    onClick={openAdd}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-[#0a2a5e] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60"
                >
                    <Plus className="h-4 w-4" aria-hidden />
                    Setup salary
                </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-md border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Employees on payroll</p>
                    <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.total}</p>
                </div>
                <div className="rounded-md border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Active setups</p>
                    <p className="mt-2 text-3xl font-semibold text-[#06b6d4]">{stats.active}</p>
                </div>
                <div className="rounded-md border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Total monthly payout</p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900 sm:text-3xl">
                        {formatINR(stats.totalNet)}
                    </p>
                </div>
                <div className="rounded-md border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Average net salary</p>
                    <p className="mt-2 text-2xl font-semibold text-emerald-600 sm:text-3xl">
                        {formatINR(stats.avg)}
                    </p>
                </div>
            </div>

            <div className="relative rounded-md border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
                <Search className="pointer-events-none absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 sm:left-8" />
                <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by employee ID, name, department…"
                    className={`${inputClass} pl-10`}
                />
            </div>

            <div className="overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
                    <p className="text-sm font-semibold text-gray-900">Salary records</p>
                    <p className="mt-1 text-sm text-gray-500">
                        {isLoading ? "Loading…" : `Showing ${filtered.length} record(s)`}
                    </p>
                </div>
                <div className="overflow-x-auto">
                    {isLoading && (
                        <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-gray-500">
                            <Loader2 className="h-5 w-5 animate-spin text-[#06b6d4]" aria-hidden />
                            Loading salary records…
                        </div>
                    )}
                    {!isLoading && (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-[#0a2a5e]/8">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#0a2a5e] sm:px-6">
                                    Employee
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                    Dept. / Role
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                    Basic
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                    Gross
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                    Deductions
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                    Net (monthly)
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-[#0a2a5e] sm:px-6">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500">
                                        No salary records found. Click Setup salary to add one.
                                    </td>
                                </tr>
                            )}
                            {filtered.map((row, idx) => (
                                <tr
                                    key={row.id}
                                    className={idx % 2 === 1 ? "bg-gray-50/60" : "bg-white"}
                                >
                                    <td className="px-4 py-4 sm:px-6">
                                        <p className="text-sm font-semibold text-gray-900">{row.employeeId}</p>
                                        <p className="text-xs text-gray-500">{row.employeeName}</p>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-700">
                                        <p className="font-medium text-gray-900">{row.department || "—"}</p>
                                        <p className="text-xs text-gray-500">{row.designation || "—"}</p>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900">
                                        {formatINR(row.basicSalary)}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
                                        {formatINR(grossSalary(row))}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-red-700">
                                        {formatINR(totalDeductions(row))}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-4 text-sm font-bold text-[#0a2a5e]">
                                        {formatINR(netSalary(row))}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-4">
                                        <span
                                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${
                                                row.active
                                                    ? "bg-[#06b6d4]/15 text-[#0a2a5e] ring-[#06b6d4]/30"
                                                    : "bg-gray-100 text-gray-600 ring-gray-300/50"
                                            }`}
                                        >
                                            {row.active ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-4 text-right sm:px-6">
                                        <div className="inline-flex gap-1">
                                            <button
                                                type="button"
                                                onClick={() => openView(row)}
                                                className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
                                                title="View"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => openEdit(row)}
                                                className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
                                                title="Edit"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => toggleActive(row)}
                                                className="rounded-md px-2 py-2 text-xs font-semibold text-[#06b6d4] hover:bg-[#06b6d4]/10"
                                            >
                                                {row.active ? "Off" : "On"}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(row)}
                                                className="rounded-md p-2 text-red-500 hover:bg-red-50"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    )}
                </div>
            </div>

            {viewDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
                    <div
                        className="absolute inset-0 bg-black/40"
                        aria-hidden
                        onClick={closeViewModal}
                    />
                    <div
                        role="dialog"
                        aria-modal="true"
                        className="relative max-h-[min(90vh,820px)] w-full max-w-3xl overflow-y-auto rounded-md border border-gray-200 bg-white shadow-2xl"
                    >
                        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                            <h3 className="text-lg font-bold text-[#0a2a5e]">Salary details</h3>
                            <button type="button" onClick={closeViewModal} className="rounded-md p-2 hover:bg-gray-100">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="space-y-4 px-6 py-6">
                            <EmployeeDetailsBlock
                                employeeName={viewDetail.employeeName}
                                department={viewDetail.department}
                                designation={viewDetail.designation}
                                employeeStatus={viewDetail.employeeStatus}
                            />
                            <p className="text-xs text-gray-500">
                                Employee ID:{" "}
                                <span className="font-semibold text-gray-800">{viewDetail.employeeId}</span>
                            </p>
                            <SalaryBreakdownPanel
                                mode="view"
                                record={viewDetail}
                                gross={grossSalary(viewDetail)}
                                totalDeduction={totalDeductions(viewDetail)}
                                net={netSalary(viewDetail)}
                                pfPercent={String(derivePfPercent(viewDetail))}
                                inputClass={inputClass}
                            />
                            {viewDetail.notes && (
                                <div className="rounded-md border border-gray-100 bg-gray-50 px-4 py-3">
                                    <p className="text-xs font-semibold text-gray-500">Notes</p>
                                    <p className="mt-1 text-sm text-gray-700">{viewDetail.notes}</p>
                                </div>
                            )}
                        </div>
                        <div className="border-t border-gray-100 px-6 py-4 text-right">
                            <button
                                type="button"
                                onClick={closeViewModal}
                                className="rounded-md bg-[#0a2a5e] px-5 py-2.5 text-sm font-semibold text-white"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
                    <div className="absolute inset-0 bg-black/50" aria-hidden onClick={closeModal} />
                    <div
                        role="dialog"
                        aria-modal="true"
                        className="relative flex max-h-[min(92vh,900px)] w-full max-w-3xl flex-col overflow-hidden rounded-t-lg border border-gray-200 bg-white shadow-2xl sm:rounded-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            className="shrink-0 border-b border-white/10 px-5 py-4 sm:px-6"
                            style={{
                                background:
                                    "linear-gradient(135deg, #06124f 0%, #0a2a5e 55%, #0d3a7a 100%)",
                            }}
                        >
                            <div className="flex items-start justify-between gap-3 text-white">
                                <div>
                                    <h2 className="text-lg font-bold">
                                        {editingId !== null ? "Edit salary setup" : "Setup employee salary"}
                                    </h2>
                                    <p className="text-xs text-white/75">
                                        Earnings and deductions
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-full bg-white/15 p-2 hover:bg-white/25"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                            <div className="space-y-5 p-5 sm:p-6">
                                {formError && (
                                    <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        {formError}
                                    </p>
                                )}

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
                                            onBlur={() => {
                                                if (form.employeeId.trim()) {
                                                    void lookupEmployeeById(form.employeeId);
                                                }
                                            }}
                                            disabled={editingId !== null || isLookingUpEmployee}
                                            required
                                            placeholder="e.g. VIROS-001"
                                            className={inputClass}
                                        />
                                        {isLookingUpEmployee && (
                                            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
                                        )}
                                    </div>
                                    {employeeLookupHint && (
                                        <p
                                            className={`mt-1 text-xs ${employeeLookupHint.includes("loaded") ? "text-emerald-600" : "text-amber-600"}`}
                                        >
                                            {employeeLookupHint}
                                        </p>
                                    )}
                                </div>

                                {showEmployeeDetails && (
                                    <EmployeeDetailsBlock
                                        employeeName={form.employeeName}
                                        department={form.department}
                                        designation={form.designation}
                                        employeeStatus={form.employeeStatus}
                                    />
                                )}

                                <SalaryBreakdownPanel
                                    mode="edit"
                                    form={form}
                                    onFieldChange={updateFormField}
                                    gross={formGross}
                                    totalDeduction={formDeductions}
                                    net={formNet}
                                    pfPercent={form.pfPercent}
                                    onPfPercentChange={(value) => updateFormField("pfPercent", value)}
                                    onApplyPfFromPercent={applyPfFromPercent}
                                    inputClass={inputClass}
                                />

                                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={form.active}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, active: e.target.checked }))
                                        }
                                        className="h-4 w-4 rounded border-gray-300 text-[#06b6d4]"
                                    />
                                    Active salary setup
                                </label>

                                <div>
                                    <label className={labelClass}>Notes</label>
                                    <textarea
                                        value={form.notes}
                                        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                                        rows={2}
                                        className={`${inputClass} resize-none`}
                                        placeholder="Increment notes, loan recovery, etc."
                                    />
                                </div>
                            </div>

                            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-gray-100 bg-white p-4 sm:px-6">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-md border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="inline-flex items-center gap-2 rounded-md bg-[#06b6d4] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    {isSubmitting ? "Saving…" : "Save salary"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
