"use client";

import ProposalContentEditor from "@/components/admin-dashboard/ProposalContentEditor";
import { PROPOSAL_STATUSES } from "@/lib/proposalConstants";
import {
    PROPOSAL_INPUT_CLASS,
    type ProposalFormValues,
    normalizeStatus,
} from "@/lib/proposalUi";

type Props = {
    values: ProposalFormValues;
    onChange: (values: ProposalFormValues) => void;
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

export default function ProposalFormFields({ values, onChange }: Props) {
    const set = (patch: Partial<ProposalFormValues>) => onChange({ ...values, ...patch });

    return (
        <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
            <SectionCard title="Client information" subtitle="Who is this proposal for?">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                            Client name <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={values.clientName}
                            onChange={(e) => set({ clientName: e.target.value })}
                            className={PROPOSAL_INPUT_CLASS}
                            placeholder="e.g. ABC Industries Pvt. Ltd."
                            required
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">Contact person</label>
                        <input
                            value={values.clientContact}
                            onChange={(e) => set({ clientContact: e.target.value })}
                            className={PROPOSAL_INPUT_CLASS}
                            placeholder="Primary contact name"
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">Phone</label>
                        <input
                            value={values.clientPhone}
                            onChange={(e) => set({ clientPhone: e.target.value })}
                            className={PROPOSAL_INPUT_CLASS}
                            placeholder="+91 …"
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">Email</label>
                        <input
                            type="email"
                            value={values.clientEmail}
                            onChange={(e) => set({ clientEmail: e.target.value })}
                            className={PROPOSAL_INPUT_CLASS}
                            placeholder="client@company.com"
                        />
                    </div>
                </div>
            </SectionCard>

            <SectionCard title="Project details" subtitle="Scope and commercial terms.">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                            Project title <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={values.projectTitle}
                            onChange={(e) => set({ projectTitle: e.target.value })}
                            className={PROPOSAL_INPUT_CLASS}
                            placeholder="e.g. Barcode printer AMC & support"
                            required
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">Proposed amount (INR)</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={values.proposedAmount}
                            onChange={(e) => set({ proposedAmount: e.target.value })}
                            className={PROPOSAL_INPUT_CLASS}
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">Valid until</label>
                        <input
                            type="date"
                            value={values.validUntil}
                            onChange={(e) => set({ validUntil: e.target.value })}
                            className={PROPOSAL_INPUT_CLASS}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">Status</label>
                        <select
                            value={values.status}
                            onChange={(e) => set({ status: normalizeStatus(e.target.value) })}
                            className={PROPOSAL_INPUT_CLASS}
                        >
                            {PROPOSAL_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </SectionCard>
        </div>

            <SectionCard title="Content" subtitle="Write your proposal text, edit tables visually, and preview the output.">
                <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Content</label>
                        <span className="text-xs text-gray-400">Write · Preview · Visual tables</span>
                    </div>
                    <ProposalContentEditor
                        value={values.content}
                        onChange={(content) => set({ content })}
                    />
                </div>
            </SectionCard>
        </div>
    );
}
