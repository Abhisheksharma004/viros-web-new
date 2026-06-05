import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { getAdminMonthlySummary } from "@/lib/adminAttendance";
import {
    ensureAdminEmployeeAdvancePaymentsTable,
    processAdvanceRecoveryForEmployeePayrollMonth,
    type AdvanceRecoveryLine,
    type AdvanceRecoverySkip,
} from "@/lib/adminEmployeeAdvancePayments";
import { ensureAdminEmployeesTable } from "@/lib/adminEmployees";
import {
    ensureAdminEmployeeSalariesTable,
    SALARY_SELECT_JOIN,
    type AdminEmployeeSalaryRow,
} from "@/lib/adminEmployeeSalaries";
import {
    computePayrollBreakdown,
    grossFromComponents,
    normalizeAttendanceForPayroll,
    roundMoney,
    safeNumber,
    statutoryFromComponents,
    type PayrollBreakdown,
} from "@/lib/payrollCalculation";

const TABLE = "admin_payroll_payments";
const PAYSLIP_PREFIX = "VEPS";
const PAYSLIP_SERIAL_LENGTH = 3;
const PAYROLL_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export type PayrollPaymentMode = "bank_transfer" | "cash" | "cheque";
export type PayrollPaymentStatus = "paid" | "cancelled";

export type AdminPayrollPaymentRow = RowDataPacket & {
    id: number;
    payslip_number: string;
    payroll_month: string;
    employee_id: string;
    salary_id: number | null;
    employee_name: string;
    department: string;
    gross_salary: number;
    per_day_salary: number;
    paid_days: number;
    working_days_in_month: number;
    earned_gross: number;
    pf: number;
    esi: number;
    tds: number;
    leave_deduction: number;
    absent_deduction: number;
    advance_deduction: number;
    net_payable: number;
    total_present: number;
    total_absent: number;
    paid_leave: number;
    unpaid_leave: number;
    payment_mode: PayrollPaymentMode;
    payment_status: PayrollPaymentStatus;
    paid_at: Date | string;
    paid_by: string | null;
    snapshot_json: string | Record<string, unknown> | null;
    notes: string | null;
    created_at: Date | string;
};

export type PayrollPaymentSnapshot = {
    payrollMonth: string;
    breakdown: PayrollBreakdown;
    earnings: {
        basic_salary: number;
        hra: number;
        conveyance: number;
        special_allowance: number;
        performance_allowance: number;
        bonus: number;
        other_allowance: number;
    };
    advanceRecovery: {
        processed: AdvanceRecoveryLine[];
        skipped: AdvanceRecoverySkip[];
        total_deducted: number;
    };
    employee?: {
        phone: string;
        designation: string;
        joiningDate: string;
        branch: string;
    };
    attendanceDetail?: {
        halfDay: number;
        weekOff: number;
    };
};

type DbConnection = Awaited<ReturnType<typeof pool.getConnection>>;

let ensureTablePromise: Promise<void> | null = null;

function parsePayrollMonth(value: unknown): string {
    if (typeof value !== "string") return "";
    const trimmed = value.trim().slice(0, 7);
    return PAYROLL_MONTH_PATTERN.test(trimmed) ? trimmed : "";
}

function payrollMonthParts(ym: string): { year: number; month: number } | null {
    const [y, m] = ym.split("-").map(Number);
    if (!y || !m || m < 1 || m > 12) return null;
    return { year: y, month: m };
}

function toIsoDateTime(value: Date | string): string {
    if (value instanceof Date) return value.toISOString();
    const text = String(value);
    if (text.includes("T")) return text;
    return `${text.replace(" ", "T")}Z`;
}

function parseSnapshot(raw: AdminPayrollPaymentRow["snapshot_json"]): PayrollPaymentSnapshot | null {
    if (!raw) return null;
    if (typeof raw === "object") return raw as PayrollPaymentSnapshot;
    try {
        return JSON.parse(raw) as PayrollPaymentSnapshot;
    } catch {
        return null;
    }
}

