import type { AdminExpenseEmployeeSummary, EmployeeExpenseRow } from "@/lib/employeeExpenses";
import {
    deriveAdminBatchPaymentStatus,
    formatExpenseDate,
    formatExpenseDateTime,
    getAdminBatchPaymentStatusLabel,
    getExpensePaymentStatusLabel,
    getExpenseStatusLabel,
    resolveExpenseApprovedAmount,
} from "@/lib/employeeExpenseUi";
import { todayDateOnly } from "@/lib/dateOnly";

export type AdminExpenseExportRow = {
    countSerial: number;
    expenseId: string;
    employeeName: string;
    employeeId: string;
    expenseDate: string;
    category: string;
    title: string;
    claimedAmount: number;
    approvedAmount: number;
    paymentMode: string;
    status: string;
    paymentStatus: string;
    rejectReason: string;
    fromAddress: string;
    toAddress: string;
    receiptReference: string;
    createdAt: string;
};

export type AdminExpenseEmployeeSummaryExportRow = {
    countSerial: number;
    employeeId: string;
    employeeName: string;
    totalClaims: number;
    totalAmount: number;
    pendingCount: number;
    pendingAmount: number;
    approvedCount: number;
    approvedAmount: number;
    rejectedCount: number;
    rejectedAmount: number;
    paymentStatus: string;
};

const EXPENSE_COLUMNS: {
    header: string;
    key: keyof AdminExpenseExportRow;
    width: number;
}[] = [
    { header: "S.No.", key: "countSerial", width: 8 },
    { header: "Expense ID", key: "expenseId", width: 16 },
    { header: "Employee Name", key: "employeeName", width: 22 },
    { header: "Employee ID", key: "employeeId", width: 14 },
    { header: "Date", key: "expenseDate", width: 14 },
    { header: "Category", key: "category", width: 14 },
    { header: "Title", key: "title", width: 28 },
    { header: "Claimed Amount", key: "claimedAmount", width: 14 },
    { header: "Approved Amount", key: "approvedAmount", width: 14 },
    { header: "Payment Mode", key: "paymentMode", width: 14 },
    { header: "Status", key: "status", width: 12 },
    { header: "Payment Status", key: "paymentStatus", width: 14 },
    { header: "Reject Reason", key: "rejectReason", width: 24 },
    { header: "From", key: "fromAddress", width: 22 },
    { header: "To", key: "toAddress", width: 22 },
    { header: "Receipt Ref.", key: "receiptReference", width: 16 },
    { header: "Created At", key: "createdAt", width: 20 },
];

const EMPLOYEE_SUMMARY_COLUMNS: {
    header: string;
    key: keyof AdminExpenseEmployeeSummaryExportRow;
    width: number;
}[] = [
    { header: "S.No.", key: "countSerial", width: 8 },
    { header: "Employee ID", key: "employeeId", width: 14 },
    { header: "Employee Name", key: "employeeName", width: 22 },
    { header: "Total Claims", key: "totalClaims", width: 12 },
    { header: "Total Amount", key: "totalAmount", width: 14 },
    { header: "Pending Count", key: "pendingCount", width: 12 },
    { header: "Pending Amount", key: "pendingAmount", width: 14 },
    { header: "Approved Count", key: "approvedCount", width: 12 },
    { header: "Approved Amount", key: "approvedAmount", width: 14 },
    { header: "Rejected Count", key: "rejectedCount", width: 12 },
    { header: "Rejected Amount", key: "rejectedAmount", width: 14 },
    { header: "Payment Status", key: "paymentStatus", width: 14 },
];

type ExportColumn<T extends string> = {
    header: string;
    key: T;
    width: number;
};

type ExportMeta = {
    reportTitle: string;
    worksheetName: string;
    filePrefix: string;
};

function exportFileStamp(): string {
    return todayDateOnly();
}

function downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}

function buildTable<T extends Record<string, string | number>>(
    rows: T[],
    columns: ExportColumn<keyof T & string>[],
) {
    return {
        headers: columns.map((c) => c.header),
        body: rows.map((row) =>
            columns.map((col) => {
                const raw = row[col.key as keyof T];
                return raw === null || raw === undefined ? "" : String(raw);
            }),
        ),
    };
}

