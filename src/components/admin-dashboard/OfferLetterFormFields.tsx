"use client";

import { useEffect, useMemo, useState } from "react";
import ProposalContentEditor from "@/components/admin-dashboard/ProposalContentEditor";
import { previewOfferNumber, WORK_LOCATIONS } from "@/lib/offerLetterConstants";
import {
    CURRENCIES,
    EMPLOYMENT_TYPES,
    NOTICE_PERIODS,
    OFFER_LETTER_INPUT_CLASS,
    OFFER_LETTER_STATUSES,
    OFFER_PRIORITIES,
    OFFER_TYPES,
    PROBATION_PERIODS,
    SALARY_TYPES,
    type OfferLetterFormValues,
    normalizeStatus,
} from "@/lib/offerLetterUi";

type DepartmentOption = { id: number; name: string };
type RoleOption = { id: number; department: string; name: string; status: string };

type Props = {
    values: OfferLetterFormValues;
    onChange: (values: OfferLetterFormValues) => void;
    offerNumber?: string;
};

function SectionCard({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-md border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
                <h2 className="text-base font-bold text-[#06124f]">{title}</h2>
            </div>
            <div className="space-y-4 px-6 py-5">{children}</div>
        </section>
    );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
    return (
        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            {children}
            {required ? <span className="text-red-500"> *</span> : null}
        </label>
    );
}

