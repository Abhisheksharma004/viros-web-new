import { todayDateOnly } from "@/lib/dateOnly";

export type AttendanceDailyExportRow = {
    employeeId: string;
    fullName: string;
    deptDesignation: string;
    date: string;
    status: string;
    checkIn: string;
    checkOut: string;
    workingHours: string;
};

export type AttendanceMonthlyExportRow = {
    employeeId: string;
    fullName: string;
    department: string;
    present: number;
    late: number;
    absent: number;
    leave: number;
    halfDay: number;
    totalPresent: number;
    totalWorkingDays: number;
    weekOff: number;
};

export type AttendanceEmployeeExportRow = {
    date: string;
    status: string;
    checkIn: string;
    checkOut: string;
    workingHours: string;
};

type ExportColumn<T extends string> = {
    header: string;
    key: T;
    width: number;
};

const DAILY_COLUMNS: ExportColumn<keyof AttendanceDailyExportRow>[] = [
    { header: "Employee ID", key: "employeeId", width: 14 },
    { header: "Employee Name", key: "fullName", width: 24 },
    { header: "Dept. / Designation", key: "deptDesignation", width: 24 },
    { header: "Date", key: "date", width: 14 },
    { header: "Status", key: "status", width: 12 },
    { header: "Check in", key: "checkIn", width: 14 },
    { header: "Check out", key: "checkOut", width: 14 },
    { header: "Working hours", key: "workingHours", width: 14 },
];

const MONTHLY_COLUMNS: ExportColumn<keyof AttendanceMonthlyExportRow>[] = [
    { header: "Employee ID", key: "employeeId", width: 14 },
    { header: "Employee Name", key: "fullName", width: 24 },
    { header: "Department", key: "department", width: 18 },
    { header: "Present", key: "present", width: 10 },
    { header: "Late", key: "late", width: 10 },
    { header: "Absent", key: "absent", width: 10 },
    { header: "Leave", key: "leave", width: 10 },
    { header: "Half day", key: "halfDay", width: 10 },
    { header: "Total working days", key: "totalWorkingDays", width: 18 },
    { header: "Week off", key: "weekOff", width: 12 },
    { header: "Total present", key: "totalPresent", width: 14 },
];

const EMPLOYEE_COLUMNS: ExportColumn<keyof AttendanceEmployeeExportRow>[] = [
    { header: "Date", key: "date", width: 22 },
    { header: "Status", key: "status", width: 12 },
    { header: "Check in", key: "checkIn", width: 14 },
    { header: "Check out", key: "checkOut", width: 14 },
    { header: "Working hours", key: "workingHours", width: 14 },
];

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
            fontSize: 8,
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

export function formatAttendanceStatusLabel(status: string): string {
    const map: Record<string, string> = {
        present: "Present",
        absent: "Absent",
        late: "Late",
        leave: "Leave",
        "half-day": "Half day",
    };
    return map[status] ?? status;
}

export async function exportDailyAttendanceExcel(
    rows: AttendanceDailyExportRow[],
    dateLabel: string,
) {
    await exportToExcel(rows, DAILY_COLUMNS, {
        reportTitle: `Daily Attendance — ${dateLabel}`,
        worksheetName: "Daily Attendance",
        filePrefix: `attendance-daily-${dateLabel.replace(/\s+/g, "-")}`,
    });
}

export async function exportDailyAttendancePdf(
    rows: AttendanceDailyExportRow[],
    dateLabel: string,
) {
    await exportToPdf(rows, DAILY_COLUMNS, {
        reportTitle: `Daily Attendance — ${dateLabel}`,
        worksheetName: "Daily Attendance",
        filePrefix: `attendance-daily-${dateLabel.replace(/\s+/g, "-")}`,
    });
}

export async function exportMonthlyAttendanceExcel(
    rows: AttendanceMonthlyExportRow[],
    monthLabel: string,
) {
    await exportToExcel(rows, MONTHLY_COLUMNS, {
        reportTitle: `Monthly Attendance — ${monthLabel}`,
        worksheetName: "Monthly Summary",
        filePrefix: `attendance-monthly-${monthLabel.replace(/\s+/g, "-")}`,
    });
}

export async function exportMonthlyAttendancePdf(
    rows: AttendanceMonthlyExportRow[],
    monthLabel: string,
) {
    await exportToPdf(rows, MONTHLY_COLUMNS, {
        reportTitle: `Monthly Attendance — ${monthLabel}`,
        worksheetName: "Monthly Summary",
        filePrefix: `attendance-monthly-${monthLabel.replace(/\s+/g, "-")}`,
    });
}

export async function exportEmployeeAttendanceExcel(
    rows: AttendanceEmployeeExportRow[],
    employeeLabel: string,
    monthLabel: string,
) {
    await exportToExcel(rows, EMPLOYEE_COLUMNS, {
        reportTitle: `${employeeLabel} — ${monthLabel}`,
        worksheetName: "Employee Attendance",
        filePrefix: `attendance-employee-${employeeLabel.replace(/\s+/g, "-")}`,
    });
}

export async function exportEmployeeAttendancePdf(
    rows: AttendanceEmployeeExportRow[],
    employeeLabel: string,
    monthLabel: string,
) {
    await exportToPdf(rows, EMPLOYEE_COLUMNS, {
        reportTitle: `${employeeLabel} — ${monthLabel}`,
        worksheetName: "Employee Attendance",
        filePrefix: `attendance-employee-${employeeLabel.replace(/\s+/g, "-")}`,
    });
}
