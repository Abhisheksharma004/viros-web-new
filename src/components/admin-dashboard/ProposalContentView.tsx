"use client";

import {
    groupLinesForDisplay,
    parseProposalContent,
    type DisplaySegment,
} from "@/lib/proposalContentMarkdown";

function formatInline(text: string): React.ReactNode[] {
    const parts: React.ReactNode[] = [];
    const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
    let last = 0;
    let match: RegExpExecArray | null;
    let key = 0;

    while ((match = pattern.exec(text)) !== null) {
        if (match.index > last) {
            parts.push(text.slice(last, match.index));
        }
        const token = match[0];
        if (token.startsWith("**")) {
            parts.push(
                <strong key={key++} className="font-bold text-gray-900">
                    {token.slice(2, -2)}
                </strong>,
            );
        } else {
            parts.push(
                <em key={key++} className="italic text-gray-800">
                    {token.slice(1, -1)}
                </em>,
            );
        }
        last = match.index + token.length;
    }

    if (last < text.length) {
        parts.push(text.slice(last));
    }

    return parts.length ? parts : [text];
}

function RenderSegments({ segments }: { segments: DisplaySegment[] }) {
    return (
        <>
            {segments.map((segment, index) => {
                if (segment.type === "list") {
                    return (
                        <ul key={index} className="mt-2 list-disc space-y-1 pl-5">
                            {segment.items.map((item, i) => (
                                <li key={i} className="text-gray-700">
                                    {formatInline(item)}
                                </li>
                            ))}
                        </ul>
                    );
                }

                return (
                    <div key={index} className={index > 0 ? "mt-2" : undefined}>
                        {segment.lines.map((line, i) =>
                            line.trim() ? (
                                <p key={i} className={i > 0 ? "mt-2" : undefined}>
                                    {formatInline(line)}
                                </p>
                            ) : null,
                        )}
                    </div>
                );
            })}
        </>
    );
}

type Props = {
    content: string;
};

export default function ProposalContentView({ content }: Props) {
    const blocks = parseProposalContent(content);

    return (
        <div className="space-y-4 text-sm leading-relaxed text-gray-700">
            {blocks.map((block, index) => {
                if (block.type === "heading") {
                    return (
                        <div key={index}>
                            <h3 className="text-base font-bold text-[#06124f]">{block.title}</h3>
                            {block.lines.length > 0 ? (
                                <RenderSegments segments={groupLinesForDisplay(block.lines)} />
                            ) : null}
                        </div>
                    );
                }

                if (block.type === "list") {
                    return (
                        <ul key={index} className="list-disc space-y-1 pl-5">
                            {block.items.map((item, i) => (
                                <li key={i}>{formatInline(item)}</li>
                            ))}
                        </ul>
                    );
                }

                if (block.type === "table") {
                    const colCount = Math.max(block.header.length, ...block.rows.map((r) => r.length), 1);
                    return (
                        <div key={index} className="overflow-x-auto rounded-md border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-[#0a2a5e]/8">
                                    <tr>
                                        {Array.from({ length: colCount }, (_, ci) => (
                                            <th
                                                key={ci}
                                                className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-[#0a2a5e]"
                                            >
                                                {formatInline(block.header[ci] ?? "")}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {block.rows.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={colCount}
                                                className="px-4 py-3 text-center text-gray-400"
                                            >
                                                —
                                            </td>
                                        </tr>
                                    ) : (
                                        block.rows.map((row, ri) => (
                                            <tr key={ri} className={ri % 2 === 1 ? "bg-gray-50/60" : undefined}>
                                                {Array.from({ length: colCount }, (_, ci) => (
                                                    <td key={ci} className="px-4 py-2.5 text-gray-800">
                                                        {formatInline(row[ci] ?? "")}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    );
                }

                return <RenderSegments key={index} segments={groupLinesForDisplay(block.lines)} />;
            })}
        </div>
    );
}
