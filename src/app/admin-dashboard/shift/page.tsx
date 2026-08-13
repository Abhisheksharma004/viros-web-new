"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
    CalendarCheck,
    Clock,
    Eye,
    Loader2,
    MapPin,
    Pencil,
    Plus,
    Trash2,
    User,
    X,
} from "lucide-react";
import WorkingDaysPills from "@/components/admin-dashboard/WorkingDaysPills";
import { adminAttendanceForEmployee } from "@/lib/adminDashboardRoutes";
import { useModulePermission } from "@/context/ModulePermissionContext";

type EmployeeLookupRow = {
    employee_id: string;
    full_name: string;
    department: string;
    designation: string;
    official_email: string;
    employee_status: string;
};

type LocationType = "office" | "remote" | "hybrid" | "client";

type ShiftRecord = {
    id: number;
    employeeId: string;
    employeeName: string;
    department: string;
    role: string;
    employeeStatus: string;
    startTime: string;
    endTime: string;
    breakMinutes: number;
    locationType: LocationType;
    locationLabel: string;
    workingDays: number[];
    graceMinutes: number;
    missedPunchDisableDays: number;
    active: boolean;
};

const WEEKDAYS = [
    { value: 1, label: "Mon", full: "Monday" },
    { value: 2, label: "Tue", full: "Tuesday" },
    { value: 3, label: "Wed", full: "Wednesday" },
    { value: 4, label: "Thu", full: "Thursday" },
    { value: 5, label: "Fri", full: "Friday" },
    { value: 6, label: "Sat", full: "Saturday" },
    { value: 0, label: "Sun", full: "Sunday" },
] as const;

const LOCATION_OPTIONS: { value: LocationType; label: string }[] = [
    { value: "office", label: "Office" },
    { value: "remote", label: "Remote" },
    { value: "hybrid", label: "Hybrid" },
    { value: "client", label: "Client site" },
];

type ShiftApiRow = {
    id: number;
    employee_id: string;
    full_name: string;
    department: string;
    designation: string;
    employee_status: string;
    start_time: string;
    end_time: string;
    break_minutes: number;
    grace_minutes: number;
    missed_punch_disable_days: number;
    location_type: LocationType;
    location_label: string;
    working_days: number[];
    is_active: boolean;
};

function apiToShift(row: ShiftApiRow): ShiftRecord {
    return {
        id: row.id,
        employeeId: row.employee_id,
        employeeName: row.full_name,
        department: row.department,
        role: row.designation,
        employeeStatus: row.employee_status,
        startTime: row.start_time,
        endTime: row.end_time,
        breakMinutes: row.break_minutes,
        locationType: row.location_type,
        locationLabel: row.location_label,
        workingDays: row.working_days,
        graceMinutes: row.grace_minutes,
        missedPunchDisableDays: row.missed_punch_disable_days ?? 2,
        active: row.is_active,
    };
}

