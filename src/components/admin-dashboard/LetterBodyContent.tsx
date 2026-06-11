"use client";

import type { ReactNode } from "react";
import { isBulletLine, stripBulletPrefix } from "@/lib/proposalContentMarkdown";

function formatInline(text: string): ReactNode[] {
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

type Props = {
    content: string;
};

/** Renders letter body with exactly the line breaks present in the source text. */
export default function LetterBodyContent({ content }: Props) {
    const lines = content.replace(/\r\n/g, "\n").split("\n");

    return (
        <div className="text-justify text-[15px] leading-7 text-gray-800">
            {lines.map((line, index) => {
                const trimmed = line.trim();

                if (!trimmed) {
                    return <div key={index} className="h-7" aria-hidden />;
                }

                if (trimmed.startsWith("## ")) {
                    return (
                        <p key={index} className="m-0 font-bold text-[#06124f]">
                            {formatInline(trimmed.slice(3).trim())}
                        </p>
                    );
                }

                if (isBulletLine(line)) {
                    return (
                        <p key={index} className="m-0 pl-5">
                            <span className="mr-2 font-bold">•</span>
                            {formatInline(stripBulletPrefix(line))}
                        </p>
                    );
                }

                return (
                    <p key={index} className="m-0 text-justify">
                        {formatInline(line)}
                    </p>
                );
            })}
        </div>
    );
}
