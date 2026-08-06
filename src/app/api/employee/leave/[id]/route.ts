import { NextResponse } from "next/server";
import {
    collectLeaveRequestErrors,
    computeUsedDays,
    countLeaveDays,
    ensureEmployeeLeaveDataReady,
    fetchActivePolicies,
    fetchEmployeeJoiningDate,
    fetchEmployeeRequests,
    fetchOrgSettings,
    type LeaveDayType,
    updateEmployeeLeaveRequest,
    withdrawEmployeeLeaveRequest,
} from "@/lib/employeeLeave";
import { getEmployeeSession } from "@/lib/employeeSession";
import { getShiftByEmployeeId } from "@/lib/adminEmployeeShifts";

export async function PUT(
    request: Request,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const session = await getEmployeeSession();
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id: idParam } = await context.params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid request id" }, { status: 400 });
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

        const shift = await getShiftByEmployeeId(session.employeeId);
        const requestedDays = countLeaveDays(startDate, endDate, dayType, {
            weekdaysOnly: policy.weekdays_only,
            excludeWeekends: !settings.count_weekends_in_leave,
            workingDays: shift?.working_days,
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
            existingRequests: existingRequests.map((r) => ({
                id: r.id,
                policy_id: r.policy_id,
                policy_code: r.policy_code,
                days: r.days,
                day_type: r.day_type,
                start_date: r.start_date,
                end_date: r.end_date,
                status: r.status,
            })),
            attachmentName,
            reason,
            currentRequestId: id,
        });
        if (validationErrors.length > 0) {
            return NextResponse.json(
                { message: validationErrors[0], messages: validationErrors },
                { status: 400 },
            );
        }

        const updated = await updateEmployeeLeaveRequest({
            id,
            employeeId: session.employeeId,
            policyId: policy.id,
            startDate,
            endDate,
            days: requestedDays,
            dayType,
            reason,
            attachmentName,
        });

        return NextResponse.json(updated);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error updating leave request:", error);
        const statusCode =
            message.includes("not found") ? 404 : message.includes("no longer") ? 400 : 500;
        return NextResponse.json(
            { message: message || "Failed to update leave request" },
            { status: statusCode },
        );
    }
}

export async function DELETE(
    _request: Request,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const session = await getEmployeeSession();
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id: idParam } = await context.params;
        const id = Number(idParam);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ message: "Invalid request id" }, { status: 400 });
        }

        const updated = await withdrawEmployeeLeaveRequest(session.employeeId, id);
        return NextResponse.json(updated);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error withdrawing leave request:", error);
        const statusCode =
            message.includes("not found") ? 404 : message.includes("no longer") ? 400 : 500;
        return NextResponse.json(
            { message: message || "Failed to withdraw leave request" },
            { status: statusCode },
        );
    }
}

