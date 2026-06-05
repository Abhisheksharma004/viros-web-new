/** Shared payroll math (client + server safe — no DB). */

export type AttendanceForPayroll = {
    present: number;
    late: number;
    leave: number;
    halfDay: number;
    absent: number;
    totalWorkingDaysInMonth: number;
};

export type PayrollBreakdown = {
    grossSalary: number;
    perDaySalary: number;
    paidDays: number;
    earnedGross: number;
    totalPresent: number;
    totalAbsent: number;
    paidLeave: number;
    unpaidLeave: number;
    netSalary: number;
    statutoryDeductions: number;
    leaveDeduction: number;
    absentDeduction: number;
    advanceDeduction: number;
    totalPayable: number;
    workingDaysInMonth: number;
};

export function safeNumber(value: unknown, fallback = 0): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

export function roundMoney(amount: number): number {
    const n = safeNumber(amount);
    return Math.round(n * 100) / 100;
}

export function grossFromComponents(components: {
    basic_salary: number;
    hra: number;
    conveyance: number;
    special_allowance: number;
    performance_allowance: number;
    bonus: number;
    other_allowance: number;
}): number {
    return (
        safeNumber(components.basic_salary) +
        safeNumber(components.hra) +
        safeNumber(components.conveyance) +
        safeNumber(components.special_allowance) +
        safeNumber(components.performance_allowance) +
        safeNumber(components.bonus) +
        safeNumber(components.other_allowance)
    );
}

export function statutoryFromComponents(components: {
    pf: number;
    esi: number;
    tds: number;
}): number {
    return safeNumber(components.pf) + safeNumber(components.esi) + safeNumber(components.tds);
}

export function computePerDaySalary(gross: number, totalWorkingDaysInMonth: number): number {
    if (gross <= 0 || totalWorkingDaysInMonth <= 0) return 0;
    return gross / totalWorkingDaysInMonth;
}

export function computePaidDays(att: AttendanceForPayroll | null | undefined): number {
    if (!att) return 0;
    return (
        safeNumber(att.present) +
        safeNumber(att.late) +
        safeNumber(att.leave) +
        safeNumber(att.halfDay) * 0.5
    );
}

export function normalizeAttendanceForPayroll(
    att: Partial<AttendanceForPayroll> | null | undefined,
): AttendanceForPayroll | null {
    if (!att) return null;
    return {
        present: safeNumber(att.present),
        late: safeNumber(att.late),
        leave: safeNumber(att.leave),
        halfDay: safeNumber(att.halfDay),
        absent: safeNumber(att.absent),
        totalWorkingDaysInMonth: safeNumber(att.totalWorkingDaysInMonth),
    };
}

export function computeAbsentDeduction(perDaySalary: number, totalAbsent: number): number {
    if (totalAbsent <= 0 || perDaySalary <= 0) return 0;
    return roundMoney(perDaySalary * totalAbsent);
}

export function computePayrollBreakdown(
    gross: number,
    att: AttendanceForPayroll | null | undefined,
    advanceDeduction: number,
    statutory?: number,
): PayrollBreakdown {
    const normalized = normalizeAttendanceForPayroll(att);
    const monthWorkingDays = normalized?.totalWorkingDaysInMonth ?? 0;
    const perDaySalary = computePerDaySalary(gross, monthWorkingDays);
    const paidDays = computePaidDays(normalized);
    const earnedGross = roundMoney(paidDays * perDaySalary);
    const totalPresent = normalized ? normalized.present + normalized.late : 0;
    const totalAbsent = normalized?.absent ?? 0;
    const paidLeave = normalized?.leave ?? 0;
    const unpaidLeave = 0;
    const absentDeduction = computeAbsentDeduction(perDaySalary, totalAbsent);
    const leaveDeduction = roundMoney(unpaidLeave * perDaySalary);
    const totalPayable = Math.max(0, roundMoney(earnedGross - advanceDeduction));

    return {
        grossSalary: gross,
        perDaySalary: roundMoney(perDaySalary),
        paidDays,
        earnedGross,
        totalPresent,
        totalAbsent,
        paidLeave,
        unpaidLeave,
        netSalary: gross,
        statutoryDeductions: statutory ?? 0,
        leaveDeduction,
        absentDeduction,
        advanceDeduction: roundMoney(advanceDeduction),
        totalPayable,
        workingDaysInMonth: monthWorkingDays,
    };
}

export function formatPayrollMonthDisplay(ym: string): string {
    if (!/^\d{4}-\d{2}$/.test(ym)) return ym;
    const d = new Date(`${ym}-01T12:00:00`);
    return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export function isCurrentPayrollMonth(payrollMonth: string): boolean {
    return payrollMonth === new Date().toISOString().slice(0, 7);
}
