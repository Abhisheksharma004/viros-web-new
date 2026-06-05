"use client";

import { Minus, Plus, Trash2 } from "lucide-react";

export type TableData = {
    header: string[];
    rows: string[][];
};

type Props = {
    title?: string;
    data: TableData;
    onChange: (data: TableData) => void;
    onRemove?: () => void;
};

const cellInput =
    "w-full min-w-[88px] rounded-md border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-900 outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20";

export default function ProposalVisualTableEditor({ title, data, onChange, onRemove }: Props) {
    const colCount = Math.max(data.header.length, ...data.rows.map((r) => r.length), 1);

    const setHeaderCell = (index: number, value: string) => {
        const header = [...data.header];
        while (header.length <= index) header.push("");
        header[index] = value;
        onChange({ ...data, header });
    };

    const setBodyCell = (rowIndex: number, colIndex: number, value: string) => {
        const rows = data.rows.map((row) => [...row]);
        while (rows.length <= rowIndex) rows.push([]);
        while (rows[rowIndex].length <= colIndex) rows[rowIndex].push("");
        rows[rowIndex][colIndex] = value;
        onChange({ ...data, rows });
    };

    const addColumn = () => {
        const header = [...data.header, `Column ${colCount + 1}`];
        const rows = data.rows.map((row) => [...row, ""]);
        onChange({ header, rows });
    };

    const removeColumn = () => {
        if (colCount <= 1) return;
        onChange({
            header: data.header.slice(0, -1),
            rows: data.rows.map((row) => row.slice(0, -1)),
        });
    };

    const addRow = () => {
        const rows = [...data.rows, Array.from({ length: colCount }, () => "")];
        onChange({ ...data, rows });
    };

    const removeRow = (rowIndex: number) => {
        onChange({ ...data, rows: data.rows.filter((_, i) => i !== rowIndex) });
    };

    return (
        <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50/80 px-3 py-2.5">
                <p className="text-sm font-semibold text-[#06124f]">{title ?? "Table"}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                    <button
                        type="button"
                        onClick={addColumn}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Column
                    </button>
                    <button
                        type="button"
                        onClick={removeColumn}
                        disabled={colCount <= 1}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                    >
                        <Minus className="h-3.5 w-3.5" />
                        Column
                    </button>
                    <button
                        type="button"
                        onClick={addRow}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Row
                    </button>
                    {onRemove ? (
                        <button
                            type="button"
                            onClick={onRemove}
                            className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove
                        </button>
                    ) : null}
                </div>
            </div>

            <div className="overflow-x-auto p-3">
                <table className="min-w-full border-collapse text-sm">
                    <thead>
                        <tr className="bg-[#0a2a5e]/8">
                            {Array.from({ length: colCount }, (_, ci) => (
                                <th key={ci} className="border border-gray-200 p-0">
                                    <input
                                        value={data.header[ci] ?? ""}
                                        onChange={(e) => setHeaderCell(ci, e.target.value)}
                                        className={`${cellInput} border-0 bg-transparent font-bold text-[#0a2a5e] focus:ring-0`}
                                        placeholder={`Header ${ci + 1}`}
                                    />
                                </th>
                            ))}
                            <th className="w-10 border border-gray-200 bg-gray-50/50" aria-hidden />
                        </tr>
                    </thead>
                    <tbody>
                        {data.rows.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={colCount + 1}
                                    className="border border-gray-200 px-3 py-4 text-center text-xs text-gray-400"
                                >
                                    No rows yet — click &quot;Row&quot; to add one.
                                </td>
                            </tr>
                        ) : (
                            data.rows.map((row, ri) => (
                                <tr key={ri} className={ri % 2 === 1 ? "bg-gray-50/50" : "bg-white"}>
                                    {Array.from({ length: colCount }, (_, ci) => (
                                        <td key={ci} className="border border-gray-200 p-0">
                                            <input
                                                value={row[ci] ?? ""}
                                                onChange={(e) => setBodyCell(ri, ci, e.target.value)}
                                                className={`${cellInput} border-0 focus:ring-0`}
                                                placeholder="Enter value"
                                            />
                                        </td>
                                    ))}
                                    <td className="border border-gray-200 bg-gray-50/30 p-1 text-center">
                                        <button
                                            type="button"
                                            onClick={() => removeRow(ri)}
                                            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                            title="Remove row"
                                            aria-label="Remove row"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
