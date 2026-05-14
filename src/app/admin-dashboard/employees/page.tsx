"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Eye, Loader2, Pencil, Trash2, X } from "lucide-react";

type RowActionBusy = { recordId: number; kind: "view" | "edit" | "delete" } | null;

type DepartmentApiRow = {
    id: number;
    name: string;
};

type RoleApiRow = {
    id: number;
    department: string;
    name: string;
    status: string;
};

type EmployeeApiListRow = {
    id: number;
    employee_id: string;
    full_name: string;
    designation: string | null;
    department: string | null;
    official_email: string | null;
    employee_status: string;
    created_at: string;
};

type EmployeeRow = {
    recordId: number;
    employeeId: string;
    name: string;
    role: string;
    department: string;
    email: string;
    status: string;
    createdAt: string;
};

function mapEmployeeApiRow(row: EmployeeApiListRow): EmployeeRow {
    return {
        recordId: row.id,
        employeeId: row.employee_id,
        name: row.full_name,
        role: row.designation ?? "",
        department: row.department ?? "",
        email: row.official_email ?? "",
        status: row.employee_status,
        createdAt: row.created_at,
    };
}

const initialFormState = {
    employeeId: "",
    fullName: "",
    gender: "",
    dateOfBirth: "",
    maritalStatus: "",
    bloodGroup: "",
    nationality: "",
    religion: "",
    category: "",

    personalMobileNumber: "",
    officialMobileNumber: "",
    personalEmail: "",
    officialEmail: "",
    currentAddress: "",
    permanentAddress: "",

    parentName: "",
    parentMobileNumber: "",
    parentOccupation: "",
    guardianRelation: "",

    higherEducationQualification: "",
    higherEducationCourseName: "",
    higherEducationInstitution: "",
    higherEducationPassingYear: "",
    higherEducationCgpaOrPercentage: "",
    higherEducationSpecialization: "",

    department: "",
    role: "",
    employeeType: "",
    employmentCategory: "",
    joiningDate: "",
    probationPeriod: "",
    workLocation: "",
    branchName: "",
    reportingManager: "",
    employeeStatus: "Active",

    previousCompanyName: "",
    previousDesignation: "",
    previousSalary: "",
    workExperienceYears: "",
    previousJoiningDate: "",
    previousRelievingDate: "",
    reasonForLeaving: "",
    referencePersonName: "",
    referenceContactNumber: "",

    aadhaarNumber: "",
    panNumber: "",
    passportNumber: "",
    voterIdNumber: "",
    drivingLicenseNumber: "",
    uanNumber: "",
    esicNumber: "",
    pfNumber: "",

    bankName: "",
    bankBranchName: "",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
};

type FormField = {
    name: keyof typeof initialFormState;
    label: string;
    type: "text" | "email" | "tel" | "date" | "textarea" | "select" | "department" | "role";
    options?: string[];
    required?: boolean;
    hint?: string;
};

type FormSection = {
    title: string;
    subtitle: string;
    icon: string;
    fields: FormField[];
};

