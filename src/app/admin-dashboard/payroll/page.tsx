"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    computeAdvanceDeductionForPayrollMonth,
    type AdvancePaymentStatus,
} from "@/lib/advanceDeductionPreview";
import {
    computePayrollBreakdown,
    formatPayrollMonthDisplay,
    grossFromComponents,
    isCurrentPayrollMonth,
    normalizeAttendanceForPayroll,
    statutoryFromComponents,
} from "@/lib/payrollCalculation";
import { downloadPayslipPdf, type PayslipPaymentRecord } from "@/lib/payrollPayslipExport";
import Toast from "@/components/Toast";
import {
    Banknote,
    Calculator,
    CalendarDays,
    CheckCircle2,
    Download,
    ExternalLink,
    Eye,
    History,
    IndianRupee,
    Loader2,
    Pencil,
    Wallet,
    X,
} from "lucide-react";
import { useModulePermission } from "@/context/ModulePermissionContext";

type SalaryApiRow = {
    id: number;
    employee_id: string;
    full_name: string;
    department: string;
    is_active: boolean;
    basic_salary: number;
    hra: number;
    conveyance: number;
    special_allowance: number;
    performance_allowance: number;
    bonus: number;
    other_allowance: number;
    pf: number;
    esi: number;
    tds: number;
    advance_deduction: number;
    leave_deduction: number;
};

type AdvanceApiRow = {
    employee_id: string;
    amount: number;
    recovered_amount: number;
    recovery_start_month: string;
    monthly_deduction: number;
    emi_months: number;
    status: AdvancePaymentStatus;
};

type AttendanceMonthlyRow = {
    employeeId: string;
    fullName: string;
    present: number;
    late: number;
    absent: number;
    leave: number;
    halfDay: number;
    totalPresent: number;
    totalWorkingDaysInMonth: number;
    totalWorkingDaysToDate: number;
    weekOff?: number;
    holiday?: number;
};

type PayrollPaymentApi = PayslipPaymentRecord & {
    id: number;
    payment_status: string;
};

type PayrollTableRow = {
    salaryId: number;
    employeeId: string;
    employeeName: string;
    department: string;
    grossSalary: number;
    statutoryDeductions: number;
    totalPresent: number;
    totalAbsent: number;
    paidLeave: number;
    unpaidLeave: number;
    netSalary: number;
    leaveDeduction: number;
    absentDeduction: number;
    advanceDeduction: number;
    totalPayable: number;
    payment: PayrollPaymentApi | null;
};

function formatInr(amount: number): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}

function payrollMonthParts(ym: string): { year: number; month: number } | null {
    const [y, m] = ym.split("-").map(Number);
    if (!y || !m || m < 1 || m > 12) return null;
    return { year: y, month: m };
}

