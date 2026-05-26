import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import {
    employeeFormToSqlValues,
    employeeRowToFormState,
    ensureAdminEmployeesTable,
    strFromBody,
} from "@/lib/adminEmployees";
import { EMPLOYEE_PROFILE_FORM_KEYS } from "@/lib/employeeProfileFields";
import type { EmployeeSession } from "@/lib/employeeSession";

export { EMPLOYEE_PROFILE_FORM_KEYS, type EmployeeProfileFormKey } from "@/lib/employeeProfileFields";

export function pickEmployeeProfileBody(body: Record<string, unknown>): Record<string, unknown> {
    const picked: Record<string, unknown> = {};
    for (const key of EMPLOYEE_PROFILE_FORM_KEYS) {
        if (key in body) picked[key] = body[key];
    }
    return picked;
}

const UPDATE_EMPLOYEE_BY_EMPLOYEE_ID_SQL = `
    UPDATE admin_employees SET
        employee_id=?, full_name=?, gender=?, date_of_birth=?, marital_status=?, blood_group=?, nationality=?, religion=?, category=?,
        personal_mobile=?, official_mobile=?, personal_email=?, official_email=?, current_address=?, permanent_address=?,
        parent_name=?, parent_mobile=?, parent_occupation=?, guardian_relation=?,
        higher_education_qualification=?, higher_education_course_name=?, higher_education_institution=?,
        higher_education_passing_year=?, higher_education_cgpa=?, higher_education_specialization=?,
        department=?, designation=?, employee_type=?, employment_category=?, joining_date=?, probation_period=?,
        work_location=?, branch_name=?, reporting_manager=?, employee_status=?,
        previous_company_name=?, previous_designation=?, previous_salary=?, work_experience_years=?,
        previous_joining_date=?, previous_relieving_date=?, reason_for_leaving=?, reference_person_name=?, reference_contact_number=?,
        aadhaar_number=?, pan_number=?, passport_number=?, voter_id_number=?, driving_license_number=?, uan_number=?, esic_number=?, pf_number=?,
        bank_name=?, bank_branch_name=?, account_holder_name=?, account_number=?, ifsc_code=?, upi_id=?
    WHERE employee_id = ?
`;

const INSERT_EMPLOYEE_SQL = `
    INSERT INTO admin_employees (
        employee_id, full_name, gender, date_of_birth, marital_status, blood_group, nationality, religion, category,
        personal_mobile, official_mobile, personal_email, official_email, current_address, permanent_address,
        parent_name, parent_mobile, parent_occupation, guardian_relation,
        higher_education_qualification, higher_education_course_name, higher_education_institution,
        higher_education_passing_year, higher_education_cgpa, higher_education_specialization,
        department, designation, employee_type, employment_category, joining_date, probation_period,
        work_location, branch_name, reporting_manager, employee_status,
        previous_company_name, previous_designation, previous_salary, work_experience_years,
        previous_joining_date, previous_relieving_date, reason_for_leaving, reference_person_name, reference_contact_number,
        aadhaar_number, pan_number, passport_number, voter_id_number, driving_license_number, uan_number, esic_number, pf_number,
        bank_name, bank_branch_name, account_holder_name, account_number, ifsc_code, upi_id
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
`;

function validateProfileBody(body: Record<string, unknown>): string | null {
    const fullName = strFromBody(body, "fullName");
    if (!fullName) return "Full name is required";

    for (const key of ["personalEmail", "officialEmail"] as const) {
        const email = strFromBody(body, key);
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return key === "personalEmail"
                ? "Enter a valid personal email address"
                : "Enter a valid official email address";
        }
    }

    return null;
}

export async function updateEmployeeSelfProfile(
    session: EmployeeSession,
    body: Record<string, unknown>,
): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
    const picked = pickEmployeeProfileBody(body);
    picked.employeeId = session.employeeId;

    const validationError = validateProfileBody(picked);
    if (validationError) {
        return { ok: false, status: 400, message: validationError };
    }

    await ensureAdminEmployeesTable();

    const values = employeeFormToSqlValues(picked);

    const [existing] = await pool.query<RowDataPacket[]>(
        "SELECT id FROM admin_employees WHERE employee_id = ? LIMIT 1",
        [session.employeeId],
    );

    if (existing[0]) {
        const [result] = await pool.query(UPDATE_EMPLOYEE_BY_EMPLOYEE_ID_SQL, [
            ...values,
            session.employeeId,
        ]);
        if ((result as ResultSetHeader).affectedRows === 0) {
            return { ok: false, status: 404, message: "Employee record not found" };
        }
        return { ok: true };
    }

    if (!strFromBody(picked, "officialEmail") && session.email.trim()) {
        picked.officialEmail = session.email.trim();
    }

    const insertValues = employeeFormToSqlValues({
        ...picked,
        employeeId: session.employeeId,
        employeeStatus: strFromBody(picked, "employeeStatus") ?? "Active",
    });

    await pool.query(INSERT_EMPLOYEE_SQL, insertValues);

    return { ok: true };
}

type ProfileRow = RowDataPacket & {
    employee_id: string;
    portal_email: string | null;
    portal_status: string | null;
};

export async function fetchEmployeeProfileResponse(session: EmployeeSession) {
    const [rows] = await pool.query<ProfileRow[]>(
        `SELECT ea.employee_id,
                ea.official_email AS portal_email,
                ea.portal_status,
                e.*
         FROM admin_employee_access ea
         LEFT JOIN admin_employees e ON e.employee_id = ea.employee_id
         WHERE ea.employee_id = ?
         LIMIT 1`,
        [session.employeeId],
    );

    const row = rows[0];
    if (!row) return null;

    const profile = employeeRowToFormState(row as Record<string, unknown>);

    if (!profile.employeeId.trim()) profile.employeeId = session.employeeId;
    if (!profile.fullName.trim()) profile.fullName = session.name || session.employeeId;
    if (!profile.officialEmail.trim()) {
        profile.officialEmail =
            typeof row.portal_email === "string" ? row.portal_email : session.email;
    }

    return {
        ...profile,
        portalEmail: typeof row.portal_email === "string" ? row.portal_email : profile.officialEmail,
        portalStatus: typeof row.portal_status === "string" ? row.portal_status : "Inactive",
    };
}