async function runEnsureAdminPayrollTable() {
    await ensureAdminEmployeeSalariesTable();
    await pool.query(`
        CREATE TABLE IF NOT EXISTS ${TABLE} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            payslip_number VARCHAR(16) NOT NULL,
            payroll_month VARCHAR(7) NOT NULL,
            employee_id VARCHAR(64) NOT NULL,
            salary_id INT NULL,
            employee_name VARCHAR(255) NOT NULL DEFAULT '',
            department VARCHAR(255) NOT NULL DEFAULT '',
            gross_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
            per_day_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
            paid_days DECIMAL(6,2) NOT NULL DEFAULT 0,
            working_days_in_month INT NOT NULL DEFAULT 0,
            earned_gross DECIMAL(12,2) NOT NULL DEFAULT 0,
            pf DECIMAL(12,2) NOT NULL DEFAULT 0,
            esi DECIMAL(12,2) NOT NULL DEFAULT 0,
            tds DECIMAL(12,2) NOT NULL DEFAULT 0,
            leave_deduction DECIMAL(12,2) NOT NULL DEFAULT 0,
            absent_deduction DECIMAL(12,2) NOT NULL DEFAULT 0,
            advance_deduction DECIMAL(12,2) NOT NULL DEFAULT 0,
            net_payable DECIMAL(12,2) NOT NULL DEFAULT 0,
            total_present INT NOT NULL DEFAULT 0,
            total_absent INT NOT NULL DEFAULT 0,
            paid_leave INT NOT NULL DEFAULT 0,
            unpaid_leave INT NOT NULL DEFAULT 0,
            payment_mode ENUM('bank_transfer', 'cash', 'cheque') NOT NULL DEFAULT 'bank_transfer',
            payment_status ENUM('paid', 'cancelled') NOT NULL DEFAULT 'paid',
            paid_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            paid_by VARCHAR(128) NULL,
            snapshot_json JSON NULL,
            notes TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_payroll_payslip_number (payslip_number),
            UNIQUE KEY uq_payroll_payment_employee_month (payroll_month, employee_id),
            INDEX idx_payroll_payments_month (payroll_month),
            INDEX idx_payroll_payments_employee (employee_id)
        )
    `);
}

export async function ensureAdminPayrollTable() {
    if (!ensureTablePromise) {
        ensureTablePromise = runEnsureAdminPayrollTable().catch((error) => {
            ensureTablePromise = null;
            throw error;
        });
    }
    await ensureTablePromise;
}

function getPayslipPeriod(payrollMonth: string): string {
    const [y, m] = payrollMonth.split("-").map(Number);
    if (!y || !m) {
        const now = new Date();
        return `${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getFullYear()).slice(-2)}`;
    }
    return `${String(m).padStart(2, "0")}${String(y).slice(-2)}`;
}

