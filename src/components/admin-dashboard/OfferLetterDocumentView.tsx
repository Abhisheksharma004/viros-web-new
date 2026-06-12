"use client";

import Image from "next/image";
import GeneratedDocumentFooter from "@/components/admin-dashboard/GeneratedDocumentFooter";
import ProposalContentView from "@/components/admin-dashboard/ProposalContentView";
import {
    OFFER_SIGNATORY,
} from "@/lib/offerLetterDocument";
import { OFFER_LETTER_COMPANY, offerLetterDisplayMeta } from "@/lib/offerLetterLayout";
import type { OfferLetter } from "@/lib/offerLetterUi";

type Props = {
    offerLetter: OfferLetter;
    className?: string;
};

function SectionHeader({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="mt-3 text-sm font-bold uppercase tracking-wide text-gray-900">
            {children}
        </h3>
    );
}

function SectionParagraph({ children }: { children: React.ReactNode }) {
    return <p className="mt-1 text-justify text-[14px] leading-6 text-gray-800">{children}</p>;
}

export default function OfferLetterDocumentView({ offerLetter, className = "" }: Props) {
    const meta = offerLetterDisplayMeta(offerLetter);

    return (
        <article className={`mx-auto max-w-3xl bg-white text-[15px] text-gray-900 ${className}`}>
            {/* Letterhead */}
            <div className="border-b border-gray-200 px-8 pb-5 pt-8 sm:px-12">
                <div className="flex items-start justify-between gap-6">
                    <div className="flex items-start gap-3">
                        <Image
                            src={OFFER_LETTER_COMPANY.logoPath}
                            alt="Company logo"
                            width={56}
                            height={56}
                            className="h-14 w-14 object-contain"
                        />
                        <div>
                            <p className="text-lg font-bold text-[#06124f]">{OFFER_LETTER_COMPANY.name}</p>
                            <p className="text-sm font-medium text-[#0a2a5e]">{OFFER_LETTER_COMPANY.subtitle}</p>
                            <p className="mt-1 text-xs text-[#06b6d4]">{OFFER_LETTER_COMPANY.tagline1}</p>
                            <p className="text-xs text-[#06b6d4]">{OFFER_LETTER_COMPANY.tagline2}</p>
                        </div>
                    </div>
                    <div className="max-w-[220px] text-right text-[11px] leading-5 text-gray-600">
                        <p>Address: {OFFER_LETTER_COMPANY.address}</p>
                        <p>Email: {OFFER_LETTER_COMPANY.email}</p>
                        <p>Contact: {OFFER_LETTER_COMPANY.phone}</p>
                        <p>Website: {OFFER_LETTER_COMPANY.website}</p>
                    </div>
                </div>
            </div>

            <div className="px-8 py-8 sm:px-12 sm:py-10">
                <h2 className="text-center text-base font-bold uppercase tracking-wide text-gray-900">
                    {meta.title}
                </h2>
                <p className="mt-2 text-right text-sm font-semibold text-gray-800">Ref: {meta.ref}</p>

                <p className="mt-6 text-sm text-gray-800">{meta.date}</p>

                <div className="mt-4 space-y-1 text-sm text-gray-800">
                    <p className="font-bold">{meta.candidateName}</p>
                    {meta.address ? <p>{meta.address}</p> : null}
                    {meta.email ? <p>{meta.email}</p> : null}
                    {meta.phone ? <p>{meta.phone}</p> : null}
                </div>

                <p className="mt-5 text-sm text-gray-900">{meta.salutation}</p>
                <p className="mt-3 text-justify text-[14px] leading-6 text-gray-800">{meta.intro}</p>

                <SectionHeader>Position Details</SectionHeader>
                <SectionParagraph>{meta.positionParagraph}</SectionParagraph>

                <SectionHeader>Compensation</SectionHeader>
                <SectionParagraph>{meta.compensationParagraph}</SectionParagraph>

                {offerLetter.benefits.trim() ? (
                    <>
                        <SectionHeader>Benefits</SectionHeader>
                        <div className="mt-1 text-[14px] leading-6 text-gray-800">
                            <ProposalContentView content={offerLetter.benefits} compact />
                        </div>
                    </>
                ) : null}

                {offerLetter.keyResponsibilities.trim() ? (
                    <>
                        <SectionHeader>Key Responsibilities</SectionHeader>
                        <div className="mt-1 text-[14px] leading-6 text-gray-800">
                            <ProposalContentView content={offerLetter.keyResponsibilities} compact />
                        </div>
                    </>
                ) : null}

                {offerLetter.termsAndConditions.trim() ? (
                    <>
                        <SectionHeader>Terms & Conditions</SectionHeader>
                        <div className="mt-1 text-[14px] leading-6 text-gray-800">
                            <ProposalContentView content={offerLetter.termsAndConditions} compact />
                        </div>
                    </>
                ) : null}

                {meta.expiryDate ? (
                    <p className="mt-3 text-[14px] leading-6 text-gray-800">
                        This offer is valid until <span className="font-semibold">{meta.expiryDate}</span>.
                    </p>
                ) : null}

                <p className="mt-3 text-[14px] leading-6 text-gray-800">
                    Please sign and return a copy of this letter as confirmation of your acceptance of this offer.
                </p>

                <div className="mt-8 grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-8">
                    <div className="text-sm text-gray-900">
                        <p>Accepted by:</p>
                        <div className="h-8" aria-hidden />
                        <div className="space-y-0.5">
                            <p className="text-sm text-gray-700">Candidate Signature</p>
                            <p className="font-bold">{meta.candidateName}</p>
                        </div>
                    </div>
                    <div className="ml-auto w-fit text-right text-sm text-gray-900 sm:ml-0 sm:w-auto">
                        <p>Sincerely,</p>
                        <div className="h-8" aria-hidden />
                        <div className="space-y-0.5">
                            <p className="text-sm text-gray-700">{OFFER_SIGNATORY.title}</p>
                            <p className="font-bold">{OFFER_SIGNATORY.company}</p>
                            <p className="font-semibold text-gray-800">{OFFER_SIGNATORY.subtitle}</p>
                        </div>
                    </div>
                </div>
            </div>

            <GeneratedDocumentFooter
                kind="offer"
                email={OFFER_LETTER_COMPANY.email}
                phone={OFFER_LETTER_COMPANY.phone}
            />
        </article>
    );
}