async function exportToExcel<T extends Record<string, string | number>>(
    rows: T[],
    columns: ExportColumn<keyof T & string>[],
    meta: ExportMeta,
) {
    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(meta.worksheetName.slice(0, 31));

    worksheet.columns = columns.map((col) => ({
        header: col.header,
        key: col.key as string,
        width: col.width,
    }));

    for (const row of rows) {
        worksheet.addRow(row);
    }

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF06124F" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "left" };
    worksheet.views = [{ state: "frozen", ySplit: 1 }];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    downloadBlob(blob, `${meta.filePrefix}-${exportFileStamp()}.xlsx`);
}

async function exportToPdf<T extends Record<string, string | number>>(
    rows: T[],
    columns: ExportColumn<keyof T & string>[],
    meta: ExportMeta,
) {
    const [{ jsPDF }, autoTableModule] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
    ]);
    const autoTable = autoTableModule.default;
    const { headers, body } = buildTable(rows, columns);

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    doc.setFontSize(16);
    doc.setTextColor(6, 18, 79);
    doc.text(meta.reportTitle, 14, 14);
    doc.setFontSize(10);
    doc.setTextColor(85, 85, 85);
    doc.text(
        `Exported ${new Date().toLocaleString()} · ${rows.length} record(s)`,
        14,
        21,
    );

    autoTable(doc, {
        head: [headers],
        body,
        startY: 26,
        styles: {
            fontSize: 7,
            cellPadding: 1.5,
            overflow: "linebreak",
            valign: "top",
        },
        headStyles: {
            fillColor: [6, 18, 79],
            textColor: 255,
            fontStyle: "bold",
        },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        margin: { left: 10, right: 10 },
        tableWidth: "auto",
    });

    doc.save(`${meta.filePrefix}-${exportFileStamp()}.pdf`);
}

export function mapExpensesToExportRows(expenses: EmployeeExpenseRow[]): AdminExpenseExportRow[] {
    return expenses.map((row, index) => ({
        countSerial: index + 1,
        expenseId: row.expense_id,
        employeeName: row.employee_name?.trim() || "—",
        employeeId: row.employee_id,
        expenseDate: formatExpenseDate(row.expense_date),
        category: row.category,
        title: row.title,
        claimedAmount: Number(row.amount) || 0,
        approvedAmount: resolveExpenseApprovedAmount(row) ?? 0,
        paymentMode: row.payment_mode,
        status: getExpenseStatusLabel(row.status),
        paymentStatus: getExpensePaymentStatusLabel(row.payment_status),
        rejectReason: row.reject_reason?.trim() || "",
        fromAddress: row.from_address?.trim() || "",
        toAddress: row.to_address?.trim() || "",
        receiptReference: row.receipt_reference?.trim() || "",
        createdAt: formatExpenseDateTime(row.created_at),
    }));
}

export function mapEmployeeSummariesToExportRows(
    summaries: AdminExpenseEmployeeSummary[],
): AdminExpenseEmployeeSummaryExportRow[] {
    return summaries.map((row, index) => ({
        countSerial: index + 1,
        employeeId: row.employeeId,
        employeeName: row.employeeName?.trim() || "—",
        totalClaims: row.totalCount,
        totalAmount: Number(row.totalAmount) || 0,
        pendingCount: row.pendingCount,
        pendingAmount: Number(row.pendingAmount) || 0,
        approvedCount: row.approvedCount,
        approvedAmount: Number(row.approvedAmount) || 0,
        rejectedCount: row.rejectedCount,
        rejectedAmount: Number(row.rejectedAmount) || 0,
        paymentStatus: getAdminBatchPaymentStatusLabel(deriveAdminBatchPaymentStatus(row)),
    }));
}

export async function exportAdminExpensesToExcel(
    rows: AdminExpenseExportRow[],
    monthLabel: string,
) {
    await exportToExcel(rows, EXPENSE_COLUMNS, {
        reportTitle: `Expense Management — ${monthLabel}`,
        worksheetName: "Expense Claims",
        filePrefix: "expense-claims",
    });
}