async function generateNextPayslipNumber(
    conn: DbConnection,
    payrollMonth: string,
): Promise<string> {
    const period = getPayslipPeriod(payrollMonth);
    const base = `${PAYSLIP_PREFIX}${period}`;

    const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT payslip_number FROM ${TABLE}
         WHERE payslip_number LIKE ?
         ORDER BY payslip_number DESC
         LIMIT 1
         FOR UPDATE`,
        [`${base}%`],
    );

    let nextSerial = 1;
    const lastId = rows[0]?.payslip_number;
    if (typeof lastId === "string" && lastId.startsWith(base)) {
        const parsed = Number.parseInt(lastId.slice(base.length), 10);
        if (Number.isFinite(parsed) && parsed >= 0) {
            nextSerial = parsed + 1;
        }
    }

    if (nextSerial > 10 ** PAYSLIP_SERIAL_LENGTH - 1) {
        throw new Error("Monthly payslip ID limit reached.");
    }

    return `${base}${String(nextSerial).padStart(PAYSLIP_SERIAL_LENGTH, "0")}`;
}

export function mapPayrollPaymentToApi(row: AdminPayrollPaymentRow) {
    const snapshot = parseSnapshot(row.snapshot_json);
    return {
        id: row.id,
        payslip_number: row.payslip_number,
        payroll_month: row.payroll_month,
        employee_id: row.employee_id,
        salary_id: row.salary_id,
        employee_name: row.employee_name,
        department: row.department,
        gross_salary: Number(row.gross_salary) || 0,
        per_day_salary: Number(row.per_day_salary) || 0,
        paid_days: Number(row.paid_days) || 0,
        working_days_in_month: Number(row.working_days_in_month) || 0,
        earned_gross: Number(row.earned_gross) || 0,
        pf: Number(row.pf) || 0,
        esi: Number(row.esi) || 0,
        tds: Number(row.tds) || 0,
        leave_deduction: Number(row.leave_deduction) || 0,
        absent_deduction: Number(row.absent_deduction) || 0,
        advance_deduction: Number(row.advance_deduction) || 0,
        net_payable: Number(row.net_payable) || 0,
        total_present: Number(row.total_present) || 0,
        total_absent: Number(row.total_absent) || 0,
        paid_leave: Number(row.paid_leave) || 0,
        unpaid_leave: Number(row.unpaid_leave) || 0,
        payment_mode: row.payment_mode,
        payment_status: row.payment_status,
        paid_at: toIsoDateTime(row.paid_at),
        paid_by: row.paid_by ?? "",
        notes: row.notes ?? "",
        snapshot,
    };
}

export async function listPayrollPayments(filters?: {
    payrollMonth?: string;
    employeeId?: string;
    limit?: number;
}) {
    await ensureAdminPayrollTable();

    const conditions: string[] = ["payment_status = 'paid'"];
    const params: (string | number)[] = [];

    const month = filters?.payrollMonth ? parsePayrollMonth(filters.payrollMonth) : "";
    if (month) {
        conditions.push("payroll_month = ?");
        params.push(month);
    }

    const employeeId = filters?.employeeId?.trim().toUpperCase();
    if (employeeId) {
        conditions.push("employee_id = ?");
        params.push(employeeId);
    }

    const limit = Math.min(Math.max(filters?.limit ?? 200, 1), 500);

    const [rows] = await pool.query<AdminPayrollPaymentRow[]>(
        `SELECT * FROM ${TABLE}
         WHERE ${conditions.join(" AND ")}
         ORDER BY paid_at DESC, id DESC
         LIMIT ?`,
        [...params, limit],
    );

    return rows.map(mapPayrollPaymentToApi);
}

export async function getPayrollPaymentById(id: number) {
    await ensureAdminPayrollTable();
    const [rows] = await pool.query<AdminPayrollPaymentRow[]>(
        `SELECT * FROM ${TABLE} WHERE id = ? LIMIT 1`,
        [id],
    );
    const row = rows[0];
    return row ? mapPayrollPaymentToApi(row) : null;
}

/** Payment record enriched with latest employee + attendance for payslip PDF. */
export async function getPaymentForPayslip(paymentId: number) {
    const payment = await getPayrollPaymentById(paymentId);
    if (!payment) return null;

    const employee = await loadEmployeePayslipMeta(payment.employee_id);
    const parts = payrollMonthParts(payment.payroll_month);
    let attendanceDetail = payment.snapshot?.attendanceDetail;

    if (parts) {
        const summary = await getAdminMonthlySummary(parts.year, parts.month);
        const att = summary.find(
            (r) => r.employeeId.toUpperCase() === payment.employee_id.toUpperCase(),
        );
        if (att) {
            attendanceDetail = {
                halfDay: att.halfDay,
                weekOff: att.weekOff,
            };
        }
    }

    return {
        ...payment,
        snapshot: {
            ...(payment.snapshot ?? {
                payrollMonth: payment.payroll_month,
                breakdown: {
                    grossSalary: payment.gross_salary,
                    perDaySalary: payment.per_day_salary,
                    paidDays: payment.paid_days,
                    earnedGross: payment.earned_gross,
                    totalPresent: payment.total_present,
                    totalAbsent: payment.total_absent,
                    paidLeave: payment.paid_leave,
                    unpaidLeave: payment.unpaid_leave,
                    netSalary: payment.gross_salary,
                    statutoryDeductions: payment.pf + payment.esi + payment.tds,
                    leaveDeduction: payment.leave_deduction,
                    absentDeduction: payment.absent_deduction,
                    advanceDeduction: payment.advance_deduction,
                    totalPayable: payment.net_payable,
                    workingDaysInMonth: payment.working_days_in_month,
                },
                earnings: {
                    basic_salary: 0,
                    hra: 0,
                    conveyance: 0,
                    special_allowance: 0,
                    performance_allowance: 0,
                    bonus: 0,
                    other_allowance: 0,
                },
                advanceRecovery: { processed: [], skipped: [], total_deducted: 0 },
            }),
            employee,
            attendanceDetail,
        },
    };
}

export async function getPayrollPaymentForEmployeeMonth(
    employeeId: string,
    payrollMonth: string,
) {
    await ensureAdminPayrollTable();
    const month = parsePayrollMonth(payrollMonth);
    if (!month) return null;

    const [rows] = await pool.query<AdminPayrollPaymentRow[]>(
        `SELECT * FROM ${TABLE}
         WHERE employee_id = ? AND payroll_month = ? AND payment_status = 'paid'
         LIMIT 1`,
        [employeeId.trim().toUpperCase(), month],
    );
    const row = rows[0];
    return row ? mapPayrollPaymentToApi(row) : null;
}

async function loadEmployeePayslipMeta(employeeId: string) {
    await ensureAdminEmployeesTable();
    const [rows] = await pool.query<
        (RowDataPacket & {
            personal_mobile: string | null;
            official_mobile: string | null;
            designation: string | null;
            joining_date: Date | string | null;
            branch_name: string | null;
        })[]
    >(
        `SELECT personal_mobile, official_mobile, designation, joining_date, branch_name
         FROM admin_employees WHERE employee_id = ? LIMIT 1`,
        [employeeId.trim().toUpperCase()],
    );
    const row = rows[0];
    if (!row) {
        return { phone: "", designation: "", joiningDate: "", branch: "Viros Entrepreneurs" };
    }
    const phone =
        (row.official_mobile ?? "").trim() || (row.personal_mobile ?? "").trim() || "";
    let joiningDate = "";
    if (row.joining_date) {
        const iso =
            row.joining_date instanceof Date
                ? row.joining_date.toISOString().slice(0, 10)
                : String(row.joining_date).slice(0, 10);
        const [y, m, d] = iso.split("-");
        if (y && m && d) joiningDate = `${d}/${m}/${y}`;
    }
    return {
        phone,
        designation: (row.designation ?? "").trim(),
        joiningDate,
        branch: (row.branch_name ?? "").trim() || "Viros Entrepreneurs",
    };
}

async function loadActiveSalary(employeeId: string): Promise<AdminEmployeeSalaryRow | null> {
    await ensureAdminEmployeeSalariesTable();
    const trimmed = employeeId.trim().toUpperCase();
    const [rows] = await pool.query<AdminEmployeeSalaryRow[]>(
        `${SALARY_SELECT_JOIN}
         WHERE s.employee_id = ? AND s.is_active = 1
         LIMIT 1`,
        [trimmed],
    );
    return rows[0] ?? null;
}

async function getAdvanceDeductionFromLedger(
    conn: DbConnection,
    employeeId: string,
    payrollMonth: string,
): Promise<number> {
    const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT COALESCE(SUM(l.deducted_amount), 0) AS total
         FROM admin_advance_recovery_ledger l
         INNER JOIN admin_employee_advance_payments a ON a.id = l.advance_payment_id
         WHERE a.employee_id = ? AND l.payroll_month = ?`,
        [employeeId.trim().toUpperCase(), payrollMonth],
    );
    return roundMoney(Number(rows[0]?.total) || 0);
}

