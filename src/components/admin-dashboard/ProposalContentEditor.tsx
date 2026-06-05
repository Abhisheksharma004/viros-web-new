"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Bold, Eye, Heading2, Italic, List, Pencil, Plus, Table2 } from "lucide-react";
import ProposalContentView from "@/components/admin-dashboard/ProposalContentView";
import ProposalVisualTableEditor, {
    type TableData,
} from "@/components/admin-dashboard/ProposalVisualTableEditor";
import {
    appendTableToContent,
    extractEditableTables,
    isBulletLine,
    removeTableFromContent,
    replaceTableInContent,
    stripBulletPrefix,
    toBulletLine,
} from "@/lib/proposalContentMarkdown";

type Props = {
    value: string;
    onChange: (value: string) => void;
};

type FormatKind = "bold" | "italic" | "h2";
type EditorTab = "write" | "preview";

const EMPTY_TABLE: TableData = {
    header: ["Item", "Description", "Amount"],
    rows: [
        ["", "", ""],
        ["", "", ""],
    ],
};

function wrapSelection(text: string, start: number, end: number, before: string, after: string, fallback: string) {
    const selected = text.slice(start, end);
    const inner = selected || fallback;
    const next = text.slice(0, start) + before + inner + after + text.slice(end);
    const cursorStart = start + before.length;
    const cursorEnd = cursorStart + inner.length;
    return { next, cursorStart, cursorEnd };
}

function applyBulletList(text: string, start: number, end: number) {
    const lineStart = text.lastIndexOf("\n", start - 1) + 1;
    const lineEndRaw = text.indexOf("\n", end);
    const lineEnd = lineEndRaw === -1 ? text.length : lineEndRaw;
    const selected = text.slice(lineStart, lineEnd);
    const lines = selected.split("\n");
    const nonEmpty = lines.filter((line) => line.trim());
    const allBullets = nonEmpty.length > 0 && nonEmpty.every((line) => isBulletLine(line));

    const nextLines = lines.map((line) => {
        if (!line.trim()) return line;
        if (allBullets) return stripBulletPrefix(line);
        return toBulletLine(line);
    });

    const nextBlock = nextLines.join("\n");
    const next = text.slice(0, lineStart) + nextBlock + text.slice(lineEnd);
    const cursor = lineStart + nextBlock.length;
    return { next, cursorStart: cursor, cursorEnd: cursor };
}

