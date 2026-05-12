import pool from "@/lib/db";

export async function ensureAdminEmployeesTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS admin_employees (
            id INT AUTO_INCREMENT PRIMARY KEY,
            employee_id VARCHAR(64) NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            gender VARCHAR(32) NULL,
            date_of_birth DATE NULL,
            marital_status VARCHAR(32) NULL,
            blood_group VARCHAR(16) NULL,
            nationality VARCHAR(128) NULL,
            religion VARCHAR(128) NULL,
            category VARCHAR(128) NULL,
            personal_mobile VARCHAR(32) NULL,
            official_mobile VARCHAR(32) NULL,
            personal_email VARCHAR(255) NULL,
            official_email VARCHAR(255) NULL,
            current_address TEXT NULL,
            permanent_address TEXT NULL,
            parent_name VARCHAR(255) NULL,
            parent_mobile VARCHAR(32) NULL,
            parent_occupation VARCHAR(255) NULL,
            guardian_relation VARCHAR(128) NULL,
            higher_education_qualification VARCHAR(64) NULL,
            higher_education_course_name VARCHAR(255) NULL,
            higher_education_institution VARCHAR(255) NULL,
            higher_education_passing_year VARCHAR(16) NULL,
            higher_education_cgpa VARCHAR(32) NULL,
            higher_education_specialization VARCHAR(255) NULL,
            department VARCHAR(255) NULL,
            designation VARCHAR(255) NULL,
            employee_type VARCHAR(64) NULL,
            employment_category VARCHAR(64) NULL,
            joining_date DATE NULL,
            probation_period VARCHAR(64) NULL,
            work_location VARCHAR(255) NULL,
            branch_name VARCHAR(255) NULL,
            reporting_manager VARCHAR(255) NULL,
            employee_status VARCHAR(32) NOT NULL DEFAULT 'Active',
            previous_company_name VARCHAR(255) NULL,
            previous_designation VARCHAR(255) NULL,
            previous_salary VARCHAR(64) NULL,
            work_experience_years VARCHAR(32) NULL,
            previous_joining_date DATE NULL,
            previous_relieving_date DATE NULL,
            reason_for_leaving TEXT NULL,
            reference_person_name VARCHAR(255) NULL,
            reference_contact_number VARCHAR(32) NULL,
            aadhaar_number VARCHAR(32) NULL,
            pan_number VARCHAR(32) NULL,
            passport_number VARCHAR(64) NULL,
            voter_id_number VARCHAR(64) NULL,
            driving_license_number VARCHAR(64) NULL,
            uan_number VARCHAR(64) NULL,
            esic_number VARCHAR(64) NULL,
            pf_number VARCHAR(64) NULL,
            bank_name VARCHAR(255) NULL,
            bank_branch_name VARCHAR(255) NULL,
            account_holder_name VARCHAR(255) NULL,
            account_number VARCHAR(64) NULL,
            ifsc_code VARCHAR(32) NULL,
            upi_id VARCHAR(128) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_admin_employees_employee_id (employee_id)
        )
    `);
}

export function strFromBody(body: Record<string, unknown>, key: string): string | null {
    const v = body[key];
    if (v === undefined || v === null) return null;
    const s = String(v).trim();
    return s.length ? s : null;
}

export function dateOrNullFromBody(body: Record<string, unknown>, key: string): string | null {
    const s = strFromBody(body, key);
    if (!s) return null;
    return s;
}

/** Values in column order for INSERT or UPDATE (excluding id). */
export function employeeFormToSqlValues(body: Record<string, unknown>): unknown[] {
    return [
        strFromBody(body, "employeeId"),
        strFromBody(body, "fullName"),
        strFromBody(body, "gender"),
        dateOrNullFromBody(body, "dateOfBirth"),
        strFromBody(body, "maritalStatus"),
        strFromBody(body, "bloodGroup"),
        strFromBody(body, "nationality"),
        strFromBody(body, "religion"),
        strFromBody(body, "category"),
        strFromBody(body, "personalMobileNumber"),
        strFromBody(body, "officialMobileNumber"),
        strFromBody(body, "personalEmail"),
        strFromBody(body, "officialEmail"),
        strFromBody(body, "currentAddress"),
        strFromBody(body, "permanentAddress"),
        strFromBody(body, "parentName"),
        strFromBody(body, "parentMobileNumber"),
        strFromBody(body, "parentOccupation"),
        strFromBody(body, "guardianRelation"),
        strFromBody(body, "higherEducationQualification"),
        strFromBody(body, "higherEducationCourseName"),
        strFromBody(body, "higherEducationInstitution"),
        strFromBody(body, "higherEducationPassingYear"),
        strFromBody(body, "higherEducationCgpaOrPercentage"),
        strFromBody(body, "higherEducationSpecialization"),
        strFromBody(body, "department"),
        strFromBody(body, "role"),
        strFromBody(body, "employeeType"),
        strFromBody(body, "employmentCategory"),
        dateOrNullFromBody(body, "joiningDate"),
        strFromBody(body, "probationPeriod"),
        strFromBody(body, "workLocation"),
        strFromBody(body, "branchName"),
        strFromBody(body, "reportingManager"),
        strFromBody(body, "employeeStatus") ?? "Active",
        strFromBody(body, "previousCompanyName"),
        strFromBody(body, "previousDesignation"),
        strFromBody(body, "previousSalary"),
        strFromBody(body, "workExperienceYears"),
        dateOrNullFromBody(body, "previousJoiningDate"),
        dateOrNullFromBody(body, "previousRelievingDate"),
        strFromBody(body, "reasonForLeaving"),
        strFromBody(body, "referencePersonName"),
        strFromBody(body, "referenceContactNumber"),
        strFromBody(body, "aadhaarNumber"),
        strFromBody(body, "panNumber"),
        strFromBody(body, "passportNumber"),
        strFromBody(body, "voterIdNumber"),
        strFromBody(body, "drivingLicenseNumber"),
        strFromBody(body, "uanNumber"),
        strFromBody(body, "esicNumber"),
        strFromBody(body, "pfNumber"),
        strFromBody(body, "bankName"),
        strFromBody(body, "bankBranchName"),
        strFromBody(body, "accountHolderName"),
        strFromBody(body, "accountNumber"),
        strFromBody(body, "ifscCode"),
        strFromBody(body, "upiId"),
    ];
}

function cellString(v: unknown): string {
    if (v === undefined || v === null) return "";
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    return String(v);
}

function cellText(v: unknown): string {
    if (v === undefined || v === null) return "";
    return String(v);
}

/** Map full DB row to client form field names (string values). */
export function employeeRowToFormState(row: Record<string, unknown>): Record<string, string> {
    return {
        employeeId: cellString(row.employee_id),
        fullName: cellText(row.full_name),
        gender: cellString(row.gender),
        dateOfBirth: cellString(row.date_of_birth),
        maritalStatus: cellString(row.marital_status),
        bloodGroup: cellString(row.blood_group),
        nationality: cellText(row.nationality),
        religion: cellText(row.religion),
        category: cellText(row.category),
        personalMobileNumber: cellText(row.personal_mobile),
        officialMobileNumber: cellText(row.official_mobile),
        personalEmail: cellText(row.personal_email),
        officialEmail: cellText(row.official_email),
        currentAddress: cellText(row.current_address),
        permanentAddress: cellText(row.permanent_address),
        parentName: cellText(row.parent_name),
        parentMobileNumber: cellText(row.parent_mobile),
        parentOccupation: cellText(row.parent_occupation),
        guardianRelation: cellText(row.guardian_relation),
        higherEducationQualification: cellString(row.higher_education_qualification),
        higherEducationCourseName: cellText(row.higher_education_course_name),
        higherEducationInstitution: cellText(row.higher_education_institution),
        higherEducationPassingYear: cellText(row.higher_education_passing_year),
        higherEducationCgpaOrPercentage: cellText(row.higher_education_cgpa),
        higherEducationSpecialization: cellText(row.higher_education_specialization),
        department: cellText(row.department),
        role: cellText(row.designation),
        employeeType: cellString(row.employee_type),
        employmentCategory: cellString(row.employment_category),
        joiningDate: cellString(row.joining_date),
        probationPeriod: cellText(row.probation_period),
        workLocation: cellText(row.work_location),
        branchName: cellText(row.branch_name),
        reportingManager: cellText(row.reporting_manager),
        employeeStatus: cellString(row.employee_status) || "Active",
        previousCompanyName: cellText(row.previous_company_name),
        previousDesignation: cellText(row.previous_designation),
        previousSalary: cellText(row.previous_salary),
        workExperienceYears: cellText(row.work_experience_years),
        previousJoiningDate: cellString(row.previous_joining_date),
        previousRelievingDate: cellString(row.previous_relieving_date),
        reasonForLeaving: cellText(row.reason_for_leaving),
        referencePersonName: cellText(row.reference_person_name),
        referenceContactNumber: cellText(row.reference_contact_number),
        aadhaarNumber: cellText(row.aadhaar_number),
        panNumber: cellText(row.pan_number),
        passportNumber: cellText(row.passport_number),
        voterIdNumber: cellText(row.voter_id_number),
        drivingLicenseNumber: cellText(row.driving_license_number),
        uanNumber: cellText(row.uan_number),
        esicNumber: cellText(row.esic_number),
        pfNumber: cellText(row.pf_number),
        bankName: cellText(row.bank_name),
        bankBranchName: cellText(row.bank_branch_name),
        accountHolderName: cellText(row.account_holder_name),
        accountNumber: cellText(row.account_number),
        ifscCode: cellText(row.ifsc_code),
        upiId: cellText(row.upi_id),
    };
}