export async function recordPayrollPayment(params: {
    employeeId: string;
    payrollMonth: string;
    paymentMode?: PayrollPaymentMode;
    paidBy?: string;
    notes?: string;
}) {
    const month = parsePayrollMonth(params.payrollMonth);
    if (!month) {
        throw new Error("Invalid payroll month. Use YYYY-MM format.");
    }

    const parts = payrollMonthParts(month);
    if (!parts) {
        throw new Error("Invalid payroll month.");
    }

    const employeeId = params.employeeId.trim().toUpperCase();
    if (!employeeId) {
        throw new Error("Employee ID is required.");
    }

    const paymentMode = params.paymentMode ?? "bank_transfer";
    if (!["bank_transfer", "cash", "cheque"].includes(paymentMode)) {
        throw new Error("Invalid payment mode.");
    }

    await ensureAdminPayrollTable();
    await ensureAdminEmployeeAdvancePaymentsTable();

    const existing = await getPayrollPaymentForEmployeeMonth(employeeId, month);
    if (existing) {
        throw new Error(
            `Salary already paid for ${employeeId} in ${month}. Payslip: ${existing.payslip_number}`,
        );
    }

    const salary = await loadActiveSalary(employeeId);
    if (!salary) {
        throw new Error("No active salary setup found for this employee.");
    }

    const monthlySummary = await getAdminMonthlySummary(parts.year, parts.month);
    const att = monthlySummary.find((r) => r.employeeId.toUpperCase() === employeeId);

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const advanceRecovery = await processAdvanceRecoveryForEmployeePayrollMonth(
            conn,
            employeeId,
            month,
        );

        const advanceDeduction =
            advanceRecovery.total_deducted > 0
                ? advanceRecovery.total_deducted
                : await getAdvanceDeductionFromLedger(conn, employeeId, month);

        const gross = grossFromComponents(salary);
        const statutory = statutoryFromComponents(salary);
        const breakdown = computePayrollBreakdown(
            gross,
            normalizeAttendanceForPayroll(att),
            safeNumber(advanceDeduction),
            statutory,
        );

        const employeeMeta = await loadEmployeePayslipMeta(employeeId);
        const snapshot: PayrollPaymentSnapshot = {
            payrollMonth: month,
            breakdown,
            earnings: {
                basic_salary: Number(salary.basic_salary) || 0,
                hra: Number(salary.hra) || 0,
                conveyance: Number(salary.conveyance) || 0,
                special_allowance: Number(salary.special_allowance) || 0,
                performance_allowance: Number(salary.performance_allowance) || 0,
                bonus: Number(salary.bonus) || 0,
                other_allowance: Number(salary.other_allowance) || 0,
            },
            advanceRecovery,
            employee: employeeMeta,
            attendanceDetail: {
                halfDay: att?.halfDay ?? 0,
                weekOff: att?.weekOff ?? 0,
            },
        };

        const payslipNumber = await generateNextPayslipNumber(conn, month);
        const paidBy = params.paidBy?.trim() || "Admin";

        const [result] = await conn.query<ResultSetHeader>(
            `INSERT INTO ${TABLE} (
                payslip_number, payroll_month, employee_id, salary_id,
                employee_name, department,
                gross_salary, per_day_salary, paid_days, working_days_in_month, earned_gross,
                pf, esi, tds, leave_deduction, absent_deduction, advance_deduction, net_payable,
                total_present, total_absent, paid_leave, unpaid_leave,
                payment_mode, payment_status, paid_by, snapshot_json, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', ?, ?, ?)`,
            [
                payslipNumber,
                month,
                employeeId,
                safeNumber(salary.id),
                salary.full_name ?? "",
                salary.department ?? "",
                safeNumber(breakdown.grossSalary),
                safeNumber(breakdown.perDaySalary),
                safeNumber(breakdown.paidDays),
                safeNumber(breakdown.workingDaysInMonth),
                safeNumber(breakdown.earnedGross),
                safeNumber(salary.pf),
                safeNumber(salary.esi),
                safeNumber(salary.tds),
                safeNumber(breakdown.leaveDeduction),
                safeNumber(breakdown.absentDeduction),
                safeNumber(breakdown.advanceDeduction),
                safeNumber(breakdown.totalPayable),
                safeNumber(breakdown.totalPresent),
                safeNumber(breakdown.totalAbsent),
                safeNumber(breakdown.paidLeave),
                safeNumber(breakdown.unpaidLeave),
                paymentMode,
                paidBy,
                JSON.stringify(snapshot),
                params.notes?.trim() || null,
            ],
        );

        await conn.commit();

        const insertId = safeNumber(result.insertId);
        if (!insertId) {
            throw new Error("Payment recorded but insert ID was missing.");
        }

        const payment = await getPayrollPaymentById(insertId);
        if (!payment) {
            throw new Error("Payment recorded but could not be loaded.");
        }
        return payment;
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
}