export async function exportAdminExpensesToPdf(rows: AdminExpenseExportRow[], monthLabel: string) {
    await exportToPdf(rows, EXPENSE_COLUMNS, {
        reportTitle: `Expense Management — ${monthLabel}`,
        worksheetName: "Expense Claims",
        filePrefix: "expense-claims",
    });
}

export async function exportAdminExpenseEmployeeSummaryToExcel(
    rows: AdminExpenseEmployeeSummaryExportRow[],
    monthLabel: string,
) {
    await exportToExcel(rows, EMPLOYEE_SUMMARY_COLUMNS, {
        reportTitle: `Expense Employee Summary — ${monthLabel}`,
        worksheetName: "Employee Summary",
        filePrefix: "expense-employee-summary",
    });
}

export async function exportAdminExpenseEmployeeSummaryToPdf(
    rows: AdminExpenseEmployeeSummaryExportRow[],
    monthLabel: string,
) {
    await exportToPdf(rows, EMPLOYEE_SUMMARY_COLUMNS, {
        reportTitle: `Expense Employee Summary — ${monthLabel}`,
        worksheetName: "Employee Summary",
        filePrefix: "expense-employee-summary",
    });
}

const COMPANY = {
    name: "VIROS ENTREPRENEURS",
    subtitle: "IT Solutions Private Limited",
    address:
        "25/2, Street -2, 1st Floor, Molarband Market, Beside Om TVS bike Showroom, Badarpur, New Delhi INDIA, Delhi - 110044",
};

const HEADER_FILL: [number, number, number] = [242, 242, 242];
const BORDER = 200;
const PAGE_MARGIN = 14;

type AutoTableDoc = import("jspdf").jsPDF;

type PayslipLogoAsset = {
    dataUrl: string;
    format: "PNG" | "JPEG";
    widthPx: number;
    heightPx: number;
};

async function loadPayslipLogoAsset(): Promise<PayslipLogoAsset | null> {
    if (typeof window === "undefined") {
        try {
            const fs = await import("fs");
            const path = await import("path");
            const candidates = ["logonn.png", "payslip-logo.png", "logo.png", "blogo.jpeg"];
            for (const cand of candidates) {
                const fullPath = path.join(process.cwd(), "public", cand);
                if (fs.existsSync(fullPath)) {
                    const buf = fs.readFileSync(fullPath);
                    const ext = cand.split(".").pop()?.toLowerCase();
                    const format: PayslipLogoAsset["format"] = ext === "jpg" || ext === "jpeg" ? "JPEG" : "PNG";
                    const dataUrl = `data:image/${format === "JPEG" ? "jpeg" : "png"};base64,${buf.toString("base64")}`;
                    const widthPx = buf.length > 24 ? buf.readUInt32BE(16) : 400;
                    const heightPx = buf.length > 24 ? buf.readUInt32BE(20) : 150;
                    return {
                        dataUrl,
                        format,
                        widthPx: widthPx > 0 ? widthPx : 400,
                        heightPx: heightPx > 0 ? heightPx : 150,
                    };
                }
            }
            return null;
        } catch {
            return null;
        }
    }

    try {
        const resp = await fetch("/logonn.png?v=1", { cache: "no-store" });
        if (!resp.ok) return null;
        const blob = await resp.blob();
        const dataUrl = await new Promise<string | null>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
        if (!dataUrl) return null;

        const format: PayslipLogoAsset["format"] = blob.type.includes("jpeg") ? "JPEG" : "PNG";
        const dimensions = await new Promise<{ width: number; height: number } | null>((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ width: img.naturalWidth || 1, height: img.naturalHeight || 1 });
            img.onerror = () => resolve(null);
            img.src = dataUrl;
        });
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

function addPayslipLogo(doc: AutoTableDoc, logo: PayslipLogoAsset, rightMarginX = 196): void {
    const maxWidthMm = 52;
    const maxHeightMm = 26;
    const aspect = logo.widthPx / logo.heightPx;
    let drawW = maxWidthMm;
    let drawH = drawW / aspect;
    if (drawH > maxHeightMm) {
        drawH = maxHeightMm;
        drawW = drawH * aspect;
    }
    const x = rightMarginX - drawW;
    const y = 9;
    doc.addImage(logo.dataUrl, logo.format, x, y, drawW, drawH);
}

