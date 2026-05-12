"use client";

import { useEffect, useMemo, useState } from "react";

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

const employeeStats = [
    { label: "Total Employees", value: "48", tone: "text-[#0a2a5e]" },
    { label: "Active Today", value: "42", tone: "text-green-600" },
    { label: "On Leave", value: "4", tone: "text-amber-600" },
    { label: "New This Month", value: "3", tone: "text-[#06b6d4]" },
];

const employees = [
    { id: "EMP-1001", name: "Rahul Sharma", role: "Sales Manager", department: "Sales", email: "rahul@viros.com", status: "Active" },
    { id: "EMP-1002", name: "Priya Patel", role: "HR Executive", department: "HR", email: "priya@viros.com", status: "Active" },
    { id: "EMP-1003", name: "Amit Kumar", role: "Tech Lead", department: "IT", email: "amit@viros.com", status: "Active" },
    { id: "EMP-1004", name: "Sneha Joshi", role: "UI/UX Designer", department: "Marketing", email: "sneha@viros.com", status: "On Leave" },
    { id: "EMP-1005", name: "Vikram Singh", role: "Finance Analyst", department: "Finance", email: "vikram@viros.com", status: "Active" },
    { id: "EMP-1006", name: "Neha Verma", role: "Operations Executive", department: "Operations", email: "neha@viros.com", status: "Probation" },
];

const initialFormState = {
    employeeId: "",
    employeeCode: "",
    firstName: "",
    middleName: "",
    lastName: "",
    fullName: "",
    gender: "",
    dateOfBirth: "",
    age: "",
    maritalStatus: "",
    bloodGroup: "",
    nationality: "",
    religion: "",
    category: "",
    profilePhoto: "",
    signature: "",
    mobileNumber: "",
    alternateMobileNumber: "",
    officialEmail: "",
    personalEmail: "",
    emergencyContactNumber: "",
    whatsappNumber: "",
    currentAddress: "",
    permanentAddress: "",
    city: "",
    state: "",
    country: "",
    pinCode: "",
    fatherName: "",
    fatherMobileNumber: "",
    fatherOccupation: "",
    motherName: "",
    motherMobileNumber: "",
    motherOccupation: "",
    spouseName: "",
    spouseMobileNumber: "",
    spouseOccupation: "",
    guardianName: "",
    guardianRelation: "",
    guardianMobileNumber: "",
    numberOfFamilyMembers: "",
    emergencyFamilyContact: "",
    nomineeName: "",
    nomineeRelation: "",
    nomineeMobileNumber: "",
    tenthSchoolName: "",
    tenthBoard: "",
    tenthPassingYear: "",
    tenthPercentage: "",
    twelfthSchoolName: "",
    twelfthBoard: "",
    twelfthPassingYear: "",
    twelfthPercentage: "",
    graduationCollegeName: "",
    degreeName: "",
    universityName: "",
    graduationPassingYear: "",
    graduationPercentage: "",
    postGraduationDetails: "",
    certifications: "",
    technicalSkills: "",
    languagesKnown: "",
    department: "",
    designation: "",
    role: "",
    employeeType: "",
    employmentCategory: "",
    joiningDate: "",
    probationPeriod: "",
    workLocation: "",
    branchName: "",
    reportingManager: "",
    shiftTiming: "",
    officeExtensionNumber: "",
    employeeStatus: "",
    salaryPackage: "",
    ctc: "",
    basicSalary: "",
    pfApplicable: "",
    esicApplicable: "",
    overtimeEligibility: "",
    previousCompanyName: "",
    previousDesignation: "",
    previousSalary: "",
    previousWorkExperience: "",
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
    pfNumber: "",
    bankName: "",
    bankBranchName: "",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
    status: "Active",
};

