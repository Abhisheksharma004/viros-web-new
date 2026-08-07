import { formatPayrollMonthDisplay } from "@/lib/payrollCalculation";

export type PayslipPaymentRecord = {
    payslip_number: string;
    payroll_month: string;
    employee_id: string;
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
    payment_mode: string;
    paid_at: string;
    paid_by: string;
    snapshot?: {
        earnings?: {
            basic_salary: number;
            hra: number;
            conveyance: number;
            special_allowance: number;
            performance_allowance: number;
            bonus: number;
            other_allowance: number;
        };
        advanceRecovery?: {
            processed: { advance_id: string; deducted_amount: number }[];
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
    } | null;
};

const COMPANY = {
    name: "VIROS ENTREPRENEURS",
    subtitle: "IT Solutions Private Limited",
    address:
        "25/2, Street -2, 1st Floor, Molarband Market, Beside Om TVS bike Showroom, Badarpur, New Delhi INDIA, Delhi - 110044",
};

const HEADER_FILL: [number, number, number] = [242, 242, 242];
const BORDER = 200;

/** PDF-safe currency (Helvetica does not render the rupee sign correctly). */
function formatAmount(amount: number): string {
    const n = Number.isFinite(amount) ? amount : 0;
    const fixed = n.toFixed(1);
    const [intPart, decPart] = fixed.split(".");
    const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `Rs. ${withCommas}.${decPart}`;
}

function formatSalaryPerMonth(amount: number): string {
    return `${formatAmount(amount)} / Month`;
}

function formatPaidDate(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function formatReportDate(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function monthShortName(payrollMonth: string): string {
    if (!/^\d{4}-\d{2}$/.test(payrollMonth)) return payrollMonth;
    const d = new Date(`${payrollMonth}-01T12:00:00`);
    return d.toLocaleDateString("en-IN", { month: "long" });
}

function formatPaymentMode(mode: string): string {
    if (mode === "bank_transfer") return "Bank Transfer";
    if (mode === "cash") return "Cash";
    if (mode === "cheque") return "Cheque";
    return mode;
}

function formatPhone(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10) return `+91 ${digits}`;
    if (digits.length === 12 && digits.startsWith("91")) {
        return `+91 ${digits.slice(2)}`;
    }
    return phone.trim() || "—";
}

function appliedDeductionTotal(payment: PayslipPaymentRecord): number {
    return (
        (payment.pf || 0) +
        (payment.esi || 0) +
        (payment.tds || 0) +
        (payment.leave_deduction || 0) +
        (payment.advance_deduction || 0)
    );
}

type AutoTableDoc = import("jspdf").jsPDF;

function sectionTitle(doc: AutoTableDoc, y: number, title: string): number {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(title, 14, y);
    return y + 6;
}

const PAGE_MARGIN = 14;

function getPageWidth(doc: AutoTableDoc): number {
    return doc.internal.pageSize.getWidth();
}

function drawHr(doc: AutoTableDoc, y: number): number {
    const pageWidth = getPageWidth(doc);
    doc.setDrawColor(BORDER, BORDER, BORDER);
    doc.setLineWidth(0.3);
    doc.line(PAGE_MARGIN, y, pageWidth - PAGE_MARGIN, y);
    return y;
}

/** Centered title band between two horizontal rules. */
function drawPayslipTitleBand(doc: AutoTableDoc, y: number, title: string): number {
    const pageWidth = getPageWidth(doc);
    const centerX = pageWidth / 2;
    const bandTop = y;
    const bandHeight = 12;

    drawHr(doc, bandTop);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    const textY = bandTop + 8;
    doc.text(title, centerX, textY, { align: "center" });

    const bandBottom = bandTop + bandHeight;
    drawHr(doc, bandBottom);
    return bandBottom + 5;
}

/** Dedicated file so PDF never reuses a stale cached `/logo.png` from another project. */
const PAYSLIP_LOGO_PATH = "/payslip-logo.png";

type PayslipLogoAsset = {
    dataUrl: string;
    format: "PNG" | "JPEG";
    widthPx: number;
    heightPx: number;
};

function resolvePayslipLogoUrl(): string {
    const origin = window.location.origin;
    return `${origin}${PAYSLIP_LOGO_PATH}?v=1`;
}

async function loadPayslipLogoAsset(): Promise<PayslipLogoAsset | null> {
    if (typeof window === "undefined") return null;

    const logoUrl = resolvePayslipLogoUrl();

    try {
        const resp = await fetch(logoUrl, { cache: "no-store" });
        if (!resp.ok) return null;

        const blob = await resp.blob();
        const dataUrl = await new Promise<string | null>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                resolve(typeof reader.result === "string" ? reader.result : null);
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
        if (!dataUrl) return null;

        const format: PayslipLogoAsset["format"] = blob.type.includes("jpeg") ? "JPEG" : "PNG";

        const dimensions = await new Promise<{ width: number; height: number } | null>(
            (resolve) => {
                const img = new Image();
                img.onload = () =>
                    resolve({
                        width: img.naturalWidth || 1,
                        height: img.naturalHeight || 1,
                    });
                img.onerror = () => resolve(null);
                img.src = dataUrl;
            },
        );
        if (!dimensions) return null;

        return {
            dataUrl,
            format,
            widthPx: dimensions.width,
            heightPx: dimensions.height,
        };
    } catch {
        return null;
    }
}

/** Draw `public/payslip-logo.png` top-right on payslip (SalaryBox-style header). */
function addPayslipLogo(doc: AutoTableDoc, logo: PayslipLogoAsset): void {
    const maxWidthMm = 52;
    const maxHeightMm = 26;
    const aspect = logo.widthPx / logo.heightPx;
    let drawW = maxWidthMm;
    let drawH = drawW / aspect;
    if (drawH > maxHeightMm) {
        drawH = maxHeightMm;
        drawW = drawH * aspect;
    }
    const x = 196 - drawW;
    const y = 9;
    doc.addImage(logo.dataUrl, logo.format, x, y, drawW, drawH);
}

function drawPayslipHeaderFallback(doc: AutoTableDoc): void {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(180, 60, 20);
    doc.text("Viros", 196, 14, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Entrepreneurs", 196, 19, { align: "right" });
}

export async function downloadPayslipPdf(payment: PayslipPaymentRecord): Promise<void> {
    const [{ jsPDF }, autoTableModule] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
    ]);
    const autoTable = autoTableModule.default;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const employee = payment.snapshot?.employee;
    const earnings = payment.snapshot?.earnings;
    const att = payment.snapshot?.attendanceDetail;
    const monthLabel = monthShortName(payment.payroll_month);
    const monthTitle = formatPayrollMonthDisplay(payment.payroll_month);

    // —— Header ——
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(COMPANY.name, 14, 16);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(COMPANY.subtitle, 14, 21);

    doc.setFontSize(8);
    const addressLines = doc.splitTextToSize(COMPANY.address, 95);
    doc.text(addressLines, 14, 27);

    doc.setTextColor(0, 0, 0);
    const logo = await loadPayslipLogoAsset();
    if (logo) {
        addPayslipLogo(doc, logo);
    } else {
        drawPayslipHeaderFallback(doc);
    }

    let y = 42;
    y = drawPayslipTitleBand(doc, y, `Pay Slip for ${monthTitle}`);

    // —— Employee details ——
    y = sectionTitle(doc, y, "Employee Details");
    autoTable(doc, {
        startY: y,
        theme: "plain",
        styles: { fontSize: 9, cellPadding: 1.8, textColor: [30, 30, 30] },
        columnStyles: {
            0: { fontStyle: "bold", cellWidth: 42 },
            1: { cellWidth: 48 },
            2: { fontStyle: "bold", cellWidth: 42 },
            3: { cellWidth: 48 },
        },
        body: [
            [
                "Name",
                payment.employee_name,
                "Phone Number",
                formatPhone(employee?.phone ?? ""),
            ],
            [
                "Branch",
                employee?.branch || "Viros Entrepreneurs",
                "Salary Amount",
                formatSalaryPerMonth(payment.gross_salary),
            ],
            [
                "Employee Id",
                payment.employee_id,
                "Designation",
                employee?.designation || "—",
            ],
            [
                "Department",
                payment.department || "—",
                "Date of Joining",
                employee?.joiningDate || "—",
            ],
        ],
        margin: { left: 14, right: 14 },
    });
    y = (doc as AutoTableDoc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

    // —— Salary calculations ——
    y = sectionTitle(doc, y, "Salary Calculations");

    const earningRows: [string, string][] = [];
    if (earnings) {
        if (earnings.basic_salary > 0) earningRows.push(["Basic Salary", formatAmount(earnings.basic_salary)]);
        if (earnings.hra > 0) earningRows.push(["HRA", formatAmount(earnings.hra)]);
        if (earnings.conveyance > 0) earningRows.push(["Conveyance", formatAmount(earnings.conveyance)]);
        if (earnings.special_allowance > 0)
            earningRows.push(["Special Allowance", formatAmount(earnings.special_allowance)]);
        if (earnings.performance_allowance > 0)
            earningRows.push(["Performance Allowance", formatAmount(earnings.performance_allowance)]);
        if (earnings.bonus > 0) earningRows.push(["Bonus", formatAmount(earnings.bonus)]);
        if (earnings.other_allowance > 0)
            earningRows.push(["Other Allowance", formatAmount(earnings.other_allowance)]);
    }
    if (earningRows.length === 0) {
        earningRows.push(["Monthly Gross", formatAmount(payment.gross_salary)]);
    }
    earningRows.push(["Monthly Gross (Total)", formatAmount(payment.gross_salary)]);

    const deductionRows: [string, string][] = [];
    if (payment.pf > 0) deductionRows.push(["PF", formatAmount(payment.pf)]);
    if (payment.esi > 0) deductionRows.push(["ESI", formatAmount(payment.esi)]);
    if (payment.tds > 0) deductionRows.push(["TDS", formatAmount(payment.tds)]);
    if (payment.leave_deduction > 0)
        deductionRows.push(["Leave Deduction", formatAmount(payment.leave_deduction)]);
    if (payment.advance_deduction > 0)
        deductionRows.push(["Advance Recovery", formatAmount(payment.advance_deduction)]);
    if (deductionRows.length === 0) {
        deductionRows.push(["—", formatAmount(0)]);
    }
    const totalDeductions = appliedDeductionTotal(payment);
    deductionRows.push(["Total Deductions", formatAmount(totalDeductions)]);

    const tableStartY = y;
    const halfWidth = 88;

    autoTable(doc, {
        startY: tableStartY,
        margin: { left: 14 },
        tableWidth: halfWidth,
        head: [["EARNINGS", "AMOUNT"]],
        body: earningRows,
        theme: "grid",
        headStyles: {
            fillColor: HEADER_FILL,
            textColor: [0, 0, 0],
            fontStyle: "bold",
            fontSize: 9,
        },
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
            0: { cellWidth: 52 },
            1: { halign: "right", cellWidth: 34 },
        },
        didParseCell: (data) => {
            if (data.section === "body" && data.row.index === earningRows.length - 1) {
                data.cell.styles.fontStyle = "bold";
            }
        },
    });

    autoTable(doc, {
        startY: tableStartY,
        margin: { left: 108 },
        tableWidth: halfWidth,
        head: [["DEDUCTIONS", "AMOUNT"]],
        body: deductionRows,
        theme: "grid",
        headStyles: {
            fillColor: HEADER_FILL,
            textColor: [0, 0, 0],
            fontStyle: "bold",
            fontSize: 9,
        },
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
            0: { cellWidth: 52 },
            1: { halign: "right", cellWidth: 34 },
        },
        didParseCell: (data) => {
            if (data.section === "body" && data.row.index === deductionRows.length - 1) {
                data.cell.styles.fontStyle = "bold";
            }
        },
    });

    y =
        Math.max(
            (doc as AutoTableDoc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY,
            tableStartY + 40,
        ) + 4;

    const perDay = payment.per_day_salary;
    const unearned = Math.max(0, payment.gross_salary - payment.earned_gross);
    autoTable(doc, {
        startY: y,
        theme: "grid",
        margin: { left: 14, right: 14 },
        body: [
            [`${monthLabel} Gross Salary (Monthly)`, formatAmount(payment.gross_salary)],
            [
                `Earned Salary (${payment.paid_days} paid days @ ${formatAmount(perDay)}/day)`,
                formatAmount(payment.earned_gross),
            ],
            ["Total Deductions", formatAmount(totalDeductions)],
            ["Net Amount Paid", formatAmount(payment.net_payable)],
            [`Unearned (${payment.total_absent} absent days)`, formatAmount(unearned)],
        ],
        styles: { fontSize: 9, cellPadding: 2.5 },
        columnStyles: {
            0: { fontStyle: "bold", cellWidth: 120 },
            1: { halign: "right" },
        },
        didParseCell: (data) => {
            if (data.row.index === 3) {
                data.cell.styles.fontStyle = "bold";
                data.cell.styles.textColor = [0, 100, 0];
            }
        },
    });
    y = (doc as AutoTableDoc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

    // —— Days Distribution ——
    y = sectionTitle(doc, y, "Days Distribution");
    const halfDays = att?.halfDay ?? 0;
    const weekOff = att?.weekOff ?? 0;
    autoTable(doc, {
        startY: y,
        theme: "grid",
        margin: { left: 14, right: 14 },
        head: [
            [
                "Working Days",
                "Week Off",
                "Present",
                "Half Day",
                "Absent",
                "Paid Leaves",
                "Unpaid Leaves",
                "Paid Days",
            ],
        ],
        body: [
            [
                String(payment.working_days_in_month),
                String(weekOff),
                String(payment.total_present),
                String(halfDays),
                String(payment.total_absent),
                String(payment.paid_leave),
                String(payment.unpaid_leave),
                String(payment.paid_days),
            ],
        ],
        headStyles: {
            fillColor: HEADER_FILL,
            textColor: [0, 0, 0],
            fontStyle: "bold",
            fontSize: 8,
            halign: "center",
        },
        styles: { fontSize: 9, cellPadding: 2, halign: "center" },
    });
    y = (doc as AutoTableDoc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

    // —— Paid amount breakdown ——
    y = sectionTitle(doc, y, "Paid Amount Breakdown");
    const paymentNote =
        payment.snapshot?.advanceRecovery?.processed
            ?.map((l) => `Advance ${l.advance_id}`)
            .join(", ") || "";

    autoTable(doc, {
        startY: y,
        theme: "grid",
        margin: { left: 14, right: 14 },
        head: [["Payment Type", "Date", "Amount", "Notes"]],
        body: [
            [
                "Earned (attendance)",
                formatPaidDate(payment.paid_at),
                formatAmount(payment.earned_gross),
                `${payment.paid_days} paid days`,
            ],
            [
                "Deductions",
                formatPaidDate(payment.paid_at),
                formatAmount(totalDeductions),
                paymentNote || "PF/ESI/TDS/Advance",
            ],
            [
                "Net salary paid",
                formatPaidDate(payment.paid_at),
                formatAmount(payment.net_payable),
                `${formatPaymentMode(payment.payment_mode)} · ${payment.payslip_number}`,
            ],
        ],
        headStyles: {
            fillColor: HEADER_FILL,
            textColor: [0, 0, 0],
            fontStyle: "bold",
            fontSize: 9,
        },
        styles: { fontSize: 9, cellPadding: 2.5 },
        columnStyles: {
            2: { halign: "right" },
        },
    });
    y = (doc as AutoTableDoc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

    // —— Footer ——
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text("Generated using VIROS HRMS Payroll", 14, y);
    doc.text(`Report date: ${formatReportDate()}`, 196, y, { align: "right" });

    doc.save(`payslip-${payment.employee_name.replace(/\s+/g, "_")}_${payment.payroll_month}.pdf`);
}