const formSections: FormSection[] = [
    {
        title: "Employee Basic Details",
        subtitle: "Employee personal and identity overview.",
        icon: "👤",
        fields: [
            { name: "employeeId", label: "Employee ID", type: "text", required: true },
            { name: "fullName", label: "Full Name", type: "text", required: true },
            { name: "gender", label: "Gender", type: "select", options: ["Male", "Female", "Other"] },
            { name: "dateOfBirth", label: "Date of Birth", type: "date" },
            { name: "maritalStatus", label: "Marital Status", type: "select", options: ["Single", "Married", "Divorced", "Widowed"] },
            { name: "bloodGroup", label: "Blood Group", type: "select", options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] },
            { name: "nationality", label: "Nationality", type: "text" },
            { name: "religion", label: "Religion", type: "text" },
            { name: "category", label: "Category/Caste", type: "text" },
        ],
    },
    {
        title: "Contact Details",
        subtitle: "Personal and official contact numbers, email and address.",
        icon: "☎️",
        fields: [
            { name: "personalMobileNumber", label: "Personal Mobile Number", type: "tel", required: true },
            { name: "officialMobileNumber", label: "Official Mobile Number", type: "tel", required: true },
            { name: "personalEmail", label: "Personal Email Address", type: "email", required: true },
            { name: "officialEmail", label: "Official Email Address", type: "email", required: true },
            { name: "currentAddress", label: "Current Address", type: "textarea" },
            { name: "permanentAddress", label: "Permanent Address", type: "textarea" },
        ],
    },
    {
        title: "Parent / Family Details",
        subtitle: "Family contact and guardian information.",
        icon: "👪",
        fields: [
            { name: "parentName", label: "Parent Name", type: "text" },
            { name: "parentMobileNumber", label: "Parent Mobile Number", type: "tel" },
            { name: "parentOccupation", label: "Parent Occupation", type: "text" },
            { name: "guardianRelation", label: "Guardian Relation", type: "text" },
        ],
    },
    {
        title: "Higher Education Details",
        subtitle: "Highest post-secondary qualification, institution and results.",
        icon: "🎓",
        fields: [
            {
                name: "higherEducationQualification",
                label: "Highest qualification",
                type: "select",
                options: [
                    "Schooling",
                    "Intermediate",
                    "Diploma",
                    "Graduate",
                    "Post Graduate",
                    "Doctorate",
                    "Professional",
                    "Other",
                ],
            },
            { name: "higherEducationCourseName", label: "Degree / course name", type: "text" },
            { name: "higherEducationInstitution", label: "College / university", type: "text" },
            { name: "higherEducationPassingYear", label: "Year of passing", type: "text" },
            { name: "higherEducationCgpaOrPercentage", label: "Percentage / CGPA", type: "text" },
            { name: "higherEducationSpecialization", label: "Specialization / branch", type: "text" },
        ],
    },
    {
        title: "Job / Company Details",
        subtitle: "Department, role and employment details.",
        icon: "🏢",
        fields: [
            { name: "department", label: "Department", type: "department", required: true },
            { name: "role", label: "Designation/Role", type: "role", required: true },
            { name: "employeeType", label: "Employee Type", type: "select", options: ["Full-time", "Part-time", "Contract", "Intern", "Freelancer"] },
            { name: "employmentCategory", label: "Employment Category", type: "select", options: ["Permanent", "Temporary", "Probation", "Consultant"] },
            { name: "joiningDate", label: "Joining Date", type: "date" },
            { name: "probationPeriod", label: "Probation Period", type: "text" },
            { name: "workLocation", label: "Work Location", type: "text" },
            { name: "branchName", label: "Branch Name", type: "text" },
            { name: "reportingManager", label: "Reporting Manager", type: "text" },
            { name: "employeeStatus", label: "Employee Status", type: "select", options: ["Active", "On Leave", "Probation", "Inactive", "Resigned"] },
        ],
    },
    {
        title: "Previous Employment Details",
        subtitle: "Previous company and reference details.",
        icon: "💼",
        fields: [
            { name: "previousCompanyName", label: "Previous Company Name", type: "text" },
            { name: "previousDesignation", label: "Previous Designation", type: "text" },
            { name: "previousSalary", label: "Previous Salary", type: "text" },
            { name: "workExperienceYears", label: "Work Experience (Years)", type: "text" },
            { name: "previousJoiningDate", label: "Joining Date", type: "date" },
            { name: "previousRelievingDate", label: "Relieving Date", type: "date" },
            { name: "reasonForLeaving", label: "Reason for Leaving", type: "textarea" },
            { name: "referencePersonName", label: "Reference Person Name", type: "text" },
            { name: "referenceContactNumber", label: "Reference Contact Number", type: "tel" },
        ],
    },
    {
        title: "Identity & Government Details",
        subtitle: "Government IDs and employee statutory numbers.",
        icon: "🪪",
        fields: [
            { name: "aadhaarNumber", label: "Aadhaar Number", type: "text" },
            { name: "panNumber", label: "PAN Number", type: "text" },
            { name: "passportNumber", label: "Passport Number", type: "text" },
            { name: "voterIdNumber", label: "Voter ID Number", type: "text" },
            { name: "drivingLicenseNumber", label: "Driving License Number", type: "text" },
            { name: "uanNumber", label: "UAN Number", type: "text" },
            { name: "esicNumber", label: "ESIC Number", type: "text" },
            { name: "pfNumber", label: "PF Number", type: "text" },
        ],
    },
    {
        title: "Bank Details",
        subtitle: "Salary payment bank account information.",
        icon: "🏦",
        fields: [
            { name: "bankName", label: "Bank Name", type: "text" },
            { name: "bankBranchName", label: "Branch Name", type: "text" },
            { name: "accountHolderName", label: "Account Holder Name", type: "text" },
            { name: "accountNumber", label: "Account Number", type: "text" },
            { name: "ifscCode", label: "IFSC Code", type: "text" },
            { name: "upiId", label: "UPI ID", type: "text" },
        ],
    },
];