export default function OfferLetterFormFields({ values, onChange, offerNumber }: Props) {
    const [departments, setDepartments] = useState<DepartmentOption[]>([]);
    const [roles, setRoles] = useState<RoleOption[]>([]);
    const [isMetaLoading, setIsMetaLoading] = useState(true);

    const set = (patch: Partial<OfferLetterFormValues>) => onChange({ ...values, ...patch });

    useEffect(() => {
        let active = true;

        const loadMeta = async () => {
            try {
                setIsMetaLoading(true);
                const [departmentsResp, rolesResp] = await Promise.all([
                    fetch("/api/admin/departments"),
                    fetch("/api/admin/roles"),
                ]);
                const departmentsData = await departmentsResp.json();
                const rolesData = await rolesResp.json();
                if (!active) return;
                setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
                setRoles(Array.isArray(rolesData) ? rolesData : []);
            } catch (error) {
                console.error("Failed to load offer letter form options", error);
            } finally {
                if (active) setIsMetaLoading(false);
            }
        };

        void loadMeta();
        return () => {
            active = false;
        };
    }, []);

    const filteredRoles = useMemo(
        () => roles.filter((role) => role.department === values.department),
        [roles, values.department],
    );

    const positionOptions = useMemo(() => {
        const names = filteredRoles.map((role) => role.name);
        if (values.designation && !names.includes(values.designation)) {
            return [values.designation, ...names];
        }
        return names;
    }, [filteredRoles, values.designation]);

    const departmentOptions = useMemo(() => {
        const names = departments.map((dept) => dept.name);
        if (values.department && !names.includes(values.department)) {
            return [values.department, ...names];
        }
        return names;
    }, [departments, values.department]);

    const locationOptions = useMemo(() => {
        const names = [...WORK_LOCATIONS] as string[];
        if (values.location && !names.includes(values.location)) {
            return [values.location, ...names];
        }
        return names;
    }, [values.location]);

    const handleDepartmentChange = (department: string) => {
        const nextRoles = roles.filter((role) => role.department === department);
        const positionStillValid = nextRoles.some((role) => role.name === values.designation);
        onChange({
            ...values,
            department,
            designation: positionStillValid ? values.designation : "",
        });
    };

    const offerIdDisplay = offerNumber || `Auto-generated (${previewOfferNumber()})`;

    return (
        <div className="space-y-6">
            <div className="grid gap-4 rounded-md border border-gray-100 bg-white p-6 shadow-sm md:grid-cols-3">
                <div>
                    <FieldLabel>Offer ID</FieldLabel>
                    <input
                        value={offerIdDisplay}
                        readOnly
                        className={`${OFFER_LETTER_INPUT_CLASS} cursor-not-allowed bg-gray-50 text-gray-500`}
                    />
                </div>
                <div>
                    <FieldLabel required>Offer Type</FieldLabel>
                    <select
                        value={values.offerType}
                        onChange={(e) => set({ offerType: e.target.value as OfferLetterFormValues["offerType"] })}
                        className={OFFER_LETTER_INPUT_CLASS}
                        required
                    >
                        {OFFER_TYPES.map((type) => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <FieldLabel>Priority</FieldLabel>
                    <select
                        value={values.priority}
                        onChange={(e) => set({ priority: e.target.value as OfferLetterFormValues["priority"] })}
                        className={OFFER_LETTER_INPUT_CLASS}
                    >
                        {OFFER_PRIORITIES.map((priority) => (
                            <option key={priority} value={priority}>
                                {priority}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <SectionCard title="Candidate Information">
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <FieldLabel required>Full Name</FieldLabel>
                        <input
                            value={values.candidateName}
                            onChange={(e) => set({ candidateName: e.target.value })}
                            className={OFFER_LETTER_INPUT_CLASS}
                            placeholder="Enter candidate name"
                            required
                        />
                    </div>
                    <div>
                        <FieldLabel required>Email</FieldLabel>
                        <input
                            type="email"
                            value={values.candidateEmail}
                            onChange={(e) => set({ candidateEmail: e.target.value })}
                            className={OFFER_LETTER_INPUT_CLASS}
                            placeholder="candidate@email.com"
                            required
                        />
                    </div>
                    <div>
                        <FieldLabel required>Phone</FieldLabel>
                        <input
                            value={values.candidatePhone}
                            onChange={(e) => set({ candidatePhone: e.target.value })}
                            className={OFFER_LETTER_INPUT_CLASS}
                            placeholder="+91-XXXXXXXXXX"
                            required
                        />
                    </div>
                    <div className="md:col-span-2">
                        <FieldLabel required>Address</FieldLabel>
                        <textarea
                            value={values.candidateAddress}
                            onChange={(e) => set({ candidateAddress: e.target.value })}
                            className={`${OFFER_LETTER_INPUT_CLASS} min-h-[88px] resize-y`}
                            placeholder="Full address"
                            required
                        />
                    </div>
                </div>
            </SectionCard>

            <SectionCard title="Position Details">
                <div className="grid gap-4 md:grid-cols-3">
                    <div>
                        <FieldLabel required>Department</FieldLabel>
                        <select
                            value={values.department}
                            onChange={(e) => handleDepartmentChange(e.target.value)}
                            disabled={isMetaLoading}
                            className={OFFER_LETTER_INPUT_CLASS}
                            required
                        >
                            <option value="">{isMetaLoading ? "Loading..." : "Select department"}</option>
                            {departmentOptions.map((name) => (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <FieldLabel required>Position</FieldLabel>
                        <select
                            value={values.designation}
                            onChange={(e) => set({ designation: e.target.value })}
                            disabled={isMetaLoading || !values.department}
                            className={OFFER_LETTER_INPUT_CLASS}
                            required
                        >
                            <option value="">
                                {!values.department
                                    ? "Select department first"
                                    : isMetaLoading
                                      ? "Loading..."
                                      : "Select position"}
                            </option>
                            {positionOptions.map((name) => (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <FieldLabel required>Employment Type</FieldLabel>
                        <select
                            value={values.employmentType}
                            onChange={(e) =>
                                set({ employmentType: e.target.value as OfferLetterFormValues["employmentType"] })
                            }
                            className={OFFER_LETTER_INPUT_CLASS}
                            required
                        >
                            {EMPLOYMENT_TYPES.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <FieldLabel required>Location</FieldLabel>
                        <select
                            value={values.location}
                            onChange={(e) => set({ location: e.target.value })}
                            className={OFFER_LETTER_INPUT_CLASS}
                            required
                        >
                            <option value="">Select location</option>
                            {locationOptions.map((name) => (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <FieldLabel required>Reporting To</FieldLabel>
                        <input
                            value={values.reportingTo}
                            onChange={(e) => set({ reportingTo: e.target.value })}
                            className={OFFER_LETTER_INPUT_CLASS}
                            placeholder="Manager name"
                            required
                        />
                    </div>
                    <div>
                        <FieldLabel required>Joining Date</FieldLabel>
                        <input
                            type="date"
                            value={values.joiningDate}
                            onChange={(e) => set({ joiningDate: e.target.value })}
                            className={OFFER_LETTER_INPUT_CLASS}
                            required
                        />
                    </div>
                </div>
            </SectionCard>

            <SectionCard title="Compensation & Terms">
                <div className="grid gap-4 md:grid-cols-4">
                    <div>
                        <FieldLabel required>Salary</FieldLabel>
                        <input
                            value={values.compensation}
                            onChange={(e) => set({ compensation: e.target.value })}
                            className={OFFER_LETTER_INPUT_CLASS}
                            placeholder="Amount"
                            required
                        />
                    </div>
                    <div>
                        <FieldLabel>Salary Type</FieldLabel>
                        <select
                            value={values.salaryType}
                            onChange={(e) => set({ salaryType: e.target.value as OfferLetterFormValues["salaryType"] })}
                            className={OFFER_LETTER_INPUT_CLASS}
                        >
                            {SALARY_TYPES.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <FieldLabel>Currency</FieldLabel>
                        <select
                            value={values.currency}
                            onChange={(e) => set({ currency: e.target.value as OfferLetterFormValues["currency"] })}
                            className={OFFER_LETTER_INPUT_CLASS}
                        >
                            {CURRENCIES.map((currency) => (
                                <option key={currency} value={currency}>
                                    {currency}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <FieldLabel>Working Hours</FieldLabel>
                        <input
                            value={values.workingHours}
                            onChange={(e) => set({ workingHours: e.target.value })}
                            className={OFFER_LETTER_INPUT_CLASS}
                            placeholder="9:00 AM - 6:00 PM"
                        />
                    </div>
                    <div>
                        <FieldLabel>Probation Period</FieldLabel>
                        <select
                            value={values.probationPeriod}
                            onChange={(e) =>
                                set({ probationPeriod: e.target.value as OfferLetterFormValues["probationPeriod"] })
                            }
                            className={OFFER_LETTER_INPUT_CLASS}
                        >
                            {PROBATION_PERIODS.map((period) => (
                                <option key={period} value={period}>
                                    {period}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <FieldLabel>Notice Period</FieldLabel>
                        <select
                            value={values.noticePeriod}
                            onChange={(e) =>
                                set({ noticePeriod: e.target.value as OfferLetterFormValues["noticePeriod"] })
                            }
                            className={OFFER_LETTER_INPUT_CLASS}
                        >
                            {NOTICE_PERIODS.map((period) => (
                                <option key={period} value={period}>
                                    {period}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <FieldLabel>Duration (for internship/contract)</FieldLabel>
                        <input
                            value={values.duration}
                            onChange={(e) => set({ duration: e.target.value })}
                            className={OFFER_LETTER_INPUT_CLASS}
                            placeholder="e.g., 6 months"
                        />
                    </div>
                    <div>
                        <FieldLabel>Offer Expiry Date</FieldLabel>
                        <input
                            type="date"
                            value={values.offerExpiryDate}
                            onChange={(e) => set({ offerExpiryDate: e.target.value })}
                            className={OFFER_LETTER_INPUT_CLASS}
                        />
                    </div>
                    <div>
                        <FieldLabel>Offer date</FieldLabel>
                        <input
                            type="date"
                            value={values.offerDate}
                            onChange={(e) => set({ offerDate: e.target.value })}
                            className={OFFER_LETTER_INPUT_CLASS}
                        />
                    </div>
                </div>
            </SectionCard>

            <div className="space-y-4 rounded-md border border-gray-100 bg-white p-6 shadow-sm">
                <div>
                    <FieldLabel>Benefits</FieldLabel>
                    <ProposalContentEditor
                        value={values.benefits}
                        onChange={(benefits) => set({ benefits })}
                        placeholder={"Health Insurance\nPaid Leave\nProfessional Development"}
                        previewHint="Benefits preview"
                    />
                </div>
                <div>
                    <FieldLabel required>Key Responsibilities</FieldLabel>
                    <ProposalContentEditor
                        value={values.keyResponsibilities}
                        onChange={(keyResponsibilities) => set({ keyResponsibilities })}
                        placeholder="Describe key responsibilities..."
                        previewHint="Responsibilities preview"
                    />
                </div>
                <div>
                    <FieldLabel required>Terms & Conditions</FieldLabel>
                    <ProposalContentEditor
                        value={values.termsAndConditions}
                        onChange={(termsAndConditions) => set({ termsAndConditions })}
                        placeholder="Terms and conditions..."
                        previewHint="Terms preview"
                    />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <FieldLabel>Status</FieldLabel>
                        <select
                            value={values.status}
                            onChange={(e) => set({ status: normalizeStatus(e.target.value) })}
                            className={OFFER_LETTER_INPUT_CLASS}
                        >
                            {OFFER_LETTER_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <FieldLabel>Internal Notes</FieldLabel>
                        <input
                            value={values.internalNotes}
                            onChange={(e) => set({ internalNotes: e.target.value })}
                            className={OFFER_LETTER_INPUT_CLASS}
                            placeholder="Optional notes"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