export default function AdminEmployeesPage() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [employeesData, setEmployeesData] = useState(employees);
    const [formValues, setFormValues] = useState<typeof initialFormState>(initialFormState);
    const [departments, setDepartments] = useState<DepartmentApiRow[]>([]);
    const [roles, setRoles] = useState<RoleApiRow[]>([]);
    const [isMetaLoading, setIsMetaLoading] = useState(true);

    const filteredRoles = useMemo(
        () => roles.filter((role) => role.department === formValues.department),
        [roles, formValues.department],
    );

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
                setDepartments(departmentsData ?? []);
                setRoles(rolesData ?? []);
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

    const handleInputChange = (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => {
        const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

        if (target instanceof HTMLInputElement && target.type === "file") {
            setFormValues((current) => ({
                ...current,
                [target.name]: target.files?.[0]?.name ?? "",
            }));
            return;
        }

        setFormValues((current) => ({
            ...current,
            [target.name]: target.value,
        }));
    };

    const handleAddEmployee = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const fullName = [formValues.firstName, formValues.middleName, formValues.lastName]
            .filter(Boolean)
            .join(" ");

        const newEmployee = {
            id: formValues.employeeId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
            name: fullName || "New Employee",
            role: formValues.role || "Unknown",
            department: formValues.department || "Unknown",
            email: formValues.officialEmail || formValues.personalEmail || "no-reply@viros.com",
            status: formValues.employeeStatus || "Active",
        };

        setEmployeesData((current) => [newEmployee, ...current]);
        setFormValues(initialFormState);
        setIsAddModalOpen(false);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Employee directory</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage employees and add new hires from the HRMS registration modal.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center justify-center rounded-xl bg-[#0a2a5e] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition"
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
                <div className="flex flex-col gap-4 border-b border-[#e9eef7] p-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-gray-900">Employee roster</p>
                        <p className="mt-1 text-sm text-gray-500">All employees currently registered.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsAddModalOpen(true)}
                        className="inline-flex items-center justify-center rounded-xl bg-[#0a2a5e] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition"
                    >
                        New employee
                    </button>
                </div>

                <div className="overflow-x-auto p-6">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Employee
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Department
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {employeesData.map((employee) => (
                                <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{employee.name}</p>
                                            <p className="text-xs text-gray-400">{employee.id}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{employee.role}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{employee.department}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{employee.email}</td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                employee.status === "Active"
                                                    ? "bg-green-50 text-green-700"
                                                    : employee.status === "On Leave"
                                                    ? "bg-amber-50 text-amber-700"
                                                    : "bg-blue-50 text-blue-700"
                                            }`}
                                        >
                                            {employee.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setIsAddModalOpen(false)}
                    />
                    <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Add Employee</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Create a new employee profile with HRMS details.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleAddEmployee} className="p-6 overflow-y-auto flex-1">
                            <div className="space-y-6">
                                {/* Personal Information */}
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 mb-4">Personal Information</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <input type="text" name="employeeCode" placeholder="Employee Code" value={formValues.employeeCode} onChange={handleInputChange} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                        <input type="text" name="employeeId" placeholder="Employee ID" value={formValues.employeeId} onChange={handleInputChange} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                        <input type="text" name="firstName" placeholder="First Name" value={formValues.firstName} onChange={handleInputChange} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                        <input type="text" name="middleName" placeholder="Middle Name" value={formValues.middleName} onChange={handleInputChange} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                        <input type="text" name="lastName" placeholder="Last Name" value={formValues.lastName} onChange={handleInputChange} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                        <select name="gender" value={formValues.gender} onChange={handleInputChange} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                                            <option value="">Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        <input type="date" name="dateOfBirth" value={formValues.dateOfBirth} onChange={handleInputChange} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                        <input type="text" name="bloodGroup" placeholder="Blood Group" value={formValues.bloodGroup} onChange={handleInputChange} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                        <input type="text" name="nationality" placeholder="Nationality" value={formValues.nationality} onChange={handleInputChange} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                    </div>
                                </div>

                                {/* Contact Information */}
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 mb-4">Contact Information</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input type="email" name="officialEmail" placeholder="Official Email" value={formValues.officialEmail} onChange={handleInputChange} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                        <input type="email" name="personalEmail" placeholder="Personal Email" value={formValues.personalEmail} onChange={handleInputChange} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                        <input type="tel" name="mobileNumber" placeholder="Mobile Number" value={formValues.mobileNumber} onChange={handleInputChange} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                        <input type="tel" name="alternateMobileNumber" placeholder="Alternate Mobile" value={formValues.alternateMobileNumber} onChange={handleInputChange} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                        <textarea name="currentAddress" placeholder="Current Address" value={formValues.currentAddress} onChange={handleInputChange} rows={2} className="px-3 py-2 border border-gray-300 rounded-lg text-sm col-span-2" />
                                        <textarea name="permanentAddress" placeholder="Permanent Address" value={formValues.permanentAddress} onChange={handleInputChange} rows={2} className="px-3 py-2 border border-gray-300 rounded-lg text-sm col-span-2" />
                                    </div>
                                </div>

                                {/* Education */}
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 mb-4">Education</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <input type="text" name="tenthSchoolName" placeholder="10th School" value={formValues.tenthSchoolName} onChange={handleInputChange} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                        <input type="text" name="graduationCollegeName" placeholder="College Name" value={formValues.graduationCollegeName} onChange={handleInputChange} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                        <input type="text" name="degreeName" placeholder="Degree" value={formValues.degreeName} onChange={handleInputChange} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                    </div>
                                </div>

                                {/* Employment Details */}
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 mb-4">Employment Details</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <select name="department" value={formValues.department} onChange={handleInputChange} disabled={isMetaLoading} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                                            <option value="">{isMetaLoading ? "Loading..." : "Department"}</option>
                                            {departments.map((d) => (
                                                <option key={d.id} value={d.name}>{d.name}</option>
                                            ))}
                                        </select>
                                        <select name="role" value={formValues.role} onChange={handleInputChange} disabled={isMetaLoading || !formValues.department} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                                            <option value="">{!formValues.department ? "Select Department First" : isMetaLoading ? "Loading..." : "Role"}</option>
                                            {filteredRoles.map((r) => (
                                                <option key={r.id} value={r.name}>{r.name}</option>
                                            ))}
                                        </select>
                                        <input type="date" name="joiningDate" value={formValues.joiningDate} onChange={handleInputChange} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                        <select name="employeeType" value={formValues.employeeType} onChange={handleInputChange} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                                            <option value="">Employment Type</option>
                                            <option value="Full-time">Full-time</option>
                                            <option value="Part-time">Part-time</option>
                                            <option value="Contract">Contract</option>
                                        </select>
                                        <input type="text" name="ctc" placeholder="CTC" value={formValues.ctc} onChange={handleInputChange} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                        <input type="text" name="basicSalary" placeholder="Basic Salary" value={formValues.basicSalary} onChange={handleInputChange} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                    </div>
                                </div>

                                {/* Banking & Documents */}
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 mb-4">Banking & Documents</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input type="text" name="bankName" placeholder="Bank Name" value={formValues.bankName} onChange={handleInputChange} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                        <input type="text" name="accountNumber" placeholder="Account Number" value={formValues.accountNumber} onChange={handleInputChange} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                        <input type="text" name="ifscCode" placeholder="IFSC Code" value={formValues.ifscCode} onChange={handleInputChange} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                        <input type="text" name="panNumber" placeholder="PAN Number" value={formValues.panNumber} onChange={handleInputChange} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                        <input type="text" name="aadhaarNumber" placeholder="Aadhaar Number" value={formValues.aadhaarNumber} onChange={handleInputChange} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                        <input type="text" name="uanNumber" placeholder="UAN Number" value={formValues.uanNumber} onChange={handleInputChange} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg bg-[#0a2a5e] text-sm font-semibold text-white hover:opacity-90"
                                >
                                    Save Employee
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