function drawHeaderFallback(doc: AutoTableDoc, rightMarginX = 196): void {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(180, 60, 20);
    doc.text("Viros", rightMarginX, 14, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Entrepreneurs", rightMarginX, 19, { align: "right" });
}

function sectionTitle(
    doc: AutoTableDoc,
    y: number,
    title: string,
    rightText?: string,
    rightMarginX = 196,
): number {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(title, 14, y);
    if (rightText) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(60, 60, 60);
        doc.text(rightText, rightMarginX, y, { align: "right" });
    }
    return y + 6;
}

function drawHr(doc: AutoTableDoc, y: number, rightMarginX = 196): number {
    doc.setDrawColor(BORDER, BORDER, BORDER);
    doc.setLineWidth(0.3);
    doc.line(PAGE_MARGIN, y, rightMarginX, y);
    return y;
}

function drawTitleBand(doc: AutoTableDoc, y: number, title: string, rightMarginX = 196): number {
    const centerX = (PAGE_MARGIN + rightMarginX) / 2;
    const bandTop = y;
    const bandHeight = 12;

    drawHr(doc, bandTop, rightMarginX);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(title, centerX, bandTop + 8, { align: "center" });

    const bandBottom = bandTop + bandHeight;
    drawHr(doc, bandBottom, rightMarginX);
    return bandBottom + 5;
}

function formatPdfCurrency(amount: number): string {
    const n = Number.isFinite(amount) ? amount : 0;
    const fixed = n.toFixed(2);
    const [intPart, decPart] = fixed.split(".");
    const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `Rs. ${withCommas}.${decPart}`;
}

