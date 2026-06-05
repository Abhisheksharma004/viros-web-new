"use client";

import ProposalContentEditor from "@/components/admin-dashboard/ProposalContentEditor";
import { LETTER_STATUSES } from "@/lib/letterConstants";
import {
    LETTER_INPUT_CLASS,
    type LetterFormValues,
    normalizeStatus,
} from "@/lib/letterUi";

type Props = {
    values: LetterFormValues;
    onChange: (values: LetterFormValues) => void;
};

function SectionCard({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-md border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
                <h2 className="text-base font-bold text-[#06124f]">{title}</h2>
                {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
            </div>
            <div className="space-y-4 px-6 py-5">{children}</div>
        </section>
    );
}

export default function LetterFormFields({ values, onChange }: Props) {
    const set = (patch: Partial<LetterFormValues>) => onChange({ ...values, ...patch });

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
                <SectionCard title="Recipient" subtitle="Who will receive this letter?">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                Recipient name <span className="text-red-500">*</span>
                            </label>
                            <input
                                value={values.clientName}
                                onChange={(e) => set({ clientName: e.target.value })}
                                className={LETTER_INPUT_CLASS}
                                placeholder="e.g. Abhishek"
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Designation</label>
                            <input
                                value={values.designation}
                                onChange={(e) => set({ designation: e.target.value })}
                                className={LETTER_INPUT_CLASS}
                                placeholder="e.g. SDE"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Contact / Full name</label>
                            <input
                                value={values.clientContact}
                                onChange={(e) => set({ clientContact: e.target.value })}
                                className={LETTER_INPUT_CLASS}
                                placeholder="e.g. Abhishek Porel"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Email</label>
                            <input
                                type="email"
                                value={values.clientEmail}
                                onChange={(e) => set({ clientEmail: e.target.value })}
                                className={LETTER_INPUT_CLASS}
                                placeholder="client@company.com"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Phone</label>
                            <input
                                value={values.clientPhone}
                                onChange={(e) => set({ clientPhone: e.target.value })}
                                className={LETTER_INPUT_CLASS}
                                placeholder="+91 …"
                            />
                        </div>
                    </div>
                </SectionCard>

                <SectionCard title="Letter details" subtitle="Subject, date, and status.">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                Subject <span className="text-red-500">*</span>
                            </label>
                            <input
                                value={values.subject}
                                onChange={(e) => set({ subject: e.target.value })}
                                className={LETTER_INPUT_CLASS}
                                placeholder="e.g. Regarding project completion and delivery"
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Letter date</label>
                            <input
                                type="date"
                                value={values.letterDate}
                                onChange={(e) => set({ letterDate: e.target.value })}
                                className={LETTER_INPUT_CLASS}
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Status</label>
                            <select
                                value={values.status}
                                onChange={(e) => set({ status: normalizeStatus(e.target.value) })}
                                className={LETTER_INPUT_CLASS}
                            >
                                {LETTER_STATUSES.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </SectionCard>
            </div>

            <SectionCard title="Letter body" subtitle="Write the main content of your letter below.">
                <ProposalContentEditor value={values.content} onChange={(content) => set({ content })} />
            </SectionCard>
        </div>
    );
}
