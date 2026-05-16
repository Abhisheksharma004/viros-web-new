/** Columns included in AMC Report Excel/PDF export. */
export type AmcReportExportRow = {
    countSerial: number;
    recordId: number;
    engineerName: string;
    company: string;
    assetName: string;
    assetDescription: string;
    tagSerial: string;
    category: string;
    assetStatus: string;
    issueReportingDate: string;
    userIssue: string;
    engineerRemarks: string;
    remarksSavedOn: string;
    workType: string;
    updatedAt: string;
};

/** Shared column list for Excel and PDF — keep in sync. */
export const AMC_REPORT_EXPORT_COLUMNS: {
    header: string;
    key: keyof AmcReportExportRow;
    width: number;
}[] = [
    { header: "Count Serial", key: "countSerial", width: 12 },
    { header: "Record ID", key: "recordId", width: 12 },
    { header: "Engineer Name", key: "engineerName", width: 22 },
    { header: "Company", key: "company", width: 22 },
    { header: "Asset Name", key: "assetName", width: 22 },
    { header: "Asset Description", key: "assetDescription", width: 28 },
    { header: "Tag / Serial", key: "tagSerial", width: 16 },
    { header: "Category", key: "category", width: 14 },
    { header: "Asset Status", key: "assetStatus", width: 14 },
    { header: "Issue Reporting Date", key: "issueReportingDate", width: 18 },
    { header: "User Issue", key: "userIssue", width: 32 },
    { header: "Engineer Remarks", key: "engineerRemarks", width: 32 },
    { header: "Remarks Saved On", key: "remarksSavedOn", width: 22 },
    { header: "Work Type", key: "workType", width: 14 },
    { header: "Updated At", key: "updatedAt", width: 22 },
];

export const WITHOUT_AMC_REPORT_EXPORT_COLUMNS = AMC_REPORT_EXPORT_COLUMNS.filter(
    (col) => col.key !== "workType",
);

type ExportColumn = (typeof AMC_REPORT_EXPORT_COLUMNS)[number];

function buildExportTable(rows: AmcReportExportRow[], columns: ExportColumn[] = AMC_REPORT_EXPORT_COLUMNS) {
    return {
        headers: columns.map((col) => col.header),
        body: rows.map((row) =>
            columns.map((col) => {
                const raw = row[col.key];
                return raw === null || raw === undefined ? "" : String(raw);
            }),
        ),
    };
}

type ReportExportMeta = {
    reportTitle: string;
    worksheetName: string;
    filePrefix: string;
};

function exportFileStamp(): string {
    return new Date().toISOString().slice(0, 10);
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

async function exportWorkRecordsToExcel(
    rows: AmcReportExportRow[],
    columns: ExportColumn[],
    meta: ReportExportMeta,
) {
    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(meta.worksheetName);

    worksheet.columns = columns.map((col) => ({
        header: col.header,
        key: col.key,
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

async function exportWorkRecordsToPdf(
    rows: AmcReportExportRow[],
    columns: ExportColumn[],
    meta: ReportExportMeta,
) {
    const [{ jsPDF }, autoTableModule] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
    ]);
    const autoTable = autoTableModule.default;

    const { headers, body } = buildExportTable(rows, columns);
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

export async function exportAmcReportToExcel(rows: AmcReportExportRow[]) {
    await exportWorkRecordsToExcel(rows, AMC_REPORT_EXPORT_COLUMNS, {
        reportTitle: "AMC Report",
        worksheetName: "AMC Report",
        filePrefix: "amc-report",
    });
}

export async function exportAmcReportToPdf(rows: AmcReportExportRow[]) {
    await exportWorkRecordsToPdf(rows, AMC_REPORT_EXPORT_COLUMNS, {
        reportTitle: "AMC Report",
        worksheetName: "AMC Report",
        filePrefix: "amc-report",
    });
}

export async function exportWithoutAmcReportToExcel(rows: AmcReportExportRow[]) {
    await exportWorkRecordsToExcel(rows, WITHOUT_AMC_REPORT_EXPORT_COLUMNS, {
        reportTitle: "Without AMC Report",
        worksheetName: "Without AMC Report",
        filePrefix: "without-amc-report",
    });
}

export async function exportWithoutAmcReportToPdf(rows: AmcReportExportRow[]) {
    await exportWorkRecordsToPdf(rows, WITHOUT_AMC_REPORT_EXPORT_COLUMNS, {
        reportTitle: "Without AMC Report",
        worksheetName: "Without AMC Report",
        filePrefix: "without-amc-report",
    });
}
