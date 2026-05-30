import type { AdminExpenseEmployeeSummary, EmployeeExpenseRow } from "@/lib/employeeExpenses";
import {
    formatExpenseDate,
    formatExpenseDateTime,
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
