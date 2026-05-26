/** Client-safe full employee profile form (matches admin employee edit modal). */

export type EmployeeProfileFormValues = {
    employeeId: string;
    fullName: string;
    gender: string;
    dateOfBirth: string;
    maritalStatus: string;
    bloodGroup: string;
    nationality: string;
    religion: string;
    category: string;
    personalMobileNumber: string;
    officialMobileNumber: string;
    personalEmail: string;
    officialEmail: string;
    currentAddress: string;
    permanentAddress: string;
    parentName: string;
    parentMobileNumber: string;
    parentOccupation: string;
    guardianRelation: string;
    higherEducationQualification: string;
    higherEducationCourseName: string;
    higherEducationInstitution: string;
    higherEducationPassingYear: string;
    higherEducationCgpaOrPercentage: string;
    higherEducationSpecialization: string;
    department: string;
    role: string;
    employeeType: string;
    employmentCategory: string;
    joiningDate: string;
    probationPeriod: string;
    workLocation: string;
    branchName: string;
    reportingManager: string;
    employeeStatus: string;
    previousCompanyName: string;
    previousDesignation: string;
    previousSalary: string;
    workExperienceYears: string;
    previousJoiningDate: string;
    previousRelievingDate: string;
    reasonForLeaving: string;
    referencePersonName: string;
    referenceContactNumber: string;
    aadhaarNumber: string;
    panNumber: string;
    passportNumber: string;
    voterIdNumber: string;
    drivingLicenseNumber: string;
    uanNumber: string;
    esicNumber: string;
    pfNumber: string;
    bankName: string;
    bankBranchName: string;
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    upiId: string;
};

export const initialEmployeeProfileFormState: EmployeeProfileFormValues = {
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

export type EmployeeProfileFormField = {
    name: keyof EmployeeProfileFormValues;
    label: string;
    type: "text" | "email" | "tel" | "date" | "textarea" | "select" | "department" | "role";
    options?: string[];
    required?: boolean;
};

export type EmployeeProfileFormSection = {
    title: string;
    subtitle: string;
    fields: EmployeeProfileFormField[];
};

export const employeeProfileFormSections: EmployeeProfileFormSection[] = [
    {
        title: "Employee Basic Details",
        subtitle: "Employee personal and identity overview.",
        fields: [
            { name: "employeeId", label: "Employee ID", type: "text", required: true },
            { name: "fullName", label: "Full Name", type: "text", required: true },
            { name: "gender", label: "Gender", type: "select", options: ["Male", "Female", "Other"] },
            { name: "dateOfBirth", label: "Date of Birth", type: "date" },
            {
                name: "maritalStatus",
                label: "Marital Status",
                type: "select",
                options: ["Single", "Married", "Divorced", "Widowed"],
            },
            {
                name: "bloodGroup",
                label: "Blood Group",
                type: "select",
                options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
            },
            { name: "nationality", label: "Nationality", type: "text" },
            { name: "religion", label: "Religion", type: "text" },
            { name: "category", label: "Category/Caste", type: "text" },
        ],
    },
    {
        title: "Contact Details",
        subtitle: "Personal and official contact numbers, email and address.",
        fields: [
            { name: "personalMobileNumber", label: "Personal Mobile Number", type: "tel" },
            { name: "officialMobileNumber", label: "Official Mobile Number", type: "tel" },
            { name: "personalEmail", label: "Personal Email Address", type: "email" },
            { name: "officialEmail", label: "Official Email Address", type: "email" },
            { name: "currentAddress", label: "Current Address", type: "textarea" },
            { name: "permanentAddress", label: "Permanent Address", type: "textarea" },
        ],
    },
    {
        title: "Parent / Family Details",
        subtitle: "Family contact and guardian information.",
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
        fields: [
            { name: "department", label: "Department", type: "department", required: true },
            { name: "role", label: "Designation/Role", type: "role", required: true },
            {
                name: "employeeType",
                label: "Employee Type",
                type: "select",
                options: ["Full-time", "Part-time", "Contract", "Intern", "Freelancer"],
            },
            {
                name: "employmentCategory",
                label: "Employment Category",
                type: "select",
                options: ["Permanent", "Temporary", "Probation", "Consultant"],
            },
            { name: "joiningDate", label: "Joining Date", type: "date" },
            { name: "probationPeriod", label: "Probation Period", type: "text" },
            { name: "workLocation", label: "Work Location", type: "text" },
            { name: "branchName", label: "Branch Name", type: "text" },
            { name: "reportingManager", label: "Reporting Manager", type: "text" },
            {
                name: "employeeStatus",
                label: "Employee Status",
                type: "select",
                options: ["Active", "On Leave", "Probation", "Inactive", "Resigned"],
            },
        ],
    },
    {
        title: "Previous Employment Details",
        subtitle: "Previous company and reference details.",
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

export function profileToFormValues(
    profile: Partial<Record<keyof EmployeeProfileFormValues, string>>,
): EmployeeProfileFormValues {
    const out = { ...initialEmployeeProfileFormState };
    for (const key of Object.keys(out) as (keyof EmployeeProfileFormValues)[]) {
        const value = profile[key];
        if (typeof value === "string") out[key] = value;
    }
    if (!out.employeeStatus.trim()) out.employeeStatus = "Active";
    return out;
}