function EmployeeStatusViewBadge({ status }: { status: string }) {
    const trimmed = status.trim();
    const isActive = trimmed === "Active";
    const isOnLeave = trimmed === "On Leave";
    const isInactive = trimmed === "Inactive" || trimmed === "Resigned";
    const tone = isActive
        ? "bg-green-50 text-green-800 ring-1 ring-green-600/15"
        : isOnLeave
          ? "bg-amber-50 text-amber-800 ring-1 ring-amber-600/15"
          : isInactive
            ? "bg-gray-100 text-gray-700 ring-1 ring-gray-200"
            : "bg-blue-50 text-blue-800 ring-1 ring-blue-600/15";

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
            {isActive ? <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden /> : null}
            {trimmed || "—"}
        </span>
    );
}

export default function AdminEmployeesPage() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
    const [isViewOnly, setIsViewOnly] = useState(false);
    const [actionBusy, setActionBusy] = useState<RowActionBusy>(null);
    const [employeesData, setEmployeesData] = useState<EmployeeRow[]>([]);
    const [formValues, setFormValues] = useState(initialFormState);
    const [departments, setDepartments] = useState<DepartmentApiRow[]>([]);
    const [roles, setRoles] = useState<RoleApiRow[]>([]);
    const [isMetaLoading, setIsMetaLoading] = useState(true);
    const [isEmployeesLoading, setIsEmployeesLoading] = useState(true);
    const [employeesLoadError, setEmployeesLoadError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const filteredRoles = useMemo(
        () => roles.filter((role) => role.department === formValues.department),
        [roles, formValues.department],
    );

    const employeeStats = useMemo(() => {
        const total = employeesData.length;
        const active = employeesData.filter((e) => e.status === "Active").length;
        const onLeave = employeesData.filter((e) => e.status === "On Leave").length;
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const newThisMonth = employeesData.filter((e) => {
            const d = new Date(e.createdAt);
            return !Number.isNaN(d.getTime()) && d >= startOfMonth;
        }).length;
        return [
            { label: "Total Employees", value: String(total), tone: "text-[#0a2a5e]" },
            { label: "Active", value: String(active), tone: "text-green-600" },
            { label: "On Leave", value: String(onLeave), tone: "text-amber-600" },
            { label: "New This Month", value: String(newThisMonth), tone: "text-[#06b6d4]" },
        ];
    }, [employeesData]);

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
                console.error("Failed to load metadata", error);
            } finally {
                if (active) {
                    setIsMetaLoading(false);
                }
            }
        };

        loadMeta();

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        let active = true;

        const loadEmployees = async () => {
            try {
                setEmployeesLoadError("");
                setIsEmployeesLoading(true);
                const response = await fetch("/api/admin/employees", { cache: "no-store" });
                if (!response.ok) {
                    throw new Error("Failed to fetch employees");
                }
                const rows: EmployeeApiListRow[] = await response.json();
                if (!active) return;
                const mapped = Array.isArray(rows) ? rows.map(mapEmployeeApiRow) : [];
                setEmployeesData(mapped);
            } catch (error) {
                console.error("Failed to load employees", error);
                if (active) {
                    setEmployeesLoadError("Unable to load employees from the database.");
                    setEmployeesData([]);
                }
            } finally {
                if (active) {
                    setIsEmployeesLoading(false);
                }
            }
        };

        loadEmployees();

        return () => {
            active = false;
        };
    }, []);

    const handleInputChange = (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => {
        const { name, value } = event.target;

        setFormValues((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const resetForm = () => {
        setFormValues(initialFormState);
    };

    const openAddModal = () => {
        setEditingRecordId(null);
        setIsViewOnly(false);
        resetForm();
        setIsAddModalOpen(true);
    };

    const loadEmployeeIntoModal = async (employee: EmployeeRow, mode: "edit" | "view") => {
        try {
            setActionBusy({ recordId: employee.recordId, kind: mode });
            const response = await fetch(`/api/admin/employees/${employee.recordId}`, { cache: "no-store" });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to load");
            }
            setFormValues({ ...initialFormState, ...(data as Record<string, string>) });
            if (mode === "edit") {
                setEditingRecordId(employee.recordId);
                setIsViewOnly(false);
            } else {
                setEditingRecordId(null);
                setIsViewOnly(true);
            }
            setIsAddModalOpen(true);
        } catch (error) {
            console.error("Error loading employee", error);
            alert(mode === "view" ? "Could not load this employee to view." : "Could not load this employee for editing.");
        } finally {
            setActionBusy(null);
        }
    };

    const openEditEmployee = (employee: EmployeeRow) => {
        void loadEmployeeIntoModal(employee, "edit");
    };

    const openViewEmployee = (employee: EmployeeRow) => {
        void loadEmployeeIntoModal(employee, "view");
    };

    const handleDeleteEmployee = async (employee: EmployeeRow) => {
        const ok = window.confirm(
            `Remove ${employee.name} (${employee.employeeId}) from the directory? This cannot be undone.`,
        );
        if (!ok) return;

        try {
            setActionBusy({ recordId: employee.recordId, kind: "delete" });
            const response = await fetch(`/api/admin/employees/${employee.recordId}`, { method: "DELETE" });
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(typeof data.message === "string" ? data.message : "Delete failed");
            }
            setEmployeesData((current) => current.filter((e) => e.recordId !== employee.recordId));
        } catch (error) {
            console.error("Error deleting employee", error);
            alert("Unable to delete this employee. Please try again.");
        } finally {
            setActionBusy(null);
        }
    };

    const handleSaveEmployee = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isViewOnly) return;

        try {
            setIsSubmitting(true);
            const isEdit = editingRecordId !== null;
            const response = await fetch(
                isEdit ? `/api/admin/employees/${editingRecordId}` : "/api/admin/employees",
                {
                    method: isEdit ? "PUT" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formValues),
                },
            );

            const data = await response.json().catch(() => ({}));

            if (response.status === 409) {
                alert(typeof data.message === "string" ? data.message : "This Employee ID is already in use.");
                return;
            }

            if (!response.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to save employee");
            }

            const saved = data as EmployeeApiListRow;
            if (saved?.id) {
                if (isEdit) {
                    setEmployeesData((current) =>
                        current.map((e) => (e.recordId === editingRecordId ? mapEmployeeApiRow(saved) : e)),
                    );
                } else {
                    setEmployeesData((current) => [mapEmployeeApiRow(saved), ...current]);
                }
            } else {
                const refresh = await fetch("/api/admin/employees", { cache: "no-store" });
                if (refresh.ok) {
                    const rows: EmployeeApiListRow[] = await refresh.json();
                    setEmployeesData(Array.isArray(rows) ? rows.map(mapEmployeeApiRow) : []);
                }
            }

            closeModal();
        } catch (error) {
            console.error("Error saving employee", error);
            alert("Unable to save employee right now. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeModal = () => {
        setEditingRecordId(null);
        setIsViewOnly(false);
        setIsAddModalOpen(false);
        resetForm();
    };

    const inputClassName =
        "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e] disabled:cursor-not-allowed disabled:bg-gray-50 placeholder:text-gray-400";
    const selectClassName = `${inputClassName} bg-white`;

    const renderField = (field: FormField) => {
        const value = formValues[field.name];
        const isSideBySideAddress =
            field.type === "textarea" &&
            (field.name === "currentAddress" || field.name === "permanentAddress");
        const textareaColSpan = field.type === "textarea" && !isSideBySideAddress ? "sm:col-span-2" : "";

        return (
            <div
                key={field.name}
                className={textareaColSpan}
            >
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    {field.label}
                    {field.required && <span className="ml-1 text-red-500">*</span>}
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
                        <option value="">{isMetaLoading ? "Loading..." : field.label}</option>
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
                                ? "Select Department First"
                                : isMetaLoading
                                  ? "Loading..."
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
                        disabled={field.name === "employeeId" && editingRecordId !== null}
                        className={inputClassName}
                    />
                )}

                {field.hint && <p className="mt-1.5 text-xs text-gray-500">{field.hint}</p>}
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Employee directory</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage employees and add new hires from the HRMS registration modal.
                    </p>
                    {employeesLoadError && <p className="mt-2 text-xs text-amber-600">{employeesLoadError}</p>}
                </div>

                <button
                    type="button"
                    onClick={openAddModal}
                    disabled={isEmployeesLoading}
                    className="inline-flex items-center justify-center rounded-xl bg-[#0a2a5e] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    Add Employee
                </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {employeeStats.map((stat) => (
                    <div key={stat.label} className="rounded-3xl border border-[#e9eef7] bg-white p-5 shadow-sm">
                        <p className="text-sm text-gray-500">{stat.label}</p>
                        <p className={`mt-3 text-3xl font-semibold ${stat.tone}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="overflow-hidden rounded-3xl border border-[#e9eef7] bg-white">
                <div className="border-b border-[#e9eef7] p-6">
                    <p className="text-sm font-semibold text-gray-900">Employee roster</p>
                    <p className="mt-1 text-sm text-gray-500">
                        {isEmployeesLoading ? "Loading…" : `Showing ${employeesData.length} employee(s).`}
                    </p>
                </div>

                <div className="overflow-x-auto p-6">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Employee
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Department
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {isEmployeesLoading && (
                                <tr>
                                    <td className="px-6 py-8 text-sm text-gray-500" colSpan={6}>
                                        Loading employees…
                                    </td>
                                </tr>
                            )}
                            {!isEmployeesLoading && employeesData.length === 0 && (
                                <tr>
                                    <td className="px-6 py-8 text-sm text-gray-500" colSpan={6}>
                                        No employees yet. Add one with the button above.
                                    </td>
                                </tr>
                            )}
                            {!isEmployeesLoading &&
                                employeesData.map((employee) => (
                                    <tr key={employee.recordId} className="transition-colors hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">{employee.name}</p>
                                                <p className="text-xs text-gray-400">{employee.employeeId}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{employee.role}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{employee.department}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{employee.email}</td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                    employee.status === "Active"
                                                        ? "bg-green-50 text-green-700"
                                                        : employee.status === "On Leave"
                                                          ? "bg-amber-50 text-amber-700"
                                                          : employee.status === "Inactive" || employee.status === "Resigned"
                                                            ? "bg-gray-100 text-gray-700"
                                                            : "bg-blue-50 text-blue-700"
                                                }`}
                                            >
                                                {employee.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => openViewEmployee(employee)}
                                                    disabled={actionBusy !== null || isSubmitting}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                    title="View employee"
                                                    aria-label="View employee"
                                                >
                                                    {actionBusy?.recordId === employee.recordId &&
                                                    actionBusy.kind === "view" ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                                    ) : (
                                                        <Eye className="h-4 w-4" aria-hidden />
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openEditEmployee(employee)}
                                                    disabled={actionBusy !== null || isSubmitting}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-[#0a2a5e] shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                    title="Edit employee"
                                                    aria-label="Edit employee"
                                                >
                                                    {actionBusy?.recordId === employee.recordId &&
                                                    actionBusy.kind === "edit" ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                                    ) : (
                                                        <Pencil className="h-4 w-4" aria-hidden />
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => void handleDeleteEmployee(employee)}
                                                    disabled={actionBusy !== null || isSubmitting}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-700 shadow-sm transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                    title="Delete employee"
                                                    aria-label="Delete employee"
                                                >
                                                    {actionBusy?.recordId === employee.recordId &&
                                                    actionBusy.kind === "delete" ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" aria-hidden />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isAddModalOpen && isViewOnly && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
                        aria-hidden
                        onClick={closeModal}
                    />
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="employee-view-title"
                        className="relative flex max-h-[min(90vh,800px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
                    >
                        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-100 px-6 py-5">
                            <h3
                                id="employee-view-title"
                                className="text-lg font-bold tracking-tight text-[#001540]"
                            >
                                Employee details
                            </h3>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" strokeWidth={2} />
                            </button>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                            {formSections.map((section, index) => (
                                <div
                                    key={section.title}
                                    className={index > 0 ? "mt-8 border-t border-gray-200 pt-8" : ""}
                                >
                                    <h4 className="text-base font-bold text-[#001540]">
                                        {section.title}
                                    </h4>
                                    <div className="mt-4 grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2">
                                        {section.fields.map((field) => {
                                            const raw = formValues[field.name];
                                            const display = typeof raw === "string" ? raw.trim() : "";
                                            const isWide = field.type === "textarea";
                                            return (
                                                <div
                                                    key={field.name}
                                                    className={isWide ? "sm:col-span-2" : ""}
                                                >
                                                    <p className="text-xs font-medium text-gray-500">{field.label}</p>
                                                    <div className="mt-1">
                                                        {field.name === "employeeStatus" ? (
                                                            <EmployeeStatusViewBadge status={display} />
                                                        ) : (
                                                            <p
                                                                className={`text-sm font-semibold text-gray-900 ${
                                                                    isWide ? "whitespace-pre-wrap break-words" : "break-words"
                                                                }`}
                                                            >
                                                                {display || "—"}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex shrink-0 justify-end border-t border-gray-100 bg-white px-6 py-4">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="rounded-lg bg-[#001540] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isAddModalOpen && !isViewOnly && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
                        aria-hidden
                        onClick={() => {
                            if (!isSubmitting) closeModal();
                        }}
                    />
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="add-employee-title"
                        className="relative flex max-h-[min(94vh,920px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"
                    >
                        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-100 bg-gradient-to-r from-[#06124f] to-[#0a2a5e] px-6 py-4">
                            <div className="min-w-0">
                                <h3 id="add-employee-title" className="text-lg font-bold text-white">
                                    {editingRecordId !== null ? "Edit employee" : "Add Employee"}
                                </h3>
                                <p className="mt-0.5 text-xs text-cyan-100/90">
                                    {editingRecordId !== null
                                        ? "Update profile details and save changes."
                                        : "Register a complete employee profile with HRMS details."}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!isSubmitting) closeModal();
                                }}
                                disabled={isSubmitting}
                                className="shrink-0 rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label="Close"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSaveEmployee} className="flex min-h-0 flex-1 flex-col">
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="flex flex-col gap-8">
                                    {formSections.map((section, index) => (
                                        <section
                                            key={section.title}
                                            className={
                                                index > 0 ? "border-t border-gray-100 pt-8" : ""
                                            }
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
                                    onClick={closeModal}
                                    disabled={isSubmitting}
                                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="rounded-xl bg-gradient-to-r from-[#06124f] to-[#0a2a5e] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSubmitting
                                        ? "Saving…"
                                        : editingRecordId !== null
                                          ? "Update employee"
                                          : "Save employee"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
