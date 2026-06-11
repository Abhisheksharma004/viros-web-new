export type InlineSegment = {
    text: string;
    bold?: boolean;
    italic?: boolean;
};

export function hasInlineMarkdown(text: string): boolean {
    return /\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`/.test(text);
}

export function parseInlineMarkdown(text: string): InlineSegment[] {
    const segments: InlineSegment[] = [];
    const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
    let last = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
        if (match.index > last) {
            segments.push({ text: text.slice(last, match.index) });
        }

        const token = match[0];
        if (token.startsWith("**")) {
            segments.push({ text: token.slice(2, -2), bold: true });
        } else if (token.startsWith("*")) {
            segments.push({ text: token.slice(1, -1), italic: true });
        } else {
            segments.push({ text: token.slice(1, -1) });
        }

        last = match.index + token.length;
    }

    if (last < text.length) {
        segments.push({ text: text.slice(last) });
    }

    return segments.length ? segments : [{ text }];
}

type StyledWord = {
    text: string;
    bold: boolean;
    italic: boolean;
};

function tokenizeStyledWords(text: string, baseBold = false, baseItalic = false): StyledWord[] {
    const words: StyledWord[] = [];

    for (const segment of parseInlineMarkdown(text)) {
        const bold = baseBold || Boolean(segment.bold);
        const italic = baseItalic || Boolean(segment.italic);
        const parts = segment.text.split(/(\s+)/);

        for (const part of parts) {
            if (!part) continue;
            words.push({ text: part, bold, italic });
        }
    }

    return words;
}

type PdfDoc = import("jspdf").jsPDF;

function setPdfFont(doc: PdfDoc, bold: boolean, italic: boolean) {
    const style = bold && italic ? "bolditalic" : bold ? "bold" : italic ? "italic" : "normal";
    doc.setFont("helvetica", style);
}

/** Draw a single line of text with **bold** / *italic* markdown. Returns y below the drawn lines. */
export function drawPdfInlineText(
    doc: PdfDoc,
    x: number,
    y: number,
    maxWidth: number,
    text: string,
    lineHeight: number,
    options?: { baseBold?: boolean; baseItalic?: boolean },
): number {
    const words = tokenizeStyledWords(text, options?.baseBold, options?.baseItalic);
    if (words.length === 0) return y;

    const lines: StyledWord[][] = [];
    let currentLine: StyledWord[] = [];
    let currentWidth = 0;

    for (const word of words) {
        setPdfFont(doc, word.bold, word.italic);
        const wordWidth = doc.getTextWidth(word.text);
        const isWhitespace = /^\s+$/.test(word.text);

        if (
            currentLine.length > 0 &&
            !isWhitespace &&
            currentWidth + wordWidth > maxWidth
        ) {
            lines.push(currentLine);
            currentLine = [];
            currentWidth = 0;
        }

        currentLine.push(word);
        currentWidth += wordWidth;
    }

    if (currentLine.length) {
        lines.push(currentLine);
    }

    let cy = y;
    for (const line of lines) {
        let cx = x;
        for (const word of line) {
            setPdfFont(doc, word.bold, word.italic);
            doc.text(word.text, cx, cy);
            cx += doc.getTextWidth(word.text);
        }
        cy += lineHeight;
    }

    return cy;
}
