"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import {
    employeeProfileFormSections,
    initialEmployeeProfileFormState,
    type EmployeeProfileFormField,
    type EmployeeProfileFormValues,
} from "@/lib/employeeProfileFormSections";

type DepartmentOption = { id: number; name: string };
type RoleOption = { id: number; department: string; name: string; status: string };

type EmployeeProfileEditModalProps = {
    open: boolean;
    employeeId: string;
    initialValues: EmployeeProfileFormValues;
    onClose: () => void;
    onSaved: (profile: Record<string, unknown>) => void;
};

export default function EmployeeProfileEditModal({
    open,
    employeeId,
    initialValues,
    onClose,
    onSaved,
}: EmployeeProfileEditModalProps) {
    const [formValues, setFormValues] = useState<EmployeeProfileFormValues>(initialEmployeeProfileFormState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [departments, setDepartments] = useState<DepartmentOption[]>([]);
    const [roles, setRoles] = useState<RoleOption[]>([]);
    const [isMetaLoading, setIsMetaLoading] = useState(false);

    const filteredRoles = useMemo(
        () => roles.filter((role) => role.department === formValues.department),
        [roles, formValues.department],
    );

    useEffect(() => {
        if (open) {
            setFormValues({ ...initialValues, employeeId });
            setError("");
        }
    }, [open, initialValues, employeeId]);

    useEffect(() => {
        if (!open) return;

        let active = true;

        const loadMeta = async () => {
            setIsMetaLoading(true);
            try {
                const response = await fetch("/api/employee/profile/meta", { cache: "no-store" });
                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(typeof data.message === "string" ? data.message : "Failed to load options");
                }
                if (!active) return;
                setDepartments(Array.isArray(data.departments) ? data.departments : []);
                setRoles(Array.isArray(data.roles) ? data.roles : []);
            } catch {
                if (active) {
                    setDepartments([]);
                    setRoles([]);
                }
            } finally {
                if (active) setIsMetaLoading(false);
            }
        };

        void loadMeta();

        return () => {
            active = false;
        };
    }, [open]);

    if (!open) return null;

    const handleInputChange = (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => {
        const { name, value } = event.target;
        setFormValues((current) => {
            const next = { ...current, [name]: value };
            if (name === "department" && value !== current.department) {
                next.role = "";
            }
            return next;
        });
        setError("");
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!formValues.fullName.trim()) {
            setError("Full name is required");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const response = await fetch("/api/employee/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formValues, employeeId }),
            });
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to update profile");
            }

            if (data.profile && typeof data.profile === "object") {
                onSaved(data.profile as Record<string, unknown>);
            }
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update profile");
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClassName =
        "w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e] disabled:cursor-not-allowed disabled:bg-gray-50 placeholder:text-gray-400";
    const selectClassName = `${inputClassName} bg-white`;

    const renderField = (field: EmployeeProfileFormField) => {
        const value = formValues[field.name];
        const isSideBySideAddress =
            field.type === "textarea" &&
            (field.name === "currentAddress" || field.name === "permanentAddress");
        const textareaColSpan = field.type === "textarea" && !isSideBySideAddress ? "sm:col-span-2" : "";

        return (
            <div key={field.name} className={textareaColSpan}>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    {field.label}
                    {field.required ? <span className="ml-1 text-red-500">*</span> : null}
                </label>

                {field.type === "textarea" ? (
                    <textarea
                        name={field.name}
                        placeholder={field.label}
                        value={value}
                        onChange={handleInputChange}
                        rows={4}
                        required={field.required}
                        className={`${inputClassName} resize-none`}
                    />
                ) : field.type === "select" ? (
                    <select
                        name={field.name}
                        value={value}
                        onChange={handleInputChange}
                        className={selectClassName}
                    >
                        <option value="">{field.label}</option>
                        {field.options?.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                ) : field.type === "department" ? (
                    <select
                        name={field.name}
                        value={value}
                        onChange={handleInputChange}
                        disabled={isMetaLoading}
                        required={field.required}
                        className={selectClassName}
                    >
                        <option value="">{isMetaLoading ? "Loading…" : field.label}</option>
                        {departments.map((department) => (
                            <option key={department.id} value={department.name}>
                                {department.name}
                            </option>
                        ))}
                    </select>
                ) : field.type === "role" ? (
                    <select
                        name={field.name}
                        value={value}
                        onChange={handleInputChange}
                        disabled={isMetaLoading || !formValues.department}
                        required={field.required}
                        className={selectClassName}
                    >
                        <option value="">
                            {!formValues.department
                                ? "Select department first"
                                : isMetaLoading
                                  ? "Loading…"
                                  : field.label}
                        </option>
                        {filteredRoles.map((role) => (
                            <option key={role.id} value={role.name}>
                                {role.name}
                            </option>
                        ))}
                    </select>
                ) : (
                    <input
                        type={field.type}
                        name={field.name}
                        placeholder={field.label}
                        value={value}
                        onChange={handleInputChange}
                        required={field.required}
                        disabled={field.name === "employeeId"}
                        className={inputClassName}
                    />
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
                aria-hidden
                onClick={() => {
                    if (!isSubmitting) onClose();
                }}
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="edit-profile-title"
                className="relative flex max-h-[min(94vh,920px)] w-full max-w-5xl flex-col overflow-hidden rounded-md border border-gray-100 bg-white shadow-2xl"
            >
                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-100 bg-gradient-to-r from-[#06124f] to-[#0a2a5e] px-6 py-4">
                    <div className="min-w-0">
                        <h3 id="edit-profile-title" className="text-lg font-bold text-white">
                            Edit employee profile
                        </h3>
                        <p className="mt-0.5 text-xs text-cyan-100/90">
                            Update profile details and save changes — same fields as admin employee update.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            if (!isSubmitting) onClose();
                        }}
                        disabled={isSubmitting}
                        className="shrink-0 rounded-md p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Close"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={(e) => void handleSubmit(e)} className="flex min-h-0 flex-1 flex-col">
                    <div className="flex-1 overflow-y-auto p-6">
                        {error ? (
                            <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {error}
                            </p>
                        ) : null}

                        <div className="flex flex-col gap-8">
                            {employeeProfileFormSections.map((section, index) => (
                                <section
                                    key={section.title}
                                    className={index > 0 ? "border-t border-gray-100 pt-8" : ""}
                                >
                                    <h4 className="text-sm font-bold text-gray-900">{section.title}</h4>
                                    <p className="mt-0.5 text-xs text-gray-500">{section.subtitle}</p>
                                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        {section.fields.map((field) => renderField(field))}
                                    </div>
                                </section>
                            ))}
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="rounded-md border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-[#06124f] to-[#0a2a5e] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                            {isSubmitting ? "Saving…" : "Update profile"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
