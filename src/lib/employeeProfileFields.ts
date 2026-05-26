import { initialEmployeeProfileFormState, type EmployeeProfileFormValues } from "@/lib/employeeProfileFormSections";

/** All employee profile form keys (same set as admin employee edit). */
export const EMPLOYEE_PROFILE_FORM_KEYS = Object.keys(
    initialEmployeeProfileFormState,
) as (keyof EmployeeProfileFormValues)[];

export type EmployeeProfileFormKey = keyof EmployeeProfileFormValues;
