import { NextResponse } from "next/server";
import {
    computeUsedDays,
    countLeaveDays,
    ensureEmployeeLeaveDataReady,
    fetchActivePolicies,
    fetchEmployeeJoiningDate,
    fetchEmployeeRequests,
    fetchOrgSettings,
    fetchUsedDaysByPolicy,
    collectLeaveRequestErrors,
    insertEmployeeLeaveRequest,
    type LeaveDayType,
} from "@/lib/employeeLeave";
import { getEmployeeSession } from "@/lib/employeeSession";
import {
    fetchEmployeeProfileForEmail,
    sendLeaveApplicationNotification,
} from "@/lib/leaveNotificationEmail";

function isoToday() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function GET() {
    try {
        const session = await getEmployeeSession();
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await ensureEmployeeLeaveDataReady();

        const [policies, settings, joiningDate, requests] = await Promise.all([
            fetchActivePolicies(),
            fetchOrgSettings(),
            fetchEmployeeJoiningDate(session.employeeId),
            fetchEmployeeRequests(session.employeeId),
        ]);

        const usedByPolicy = await fetchUsedDaysByPolicy(
            session.employeeId,
            settings.fiscal_year_start_month,
        );

        const balances = policies.map((policy) => {
            const used = usedByPolicy.get(policy.id) ?? 0;
            const total =
                policy.accrual_cycle === "none" ? 0 : Number(policy.days_per_year) || 0;
            const remaining = total > 0 ? Math.max(0, total - used) : 0;
            return {
                policy_id: policy.id,
                code: policy.code,
                name: policy.name,
                accrual_cycle: policy.accrual_cycle,
                total,
                used,
                remaining,
            };
        });

        return NextResponse.json(
            {
                policies,
                settings,
                joining_date: joiningDate,
                balances,
                requests,
            },
            {
                headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
            },
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching employee leave data:", error);
        return NextResponse.json(
            { message: "Failed to load leave data", error: message },
            { status: 500 },
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await getEmployeeSession();
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = (await request.json()) as Record<string, unknown>;
        const policyId = Number(body.policy_id);
        const startDate = typeof body.start_date === "string" ? body.start_date.slice(0, 10) : "";
        const endDate = typeof body.end_date === "string" ? body.end_date.slice(0, 10) : "";
        const dayType = ["full", "first-half", "second-half"].includes(body.day_type as string)
            ? (body.day_type as LeaveDayType)
            : "full";
        const reason = typeof body.reason === "string" ? body.reason.trim() : "";
        const attachmentName =
            typeof body.attachment_name === "string" ? body.attachment_name.trim() : "";

        if (!Number.isFinite(policyId) || policyId < 1) {
            return NextResponse.json({ message: "Select a valid leave type" }, { status: 400 });
        }
        await ensureEmployeeLeaveDataReady();

        const policies = await fetchActivePolicies();
        const policy = policies.find((p) => p.id === policyId);
        if (!policy) {
            return NextResponse.json({ message: "Leave type not found or inactive" }, { status: 404 });
        }

        const settings = await fetchOrgSettings();
        const joiningDate = await fetchEmployeeJoiningDate(session.employeeId);
        const used = await computeUsedDays(
            session.employeeId,
            policy.id,
            settings.fiscal_year_start_month,
        );
        const total = policy.accrual_cycle === "none" ? 0 : Number(policy.days_per_year) || 0;
        const balanceRemaining = total > 0 ? Math.max(0, total - used) : 999;

        const requestedDays = countLeaveDays(startDate, endDate, dayType, {
            weekdaysOnly: policy.weekdays_only,
            excludeWeekends: !settings.count_weekends_in_leave,
        });

        const existingRequests = await fetchEmployeeRequests(session.employeeId, 200);

        const validationErrors = collectLeaveRequestErrors({
            policy,
            settings,
            joiningDate,
            startDate,
            endDate,
            dayType,
            requestedDays,
            balanceRemaining,
            existingRequests,
            attachmentName,
            reason,
        });
        if (validationErrors.length > 0) {
            return NextResponse.json(
                { message: validationErrors[0], messages: validationErrors },
                { status: 400 },
            );
        }

        const created = await insertEmployeeLeaveRequest({
            employeeId: session.employeeId,
            policyId: policy.id,
            policyCode: policy.code,
            policyName: policy.name,
            startDate,
            endDate,
            days: requestedDays,
            dayType,
            reason,
            attachmentName,
            appliedOn: isoToday(),
        });

        const profile = await fetchEmployeeProfileForEmail(session.employeeId);
        void sendLeaveApplicationNotification({
            employeeId: session.employeeId,
            employeeName: profile.fullName,
            department: profile.department,
            request: {
                request_id: created.request_id,
                policy_name: created.policy_name,
                policy_code: created.policy_code,
                start_date: created.start_date,
                end_date: created.end_date,
                days: created.days,
                day_type: created.day_type,
                reason: created.reason,
                applied_on: created.applied_on,
            },
        });

        return NextResponse.json(created, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error submitting leave request:", error);
        return NextResponse.json(
            { message: "Failed to submit leave request", error: message },
            { status: 500 },
        );
    }
}
