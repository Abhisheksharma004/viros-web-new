"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Check,
    Eye,
    FileText,
    Loader2,
    Mail,
    Pencil,
    Plus,
    Save,
    Search,
    Settings2,
    Trash2,
    X,
} from "lucide-react";
import type { AccrualCycle } from "@/lib/adminLeavePolicies";

type LeavePolicyRow = {
    id: number;
    code: string;
    name: string;
    daysPerYear: number;
    accrualCycle: AccrualCycle;
    carryForwardEnabled: boolean;
    carryForwardMax: number;
    halfDayAllowed: boolean;
    documentRequired: boolean;
    minNoticeDays: number;
    maxConsecutiveDays: number;
    requiresApproval: boolean;
    paid: boolean;
    active: boolean;
    description: string;
    /** Empty when allMonthsApplicable is true */
    applicableMonths: number[];
    allMonthsApplicable: boolean;
    maxDaysPerRequest: number;
    minDaysPerRequest: number;
    enforceRemainingBalanceCap: boolean;
    mustUseFullBalanceWhenLow: boolean;
    fullBalanceThresholdDays: number;
    maxRequestsPerMonth: number;
    maxRequestsPerYear: number;
    minGapDaysBetweenRequests: number;
    weekdaysOnly: boolean;
    allowBackdatedLeave: boolean;
    maxAdvanceBookingDays: number;
    applicableFromJoining: boolean;
    monthsAfterJoining: number;
};

type PolicyApiRow = {
    id: number;
    code: string;
    name: string;
    description: string;
    days_per_year: number;
    accrual_cycle: AccrualCycle;
    carry_forward_enabled: boolean;
    carry_forward_max: number;
    half_day_allowed: boolean;
    document_required: boolean;
    min_notice_days: number;
    max_consecutive_days: number;
    requires_approval: boolean;
    paid: boolean;
    is_active: boolean;
    all_months_applicable: boolean;
    applicable_months: number[];
    applicable_from_joining: boolean;
    months_after_joining: number;
    max_days_per_request: number;
    min_days_per_request: number;
    enforce_remaining_balance_cap: boolean;
    must_use_full_balance_when_low: boolean;
    full_balance_threshold_days: number;
    max_requests_per_month: number;
    max_requests_per_year: number;
    min_gap_days_between_requests: number;
    weekdays_only: boolean;
    allow_backdated_leave: boolean;
    max_advance_booking_days: number;
};

type OrgSettingsApi = {
    fiscal_year_start_month: number;
    default_min_notice_days: number;
    max_consecutive_days_default: number;
    allow_half_day: boolean;
    count_weekends_in_leave: boolean;
    notification_emails: string[];
};

function apiToPolicy(row: PolicyApiRow): LeavePolicyRow {
    return {
        id: row.id,
        code: row.code,
        name: row.name,
        description: row.description,
        daysPerYear: row.days_per_year,
        accrualCycle: row.accrual_cycle,
        carryForwardEnabled: row.carry_forward_enabled,
        carryForwardMax: row.carry_forward_max,
        halfDayAllowed: row.half_day_allowed,
        documentRequired: row.document_required,
        minNoticeDays: row.min_notice_days,
        maxConsecutiveDays: row.max_consecutive_days,
        requiresApproval: row.requires_approval,
        paid: row.paid,
        active: row.is_active,
        applicableMonths: row.applicable_months,
        allMonthsApplicable: row.all_months_applicable,
        applicableFromJoining: row.applicable_from_joining,
        monthsAfterJoining: row.months_after_joining,
        maxDaysPerRequest: row.max_days_per_request,
        minDaysPerRequest: row.min_days_per_request,
        enforceRemainingBalanceCap: row.enforce_remaining_balance_cap,
        mustUseFullBalanceWhenLow: row.must_use_full_balance_when_low,
        fullBalanceThresholdDays: row.full_balance_threshold_days,
        maxRequestsPerMonth: row.max_requests_per_month,
        maxRequestsPerYear: row.max_requests_per_year,
        minGapDaysBetweenRequests: row.min_gap_days_between_requests,
        weekdaysOnly: row.weekdays_only,
        allowBackdatedLeave: row.allow_backdated_leave,
        maxAdvanceBookingDays: row.max_advance_booking_days,
    };
}

function apiToGlobalSettings(row: OrgSettingsApi): GlobalSettings {
    return {
        fiscalYearStartMonth: row.fiscal_year_start_month,
        defaultMinNoticeDays: row.default_min_notice_days,
        maxConsecutiveDaysDefault: row.max_consecutive_days_default,
        allowHalfDay: row.allow_half_day,
        countWeekendsInLeave: row.count_weekends_in_leave,
        notificationEmails: Array.isArray(row.notification_emails)
            ? row.notification_emails
            : [],
    };
}

function formToApiBody(form: typeof emptyPolicyForm) {
    return {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        description: form.description.trim(),
        days_per_year: Math.max(0, Number(form.daysPerYear) || 0),
        accrual_cycle: form.accrualCycle,
        carry_forward_enabled: form.carryForwardEnabled,
        carry_forward_max: form.carryForwardEnabled
            ? Math.max(0, Number(form.carryForwardMax) || 0)
            : 0,
        half_day_allowed: form.halfDayAllowed,
        document_required: form.documentRequired,
        min_notice_days: Math.max(0, Number(form.minNoticeDays) || 0),
        max_consecutive_days: Math.max(1, Number(form.maxConsecutiveDays) || 1),
        requires_approval: form.requiresApproval,
        paid: form.paid,
        is_active: form.active,
        all_months_applicable: form.allMonthsApplicable,
        applicable_months: normalizeApplicableMonths(
            form.applicableMonths,
            form.allMonthsApplicable,
        ),
        applicable_from_joining: form.applicableFromJoining,
        months_after_joining: form.applicableFromJoining
            ? Math.max(0, Number(form.monthsAfterJoining) || 0)
            : 0,
        max_days_per_request: Math.max(0.5, Number(form.maxDaysPerRequest) || 0.5),
        min_days_per_request: Math.max(0, Number(form.minDaysPerRequest) || 0),
        enforce_remaining_balance_cap: form.enforceRemainingBalanceCap,
        must_use_full_balance_when_low: form.mustUseFullBalanceWhenLow,
        full_balance_threshold_days: form.mustUseFullBalanceWhenLow
            ? Math.max(0, Number(form.fullBalanceThresholdDays) || 0)
            : 0,
        max_requests_per_month: Math.max(0, Number(form.maxRequestsPerMonth) || 0),
        max_requests_per_year: Math.max(0, Number(form.maxRequestsPerYear) || 0),
        min_gap_days_between_requests: Math.max(0, Number(form.minGapDaysBetweenRequests) || 0),
        weekdays_only: form.weekdaysOnly,
        allow_backdated_leave: form.allowBackdatedLeave,
        max_advance_booking_days: Math.max(0, Number(form.maxAdvanceBookingDays) || 0),
    };
}

