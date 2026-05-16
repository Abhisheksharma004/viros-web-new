/**
 * Minimal RFC 4180–style CSV parser (quoted fields, escaped quotes).
 */

export function stripBom(text: string): string {
    return text.startsWith("\uFEFF") ? text.slice(1) : text;
}

/** Normalizes newlines then parses CSV into rows (including quoted commas / newlines). */
export function parseCsvLines(text: string): string[][] {
    const s = stripBom(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const rows: string[][] = [];
    let row: string[] = [];
    let field = "";
    let inQuotes = false;

    const flushField = () => {
        row.push(field);
        field = "";
    };

    const flushRow = () => {
        flushField();
        rows.push(row);
        row = [];
    };

    for (let i = 0; i < s.length; i++) {
        const c = s[i]!;

        if (inQuotes) {
            if (c === "\"") {
                if (s[i + 1] === "\"") {
                    field += "\"";
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                field += c;
            }
            continue;
        }

        switch (c) {
            case "\"":
                inQuotes = true;
                break;
            case ",":
                flushField();
                break;
            case "\n":
                flushRow();
                break;
            default:
                field += c;
                break;
        }
    }

    if (inQuotes || field.length > 0 || row.length > 0) {
        flushRow();
    }

    return rows;
}