function applyHeading(text: string, start: number, end: number) {
    const lineStart = text.lastIndexOf("\n", start - 1) + 1;
    const lineEndRaw = text.indexOf("\n", end);
    const lineEnd = lineEndRaw === -1 ? text.length : lineEndRaw;
    const line = text.slice(lineStart, lineEnd);
    const stripped = line.replace(/^#{1,6}\s+/, "");
    const nextLine = stripped.trim() ? `## ${stripped.trim()}` : "## ";
    const next = text.slice(0, lineStart) + nextLine + text.slice(lineEnd);
    const cursor = lineStart + nextLine.length;
    return { next, cursorStart: cursor, cursorEnd: cursor };
}

export default function ProposalContentEditor({ value, onChange }: Props) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [tab, setTab] = useState<EditorTab>("write");
    const [newTableDraft, setNewTableDraft] = useState<TableData | null>(null);

    const tables = useMemo(() => extractEditableTables(value), [value]);

    const focusTextarea = useCallback((cursorStart: number, cursorEnd: number) => {
        const el = textareaRef.current;
        if (!el) return;
        requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(cursorStart, cursorEnd);
        });
    }, []);

    const applyFormat = useCallback(
        (kind: FormatKind) => {
            const el = textareaRef.current;
            if (!el) return;

            const start = el.selectionStart;
            const end = el.selectionEnd;

            let result: { next: string; cursorStart: number; cursorEnd: number };
            if (kind === "bold") {
                result = wrapSelection(value, start, end, "**", "**", "bold text");
            } else if (kind === "italic") {
                result = wrapSelection(value, start, end, "*", "*", "italic text");
            } else {
                result = applyHeading(value, start, end);
            }

            onChange(result.next);
            focusTextarea(result.cursorStart, result.cursorEnd);
        },
        [focusTextarea, onChange, value],
    );

    const applyBullets = useCallback(() => {
        const el = textareaRef.current;
        if (!el) return;

        const result = applyBulletList(value, el.selectionStart, el.selectionEnd);
        onChange(result.next);
        focusTextarea(result.cursorStart, result.cursorEnd);
    }, [focusTextarea, onChange, value]);

    const updateTable = useCallback(
        (tableIndex: number, data: TableData) => {
            onChange(replaceTableInContent(value, tableIndex, data.header, data.rows));
        },
        [onChange, value],
    );

    const startNewTable = () => {
        setNewTableDraft({ ...EMPTY_TABLE, header: [...EMPTY_TABLE.header], rows: EMPTY_TABLE.rows.map((r) => [...r]) });
        setTab("write");
    };

    const confirmNewTable = () => {
        if (!newTableDraft) return;
        onChange(appendTableToContent(value, newTableDraft.header, newTableDraft.rows));
        setNewTableDraft(null);
    };

    const toolbarBtn =
        "inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-gray-200 bg-white px-2 text-sm font-semibold text-[#0a2a5e] transition hover:border-[#06b6d4]/40 hover:bg-[#06b6d4]/5";

    const tabBtn = (active: boolean) =>
        `inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
            active
                ? "bg-[#06124f] text-white shadow-sm"
                : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
        }`;

    return (
        <div className="space-y-4">
            <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50/80 px-3 py-2">
                    <div className="flex flex-wrap items-center gap-1">
                        <button type="button" onClick={() => setTab("write")} className={tabBtn(tab === "write")}>
                            <Pencil className="h-3.5 w-3.5" />
                            Write
                        </button>
                        <button type="button" onClick={() => setTab("preview")} className={tabBtn(tab === "preview")}>
                            <Eye className="h-3.5 w-3.5" />
                            Preview
                        </button>
                        <span className="mx-1 h-5 w-px bg-gray-200" aria-hidden />
                        {tab === "write" ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => applyFormat("bold")}
                                    className={toolbarBtn}
                                    title="Bold"
                                    aria-label="Bold"
                                >
                                    <Bold className="h-4 w-4" strokeWidth={2.5} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyFormat("italic")}
                                    className={toolbarBtn}
                                    title="Italic"
                                    aria-label="Italic"
                                >
                                    <Italic className="h-4 w-4" strokeWidth={2.5} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyFormat("h2")}
                                    className={`${toolbarBtn} gap-1 px-2.5 text-xs`}
                                    title="Section heading"
                                    aria-label="Heading"
                                >
                                    <Heading2 className="h-4 w-4" />
                                    H2
                                </button>
                                <button
                                    type="button"
                                    onClick={applyBullets}
                                    className={`${toolbarBtn} gap-1 px-2.5 text-xs`}
                                    title="Bullet list (click again to remove)"
                                    aria-label="Bullet list"
                                >
                                    <List className="h-4 w-4" />
                                    List
                                </button>
                                <button
                                    type="button"
                                    onClick={startNewTable}
                                    className={`${toolbarBtn} gap-1 px-2.5 text-xs`}
                                    title="Add a visual table"
                                    aria-label="Add table"
                                >
                                    <Table2 className="h-4 w-4" />
                                    Table
                                </button>
                            </>
                        ) : null}
                    </div>
                    <p className="text-xs text-gray-400">
                        {tab === "write" ? "Write text above, edit tables below" : "Final proposal preview"}
                    </p>
                </div>

                {tab === "write" ? (
                    <div className="space-y-3 p-4">
                        <textarea
                            ref={textareaRef}
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            rows={8}
                            className="min-h-[180px] w-full resize-y rounded-md border border-gray-200 px-4 py-3 text-sm leading-relaxed text-gray-800 outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20"
                            placeholder={
                                "Write your introduction here…\n\n## Scope of work\n\nAdd details here. Click the Table button above to insert a table."
                            }
                        />
                    </div>
                ) : (
                    <div className="min-h-[220px] border-t border-gray-100 bg-[#f8fafc] p-4">
                        {value.trim() ? (
                            <ProposalContentView content={value} />
                        ) : (
                            <p className="text-sm text-gray-400">Add some content to see the preview.</p>
                        )}
                    </div>
                )}
            </div>

            {tab === "write" && newTableDraft ? (
                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-[#06124f]">New table</p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setNewTableDraft(null)}
                                className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmNewTable}
                                className="inline-flex items-center gap-1 rounded-md bg-[#06124f] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Add table
                            </button>
                        </div>
                    </div>
                    <ProposalVisualTableEditor data={newTableDraft} onChange={setNewTableDraft} />
                </div>
            ) : null}

            {tab === "write" && tables.length > 0 ? (
                <div className="space-y-3">
                    <p className="text-sm font-bold text-[#06124f]">
                        Tables ({tables.length}) — edit cells directly below
                    </p>
                    {tables.map((table) => (
                        <ProposalVisualTableEditor
                            key={`${table.index}-${table.start}`}
                            title={`Table ${table.index + 1}`}
                            data={{ header: table.header, rows: table.rows }}
                            onChange={(data) => updateTable(table.index, data)}
                            onRemove={() => onChange(removeTableFromContent(value, table.index))}
                        />
                    ))}
                </div>
            ) : null}
        </div>
    );
}
