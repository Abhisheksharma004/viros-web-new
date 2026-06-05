export const DEFAULT_MARKDOWN_TABLE = `| Item | Description | Amount |
| --- | --- | --- |
| Row 1 |  |  |
| Row 2 |  |  |
`;

export function buildMarkdownTable(columns: number, rows: number): string {
    const cols = Math.max(2, Math.min(columns, 6));
    const dataRows = Math.max(1, Math.min(rows, 10));
    const headers = Array.from({ length: cols }, (_, i) => `Column ${i + 1}`);
    const separator = Array.from({ length: cols }, () => "---");
    const body = Array.from({ length: dataRows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => (c === 0 ? `Row ${r + 1}` : "")).join(" | "),
    );

    return [
        `| ${headers.join(" | ")} |`,
        `| ${separator.join(" | ")} |`,
        ...body.map((row) => `| ${row} |`),
    ].join("\n");
}

export function insertAtCursor(
    text: string,
    start: number,
    end: number,
    snippet: string,
): { next: string; cursorStart: number; cursorEnd: number } {
    const needsLeadingBreak = start > 0 && text[start - 1] !== "\n";
    const needsTrailingBreak = end < text.length && text[end] !== "\n";
    const prefix = needsLeadingBreak ? (text[start - 1] === "\n" ? "\n" : "\n\n") : "";
    const suffix = needsTrailingBreak ? "\n" : "";
    const insert = `${prefix}${snippet}${suffix}`;
    const next = text.slice(0, start) + insert + text.slice(end);
    const cursorStart = start + prefix.length;
    const cursorEnd = cursorStart + snippet.length;
    return { next, cursorStart, cursorEnd };
}

export function isTableSeparator(line: string): boolean {
    const trimmed = line.trim();
    if (!trimmed.includes("|")) return false;
    return /^\|?(\s*:?-{3,}:?\s*\|)+\s*$/.test(trimmed) || /^\|(\s*-+\s*\|)+$/.test(trimmed);
}

export function parseTableRow(line: string): string[] {
    const trimmed = line.trim();
    const inner = trimmed.startsWith("|") ? trimmed.slice(1) : trimmed;
    const withoutEnd = inner.endsWith("|") ? inner.slice(0, -1) : inner;
    return withoutEnd.split("|").map((cell) => cell.trim());
}

export type ContentBlock =
    | { type: "heading"; title: string; lines: string[] }
    | { type: "paragraph"; lines: string[] }
    | { type: "list"; items: string[] }
    | { type: "table"; header: string[]; rows: string[][] };

export type DisplaySegment =
    | { type: "paragraph"; lines: string[] }
    | { type: "list"; items: string[] };

const BULLET_LINE_RE = /^(\s*)[-*+]\s+/;

export function isBulletLine(line: string): boolean {
    return BULLET_LINE_RE.test(line);
}

export function stripBulletPrefix(line: string): string {
    return line.replace(BULLET_LINE_RE, "").trim();
}

export function toBulletLine(text: string): string {
    const stripped = stripBulletPrefix(text);
    return `- ${stripped}`;
}

export function groupLinesForDisplay(lines: string[]): DisplaySegment[] {
    const segments: DisplaySegment[] = [];
    let paraBuffer: string[] = [];
    let listBuffer: string[] = [];

    const flushPara = () => {
        if (paraBuffer.length) {
            segments.push({ type: "paragraph", lines: [...paraBuffer] });
            paraBuffer = [];
        }
    };

    const flushList = () => {
        if (listBuffer.length) {
            segments.push({
                type: "list",
                items: listBuffer.map(stripBulletPrefix).filter((item) => item.length > 0),
            });
            listBuffer = [];
        }
    };

    for (const line of lines) {
        if (!line.trim()) {
            flushList();
            flushPara();
            continue;
        }

        if (isBulletLine(line)) {
            flushPara();
            listBuffer.push(line);
        } else {
            flushList();
            paraBuffer.push(line);
        }
    }

    flushList();
    flushPara();
    return segments;
}

export function tableDataToMarkdown(header: string[], rows: string[][]): string {
    const cols = Math.max(header.length, ...rows.map((r) => r.length), 1);
    const normalizedHeader = Array.from({ length: cols }, (_, i) => header[i] ?? `Column ${i + 1}`);
    const separator = Array.from({ length: cols }, () => "---");
    const normalizedRows = rows.map((row) =>
        Array.from({ length: cols }, (_, i) => (row[i] ?? "").trim()),
    );

    return [
        `| ${normalizedHeader.join(" | ")} |`,
        `| ${separator.join(" | ")} |`,
        ...normalizedRows.map((row) => `| ${row.join(" | ")} |`),
    ].join("\n");
}