function currentMonthParam(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formToApiBody(form: typeof emptyForm) {
    return {
        employee_id: form.employeeId.trim().toUpperCase(),
        start_time: form.startTime,
        end_time: form.endTime,
        break_minutes: Math.max(0, Number(form.breakMinutes) || 0),
        grace_minutes: Math.max(0, Number(form.graceMinutes) || 0),
        missed_punch_disable_days: Math.min(
            30,
            Math.max(0, Math.floor(Number(form.missedPunchDisableDays) || 0)),
        ),
        location_type: form.locationType,
        location_label: form.locationLabel.trim() || locationTypeLabel(form.locationType),
        working_days: form.workingDays,
        is_active: form.active,
    };
}

const emptyForm = {
    employeeId: "",
    employeeName: "",
    department: "",
    role: "",
    employeeStatus: "",
    startTime: "09:00",
    endTime: "18:00",
    breakMinutes: "60",
    locationType: "office" as LocationType,
    locationLabel: "",
    workingDays: [1, 2, 3, 4, 5] as number[],
    graceMinutes: "15",
    missedPunchDisableDays: "2",
    active: true,
};

function formatTime12h(time24: string) {
    const [h, m] = time24.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return time24;
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function workingHoursLabel(start: string, end: string, breakMin: number) {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    let mins = eh * 60 + em - (sh * 60 + sm) - breakMin;
    if (mins < 0) mins = 0;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

function locationTypeLabel(type: LocationType) {
    return LOCATION_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

function EmployeeStatusBadge({ status }: { status: string }) {
    const trimmed = status.trim() || "—";
    const isActive = trimmed === "Active";
    const isOnLeave = trimmed === "On Leave";
    const isInactive = trimmed === "Inactive" || trimmed === "Resigned";
    const tone = isActive
        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15"
        : isOnLeave
          ? "bg-amber-50 text-amber-700 ring-1 ring-amber-600/15"
          : isInactive
            ? "bg-gray-100 text-gray-600 ring-1 ring-gray-200"
            : "bg-blue-50 text-blue-700 ring-1 ring-blue-600/15";

    return (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
            {trimmed}
        </span>
    );
}

function EmployeeDetailsBlock({
    employeeName,
    department,
    role,
    employeeStatus,
}: {
    employeeName: string;
    department: string;
    role: string;
    employeeStatus: string;
}) {
    return (
        <div className="rounded-md border border-[#0a2a5e]/15 bg-[#0a2a5e]/5 p-4">
            <p className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#0a2a5e]">
                <User className="h-3.5 w-3.5" aria-hidden />
                Employee details
            </p>
            <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                    <dt className="text-xs text-gray-500">Employee name</dt>
                    <dd className="mt-0.5 text-sm font-semibold text-gray-900">{employeeName || "—"}</dd>
                </div>
                <div>
                    <dt className="text-xs text-gray-500">Employee status</dt>
                    <dd className="mt-1">
                        {employeeStatus ? (
                            <EmployeeStatusBadge status={employeeStatus} />
                        ) : (
                            <span className="text-sm font-semibold text-gray-900">—</span>
                        )}
                    </dd>
                </div>
                <div>
                    <dt className="text-xs text-gray-500">Department</dt>
                    <dd className="mt-0.5 text-sm font-semibold text-gray-900">{department || "—"}</dd>
                </div>
                <div>
                    <dt className="text-xs text-gray-500">Role</dt>
                    <dd className="mt-0.5 text-sm font-semibold text-gray-900">{role || "—"}</dd>
                </div>
            </dl>
        </div>
    );
}

export default function AdminEmployeeShiftPage() {
    const { write: canWrite, delete: canDelete, admin: isAdmin } = useModulePermission();
    const [shifts, setShifts] = useState<ShiftRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [viewDetail, setViewDetail] = useState<ShiftRecord | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [isLookingUpEmployee, setIsLookingUpEmployee] = useState(false);
    const [showEmployeeDetails, setShowEmployeeDetails] = useState(false);
    const [employeeLookupHint, setEmployeeLookupHint] = useState("");
    const lookupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchShifts = useCallback(async () => {
        try {
            setLoadError("");
            setIsLoading(true);
            const resp = await fetch("/api/admin/shifts", { cache: "no-store" });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to load shifts");
            }
            const rows: ShiftApiRow[] = Array.isArray(data) ? data : [];
            setShifts(rows.map(apiToShift));
        } catch (error) {
            console.error("Error loading shifts:", error);
            setLoadError(error instanceof Error ? error.message : "Failed to load shifts");
            setShifts([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchShifts();
    }, [fetchShifts]);

    const lookupEmployeeById = useCallback(async (employeeId: string) => {
        const trimmed = employeeId.trim();
        if (!trimmed) {
            setShowEmployeeDetails(false);
            setEmployeeLookupHint("");
            setForm((prev) => ({ ...prev, employeeName: "", department: "", role: "", employeeStatus: "" }));
            return;
        }

        try {
            setIsLookingUpEmployee(true);
            setEmployeeLookupHint("");

            const resp = await fetch(
                `/api/admin/employees/lookup?employee_id=${encodeURIComponent(trimmed)}`,
                { cache: "no-store" },
            );

            if (!resp.ok) {
                if (resp.status === 404) {
                    setShowEmployeeDetails(false);
                    setEmployeeLookupHint("No employee found with this ID.");
                    setForm((prev) => ({ ...prev, employeeName: "", department: "", role: "", employeeStatus: "" }));
                    return;
                }
                const data = await resp.json().catch(() => ({}));
                throw new Error(typeof data.message === "string" ? data.message : "Lookup failed");
            }

            const data: EmployeeLookupRow = await resp.json();
            setShowEmployeeDetails(true);
            setEmployeeLookupHint("Employee details loaded.");
            setForm((prev) => ({
                ...prev,
                employeeName: data.full_name ?? "",
                department: data.department ?? "",
                role: data.designation ?? "",
                employeeStatus: data.employee_status ?? "Active",
            }));
        } catch (error) {
            console.error("Employee lookup failed:", error);
            setShowEmployeeDetails(false);
            setEmployeeLookupHint("Could not load employee details. Try again.");
            setForm((prev) => ({ ...prev, employeeName: "", department: "", role: "", employeeStatus: "" }));
        } finally {
            setIsLookingUpEmployee(false);
        }
    }, []);

    useEffect(() => {
        if (!modalOpen) return;

        const trimmed = form.employeeId.trim();
        if (!trimmed) {
            setShowEmployeeDetails(false);
            setEmployeeLookupHint("");
            return;
        }

        if (lookupTimerRef.current) clearTimeout(lookupTimerRef.current);
        lookupTimerRef.current = setTimeout(() => {
            void lookupEmployeeById(trimmed);
        }, 500);

        return () => {
            if (lookupTimerRef.current) clearTimeout(lookupTimerRef.current);
        };
    }, [form.employeeId, modalOpen, lookupEmployeeById]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return shifts;
        return shifts.filter(
            (s) =>
                s.employeeId.toLowerCase().includes(q) ||
                s.employeeName.toLowerCase().includes(q) ||
                s.department.toLowerCase().includes(q) ||
                s.role.toLowerCase().includes(q) ||
                s.employeeStatus.toLowerCase().includes(q) ||
                s.locationLabel.toLowerCase().includes(q) ||
                locationTypeLabel(s.locationType).toLowerCase().includes(q),
        );
    }, [shifts, search]);

    const stats = useMemo(() => {
        const active = shifts.filter((s) => s.active).length;
        return { total: shifts.length, active };
    }, [shifts]);

    const resetEmployeeLookup = () => {
        setShowEmployeeDetails(false);
        setEmployeeLookupHint("");
        setIsLookingUpEmployee(false);
        if (lookupTimerRef.current) clearTimeout(lookupTimerRef.current);
    };

    const openAdd = () => {
        setForm(emptyForm);
        setEditingId(null);
        resetEmployeeLookup();
        setModalOpen(true);
    };

    const openView = (shift: ShiftRecord) => {
        setViewDetail(shift);
    };

    const openEdit = (shift: ShiftRecord) => {
        setForm({
            employeeId: shift.employeeId,
            employeeName: shift.employeeName,
            department: shift.department,
            role: shift.role,
            employeeStatus: shift.employeeStatus,
            startTime: shift.startTime,
            endTime: shift.endTime,
            breakMinutes: String(shift.breakMinutes),
            locationType: shift.locationType,
            locationLabel: shift.locationLabel,
            workingDays: [...shift.workingDays],
            graceMinutes: String(shift.graceMinutes),
            missedPunchDisableDays: String(shift.missedPunchDisableDays),
            active: shift.active,
        });
        setEditingId(shift.id);
        setShowEmployeeDetails(Boolean(shift.employeeName));
        setEmployeeLookupHint(shift.employeeName ? "Employee details loaded." : "");
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingId(null);
        resetEmployeeLookup();
    };

    const closeViewModal = () => {
        setViewDetail(null);
    };

    const toggleDay = (day: number) => {
        setForm((prev) => {
            const has = prev.workingDays.includes(day);
            const workingDays = has
                ? prev.workingDays.filter((d) => d !== day)
                : [...prev.workingDays, day].sort((a, b) => {
                      const order = [1, 2, 3, 4, 5, 6, 0];
                      return order.indexOf(a) - order.indexOf(b);
                  });
            return { ...prev, workingDays };
        });
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Delete this shift record?")) return;
        try {
            const resp = await fetch(`/api/admin/shifts/${id}`, { method: "DELETE" });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Delete failed");
            }
            setShifts((prev) => prev.filter((s) => s.id !== id));
        } catch (error) {
            console.error("Delete shift failed:", error);
            alert(error instanceof Error ? error.message : "Failed to delete shift");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        if (!form.employeeId.trim()) return;
        if (form.workingDays.length === 0) return;
        if (!showEmployeeDetails || !form.employeeName.trim()) {
            setEmployeeLookupHint("Enter a valid Employee ID and wait for details to load.");
            return;
        }

        const body = formToApiBody(form);

        try {
            setIsSubmitting(true);
            const isEdit = editingId !== null;
            const resp = await fetch(isEdit ? `/api/admin/shifts/${editingId}` : "/api/admin/shifts", {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Save failed");
            }
            const saved = apiToShift(data as ShiftApiRow);
            if (isEdit) {
                setShifts((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
            } else {
                setShifts((prev) => [saved, ...prev]);
            }
            closeModal();
        } catch (error) {
            console.error("Save shift failed:", error);
            alert(error instanceof Error ? error.message : "Failed to save shift");
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass =
        "w-full rounded-md border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 disabled:bg-gray-50 disabled:text-gray-500";
    const labelClass = "mb-1.5 block text-sm font-semibold text-gray-700";

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                {loadError ? <p className="text-xs text-amber-600">{loadError}</p> : <span className="hidden sm:block" aria-hidden />}
                <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                    <Link
                        href="/admin-dashboard/attendance"
                        className="inline-flex items-center justify-center gap-2 rounded-md border border-[#0a2a5e]/20 bg-white px-4 py-3 text-sm font-semibold text-[#0a2a5e] shadow-sm transition hover:bg-[#0a2a5e]/5"
                    >
                        <CalendarCheck className="h-4 w-4" aria-hidden />
                        Attendance
                    </Link>
                    {(canWrite || isAdmin) && (
                        <button
                            type="button"
                            onClick={openAdd}
                            disabled={isLoading}
                            className="inline-flex items-center justify-center gap-2 rounded-md bg-[#0a2a5e] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                        >
                            <Plus className="h-4 w-4" aria-hidden />
                            Add shift
                        </button>
                    )}
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-md border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Total shifts</p>
                    <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.total}</p>
                </div>
                <div className="rounded-md border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Active shifts</p>
                    <p className="mt-2 text-3xl font-semibold text-emerald-600">{stats.active}</p>
                </div>
                <div className="rounded-md border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Inactive shifts</p>
                    <p className="mt-2 text-3xl font-semibold text-gray-600">
                        {stats.total - stats.active}
                    </p>
                </div>
            </div>

            <div className="rounded-md border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
                <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by employee ID, name, or location…"
                    className={inputClass}
                />
            </div>

            <div className="overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
                    <p className="text-sm font-semibold text-gray-900">Shift records</p>
                    <p className="mt-1 text-sm text-gray-500">
                        {isLoading ? "Loading…" : `Showing ${filtered.length} shift(s).`}
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 sm:px-6">Employee</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Timing</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Location</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Working days</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Shift</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 sm:px-6">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">
                                        <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                                        Loading shifts…
                                    </td>
                                </tr>
                            )}
                            {!isLoading && filtered.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">
                                        No shifts found. Add a shift for an employee.
                                    </td>
                                </tr>
                            )}
                            {!isLoading &&
                                filtered.map((shift) => (
                                    <tr key={shift.id} className="hover:bg-gray-50/80">
                                        <td className="px-4 py-4 sm:px-6">
                                            <p className="text-sm font-semibold text-gray-900">{shift.employeeId}</p>
                                            <p className="text-xs text-gray-500">{shift.employeeName || "—"}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            {shift.employeeStatus ? (
                                                <EmployeeStatusBadge status={shift.employeeStatus} />
                                            ) : (
                                                "—"
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
                                            <p className="font-medium text-gray-900">
                                                {formatTime12h(shift.startTime)} – {formatTime12h(shift.endTime)}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {workingHoursLabel(shift.startTime, shift.endTime, shift.breakMinutes)} · {shift.breakMinutes}m break
                                            </p>
                                        </td>
                                        <td className="max-w-[180px] px-4 py-4 text-sm text-gray-700">
                                            <p className="font-medium text-gray-900">{locationTypeLabel(shift.locationType)}</p>
                                            <p className="truncate text-xs text-gray-500">{shift.locationLabel}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <WorkingDaysPills days={shift.workingDays} />
                                            <Link
                                                href={adminAttendanceForEmployee(shift.employeeId, {
                                                    month: currentMonthParam(),
                                                })}
                                                className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#06b6d4] hover:text-[#0a2a5e]"
                                            >
                                                <CalendarCheck className="h-3.5 w-3.5" aria-hidden />
                                                Manage attendance
                                            </Link>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${shift.active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                                                {shift.active ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-right sm:px-6">
                                            <div className="inline-flex gap-1">
                                                <button type="button" onClick={() => openView(shift)} className="rounded-md p-2 text-gray-500 hover:bg-gray-100" aria-label="View shift"><Eye className="h-4 w-4" /></button>
                                                {(canWrite || isAdmin) && (
                                                    <button type="button" onClick={() => openEdit(shift)} className="rounded-md p-2 text-gray-500 hover:bg-gray-100" aria-label="Edit shift"><Pencil className="h-4 w-4" /></button>
                                                )}
                                                {(canDelete || isAdmin) && (
                                                    <button type="button" onClick={() => void handleDelete(shift.id)} className="rounded-md p-2 text-red-500 hover:bg-red-50" aria-label="Delete shift"><Trash2 className="h-4 w-4" /></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>




            {viewDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
                        aria-hidden
                        onClick={closeViewModal}
                    />
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="shift-view-title"
                        className="relative flex max-h-[min(90vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-md border border-gray-200 bg-white shadow-2xl"
                    >
                        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-100 px-6 py-5">
                            <h3 id="shift-view-title" className="text-lg font-bold tracking-tight text-[#001540]">
                                Shift details
                            </h3>
                            <button
                                type="button"
                                onClick={closeViewModal}
                                className="shrink-0 rounded-md p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" strokeWidth={2} />
                            </button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Employee ID</p>
                                    <p className="mt-1 break-words text-sm font-semibold text-gray-900">{viewDetail.employeeId}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Employee status</p>
                                    <div className="mt-1">
                                        {viewDetail.employeeStatus ? (
                                            <EmployeeStatusBadge status={viewDetail.employeeStatus} />
                                        ) : (
                                            <span className="text-sm font-semibold text-gray-900">—</span>
                                        )}
                                    </div>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-xs font-medium text-gray-500">Employee</p>
                                    <p className="mt-1 break-words text-sm font-semibold text-gray-900">{viewDetail.employeeName || "—"}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Department</p>
                                    <p className="mt-1 break-words text-sm font-semibold text-gray-900">{viewDetail.department || "—"}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Role</p>
                                    <p className="mt-1 break-words text-sm font-semibold text-gray-900">{viewDetail.role || "—"}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Shift timing</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">
                                        {formatTime12h(viewDetail.startTime)} – {formatTime12h(viewDetail.endTime)}
                                    </p>
                                    <p className="mt-0.5 text-xs text-gray-500">
                                        {workingHoursLabel(viewDetail.startTime, viewDetail.endTime, viewDetail.breakMinutes)} · {viewDetail.breakMinutes}m break
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Late grace</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">{viewDetail.graceMinutes} minutes</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Portal auto-disable</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">
                                        {viewDetail.missedPunchDisableDays <= 0
                                            ? "Off"
                                            : `${viewDetail.missedPunchDisableDays} consecutive working day(s) without check-in`}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Location type</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">{locationTypeLabel(viewDetail.locationType)}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Working location</p>
                                    <p className="mt-1 break-words text-sm font-semibold text-gray-900">{viewDetail.locationLabel || "—"}</p>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-xs font-medium text-gray-500">Working days</p>
                                    <div className="mt-2">
                                        <WorkingDaysPills days={viewDetail.workingDays} />
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500">
                                        Attendance for this employee is calculated only on these days; other
                                        days show as off days.
                                    </p>
                                    <Link
                                        href={adminAttendanceForEmployee(viewDetail.employeeId, {
                                            month: currentMonthParam(),
                                        })}
                                        className="mt-3 inline-flex items-center gap-2 rounded-md bg-[#06b6d4]/15 px-4 py-2.5 text-sm font-bold text-[#0a2a5e] hover:bg-[#06b6d4]/25"
                                    >
                                        <CalendarCheck className="h-4 w-4" aria-hidden />
                                        Manage attendance for this schedule
                                    </Link>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Shift status</p>
                                    <div className="mt-1">
                                        <span
                                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                viewDetail.active
                                                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15"
                                                    : "bg-gray-100 text-gray-600 ring-1 ring-gray-200"
                                            }`}
                                        >
                                            {viewDetail.active ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex shrink-0 justify-end border-t border-gray-100 px-6 py-4">
                            <button
                                type="button"
                                onClick={closeViewModal}
                                className="rounded-md bg-[#001540] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modalOpen && (
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
                        aria-labelledby="shift-form-title"
                        className="relative flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-md border border-gray-100 bg-white shadow-2xl"
                    >
                        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-100 bg-gradient-to-r from-[#06124f] to-[#0a2a5e] px-6 py-4">
                            <div className="min-w-0">
                                <h3 id="shift-form-title" className="text-lg font-bold text-white">
                                    {editingId !== null ? "Edit shift" : "Add shift"}
                                </h3>
                                <p className="mt-0.5 text-xs text-cyan-100/90">
                                    {editingId !== null
                                        ? "Update shift timing, location, and working days."
                                        : "Assign shift schedule and location for an employee."}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="shrink-0 rounded-md p-1.5 text-white/80 transition-colors hover:bg-white/10"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                            <div className="flex-1 space-y-4 overflow-y-auto p-5">
                                <div>
                                    <label className={labelClass}>Employee ID</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={form.employeeId}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setForm((f) => ({
                                                    ...f,
                                                    employeeId: value,
                                                    employeeName: "",
                                                    department: "",
                                                    role: "",
                                                    employeeStatus: "",
                                                }));
                                                setShowEmployeeDetails(false);
                                                setEmployeeLookupHint("");
                                            }}
                                            onBlur={() => {
                                                if (form.employeeId.trim()) {
                                                    void lookupEmployeeById(form.employeeId);
                                                }
                                            }}
                                            disabled={editingId !== null || isLookingUpEmployee}
                                            required
                                            placeholder="e.g. VIROS-001"
                                            className={`${inputClass} pr-10`}
                                        />
                                        {isLookingUpEmployee && (
                                            <Loader2
                                                className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400"
                                                aria-hidden
                                            />
                                        )}
                                    </div>
                                    {employeeLookupHint && (
                                        <p
                                            className={`mt-1.5 text-xs ${
                                                employeeLookupHint.includes("loaded")
                                                    ? "text-emerald-600"
                                                    : "text-amber-600"
                                            }`}
                                        >
                                            {employeeLookupHint}
                                        </p>
                                    )}
                                </div>

                                {showEmployeeDetails && (
                                    <EmployeeDetailsBlock
                                        employeeName={form.employeeName}
                                        department={form.department}
                                        role={form.role}
                                        employeeStatus={form.employeeStatus}
                                    />
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelClass}>Start time</label>
                                        <input
                                            type="time"
                                            value={form.startTime}
                                            onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                                            required
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>End time</label>
                                        <input
                                            type="time"
                                            value={form.endTime}
                                            onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                                            required
                                            className={inputClass}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelClass}>Break (minutes)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={form.breakMinutes}
                                            onChange={(e) =>
                                                setForm((f) => ({ ...f, breakMinutes: e.target.value }))
                                            }
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Late grace (minutes)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={form.graceMinutes}
                                            onChange={(e) =>
                                                setForm((f) => ({ ...f, graceMinutes: e.target.value }))
                                            }
                                            className={inputClass}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className={labelClass}>
                                        Auto-disable portal (working days)
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={30}
                                        value={form.missedPunchDisableDays}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                missedPunchDisableDays: e.target.value,
                                            }))
                                        }
                                        className={inputClass}
                                    />
                                    <p className="text-[11px] leading-snug text-gray-500">
                                        Consecutive working days without check-in before login is
                                        disabled. Week-offs and approved full leave excluded. Use{" "}
                                        <span className="font-semibold">0</span> to turn off.
                                    </p>
                                </div>

                                <div>
                                    <label className={labelClass}>Location type</label>
                                    <select
                                        value={form.locationType}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                locationType: e.target.value as LocationType,
                                            }))
                                        }
                                        className={inputClass}
                                    >
                                        {LOCATION_OPTIONS.map((o) => (
                                            <option key={o.value} value={o.value}>
                                                {o.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className={labelClass}>Working location</label>
                                    <input
                                        type="text"
                                        value={form.locationLabel}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, locationLabel: e.target.value }))
                                        }
                                        placeholder="Address, site name, or WFH policy"
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Working days</label>
                                    <div className="flex flex-wrap gap-2">
                                        {WEEKDAYS.map((d) => {
                                            const selected = form.workingDays.includes(d.value);
                                            return (
                                                <button
                                                    key={d.value}
                                                    type="button"
                                                    onClick={() => toggleDay(d.value)}
                                                    className={`h-10 min-w-[3rem] rounded-md px-3 text-sm font-semibold transition-colors ${
                                                        selected
                                                            ? "bg-[#0a2a5e] text-white"
                                                            : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                                                    } disabled:cursor-default`}
                                                >
                                                    {d.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {form.workingDays.length === 0 && (
                                        <p className="mt-1 text-xs text-red-500">Select at least one working day.</p>
                                    )}
                                </div>

                                <label className="flex cursor-pointer items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={form.active}
                                        onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                                        className="h-4 w-4 rounded border-gray-300 text-[#0a2a5e] focus:ring-[#06b6d4]"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Shift is active</span>
                                </label>
                            </div>

                            <div className="flex shrink-0 justify-end gap-2 border-t border-gray-100 bg-gray-50/80 px-5 py-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-md border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-white"
                                >
                                    Cancel
                                </button>
                                <button
                                        type="submit"
                                        disabled={
                                            isSubmitting ||
                                            !form.employeeId.trim() ||
                                            form.workingDays.length === 0 ||
                                            !showEmployeeDetails ||
                                            !form.employeeName.trim()
                                        }
                                        className="inline-flex items-center justify-center gap-2 rounded-md bg-[#0a2a5e] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Saving…
                                            </>
                                        ) : editingId !== null ? (
                                            "Save changes"
                                        ) : (
                                            "Create shift"
                                        )}
                                    </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