export default function PayrollPage() {
    const { write: canWrite, admin: isAdmin } = useModulePermission();
    const [payrollMonth, setPayrollMonth] = useState(() => new Date().toISOString().slice(0, 7));
    const [salaries, setSalaries] = useState<SalaryApiRow[]>([]);
    const [advances, setAdvances] = useState<AdvanceApiRow[]>([]);
    const [attendanceRows, setAttendanceRows] = useState<AttendanceMonthlyRow[]>([]);
    const [payments, setPayments] = useState<PayrollPaymentApi[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const [feedback, setFeedback] = useState("");
    const [payingEmployeeId, setPayingEmployeeId] = useState<string | null>(null);
    const [downloadingPaymentId, setDownloadingPaymentId] = useState<number | null>(null);
    const [viewDetail, setViewDetail] = useState<PayrollTableRow | null>(null);
    const [payConfirmTarget, setPayConfirmTarget] = useState<PayrollTableRow | null>(null);

    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
    const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false);
    const [isBulkPaying, setIsBulkPaying] = useState(false);
    const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);

    const inputClass =
        "w-full rounded-md border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 disabled:bg-gray-50";

    const fetchPayrollData = useCallback(async () => {
        const parts = payrollMonthParts(payrollMonth);
        if (!parts) return;

        try {
            setLoadError("");
            setIsLoading(true);

            const [salaryResp, advanceResp, attendanceResp, paymentsResp] = await Promise.all([
                fetch("/api/admin/salaries", { cache: "no-store" }),
                fetch("/api/admin/advance-payments", { cache: "no-store" }),
                fetch(
                    `/api/admin/attendance?view=monthly&year=${parts.year}&month=${parts.month}`,
                    { cache: "no-store" },
                ),
                fetch(
                    `/api/admin/payroll/payments?payroll_month=${encodeURIComponent(payrollMonth)}`,
                    { cache: "no-store" },
                ),
            ]);

            const salaryData = await salaryResp.json().catch(() => ({}));
            const advanceData = await advanceResp.json().catch(() => ({}));
            const attendanceData = await attendanceResp.json().catch(() => ({}));
            const paymentsData = await paymentsResp.json().catch(() => ({}));

            if (!salaryResp.ok) {
                throw new Error(
                    typeof salaryData.message === "string"
                        ? salaryData.message
                        : "Failed to load salaries",
                );
            }
            if (!advanceResp.ok) {
                throw new Error(
                    typeof advanceData.message === "string"
                        ? advanceData.message
                        : "Failed to load advances",
                );
            }
            if (!attendanceResp.ok) {
                throw new Error(
                    typeof attendanceData.message === "string"
                        ? attendanceData.message
                        : "Failed to load attendance",
                );
            }

            setSalaries(Array.isArray(salaryData) ? salaryData : []);
            setAdvances(
                Array.isArray(advanceData) ? (advanceData as AdvanceApiRow[]) : [],
            );
            setAttendanceRows(Array.isArray(attendanceData.rows) ? attendanceData.rows : []);
            setPayments(
                Array.isArray(paymentsData.payments)
                    ? (paymentsData.payments as PayrollPaymentApi[])
                    : [],
            );
        } catch (error) {
            console.error("Payroll data load failed:", error);
            setLoadError(error instanceof Error ? error.message : "Failed to load payroll data");
            setSalaries([]);
            setAdvances([]);
            setAttendanceRows([]);
            setPayments([]);
        } finally {
            setIsLoading(false);
        }
    }, [payrollMonth]);

    useEffect(() => {
        void fetchPayrollData();
    }, [fetchPayrollData]);

    const activeSalaries = useMemo(
        () => salaries.filter((s) => s.is_active),
        [salaries],
    );

    const advanceStats = useMemo(() => {
        const active = advances.filter((a) => a.status !== "cancelled");
        const outstanding = active.reduce(
            (sum, a) => sum + Math.max(0, a.amount - a.recovered_amount),
            0,
        );
        const recovering = advances.filter(
            (a) => a.status === "recovering" || a.status === "pending",
        ).length;
        return { outstanding, recovering };
    }, [advances]);

    const paymentsByEmployee = useMemo(
        () => new Map(payments.map((p) => [p.employee_id.toUpperCase(), p])),
        [payments],
    );

    const payrollTableRows = useMemo((): PayrollTableRow[] => {
        const attendanceByEmployee = new Map(
            attendanceRows.map((r) => [r.employeeId.toUpperCase(), r]),
        );

        return activeSalaries.map((salary) => {
            const empKey = salary.employee_id.toUpperCase();
            const att = attendanceByEmployee.get(empKey);
            const payment = paymentsByEmployee.get(empKey) ?? null;
            const gross = grossFromComponents(salary);
            const advanceDeduction = computeAdvanceDeductionForPayrollMonth(
                advances,
                salary.employee_id,
                payrollMonth,
            );
            const breakdown = computePayrollBreakdown(
                gross,
                normalizeAttendanceForPayroll(att),
                advanceDeduction,
                statutoryFromComponents(salary),
            );

            return {
                salaryId: salary.id,
                employeeId: salary.employee_id,
                employeeName: salary.full_name,
                department: salary.department,
                grossSalary: breakdown.grossSalary,
                statutoryDeductions: breakdown.statutoryDeductions,
                totalPresent: breakdown.totalPresent,
                totalAbsent: breakdown.totalAbsent,
                paidLeave: breakdown.paidLeave,
                unpaidLeave: breakdown.unpaidLeave,
                netSalary: breakdown.netSalary,
                leaveDeduction: breakdown.leaveDeduction,
                absentDeduction: breakdown.absentDeduction,
                advanceDeduction: breakdown.advanceDeduction,
                totalPayable: payment ? payment.net_payable : breakdown.totalPayable,
                payment,
            };
        });
    }, [activeSalaries, attendanceRows, advances, payrollMonth, paymentsByEmployee]);

    const executePaySalary = useCallback(
        async (row: PayrollTableRow) => {
            if (row.payment || payingEmployeeId) return;

            setFeedback("");
            setPayingEmployeeId(row.employeeId);
            try {
                const resp = await fetch("/api/admin/payroll/payments", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        employee_id: row.employeeId,
                        payroll_month: payrollMonth,
                        payment_mode: "bank_transfer",
                    }),
                });
                const data = await resp.json().catch(() => ({}));
                if (!resp.ok) {
                    throw new Error(
                        typeof data.message === "string"
                            ? data.message
                            : "Failed to record payment",
                    );
                }
                const payment = data.payment as PayrollPaymentApi | undefined;
                setFeedback(
                    payment
                        ? `Payment successfully recorded for ${row.employeeName} (${formatInr(payment.net_payable)}). Payslip ID: ${payment.payslip_number}`
                        : `Payment recorded for ${row.employeeName}.`,
                );
                setPayConfirmTarget(null);
                await fetchPayrollData();
            } catch (error) {
                console.error("Payroll payment failed:", error);
                setFeedback(
                    error instanceof Error ? error.message : "Failed to record payment",
                );
            } finally {
                setPayingEmployeeId(null);
            }
        },
        [fetchPayrollData, payingEmployeeId, payrollMonth],
    );

    const payableUnpaidRows = useMemo(
        () => payrollTableRows.filter((r) => !r.payment && r.totalPayable > 0),
        [payrollTableRows],
    );

    const selectedRows = useMemo(
        () =>
            payrollTableRows.filter(
                (r) => selectedEmployeeIds.includes(r.employeeId) && !r.payment && r.totalPayable > 0,
            ),
        [payrollTableRows, selectedEmployeeIds],
    );

    const isAllSelected = useMemo(
        () =>
            payableUnpaidRows.length > 0 &&
            payableUnpaidRows.every((r) => selectedEmployeeIds.includes(r.employeeId)),
        [payableUnpaidRows, selectedEmployeeIds],
    );

    const isSomeSelected = useMemo(
        () =>
            selectedEmployeeIds.length > 0 &&
            !isAllSelected &&
            payableUnpaidRows.some((r) => selectedEmployeeIds.includes(r.employeeId)),
        [selectedEmployeeIds, isAllSelected, payableUnpaidRows],
    );

    const selectedTotalPayable = useMemo(
        () => selectedRows.reduce((sum, r) => sum + r.totalPayable, 0),
        [selectedRows],
    );

    const handleToggleSelectAll = useCallback(() => {
        if (isAllSelected) {
            setSelectedEmployeeIds([]);
        } else {
            setSelectedEmployeeIds(payableUnpaidRows.map((r) => r.employeeId));
        }
    }, [isAllSelected, payableUnpaidRows]);

    const handleToggleSelectRow = useCallback((employeeId: string) => {
        setSelectedEmployeeIds((prev) =>
            prev.includes(employeeId)
                ? prev.filter((id) => id !== employeeId)
                : [...prev, employeeId],
        );
    }, []);

    const executeBulkPay = useCallback(async () => {
        if (selectedRows.length === 0 || isBulkPaying) return;

        setIsBulkPaying(true);
        setBulkProgress({ current: 0, total: selectedRows.length });

        let successCount = 0;
        let totalPaidSum = 0;

        for (let i = 0; i < selectedRows.length; i++) {
            const row = selectedRows[i];
            setBulkProgress({ current: i + 1, total: selectedRows.length });

            try {
                const resp = await fetch("/api/admin/payroll/payments", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        employee_id: row.employeeId,
                        payroll_month: payrollMonth,
                        payment_mode: "bank_transfer",
                    }),
                });

                if (resp.ok) {
                    const data = await resp.json().catch(() => ({}));
                    const payment = data.payment as PayrollPaymentApi | undefined;
                    successCount++;
                    totalPaidSum += payment?.net_payable ?? row.totalPayable;
                }
            } catch (error) {
                console.error(`Bulk payment error for ${row.employeeName}:`, error);
            }
        }

        setIsBulkPaying(false);
        setBulkProgress(null);
        setShowBulkConfirmModal(false);
        setSelectedEmployeeIds([]);
        setFeedback(
            `Bulk payment successfully recorded for ${successCount} employee(s) (Total: ${formatInr(totalPaidSum)}).`,
        );
        await fetchPayrollData();
    }, [selectedRows, isBulkPaying, payrollMonth, fetchPayrollData]);

    const handleDownloadPayslip = useCallback(async (payment: PayrollPaymentApi) => {
        setDownloadingPaymentId(payment.id);
        try {
            const resp = await fetch(
                `/api/admin/payroll/payments/${payment.id}?payslip=1`,
                { cache: "no-store" },
            );
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(
                    typeof data.message === "string"
                        ? data.message
                        : "Failed to load payslip data",
                );
            }
            await downloadPayslipPdf(data.payment as PayrollPaymentApi);
        } catch (error) {
            console.error("Payslip download failed:", error);
            setFeedback(error instanceof Error ? error.message : "Failed to generate payslip");
        } finally {
            setDownloadingPaymentId(null);
        }
    }, []);

    const salaryStats = useMemo(() => {
        const totalNet = payrollTableRows.reduce((sum, r) => sum + r.totalPayable, 0);
        const totalAdvanceDeduction = payrollTableRows.reduce(
            (sum, r) => sum + r.advanceDeduction,
            0,
        );
        const avg =
            payrollTableRows.length > 0 ? Math.round(totalNet / payrollTableRows.length) : 0;
        return {
            total: salaries.length,
            active: activeSalaries.length,
            totalNet,
            totalAdvanceDeduction,
            avg,
        };
    }, [payrollTableRows, salaries.length, activeSalaries.length]);

    const tableTotals = useMemo(() => {
        return payrollTableRows.reduce(
            (acc, row) => ({
                totalPresent: acc.totalPresent + row.totalPresent,
                totalAbsent: acc.totalAbsent + row.totalAbsent,
                paidLeave: acc.paidLeave + row.paidLeave,
                unpaidLeave: acc.unpaidLeave + row.unpaidLeave,
                netSalary: acc.netSalary + row.netSalary,
                leaveDeduction: acc.leaveDeduction + row.leaveDeduction,
                absentDeduction: acc.absentDeduction + row.absentDeduction,
                advanceDeduction: acc.advanceDeduction + row.advanceDeduction,
                totalPayable: acc.totalPayable + row.totalPayable,
            }),
            {
                totalPresent: 0,
                totalAbsent: 0,
                paidLeave: 0,
                unpaidLeave: 0,
                netSalary: 0,
                leaveDeduction: 0,
                absentDeduction: 0,
                advanceDeduction: 0,
                totalPayable: 0,
            },
        );
    }, [payrollTableRows]);

    return (
        <div className="mx-auto max-w-7xl space-y-5">
            {/* Toolbar */}
            <div className="flex flex-col gap-4 rounded-md border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#06b6d4]/10 text-[#06b6d4]">
                        <CalendarDays className="h-5 w-5" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
                            Payroll Month
                        </label>
                        <input
                            type="month"
                            value={payrollMonth}
                            onChange={(e) => setPayrollMonth(e.target.value)}
                            className="mt-0.5 rounded-md border border-gray-200 bg-gray-50/50 px-3 py-1.5 text-sm font-semibold text-gray-900 outline-none transition-all focus:border-[#06b6d4] focus:bg-white focus:ring-2 focus:ring-[#06b6d4]/20 hover:border-gray-300 cursor-pointer"
                        />
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href={`/admin-dashboard/payroll/history?month=${encodeURIComponent(payrollMonth)}`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 hover:text-gray-900 transition-all"
                    >
                        <History className="h-3.5 w-3.5 text-gray-500" aria-hidden />
                        Payment history
                    </Link>
                    <Link
                        href="/admin-dashboard/salary"
                        className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 hover:text-gray-900 transition-all"
                    >
                        Salary setup
                        <ExternalLink className="h-3.5 w-3.5 text-gray-400" aria-hidden />
                    </Link>
                    <Link
                        href="/admin-dashboard/advance-payment"
                        className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 hover:text-gray-900 transition-all"
                    >
                        Advance payment
                        <ExternalLink className="h-3.5 w-3.5 text-gray-400" aria-hidden />
                    </Link>
                </div>
            </div>

            {feedback ? (
                <Toast
                    message={feedback}
                    type={
                        feedback.toLowerCase().includes("fail") || feedback.toLowerCase().includes("error")
                            ? "error"
                            : "success"
                    }
                    onClose={() => setFeedback("")}
                    duration={4500}
                />
            ) : null}

            {loadError ? (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {loadError}
                </p>
            ) : null}

            {/* KPI cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    {
                        label: "Employees on payroll",
                        value: isLoading ? "—" : String(salaryStats.active),
                        sub: `${salaryStats.total} salary setup(s)`,
                        tone: "text-[#0a2a5e]",
                        icon: Banknote,
                    },
                    {
                        label: isCurrentPayrollMonth(payrollMonth)
                            ? "Payout till date"
                            : "Monthly payout",
                        value: isLoading ? "—" : formatInr(salaryStats.totalNet),
                        sub: isCurrentPayrollMonth(payrollMonth)
                            ? `Month start to today · avg ${formatInr(salaryStats.avg)}`
                            : `Avg ${formatInr(salaryStats.avg)} / employee`,
                        tone: "text-[#06b6d4]",
                        icon: IndianRupee,
                    },
                    {
                        label: "Advance outstanding",
                        value: isLoading ? "—" : formatInr(advanceStats.outstanding),
                        sub: `${advanceStats.recovering} active recovery`,
                        tone: "text-amber-600",
                        icon: Wallet,
                    },
                    {
                        label: "Advance deductions",
                        value: isLoading ? "—" : formatInr(salaryStats.totalAdvanceDeduction),
                        sub: "From recovery start month",
                        tone: "text-emerald-600",
                        icon: Calculator,
                    },
                ].map((item) => (
                    <div
                        key={item.label}
                        className="rounded-md border border-gray-100 bg-white p-4 shadow-sm"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                    {item.label}
                                </p>
                                <p
                                    className={`mt-1.5 text-xl font-extrabold tracking-tight tabular-nums truncate ${item.tone}`}
                                    title={item.value}
                                >
                                    {item.value}
                                </p>
                                <p className="mt-1 text-xs text-gray-500 truncate">{item.sub}</p>
                            </div>
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-50 text-[#3d7ab8]">
                                <item.icon className="h-4.5 w-4.5" aria-hidden />
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Payroll table */}
            <div className="overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 px-4 py-4 sm:px-6">
                    <div>
                        <p className="text-sm font-semibold text-gray-900">Payroll breakdown</p>
                        <p className="mt-0.5 text-xs text-gray-500">
                            {isLoading
                                ? "Loading…"
                                : `Showing ${payrollTableRows.length} employee(s) · ${formatPayrollMonthDisplay(payrollMonth)}${
                                      isCurrentPayrollMonth(payrollMonth)
                                          ? " · salary till today (present + paid leave × per day)"
                                          : ""
                                  }`}
                        </p>
                    </div>
                    {(canWrite || isAdmin) && selectedRows.length > 0 ? (
                        <button
                            type="button"
                            onClick={() => setShowBulkConfirmModal(true)}
                            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-all animate-in fade-in duration-150"
                        >
                            <Banknote className="h-4 w-4" />
                            Pay Selected ({selectedRows.length}) · {formatInr(selectedTotalPayable)}
                        </button>
                    ) : null}
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-[#0a2a5e]/8">
                            <tr>
                                <th className="w-10 px-4 py-3 text-center sm:px-6">
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        ref={(el) => {
                                            if (el) el.indeterminate = isSomeSelected;
                                        }}
                                        onChange={handleToggleSelectAll}
                                        disabled={payableUnpaidRows.length === 0}
                                        aria-label="Select all unpaid employees for bulk payment"
                                        title={
                                            payableUnpaidRows.length === 0
                                                ? "No unpaid employees available"
                                                : "Select all unpaid employees"
                                        }
                                        className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:opacity-40"
                                    />
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                    Employee
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                    Total present
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                    Total absent
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                    Paid leave
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                    Unpaid leave
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                    Net salary
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                    Leave deduction
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                    Absent deduction
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                    Advance deduction
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                    Total payable
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-[#0a2a5e] sm:px-6">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={12} className="px-6 py-10 text-center text-sm text-gray-500">
                                        <span className="inline-flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                            Loading payroll data…
                                        </span>
                                    </td>
                                </tr>
                            ) : payrollTableRows.length === 0 ? (
                                <tr>
                                    <td colSpan={12} className="px-6 py-10 text-center text-sm text-gray-500">
                                        No active salary setups.{" "}
                                        <Link
                                            href="/admin-dashboard/salary"
                                            className="font-semibold text-[#06b6d4] hover:underline"
                                        >
                                            Setup salary first
                                        </Link>
                                    </td>
                                </tr>
                            ) : (
                                <>
                                    {payrollTableRows.map((row, idx) => (
                                        <tr
                                            key={row.employeeId}
                                            className={`hover:bg-gray-50/80 ${
                                                selectedEmployeeIds.includes(row.employeeId)
                                                    ? "bg-emerald-50/30"
                                                    : idx % 2 === 1
                                                      ? "bg-gray-50/60"
                                                      : "bg-white"
                                            }`}
                                        >
                                            <td className="w-10 px-4 py-4 text-center sm:px-6">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedEmployeeIds.includes(row.employeeId)}
                                                    onChange={() => handleToggleSelectRow(row.employeeId)}
                                                    disabled={!!row.payment || row.totalPayable <= 0}
                                                    aria-label={`Select ${row.employeeName} for bulk payment`}
                                                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:opacity-30"
                                                />
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {row.employeeName}
                                                </p>
                                                <p className="text-xs text-gray-500">{row.employeeId}</p>
                                                <p className="text-xs text-gray-400">
                                                    {row.department || "—"}
                                                </p>
                                                {row.payment ? (
                                                    <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                                                        <CheckCircle2 className="h-3 w-3" aria-hidden />
                                                        Paid · {row.payment.payslip_number}
                                                    </p>
                                                ) : null}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4 text-center text-sm font-medium tabular-nums text-gray-900">
                                                {row.totalPresent}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4 text-center text-sm font-medium tabular-nums text-gray-700">
                                                {row.totalAbsent}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4 text-center text-sm font-medium tabular-nums text-gray-700">
                                                {row.paidLeave}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4 text-center text-sm font-medium tabular-nums text-gray-700">
                                                {row.unpaidLeave}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium tabular-nums text-gray-900">
                                                {formatInr(row.netSalary)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium tabular-nums text-amber-700">
                                                {formatInr(row.leaveDeduction)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium tabular-nums text-red-700">
                                                {formatInr(row.absentDeduction)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium tabular-nums text-blue-700">
                                                {formatInr(row.advanceDeduction)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-bold tabular-nums text-[#0a2a5e]">
                                                {formatInr(row.totalPayable)}
                                            </td>
                                            <td className="px-4 py-4 text-right sm:px-6">
                                                <div className="inline-flex gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewDetail(row)}
                                                        className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
                                                        aria-label={`View payroll for ${row.employeeName}`}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    {row.payment ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                void handleDownloadPayslip(row.payment!)
                                                            }
                                                            disabled={downloadingPaymentId === row.payment.id}
                                                            className="rounded-md p-2 text-[#0a2a5e] hover:bg-slate-100 disabled:opacity-60"
                                                            aria-label={`Download payslip for ${row.employeeName}`}
                                                            title="Download payslip"
                                                        >
                                                            {downloadingPaymentId === row.payment.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Download className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                    ) : (canWrite || isAdmin) ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setPayConfirmTarget(row)}
                                                            disabled={
                                                                payingEmployeeId === row.employeeId ||
                                                                row.totalPayable <= 0
                                                            }
                                                            className="rounded-md p-2 text-emerald-600 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                            aria-label={`Pay salary for ${row.employeeName}`}
                                                            title={
                                                                row.totalPayable <= 0
                                                                    ? "Nothing payable"
                                                                    : "Pay salary"
                                                            }
                                                        >
                                                            {payingEmployeeId === row.employeeId ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Banknote className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-50 font-semibold">
                                        <td className="w-10 px-4 py-4 sm:px-6" />
                                        <td className="px-4 py-4 text-sm text-[#0a2a5e]">
                                            Total ({payrollTableRows.length})
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-center text-sm tabular-nums text-gray-900">
                                            {tableTotals.totalPresent}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-center text-sm tabular-nums text-gray-900">
                                            {tableTotals.totalAbsent}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-center text-sm tabular-nums text-gray-900">
                                            {tableTotals.paidLeave}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-center text-sm tabular-nums text-gray-900">
                                            {tableTotals.unpaidLeave}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-right text-sm tabular-nums text-gray-900">
                                            {formatInr(tableTotals.netSalary)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-right text-sm tabular-nums text-amber-800">
                                            {formatInr(tableTotals.leaveDeduction)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-right text-sm tabular-nums text-red-800">
                                            {formatInr(tableTotals.absentDeduction)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-right text-sm tabular-nums text-blue-800">
                                            {formatInr(tableTotals.advanceDeduction)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-bold tabular-nums text-[#0a2a5e]">
                                            {formatInr(tableTotals.totalPayable)}
                                        </td>
                                        <td className="px-4 py-4 sm:px-6" />
                                    </tr>
                                </>
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
                        onClick={() => setViewDetail(null)}
                    />
                    <div
                        role="dialog"
                        aria-modal="true"
                        className="relative flex max-h-[min(90vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-md border border-gray-200 bg-white shadow-2xl"
                    >
                        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-100 px-6 py-5">
                            <div>
                                <h3 className="text-lg font-bold text-[#001540]">Payroll details</h3>
                                <p className="mt-0.5 text-sm text-gray-500">
                                    {formatPayrollMonthDisplay(payrollMonth)}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewDetail(null)}
                                className="rounded-md p-2 text-gray-400 hover:bg-gray-100"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                            <div className="mb-5 rounded-md border border-[#0a2a5e]/15 bg-[#0a2a5e]/5 p-4">
                                <p className="text-sm font-semibold text-gray-900">
                                    {viewDetail.employeeName}
                                </p>
                                <p className="text-xs text-gray-500">{viewDetail.employeeId}</p>
                                <p className="text-xs text-gray-400">
                                    {viewDetail.department || "—"}
                                </p>
                                {viewDetail.payment ? (
                                    <p className="mt-2 text-xs font-semibold text-emerald-700">
                                        Paid · {viewDetail.payment.payslip_number}
                                    </p>
                                ) : null}
                            </div>
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                                {[
                                    { label: "Total present", value: String(viewDetail.totalPresent) },
                                    { label: "Total absent", value: String(viewDetail.totalAbsent) },
                                    { label: "Paid leave", value: String(viewDetail.paidLeave) },
                                    { label: "Unpaid leave", value: String(viewDetail.unpaidLeave) },
                                    { label: "Gross salary", value: formatInr(viewDetail.grossSalary) },
                                    {
                                        label: "Statutory (PF/ESI/TDS)",
                                        value: formatInr(viewDetail.statutoryDeductions),
                                    },
                                    { label: "Net salary (monthly)", value: formatInr(viewDetail.netSalary) },
                                    {
                                        label: "Leave deduction",
                                        value: formatInr(viewDetail.leaveDeduction),
                                    },
                                    {
                                        label: "Absent deduction",
                                        value: formatInr(viewDetail.absentDeduction),
                                    },
                                    {
                                        label: "Advance deduction",
                                        value: formatInr(viewDetail.advanceDeduction),
                                    },
                                    {
                                        label: "Earned (till date)",
                                        value: formatInr(
                                            Math.max(
                                                0,
                                                viewDetail.totalPayable + viewDetail.advanceDeduction,
                                            ),
                                        ),
                                    },
                                ].map((item) => (
                                    <div key={item.label}>
                                        <p className="text-xs text-gray-500">{item.label}</p>
                                        <p className="mt-1 text-sm font-semibold text-gray-900">
                                            {item.value}
                                        </p>
                                    </div>
                                ))}
                                <div className="col-span-2 sm:col-span-3 rounded-md border border-emerald-100 bg-emerald-50/50 p-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                                        Total payable salary
                                    </p>
                                    <p className="mt-1 text-xl font-black tabular-nums text-emerald-900">
                                        {formatInr(viewDetail.totalPayable)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-gray-100 bg-gray-50/80 px-5 py-4">
                            {!viewDetail.payment && viewDetail.totalPayable > 0 ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const target = viewDetail;
                                        setViewDetail(null);
                                        setPayConfirmTarget(target);
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                                >
                                    <Banknote className="h-4 w-4" />
                                    Pay salary
                                </button>
                            ) : null}
                            {viewDetail.payment ? (
                                <button
                                    type="button"
                                    onClick={() => void handleDownloadPayslip(viewDetail.payment!)}
                                    disabled={downloadingPaymentId === viewDetail.payment.id}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-[#0a2a5e]/20 bg-white px-4 py-2 text-sm font-semibold text-[#0a2a5e] hover:bg-slate-50 disabled:opacity-60"
                                >
                                    {downloadingPaymentId === viewDetail.payment.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Download className="h-4 w-4" />
                                    )}
                                    Download payslip
                                </button>
                            ) : null}
                            <Link
                                href={`/admin-dashboard/attendance?tab=employee&employeeId=${encodeURIComponent(viewDetail.employeeId)}&month=${payrollMonth}`}
                                className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                <CalendarDays className="h-4 w-4" aria-hidden />
                                Attendance
                            </Link>
                            <Link
                                href="/admin-dashboard/salary"
                                className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                <Pencil className="h-4 w-4" aria-hidden />
                                Salary setup
                            </Link>
                            <button
                                type="button"
                                onClick={() => setViewDetail(null)}
                                className="rounded-md bg-[#0a2a5e] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Custom Payment Confirmation Popup Modal */}
            {payConfirmTarget ? (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => !payingEmployeeId && setPayConfirmTarget(null)}
                    />
                    <div className="relative w-full max-w-md rounded-md border border-gray-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <button
                            type="button"
                            onClick={() => setPayConfirmTarget(null)}
                            disabled={!!payingEmployeeId}
                            className="absolute right-4 top-4 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                <Wallet className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Confirm Salary Payment</h3>
                                <p className="text-xs font-medium text-gray-500">
                                    {formatPayrollMonthDisplay(payrollMonth)}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 rounded-md border border-emerald-100 bg-emerald-50/50 p-4 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Employee</span>
                                <span className="font-semibold text-gray-900">
                                    {payConfirmTarget.employeeName} ({payConfirmTarget.employeeId})
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Department</span>
                                <span className="font-semibold text-gray-900">
                                    {payConfirmTarget.department || "—"}
                                </span>
                            </div>
                            <div className="pt-2 border-t border-emerald-100 flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-700">Total Payable Amount</span>
                                <span className="text-xl font-black text-emerald-700">
                                    {formatInr(payConfirmTarget.totalPayable)}
                                </span>
                            </div>
                        </div>

                        <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                            Advance recovery and tax/statutory deductions will be applied automatically and recorded on the payslip.
                        </p>

                        <div className="mt-6 flex justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setPayConfirmTarget(null)}
                                disabled={!!payingEmployeeId}
                                className="rounded-md border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => void executePaySalary(payConfirmTarget)}
                                disabled={!!payingEmployeeId}
                                className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-60 transition-all"
                            >
                                {payingEmployeeId === payConfirmTarget.employeeId ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Processing…
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-4 w-4" />
                                        Confirm & Pay
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Custom Bulk Payment Confirmation Popup Modal */}
            {showBulkConfirmModal ? (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => !isBulkPaying && setShowBulkConfirmModal(false)}
                    />
                    <div className="relative w-full max-w-lg rounded-md border border-gray-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <button
                            type="button"
                            onClick={() => setShowBulkConfirmModal(false)}
                            disabled={isBulkPaying}
                            className="absolute right-4 top-4 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                <Wallet className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Confirm Bulk Salary Payment</h3>
                                <p className="text-xs font-medium text-gray-500">
                                    {formatPayrollMonthDisplay(payrollMonth)} · {selectedRows.length} employee(s) selected
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 max-h-48 overflow-y-auto rounded-md border border-gray-200 bg-gray-50/50 p-3 space-y-2">
                            {selectedRows.map((r) => (
                                <div
                                    key={r.employeeId}
                                    className="flex items-center justify-between text-xs py-1 border-b border-gray-200/60 last:border-0"
                                >
                                    <div>
                                        <span className="font-semibold text-gray-900">{r.employeeName}</span>
                                        <span className="ml-1.5 text-gray-500">({r.employeeId})</span>
                                    </div>
                                    <span className="font-bold tabular-nums text-emerald-700">
                                        {formatInr(r.totalPayable)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-3 flex items-center justify-between rounded-md border border-emerald-100 bg-emerald-50/50 p-3">
                            <span className="text-xs font-semibold text-gray-700">Total Bulk Payout Amount</span>
                            <span className="text-xl font-black text-emerald-700">
                                {formatInr(selectedTotalPayable)}
                            </span>
                        </div>

                        <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                            Advance recovery and statutory tax deductions will be recorded automatically for each selected employee.
                        </p>

                        <div className="mt-6 flex justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setShowBulkConfirmModal(false)}
                                disabled={isBulkPaying}
                                className="rounded-md border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => void executeBulkPay()}
                                disabled={isBulkPaying}
                                className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-60 transition-all"
                            >
                                {isBulkPaying ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Processing ({bulkProgress?.current ?? 0}/{bulkProgress?.total ?? 0})…
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-4 w-4" />
                                        Confirm & Pay ({selectedRows.length})
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