export type EditableTableBlock = {
    index: number;
    start: number;
    end: number;
    markdown: string;
    header: string[];
    rows: string[][];
};

export function extractEditableTables(content: string): EditableTableBlock[] {
    const lines = content.split("\n");
    const tables: EditableTableBlock[] = [];
    let offset = 0;
    let i = 0;
    let tableIndex = 0;

    while (i < lines.length) {
        const line = lines[i];

        if (line.includes("|")) {
            const start = offset;
            const tableLines: string[] = [];
            while (i < lines.length && lines[i].trim() && lines[i].includes("|")) {
                tableLines.push(lines[i]);
                offset += lines[i].length + 1;
                i += 1;
            }

            const sepIndex = tableLines.findIndex(isTableSeparator);
            if (tableLines.length >= 2 && sepIndex > 0) {
                const header = parseTableRow(tableLines[sepIndex - 1]);
                const rows = tableLines
                    .slice(sepIndex + 1)
                    .filter((row) => row.trim() && !isTableSeparator(row))
                    .map(parseTableRow);
                tables.push({
                    index: tableIndex++,
                    start,
                    end: offset,
                    markdown: tableLines.join("\n"),
                    header,
                    rows,
                });
            }
            continue;
        }

        offset += line.length + 1;
        i += 1;
    }

    return tables;
}

export function replaceTableInContent(
    content: string,
    tableIndex: number,
    header: string[],
    rows: string[][],
): string {
    const tables = extractEditableTables(content);
    const target = tables[tableIndex];
    if (!target) return content;
    const newMarkdown = tableDataToMarkdown(header, rows);
    return content.slice(0, target.start) + newMarkdown + content.slice(target.end);
}

export function removeTableFromContent(content: string, tableIndex: number): string {
    const tables = extractEditableTables(content);
    const target = tables[tableIndex];
    if (!target) return content;
    let next = content.slice(0, target.start) + content.slice(target.end);
    next = next.replace(/\n{3,}/g, "\n\n");
    return next.trim();
}

export function appendTableToContent(content: string, header: string[], rows: string[][]): string {
    const snippet = tableDataToMarkdown(header, rows);
    const trimmed = content.trimEnd();
    if (!trimmed) return snippet;
    return `${trimmed}\n\n${snippet}`;
}

export function parseProposalContent(content: string): ContentBlock[] {
    const lines = content.split("\n");
    const blocks: ContentBlock[] = [];
    let i = 0;
    let buffer: string[] = [];

    const flushBuffer = () => {
        const text = buffer.join("\n").trim();
        buffer = [];
        if (!text) return;

        const parts = text.split("\n");
        const first = parts[0]?.trim() ?? "";
        if (first.startsWith("## ")) {
            blocks.push({
                type: "heading",
                title: first.slice(3).trim(),
                lines: parts.slice(1).filter((l) => l.trim()),
            });
        } else {
            blocks.push({ type: "paragraph", lines: parts });
        }
    };

    while (i < lines.length) {
        const line = lines[i];

        if (!line.trim()) {
            flushBuffer();
            i += 1;
            continue;
        }

        if (isBulletLine(line)) {
            flushBuffer();
            const items: string[] = [];
            while (i < lines.length && isBulletLine(lines[i])) {
                items.push(stripBulletPrefix(lines[i]));
                i += 1;
            }
            if (items.length) {
                blocks.push({ type: "list", items });
            }
            continue;
        }

        if (line.includes("|")) {
            const tableLines: string[] = [];
            while (i < lines.length && lines[i].trim() && lines[i].includes("|")) {
                tableLines.push(lines[i]);
                i += 1;
            }

            const sepIndex = tableLines.findIndex(isTableSeparator);
            if (tableLines.length >= 2 && sepIndex > 0) {
                flushBuffer();
                const header = parseTableRow(tableLines[sepIndex - 1]);
                const rows = tableLines
                    .slice(sepIndex + 1)
                    .filter((row) => row.trim() && !isTableSeparator(row))
                    .map(parseTableRow);
                blocks.push({ type: "table", header, rows });
            } else {
                buffer.push(...tableLines);
            }
            continue;
        }

        buffer.push(line);
        i += 1;
    }

    flushBuffer();
    return blocks;
}