function formatReportDate(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${pad(d.getFullYear())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export async function buildEmployeeWiseExpensePdfDoc(
    expenses: EmployeeExpenseRow[],
    employeeInfo: { employeeId: string; employeeName: string },
    monthLabel: string,
) {
    const [{ jsPDF }, autoTableModule] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
    ]);
    const autoTable = autoTableModule.default;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const rightMarginX = 196;

    // 1. Company Header
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
        addPayslipLogo(doc, logo, rightMarginX);
    } else {
        drawHeaderFallback(doc, rightMarginX);
    }

    let y = 42;

    // 2. Title Band (Exact Salary Slip style)
    y = drawTitleBand(doc, y, `Expense Reimbursement Statement for ${monthLabel}`, rightMarginX);

    const cleanName =
        employeeInfo.employeeName && employeeInfo.employeeName !== "—"
            ? employeeInfo.employeeName
            : employeeInfo.employeeId;

    const totalClaimed = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalApproved = expenses.reduce(
        (sum, e) => sum + (resolveExpenseApprovedAmount(e) ?? 0),
        0,
    );
    const totalPending = expenses
        .filter((e) => e.status === "pending")
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalRejected = expenses
        .filter((e) => e.status === "rejected")
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // 3. Employee Details (Plain grid key-value style)
    y = sectionTitle(doc, y, "Employee Details", undefined, rightMarginX);

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
            ["Employee Name", cleanName, "Total Claims", `${expenses.length} record(s)`],
            ["Employee Id", employeeInfo.employeeId, "Total Claimed", formatPdfCurrency(totalClaimed)],
            ["Expense Period", monthLabel, "Net Approved", formatPdfCurrency(totalApproved)],
        ],
        margin: { left: 14, right: 14 },
    });
    y = (doc as AutoTableDoc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

    // 4. Expense Claims Breakdown (Grid theme with light gray header)
    y = sectionTitle(doc, y, "Expense Claims Breakdown", undefined, rightMarginX);

    const tableBody: (string | number)[][] = expenses.map((e, idx) => [
        String(idx + 1),
        e.expense_id,
        formatExpenseDate(e.expense_date),
        e.category,
        e.title,
        formatPdfCurrency(Number(e.amount) || 0),
        e.status === "approved"
            ? formatPdfCurrency(resolveExpenseApprovedAmount(e) ?? (Number(e.amount) || 0))
            : "—",
        e.payment_mode || "—",
        getExpenseStatusLabel(e.status),
        getExpensePaymentStatusLabel(e.payment_status),
    ]);

    // Bottom totals row
    tableBody.push([
        "",
        "Total",
        "",
        "",
        `${expenses.length} Claim(s)`,
        formatPdfCurrency(totalClaimed),
        formatPdfCurrency(totalApproved),
        "",
        "",
        "",
    ]);

    autoTable(doc, {
        startY: y,
        theme: "grid",
        margin: { left: 14, right: 14 },
        head: [
            [
                "S.No.",
                "Expense ID",
                "Date",
                "Category",
                "Title / Purpose",
                "Claimed",
                "Approved",
                "Mode",
                "Status",
                "Payment",
            ],
        ],
        body: tableBody,
        headStyles: {
            fillColor: HEADER_FILL,
            textColor: [0, 0, 0],
            fontStyle: "bold",
            fontSize: 7.5,
            halign: "center",
        },
        styles: { fontSize: 7.5, cellPadding: 1.8, overflow: "linebreak", valign: "top" },
        columnStyles: {
            0: { halign: "center", cellWidth: 9 },
            1: { fontStyle: "bold", cellWidth: 22 },
            2: { cellWidth: 17 },
            3: { cellWidth: 18 },
            4: { cellWidth: 38 },
            5: { halign: "right", cellWidth: 18 },
            6: { halign: "right", cellWidth: 18 },
            7: { cellWidth: 13 },
            8: { halign: "center", cellWidth: 14 },
            9: { halign: "center", cellWidth: 15 },
        },
        didParseCell: (data) => {
            if (data.section === "body" && data.row.index === tableBody.length - 1) {
                data.cell.styles.fontStyle = "bold";
                data.cell.styles.fillColor = [248, 250, 252];
            }
        },
    });
    y = (doc as AutoTableDoc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

    // 5. Reimbursement Calculations (Exact Salary Slip style calculations box)
    y = sectionTitle(doc, y, "Reimbursement Calculation", undefined, rightMarginX);

    autoTable(doc, {
        startY: y,
        theme: "grid",
        margin: { left: 14, right: 14 },
        body: [
            ["Total Claimed Expense Amount", formatPdfCurrency(totalClaimed)],
            ["Total Pending Claims Amount", formatPdfCurrency(totalPending)],
            ["Total Rejected Claims Amount", formatPdfCurrency(totalRejected)],
            ["Net Amount Payable (Approved)", formatPdfCurrency(totalApproved)],
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
    y = (doc as AutoTableDoc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

    // 6. Footer (Exact Salary Slip footer)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 110);
    doc.text("For More Inquiry Contact this Email : hr@virosentrepreneurs.com", 14, y);
    y += 4.5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    doc.text("Generated using VIROS Expense Management", 14, y);
    doc.text(`Report date: ${formatReportDate()}`, rightMarginX, y, { align: "right" });

    return doc;
}

export async function exportEmployeeWiseExpensesToPdf(
    expenses: EmployeeExpenseRow[],
    employeeInfo: { employeeId: string; employeeName: string },
    monthLabel: string,
) {
    const doc = await buildEmployeeWiseExpensePdfDoc(expenses, employeeInfo, monthLabel);
    const fileStamp = exportFileStamp();
    const cleanId = employeeInfo.employeeId.replace(/[^a-zA-Z0-9_-]/g, "_");
    doc.save(`expense-slip-${cleanId}-${fileStamp}.pdf`);
}

export async function generateEmployeeWiseExpensePdfBuffer(
    expenses: EmployeeExpenseRow[],
    employeeInfo: { employeeId: string; employeeName: string },
    monthLabel: string,
): Promise<Buffer> {
    const doc = await buildEmployeeWiseExpensePdfDoc(expenses, employeeInfo, monthLabel);
    const arrayBuffer = doc.output("arraybuffer");
    return Buffer.from(arrayBuffer);
}