function policyToApiBody(row: LeavePolicyRow) {
    return {
        code: row.code,
        name: row.name,
        description: row.description,
        days_per_year: row.daysPerYear,
        accrual_cycle: row.accrualCycle,
        carry_forward_enabled: row.carryForwardEnabled,
        carry_forward_max: row.carryForwardMax,
        half_day_allowed: row.halfDayAllowed,
        document_required: row.documentRequired,
        min_notice_days: row.minNoticeDays,
        max_consecutive_days: row.maxConsecutiveDays,
        requires_approval: row.requiresApproval,
        paid: row.paid,
        is_active: row.active,
        all_months_applicable: row.allMonthsApplicable,
        applicable_months: row.applicableMonths,
        applicable_from_joining: row.applicableFromJoining,
        months_after_joining: row.monthsAfterJoining,
        max_days_per_request: row.maxDaysPerRequest,
        min_days_per_request: row.minDaysPerRequest,
        enforce_remaining_balance_cap: row.enforceRemainingBalanceCap,
        must_use_full_balance_when_low: row.mustUseFullBalanceWhenLow,
        full_balance_threshold_days: row.fullBalanceThresholdDays,
        max_requests_per_month: row.maxRequestsPerMonth,
        max_requests_per_year: row.maxRequestsPerYear,
        min_gap_days_between_requests: row.minGapDaysBetweenRequests,
        weekdays_only: row.weekdaysOnly,
        allow_backdated_leave: row.allowBackdatedLeave,
        max_advance_booking_days: row.maxAdvanceBookingDays,
    };
}

function globalSettingsToApiBody(settings: GlobalSettings) {
    return {
        fiscal_year_start_month: settings.fiscalYearStartMonth,
        default_min_notice_days: settings.defaultMinNoticeDays,
        max_consecutive_days_default: settings.maxConsecutiveDaysDefault,
        allow_half_day: settings.allowHalfDay,
        count_weekends_in_leave: settings.countWeekendsInLeave,
        notification_emails: settings.notificationEmails,
    };
}

function normalizeEmailDraft(value: string): string {
    return value.trim().toLowerCase();
}

function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

type GlobalSettings = {
    fiscalYearStartMonth: number;
    defaultMinNoticeDays: number;
    maxConsecutiveDaysDefault: number;
    allowHalfDay: boolean;
    countWeekendsInLeave: boolean;
    notificationEmails: string[];
};

const ALL_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

const MONTH_OPTIONS = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
];

const ACCRUAL_OPTIONS: { value: AccrualCycle; label: string }[] = [
    { value: "yearly", label: "Yearly (lump sum)" },
    { value: "monthly", label: "Monthly accrual" },
    { value: "none", label: "No fixed quota" },
];

const DEFAULT_GLOBAL: GlobalSettings = {
    fiscalYearStartMonth: 4,
    defaultMinNoticeDays: 2,
    maxConsecutiveDaysDefault: 15,
    allowHalfDay: true,
    countWeekendsInLeave: false,
    notificationEmails: [],
};

const emptyPolicyForm = {
    code: "",
    name: "",
    daysPerYear: "12",
    accrualCycle: "yearly" as AccrualCycle,
    carryForwardEnabled: false,
    carryForwardMax: "0",
    halfDayAllowed: true,
    documentRequired: false,
    minNoticeDays: "2",
    maxConsecutiveDays: "5",
    requiresApproval: true,
    paid: true,
    active: true,
    description: "",
    applicableMonths: [] as number[],
    allMonthsApplicable: true,
    maxDaysPerRequest: "5",
    minDaysPerRequest: "0.5",
    enforceRemainingBalanceCap: true,
    mustUseFullBalanceWhenLow: false,
    fullBalanceThresholdDays: "0",
    maxRequestsPerMonth: "0",
    maxRequestsPerYear: "0",
    minGapDaysBetweenRequests: "0",
    weekdaysOnly: false,
    allowBackdatedLeave: false,
    maxAdvanceBookingDays: "0",
    applicableFromJoining: false,
    monthsAfterJoining: "0",
};

function accrualLabel(cycle: AccrualCycle) {
    return ACCRUAL_OPTIONS.find((o) => o.value === cycle)?.label ?? cycle;
}

function monthLabel(month: number) {
    return MONTH_OPTIONS.find((m) => m.value === month)?.label ?? "—";
}

function formatApplicableMonths(row: Pick<LeavePolicyRow, "applicableMonths" | "allMonthsApplicable">) {
    if (row.allMonthsApplicable || row.applicableMonths.length === 0) return "All months";
    const sorted = [...row.applicableMonths].sort((a, b) => a - b);
    if (sorted.length <= 4) {
        return sorted.map((m) => monthLabel(m).slice(0, 3)).join(", ");
    }
    return `${sorted.length} months`;
}

function normalizeApplicableMonths(months: number[], allMonths: boolean): number[] {
    if (allMonths) return [];
    const unique = Array.from(new Set(months.filter((m) => m >= 1 && m <= 12))).sort((a, b) => a - b);
    return unique;
}

function toggleMonthInList(months: number[], month: number): number[] {
    const has = months.includes(month);
    if (has) return months.filter((m) => m !== month);
    return [...months, month].sort((a, b) => a - b);
}

