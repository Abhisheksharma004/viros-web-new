"use client";

import GeneratedDocumentFooter from "@/components/admin-dashboard/GeneratedDocumentFooter";
import LetterBodyContent from "@/components/admin-dashboard/LetterBodyContent";
import {
    LETTER_SIGNATORY,
    formatLetterDateLong,
    formatLetterPhone,
    letterSalutation,
    normalizeLetterContent,
} from "@/lib/letterDocument";
import type { Letter } from "@/lib/letterUi";

type Props = {
    letter: Letter;
    className?: string;
};

export default function LetterDocumentView({ letter, className = "" }: Props) {
    const phone = letter.clientPhone.trim() ? formatLetterPhone(letter.clientPhone) : "";
    const bodyContent = normalizeLetterContent(letter.content, letter);

    return (
        <article
            className={`mx-auto max-w-3xl bg-white px-8 py-8 text-[15px] leading-7 text-gray-900 sm:px-12 sm:py-10 ${className}`}
        >
            <div className="flex items-start justify-between gap-6 text-sm text-gray-800">
                <p>
                    <span className="font-semibold">Ref:</span> {letter.letterNumber}
                </p>
                <p className="shrink-0 text-right">
                    <span className="font-semibold">Date:</span> {formatLetterDateLong(letter.letterDate)}
                </p>
            </div>

            <div className="mt-8 space-y-0.5">
                <p className="font-bold text-gray-900">To,</p>
                <p className="font-bold text-gray-900">{letter.clientName}</p>
                {letter.designation ? <p className="text-gray-800">{letter.designation}</p> : null}
                {letter.clientContact && letter.clientContact !== letter.clientName ? (
                    <p className="text-gray-800">{letter.clientContact}</p>
                ) : null}
                {letter.clientEmail ? (
                    <p className="text-gray-500">
                        <span className="font-medium text-gray-600">Email:</span> {letter.clientEmail}
                    </p>
                ) : null}
                {phone ? (
                    <p className="text-gray-500">
                        <span className="font-medium text-gray-600">Contact:</span> {phone}
                    </p>
                ) : null}
            </div>

            <p className="mt-5 text-gray-900">
                <span className="font-bold">Subject:</span> {letter.subject}
            </p>

            <p className="mt-4 text-gray-900">{letterSalutation(letter)}</p>

            {bodyContent ? (
                <div className="mt-3">
                    <LetterBodyContent content={bodyContent} />
                </div>
            ) : null}

            <div className="ml-auto w-fit text-right text-gray-900">
                <p>Sincerely,</p>
                <div className="h-14" aria-hidden />
                <div className="space-y-0.5">
                    <p className="text-sm text-gray-700">{LETTER_SIGNATORY.title}</p>
                    <p className="font-bold">{LETTER_SIGNATORY.company}</p>
                    <p className="font-semibold text-gray-800">{LETTER_SIGNATORY.subtitle}</p>
                </div>
            </div>

            <GeneratedDocumentFooter kind="letter" />
        </article>
    );
}