function YesNoBadge({ yes, yesLabel = "Yes", noLabel = "No" }: { yes: boolean; yesLabel?: string; noLabel?: string }) {
    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                yes
                    ? "bg-emerald-50 text-emerald-800 ring-emerald-500/20"
                    : "bg-gray-100 text-gray-600 ring-gray-300/50"
            }`}
        >
            {yes ? yesLabel : noLabel}
        </span>
    );
}

function ActiveBadge({ active }: { active: boolean }) {
    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${
                active
                    ? "bg-[#06b6d4]/15 text-[#0a2a5e] ring-[#06b6d4]/30"
                    : "bg-gray-100 text-gray-600 ring-gray-300/50"
            }`}
        >
            {active ? "Active" : "Inactive"}
        </span>
    );
}

export default function Page() {
    const [policies, setPolicies] = useState<LeavePolicyRow[]>([]);
    const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(DEFAULT_GLOBAL);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [settingsSaved, setSettingsSaved] = useState(false);
    const [search, setSearch] = useState("");
    const [modalMode, setModalMode] = useState<"add" | "edit" | "view" | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState(emptyPolicyForm);
    const [formError, setFormError] = useState("");
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [emailDraft, setEmailDraft] = useState<string[]>([]);
    const [newEmailInput, setNewEmailInput] = useState("");
    const [emailError, setEmailError] = useState("");
    const [isSavingEmails, setIsSavingEmails] = useState(false);
    const [emailsSaved, setEmailsSaved] = useState(false);

    const fetchPolicies = useCallback(async () => {
        try {
            setLoadError("");
            setIsLoading(true);
            const [policiesResp, settingsResp] = await Promise.all([
                fetch("/api/admin/leave-policies", { cache: "no-store" }),
                fetch("/api/admin/leave-policies/settings", { cache: "no-store" }),
            ]);
            const policiesData = await policiesResp.json().catch(() => ({}));
            const settingsData = await settingsResp.json().catch(() => ({}));
            if (!policiesResp.ok) {
                throw new Error(
                    typeof policiesData.message === "string"
                        ? policiesData.message
                        : "Failed to load leave policies",
                );
            }
            const rows: PolicyApiRow[] = Array.isArray(policiesData) ? policiesData : [];
            setPolicies(rows.map(apiToPolicy));
            if (settingsResp.ok) {
                setGlobalSettings(apiToGlobalSettings(settingsData as OrgSettingsApi));
            }
        } catch (error) {
            console.error("Error loading leave policies:", error);
            setLoadError(error instanceof Error ? error.message : "Failed to load leave policies");
            setPolicies([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchPolicies();
    }, [fetchPolicies]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return policies;
        return policies.filter(
            (p) =>
                p.name.toLowerCase().includes(q) ||
                p.code.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q),
        );
    }, [policies, search]);

    const stats = useMemo(() => {
        const active = policies.filter((p) => p.active).length;
        const totalDays = policies
            .filter((p) => p.active && p.accrualCycle !== "none")
            .reduce((sum, p) => sum + p.daysPerYear, 0);
        const paid = policies.filter((p) => p.paid && p.active).length;
        return { total: policies.length, active, totalDays, paid };
    }, [policies]);

    const closeModal = useCallback(() => {
        setModalMode(null);
        setEditingId(null);
        setForm(emptyPolicyForm);
        setFormError("");
    }, []);

    useEffect(() => {
        if (!modalMode) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeModal();
        };
        window.addEventListener("keydown", onKeyDown);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = prev;
        };
    }, [modalMode, closeModal]);

    const openAdd = () => {
        setForm(emptyPolicyForm);
        setEditingId(null);
        setFormError("");
        setModalMode("add");
    };

    const openEdit = (row: LeavePolicyRow) => {
        setForm({
            code: row.code,
            name: row.name,
            daysPerYear: String(row.daysPerYear),
            accrualCycle: row.accrualCycle,
            carryForwardEnabled: row.carryForwardEnabled,
            carryForwardMax: String(row.carryForwardMax),
            halfDayAllowed: row.halfDayAllowed,
            documentRequired: row.documentRequired,
            minNoticeDays: String(row.minNoticeDays),
            maxConsecutiveDays: String(row.maxConsecutiveDays),
            requiresApproval: row.requiresApproval,
            paid: row.paid,
            active: row.active,
            description: row.description,
            applicableMonths: row.allMonthsApplicable ? [] : [...row.applicableMonths],
            allMonthsApplicable: row.allMonthsApplicable,
            maxDaysPerRequest: String(row.maxDaysPerRequest),
            minDaysPerRequest: String(row.minDaysPerRequest),
            enforceRemainingBalanceCap: row.enforceRemainingBalanceCap,
            mustUseFullBalanceWhenLow: row.mustUseFullBalanceWhenLow,
            fullBalanceThresholdDays: String(row.fullBalanceThresholdDays),
            maxRequestsPerMonth: String(row.maxRequestsPerMonth),
            maxRequestsPerYear: String(row.maxRequestsPerYear),
            minGapDaysBetweenRequests: String(row.minGapDaysBetweenRequests),
            weekdaysOnly: row.weekdaysOnly,
            allowBackdatedLeave: row.allowBackdatedLeave,
            maxAdvanceBookingDays: String(row.maxAdvanceBookingDays),
            applicableFromJoining: row.applicableFromJoining,
            monthsAfterJoining: String(row.monthsAfterJoining),
        });
        setEditingId(row.id);
        setFormError("");
        setModalMode("edit");
    };

    const openView = (row: LeavePolicyRow) => {
        openEdit(row);
        setModalMode("view");
    };

    const handleDelete = async (row: LeavePolicyRow) => {
        if (!window.confirm(`Delete policy “${row.name}”?`)) return;
        try {
            const resp = await fetch(`/api/admin/leave-policies/${row.id}`, { method: "DELETE" });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Delete failed");
            }
            setPolicies((prev) => prev.filter((p) => p.id !== row.id));
        } catch (error) {
            console.error("Delete policy failed:", error);
            alert(error instanceof Error ? error.message : "Failed to delete policy");
        }
    };

    const toggleActive = async (row: LeavePolicyRow) => {
        const nextActive = !row.active;
        try {
            const resp = await fetch(`/api/admin/leave-policies/${row.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...policyToApiBody(row),
                    is_active: nextActive,
                }),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Update failed");
            }
            const saved = apiToPolicy(data as PolicyApiRow);
            setPolicies((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
        } catch (error) {
            console.error("Toggle policy active failed:", error);
            alert(error instanceof Error ? error.message : "Failed to update status");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (modalMode === "view" || isSubmitting) return;

        const code = form.code.trim().toUpperCase();
        const name = form.name.trim();
        if (!code || code.length > 8) {
            setFormError("Policy code is required (max 8 characters).");
            return;
        }
        if (!name) {
            setFormError("Policy name is required.");
            return;
        }
        if (!form.allMonthsApplicable && form.applicableMonths.length === 0) {
            setFormError("Select at least one applicable month, or enable “All months”.");
            return;
        }
        if (form.applicableFromJoining && (Number(form.monthsAfterJoining) || 0) <= 0) {
            setFormError("Enter months after date of joining (at least 1).");
            return;
        }
        const maxPerReq = Number(form.maxDaysPerRequest) || 0;
        const minPerReq = Number(form.minDaysPerRequest) || 0;
        if (maxPerReq > 0 && minPerReq > maxPerReq) {
            setFormError("Min. days per request cannot exceed max. days per request.");
            return;
        }
        const maxConsec = Number(form.maxConsecutiveDays) || 1;
        if (maxPerReq > maxConsec) {
            setFormError("Max days per request cannot exceed max consecutive days.");
            return;
        }

        const isEdit = modalMode === "edit" && editingId !== null;
        const body = formToApiBody(form);

        try {
            setIsSubmitting(true);
            const resp = await fetch(
                isEdit ? `/api/admin/leave-policies/${editingId}` : "/api/admin/leave-policies",
                {
                    method: isEdit ? "PUT" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                },
            );
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Save failed");
            }
            const saved = apiToPolicy(data as PolicyApiRow);
            if (isEdit) {
                setPolicies((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
            } else {
                setPolicies((prev) => [saved, ...prev]);
            }
            closeModal();
        } catch (error) {
            console.error("Save policy failed:", error);
            setFormError(error instanceof Error ? error.message : "Failed to save policy");
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEmailModal = () => {
        setEmailDraft([...globalSettings.notificationEmails]);
        setNewEmailInput("");
        setEmailError("");
        setEmailsSaved(false);
        setEmailModalOpen(true);
    };

    const closeEmailModal = () => {
        setEmailModalOpen(false);
        setEmailError("");
        setNewEmailInput("");
    };

    const addEmailToDraft = () => {
        const email = normalizeEmailDraft(newEmailInput);
        if (!email) {
            setEmailError("Enter an email address.");
            return;
        }
        if (!isValidEmail(email)) {
            setEmailError("Enter a valid email address.");
            return;
        }
        if (emailDraft.includes(email)) {
            setEmailError("This email is already in the list.");
            return;
        }
        if (emailDraft.length >= 30) {
            setEmailError("You can store up to 30 emails.");
            return;
        }
        setEmailDraft((prev) => [...prev, email]);
        setNewEmailInput("");
        setEmailError("");
    };

    const removeEmailFromDraft = (email: string) => {
        setEmailDraft((prev) => prev.filter((e) => e !== email));
    };

    const saveNotificationEmails = async () => {
        const cleaned = emailDraft
            .map(normalizeEmailDraft)
            .filter((e) => e && isValidEmail(e));
        const unique = [...new Set(cleaned)];

        try {
            setIsSavingEmails(true);
            setEmailError("");
            const payload = globalSettingsToApiBody({
                ...globalSettings,
                notificationEmails: unique,
            });
            const resp = await fetch("/api/admin/leave-policies/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Save failed");
            }
            const saved = apiToGlobalSettings(data as OrgSettingsApi);
            setGlobalSettings(saved);
            setEmailDraft([...saved.notificationEmails]);
            setEmailsSaved(true);
            window.setTimeout(() => setEmailsSaved(false), 2500);
        } catch (error) {
            console.error("Save notification emails failed:", error);
            setEmailError(error instanceof Error ? error.message : "Failed to save emails");
        } finally {
            setIsSavingEmails(false);
        }
    };

    useEffect(() => {
        if (!emailModalOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeEmailModal();
        };
        window.addEventListener("keydown", onKeyDown);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = prev;
        };
    }, [emailModalOpen]);

    const saveGlobalSettings = async () => {
        try {
            setIsSavingSettings(true);
            const resp = await fetch("/api/admin/leave-policies/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(globalSettingsToApiBody(globalSettings)),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Save failed");
            }
            setGlobalSettings(apiToGlobalSettings(data as OrgSettingsApi));
            setSettingsSaved(true);
            window.setTimeout(() => setSettingsSaved(false), 2500);
        } catch (error) {
            console.error("Save org settings failed:", error);
            alert(error instanceof Error ? error.message : "Failed to save settings");
        } finally {
            setIsSavingSettings(false);
        }
    };

    const inputClass =
        "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 disabled:bg-gray-50 disabled:text-gray-500";
    const labelClass = "mb-1.5 block text-sm font-semibold text-gray-700";
    const readOnly = modalMode === "view";

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-[#0a2a5e]">
                        <FileText className="h-6 w-6" aria-hidden />
                        <h1 className="text-2xl font-semibold text-gray-900">Leave policy</h1>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                        Define leave types, annual quotas, carry-forward, and approval rules for all employees.
                    </p>
                    {loadError && <p className="mt-2 text-xs text-amber-600">{loadError}</p>}
                </div>
                <button
                    type="button"
                    onClick={openAdd}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0a2a5e] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
                >
                    <Plus className="h-4 w-4" aria-hidden />
                    Add policy
                </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Total policies</p>
                    <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.total}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Active policies</p>
                    <p className="mt-2 text-3xl font-semibold text-[#06b6d4]">{stats.active}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Annual days (quota)</p>
                    <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.totalDays}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Paid leave types</p>
                    <p className="mt-2 text-3xl font-semibold text-emerald-600">{stats.paid}</p>
                </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-[#0a2a5e]">
                        <Settings2 className="h-5 w-5" aria-hidden />
                        <h2 className="text-base font-bold text-gray-900">Organization settings</h2>
                    </div>
                    <button
                        type="button"
                        onClick={openEmailModal}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#0a2a5e]/20 bg-[#0a2a5e]/5 px-4 py-2.5 text-sm font-semibold text-[#0a2a5e] transition hover:bg-[#0a2a5e]/10"
                    >
                        <Mail className="h-4 w-4" aria-hidden />
                        Notification emails
                        <span className="rounded-full bg-[#06b6d4]/20 px-2 py-0.5 text-xs font-bold text-[#0a2a5e]">
                            {globalSettings.notificationEmails.length}
                        </span>
                    </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                        <label htmlFor="fiscal-month" className={labelClass}>
                            Fiscal year starts
                        </label>
                        <select
                            id="fiscal-month"
                            value={globalSettings.fiscalYearStartMonth}
                            onChange={(e) =>
                                setGlobalSettings((s) => ({
                                    ...s,
                                    fiscalYearStartMonth: Number(e.target.value),
                                }))
                            }
                            className={inputClass}
                        >
                            {MONTH_OPTIONS.map((m) => (
                                <option key={m.value} value={m.value}>
                                    {m.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="default-notice" className={labelClass}>
                            Default min. notice (days)
                        </label>
                        <input
                            id="default-notice"
                            type="number"
                            min={0}
                            value={globalSettings.defaultMinNoticeDays}
                            onChange={(e) =>
                                setGlobalSettings((s) => ({
                                    ...s,
                                    defaultMinNoticeDays: Math.max(0, Number(e.target.value) || 0),
                                }))
                            }
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label htmlFor="max-consecutive" className={labelClass}>
                            Default max consecutive days
                        </label>
                        <input
                            id="max-consecutive"
                            type="number"
                            min={1}
                            value={globalSettings.maxConsecutiveDaysDefault}
                            onChange={(e) =>
                                setGlobalSettings((s) => ({
                                    ...s,
                                    maxConsecutiveDaysDefault: Math.max(1, Number(e.target.value) || 1),
                                }))
                            }
                            className={inputClass}
                        />
                    </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-6">
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
                        <input
                            type="checkbox"
                            checked={globalSettings.allowHalfDay}
                            onChange={(e) =>
                                setGlobalSettings((s) => ({ ...s, allowHalfDay: e.target.checked }))
                            }
                            className="h-4 w-4 rounded border-gray-300 text-[#06b6d4] focus:ring-[#06b6d4]"
                        />
                        Allow half-day leave globally
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
                        <input
                            type="checkbox"
                            checked={globalSettings.countWeekendsInLeave}
                            onChange={(e) =>
                                setGlobalSettings((s) => ({
                                    ...s,
                                    countWeekendsInLeave: e.target.checked,
                                }))
                            }
                            className="h-4 w-4 rounded border-gray-300 text-[#06b6d4] focus:ring-[#06b6d4]"
                        />
                        Count weekends in leave duration
                    </label>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={() => void saveGlobalSettings()}
                        disabled={isSavingSettings}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#06b6d4] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                    >
                        {isSavingSettings ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        ) : (
                            <Save className="h-4 w-4" aria-hidden />
                        )}
                        {isSavingSettings ? "Saving…" : "Save settings"}
                    </button>
                    {settingsSaved && (
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
                            <Check className="h-4 w-4" />
                            Settings saved
                        </span>
                    )}
                    <span className="text-xs text-gray-500">
                        FY starts {monthLabel(globalSettings.fiscalYearStartMonth)}
                    </span>
                </div>
            </div>

            <div className="relative rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
                <Search className="pointer-events-none absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 sm:left-8" />
                <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, code, or description…"
                    className={`${inputClass} pl-10`}
                />
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
                    <p className="text-sm font-semibold text-gray-900">Leave types & quotas</p>
                    <p className="mt-1 text-sm text-gray-500">
                        {isLoading
                            ? "Loading…"
                            : `Showing ${filtered.length} polic${filtered.length === 1 ? "y" : "ies"}`}
                    </p>
                </div>
                <div className="overflow-x-auto">
                    {isLoading && (
                        <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-gray-500">
                            <Loader2 className="h-5 w-5 animate-spin text-[#06b6d4]" aria-hidden />
                            Loading leave policies…
                        </div>
                    )}
                    {!isLoading && (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-[#0a2a5e]/8">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#0a2a5e] sm:px-6">
                                    Policy
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                    Quota
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                    Rules
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                    Carry forward
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-[#0a2a5e] sm:px-6">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                                        No policies match your search.
                                    </td>
                                </tr>
                            )}
                            {filtered.map((row, idx) => (
                                <tr
                                    key={row.id}
                                    className={idx % 2 === 1 ? "bg-gray-50/60" : "bg-white"}
                                >
                                    <td className="px-4 py-4 sm:px-6">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0a2a5e] text-xs font-bold text-white">
                                                {row.code}
                                            </span>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">{row.name}</p>
                                                <p className="max-w-[220px] truncate text-xs text-gray-500">
                                                    {row.description || "—"}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
                                        <p className="font-semibold text-gray-900">
                                            {row.accrualCycle === "none"
                                                ? "As granted"
                                                : `${row.daysPerYear} days / yr`}
                                        </p>
                                        <p className="text-xs text-gray-500">{accrualLabel(row.accrualCycle)}</p>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-700">
                                        <div className="flex flex-wrap gap-1.5">
                                            <YesNoBadge yes={row.halfDayAllowed} yesLabel="½ day" noLabel="Full only" />
                                            <YesNoBadge yes={row.documentRequired} yesLabel="Doc" noLabel="No doc" />
                                            <YesNoBadge yes={row.paid} yesLabel="Paid" noLabel="Unpaid" />
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Notice {row.minNoticeDays}d · max {row.maxConsecutiveDays}d
                                            {row.requiresApproval ? " · approval" : ""}
                                        </p>
                                        <p className="mt-0.5 text-xs text-[#0a2a5e]/80">
                                            {formatApplicableMonths(row)} · max {row.maxDaysPerRequest}d/request
                                            {row.applicableFromJoining
                                                ? ` · after ${row.monthsAfterJoining} mo. from joining`
                                                : ""}
                                        </p>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
                                        {row.carryForwardEnabled ? (
                                            <span className="font-medium text-gray-900">Up to {row.carryForwardMax} days</span>
                                        ) : (
                                            <span className="text-gray-500">Not allowed</span>
                                        )}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-4">
                                        <ActiveBadge active={row.active} />
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-4 text-right sm:px-6">
                                        <div className="inline-flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => openView(row)}
                                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-[#0a2a5e]"
                                                title="View"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => openEdit(row)}
                                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-[#0a2a5e]"
                                                title="Edit"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => toggleActive(row)}
                                                className="rounded-lg px-2 py-2 text-xs font-semibold text-[#06b6d4] hover:bg-[#06b6d4]/10"
                                                title={row.active ? "Deactivate" : "Activate"}
                                            >
                                                {row.active ? "Off" : "On"}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(row)}
                                                className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    )}
                </div>
            </div>

            {modalMode && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
                    role="dialog"
                    aria-modal="true"
                    onClick={closeModal}
                >
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" aria-hidden />
                    <div
                        className="relative flex max-h-[min(92vh,900px)] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-2xl sm:rounded-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            className="shrink-0 border-b border-white/10 px-5 py-4 sm:px-6"
                            style={{
                                background:
                                    "linear-gradient(135deg, #06124f 0%, #0a2a5e 55%, #0d3a7a 100%)",
                            }}
                        >
                            <div className="flex items-start justify-between gap-3 text-white">
                                <div>
                                    <h2 className="text-lg font-bold">
                                        {modalMode === "add"
                                            ? "Add leave policy"
                                            : modalMode === "view"
                                              ? "View leave policy"
                                              : "Edit leave policy"}
                                    </h2>
                                    <p className="text-xs text-white/75">
                                        {readOnly
                                            ? "Policy details (read-only)"
                                            : "Configure quota and approval rules"}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
                                    aria-label="Close"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="flex min-h-0 flex-1 flex-col overflow-y-auto"
                        >
                            <div className="space-y-4 p-5 sm:p-6">
                                {formError && (
                                    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        {formError}
                                    </p>
                                )}

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="policy-code" className={labelClass}>
                                            Code
                                        </label>
                                        <input
                                            id="policy-code"
                                            value={form.code}
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    code: e.target.value.toUpperCase(),
                                                }))
                                            }
                                            disabled={readOnly}
                                            placeholder="e.g. CL"
                                            maxLength={8}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="policy-name" className={labelClass}>
                                            Policy name
                                        </label>
                                        <input
                                            id="policy-name"
                                            value={form.name}
                                            onChange={(e) =>
                                                setForm((f) => ({ ...f, name: e.target.value }))
                                            }
                                            disabled={readOnly}
                                            placeholder="Casual leave"
                                            className={inputClass}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="policy-desc" className={labelClass}>
                                        Description
                                    </label>
                                    <textarea
                                        id="policy-desc"
                                        value={form.description}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, description: e.target.value }))
                                        }
                                        disabled={readOnly}
                                        rows={2}
                                        className={`${inputClass} resize-none`}
                                    />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div>
                                        <label htmlFor="days-year" className={labelClass}>
                                            Days per year
                                        </label>
                                        <input
                                            id="days-year"
                                            type="number"
                                            min={0}
                                            value={form.daysPerYear}
                                            onChange={(e) =>
                                                setForm((f) => ({ ...f, daysPerYear: e.target.value }))
                                            }
                                            disabled={readOnly || form.accrualCycle === "none"}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="accrual" className={labelClass}>
                                            Accrual
                                        </label>
                                        <select
                                            id="accrual"
                                            value={form.accrualCycle}
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    accrualCycle: e.target.value as AccrualCycle,
                                                }))
                                            }
                                            disabled={readOnly}
                                            className={inputClass}
                                        >
                                            {ACCRUAL_OPTIONS.map((o) => (
                                                <option key={o.value} value={o.value}>
                                                    {o.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="min-notice" className={labelClass}>
                                            Min. notice (days)
                                        </label>
                                        <input
                                            id="min-notice"
                                            type="number"
                                            min={0}
                                            value={form.minNoticeDays}
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    minNoticeDays: e.target.value,
                                                }))
                                            }
                                            disabled={readOnly}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="max-consec-policy" className={labelClass}>
                                            Max consecutive days
                                        </label>
                                        <input
                                            id="max-consec-policy"
                                            type="number"
                                            min={1}
                                            value={form.maxConsecutiveDays}
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    maxConsecutiveDays: e.target.value,
                                                }))
                                            }
                                            disabled={readOnly}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="carry-max" className={labelClass}>
                                            Carry forward max (days)
                                        </label>
                                        <input
                                            id="carry-max"
                                            type="number"
                                            min={0}
                                            value={form.carryForwardMax}
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    carryForwardMax: e.target.value,
                                                }))
                                            }
                                            disabled={readOnly || !form.carryForwardEnabled}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>

                                <div className="rounded-xl border border-[#0a2a5e]/15 bg-[#0a2a5e]/5 p-4 sm:p-5">
                                    <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#0a2a5e]">
                                        Leave conditions
                                    </p>
                                    <p className="mb-4 text-xs text-gray-500">
                                        Control when leave can be applied, per-request limits, and balance rules.
                                    </p>

                                    <div className="mb-4">
                                        <label className={labelClass}>Applicable months</label>
                                        <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
                                            <input
                                                type="checkbox"
                                                checked={form.allMonthsApplicable}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    setForm((f) => ({
                                                        ...f,
                                                        allMonthsApplicable: checked,
                                                        applicableMonths: checked ? [] : [...ALL_MONTHS],
                                                    }));
                                                }}
                                                disabled={readOnly}
                                                className="h-4 w-4 rounded border-gray-300 text-[#06b6d4]"
                                            />
                                            All months (year-round)
                                        </label>
                                        {!form.allMonthsApplicable && (
                                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                                                {MONTH_OPTIONS.map((m) => {
                                                    const selected = form.applicableMonths.includes(m.value);
                                                    return (
                                                        <button
                                                            key={m.value}
                                                            type="button"
                                                            disabled={readOnly}
                                                            onClick={() =>
                                                                setForm((f) => ({
                                                                    ...f,
                                                                    applicableMonths: toggleMonthInList(
                                                                        f.applicableMonths,
                                                                        m.value,
                                                                    ),
                                                                }))
                                                            }
                                                            className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                                                                selected
                                                                    ? "border-[#06b6d4] bg-[#06b6d4]/15 text-[#0a2a5e]"
                                                                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                                                            } disabled:opacity-60`}
                                                        >
                                                            {m.label.slice(0, 3)}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-4 rounded-xl border border-gray-200/80 bg-white p-4">
                                        <label className="flex cursor-pointer items-start gap-2 text-sm font-medium text-gray-700">
                                            <input
                                                type="checkbox"
                                                checked={form.applicableFromJoining}
                                                onChange={(e) =>
                                                    setForm((f) => ({
                                                        ...f,
                                                        applicableFromJoining: e.target.checked,
                                                        monthsAfterJoining: e.target.checked
                                                            ? f.monthsAfterJoining === "0"
                                                                ? "3"
                                                                : f.monthsAfterJoining
                                                            : "0",
                                                    }))
                                                }
                                                disabled={readOnly}
                                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#06b6d4]"
                                            />
                                            <span>
                                                Leave applicable from date of joining
                                                <span className="mt-0.5 block text-xs font-normal text-gray-500">
                                                    Employee can use this leave only after completing a waiting
                                                    period from their joining date
                                                </span>
                                            </span>
                                        </label>
                                        {form.applicableFromJoining && (
                                            <div className="mt-3 max-w-xs pl-6">
                                                <label htmlFor="months-after-joining" className={labelClass}>
                                                    Months after joining
                                                </label>
                                                <input
                                                    id="months-after-joining"
                                                    type="number"
                                                    min={1}
                                                    max={24}
                                                    value={form.monthsAfterJoining}
                                                    onChange={(e) =>
                                                        setForm((f) => ({
                                                            ...f,
                                                            monthsAfterJoining: e.target.value,
                                                        }))
                                                    }
                                                    disabled={readOnly}
                                                    className={inputClass}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        <div>
                                            <label htmlFor="max-per-request" className={labelClass}>
                                                Max days per request
                                            </label>
                                            <input
                                                id="max-per-request"
                                                type="number"
                                                min={0.5}
                                                step={0.5}
                                                value={form.maxDaysPerRequest}
                                                onChange={(e) =>
                                                    setForm((f) => ({
                                                        ...f,
                                                        maxDaysPerRequest: e.target.value,
                                                    }))
                                                }
                                                disabled={readOnly}
                                                className={inputClass}
                                            />
                                            <p className="mt-1 text-[10px] text-gray-500">
                                                Single application cannot exceed this
                                            </p>
                                        </div>
                                        <div>
                                            <label htmlFor="min-per-request" className={labelClass}>
                                                Min days per request
                                            </label>
                                            <input
                                                id="min-per-request"
                                                type="number"
                                                min={0}
                                                step={0.5}
                                                value={form.minDaysPerRequest}
                                                onChange={(e) =>
                                                    setForm((f) => ({
                                                        ...f,
                                                        minDaysPerRequest: e.target.value,
                                                    }))
                                                }
                                                disabled={readOnly}
                                                className={inputClass}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="max-advance" className={labelClass}>
                                                Max advance booking (days)
                                            </label>
                                            <input
                                                id="max-advance"
                                                type="number"
                                                min={0}
                                                value={form.maxAdvanceBookingDays}
                                                onChange={(e) =>
                                                    setForm((f) => ({
                                                        ...f,
                                                        maxAdvanceBookingDays: e.target.value,
                                                    }))
                                                }
                                                disabled={readOnly}
                                                placeholder="0 = no limit"
                                                className={inputClass}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="max-req-month" className={labelClass}>
                                                Max requests / month
                                            </label>
                                            <input
                                                id="max-req-month"
                                                type="number"
                                                min={0}
                                                value={form.maxRequestsPerMonth}
                                                onChange={(e) =>
                                                    setForm((f) => ({
                                                        ...f,
                                                        maxRequestsPerMonth: e.target.value,
                                                    }))
                                                }
                                                disabled={readOnly}
                                                placeholder="0 = unlimited"
                                                className={inputClass}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="max-req-year" className={labelClass}>
                                                Max requests / year
                                            </label>
                                            <input
                                                id="max-req-year"
                                                type="number"
                                                min={0}
                                                value={form.maxRequestsPerYear}
                                                onChange={(e) =>
                                                    setForm((f) => ({
                                                        ...f,
                                                        maxRequestsPerYear: e.target.value,
                                                    }))
                                                }
                                                disabled={readOnly}
                                                placeholder="0 = unlimited"
                                                className={inputClass}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="min-gap" className={labelClass}>
                                                Min gap between requests (days)
                                            </label>
                                            <input
                                                id="min-gap"
                                                type="number"
                                                min={0}
                                                value={form.minGapDaysBetweenRequests}
                                                onChange={(e) =>
                                                    setForm((f) => ({
                                                        ...f,
                                                        minGapDaysBetweenRequests: e.target.value,
                                                    }))
                                                }
                                                disabled={readOnly}
                                                className={inputClass}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-4 rounded-xl border border-gray-200/80 bg-white p-4">
                                        <label className="flex cursor-pointer items-start gap-2 text-sm font-medium text-gray-700">
                                            <input
                                                type="checkbox"
                                                checked={form.enforceRemainingBalanceCap}
                                                onChange={(e) =>
                                                    setForm((f) => ({
                                                        ...f,
                                                        enforceRemainingBalanceCap: e.target.checked,
                                                    }))
                                                }
                                                disabled={readOnly}
                                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#06b6d4]"
                                            />
                                            <span>
                                                Cannot exceed remaining balance
                                                <span className="mt-0.5 block text-xs font-normal text-gray-500">
                                                    Requested days must not be more than leave balance available
                                                </span>
                                            </span>
                                        </label>
                                        <label className="flex cursor-pointer items-start gap-2 text-sm font-medium text-gray-700">
                                            <input
                                                type="checkbox"
                                                checked={form.mustUseFullBalanceWhenLow}
                                                onChange={(e) =>
                                                    setForm((f) => ({
                                                        ...f,
                                                        mustUseFullBalanceWhenLow: e.target.checked,
                                                    }))
                                                }
                                                disabled={readOnly}
                                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#06b6d4]"
                                            />
                                            <span>
                                                Use full balance when low
                                                <span className="mt-0.5 block text-xs font-normal text-gray-500">
                                                    If balance is at or below threshold, employee must apply for
                                                    exact remaining days only
                                                </span>
                                            </span>
                                        </label>
                                        {form.mustUseFullBalanceWhenLow && (
                                            <div className="w-full sm:w-48">
                                                <label htmlFor="full-balance-threshold" className={labelClass}>
                                                    Balance threshold (days)
                                                </label>
                                                <input
                                                    id="full-balance-threshold"
                                                    type="number"
                                                    min={0}
                                                    step={0.5}
                                                    value={form.fullBalanceThresholdDays}
                                                    onChange={(e) =>
                                                        setForm((f) => ({
                                                            ...f,
                                                            fullBalanceThresholdDays: e.target.value,
                                                        }))
                                                    }
                                                    disabled={readOnly}
                                                    className={inputClass}
                                                />
                                            </div>
                                        )}
                                        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
                                            <input
                                                type="checkbox"
                                                checked={form.weekdaysOnly}
                                                onChange={(e) =>
                                                    setForm((f) => ({
                                                        ...f,
                                                        weekdaysOnly: e.target.checked,
                                                    }))
                                                }
                                                disabled={readOnly}
                                                className="h-4 w-4 rounded border-gray-300 text-[#06b6d4]"
                                            />
                                            Weekdays only (exclude weekends)
                                        </label>
                                        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
                                            <input
                                                type="checkbox"
                                                checked={form.allowBackdatedLeave}
                                                onChange={(e) =>
                                                    setForm((f) => ({
                                                        ...f,
                                                        allowBackdatedLeave: e.target.checked,
                                                    }))
                                                }
                                                disabled={readOnly}
                                                className="h-4 w-4 rounded border-gray-300 text-[#06b6d4]"
                                            />
                                            Allow backdated leave
                                        </label>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
                                    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={form.carryForwardEnabled}
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    carryForwardEnabled: e.target.checked,
                                                }))
                                            }
                                            disabled={readOnly}
                                            className="h-4 w-4 rounded border-gray-300 text-[#06b6d4]"
                                        />
                                        Carry forward allowed
                                    </label>
                                    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={form.halfDayAllowed}
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    halfDayAllowed: e.target.checked,
                                                }))
                                            }
                                            disabled={readOnly}
                                            className="h-4 w-4 rounded border-gray-300 text-[#06b6d4]"
                                        />
                                        Half day allowed
                                    </label>
                                    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={form.documentRequired}
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    documentRequired: e.target.checked,
                                                }))
                                            }
                                            disabled={readOnly}
                                            className="h-4 w-4 rounded border-gray-300 text-[#06b6d4]"
                                        />
                                        Document required
                                    </label>
                                    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={form.requiresApproval}
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    requiresApproval: e.target.checked,
                                                }))
                                            }
                                            disabled={readOnly}
                                            className="h-4 w-4 rounded border-gray-300 text-[#06b6d4]"
                                        />
                                        Manager approval
                                    </label>
                                    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={form.paid}
                                            onChange={(e) =>
                                                setForm((f) => ({ ...f, paid: e.target.checked }))
                                            }
                                            disabled={readOnly}
                                            className="h-4 w-4 rounded border-gray-300 text-[#06b6d4]"
                                        />
                                        Paid leave
                                    </label>
                                    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={form.active}
                                            onChange={(e) =>
                                                setForm((f) => ({ ...f, active: e.target.checked }))
                                            }
                                            disabled={readOnly}
                                            className="h-4 w-4 rounded border-gray-300 text-[#06b6d4]"
                                        />
                                        Active policy
                                    </label>
                                </div>
                            </div>

                            <div className="sticky bottom-0 flex shrink-0 justify-end gap-2 border-t border-gray-100 bg-white p-4 sm:px-6">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                                >
                                    {readOnly ? "Close" : "Cancel"}
                                </button>
                                {!readOnly && (
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="inline-flex items-center gap-2 rounded-xl bg-[#06b6d4] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                        ) : (
                                            <Save className="h-4 w-4" />
                                        )}
                                        {isSubmitting ? "Saving…" : "Save policy"}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {emailModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
                        aria-hidden
                        onClick={closeEmailModal}
                    />
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="leave-notification-emails-title"
                        className="relative flex max-h-[min(90vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            className="shrink-0 border-b border-white/10 px-5 py-4 sm:px-6"
                            style={{
                                background:
                                    "linear-gradient(135deg, #06124f 0%, #0a2a5e 55%, #0d3a7a 100%)",
                            }}
                        >
                            <div className="flex items-start justify-between gap-3 text-white">
                                <div>
                                    <h2
                                        id="leave-notification-emails-title"
                                        className="text-lg font-bold"
                                    >
                                        Notification emails
                                    </h2>
                                    <p className="text-xs text-white/75">
                                        These addresses receive an email automatically when an
                                        employee submits a new leave request.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeEmailModal}
                                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
                                    aria-label="Close"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
                            {emailError && (
                                <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {emailError}
                                </p>
                            )}

                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    value={newEmailInput}
                                    onChange={(e) => setNewEmailInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            addEmailToDraft();
                                        }
                                    }}
                                    placeholder="name@company.com"
                                    className={inputClass}
                                    aria-label="New notification email"
                                />
                                <button
                                    type="button"
                                    onClick={addEmailToDraft}
                                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#0a2a5e] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                                >
                                    <Plus className="h-4 w-4" aria-hidden />
                                    Add
                                </button>
                            </div>

                            <div className="mt-4">
                                {emailDraft.length === 0 ? (
                                    <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                                        No emails saved yet. Add at least one address.
                                    </p>
                                ) : (
                                    <ul className="space-y-2">
                                        {emailDraft.map((email) => (
                                            <li
                                                key={email}
                                                className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5"
                                            >
                                                <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-gray-900">
                                                    <Mail className="h-4 w-4 shrink-0 text-[#06b6d4]" aria-hidden />
                                                    <span className="truncate">{email}</span>
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeEmailFromDraft(email)}
                                                    className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                                                    aria-label={`Remove ${email}`}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-gray-100 bg-white p-4 sm:px-6">
                            {emailsSaved && (
                                <span className="mr-auto inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
                                    <Check className="h-4 w-4" aria-hidden />
                                    Emails saved
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={closeEmailModal}
                                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                onClick={() => void saveNotificationEmails()}
                                disabled={isSavingEmails}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#06b6d4] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                            >
                                {isSavingEmails ? (
                                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                ) : (
                                    <Save className="h-4 w-4" aria-hidden />
                                )}
                                {isSavingEmails ? "Saving…" : "Save emails"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

