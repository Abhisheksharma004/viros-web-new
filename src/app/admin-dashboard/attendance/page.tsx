"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { AdminAttendanceTab } from "@/lib/adminDashboardRoutes";
import {
    Calendar,
    Check,
    ChevronLeft,
    ChevronRight,
    Clock,
    FileSpreadsheet,
    FileText,
    Loader2,
    Eye,
    MapPin,
    Pencil,
    Search,
    UserCheck,
    UserX,
    Users,
    X,
} from "lucide-react";
import PhotoLightbox from "@/components/employee-dashboard/PhotoLightbox";
import WorkingDaysPills from "@/components/admin-dashboard/WorkingDaysPills";
import Link from "next/link";
import type { AttendancePunchProof } from "@/lib/employeeAttendance";
import {
    exportDailyAttendanceExcel,
    exportDailyAttendancePdf,
    exportEmployeeAttendanceExcel,
    exportEmployeeAttendancePdf,
    exportMonthlyAttendanceExcel,
    exportMonthlyAttendancePdf,
    formatAttendanceStatusLabel,
    type AttendanceDailyExportRow,
    type AttendanceEmployeeExportRow,
    type AttendanceMonthlyExportRow,
} from "@/lib/adminAttendanceExport";

type TabId = "daily" | "monthly" | "employee";

type AttendanceStatus = "present" | "absent" | "late" | "grace" | "leave" | "half-day" | "weekend";

type DailyRow = {
    employeeId: string;
    fullName: string;
    department: string;
    designation: string;
    attendanceId: number | null;
    date: string;
    status: AttendanceStatus;
    checkIn?: string;
    checkOut?: string;
    hours?: string;
    note?: string;
    checkInProof?: AttendancePunchProof;
    checkOutProof?: AttendancePunchProof;
    canMarkPresent: boolean;
    canMarkAbsent: boolean;
    workEntryCount?: number;
};

type MonthlyRow = {
    employeeId: string;
    fullName: string;
    department: string;
    present: number;
    late: number;
    absent: number;
    leave: number;
    halfDay: number;
    totalPresent: number;
    totalWorkingDaysInMonth: number;
    totalWorkingDaysToDate: number;
    weekOff: number;
    holiday?: number;
};

type MonthlyRowCompat = Omit<MonthlyRow, "totalWorkingDaysInMonth" | "totalWorkingDaysToDate"> & {
    /** Older API field — maps to totalWorkingDaysInMonth when new fields absent */
    totalWorkingDays?: number;
    totalWorkingDaysInMonth?: number;
    totalWorkingDaysToDate?: number;
};

type EmployeeListItem = {
    employee_id: string;
    full_name: string;
    department: string | null;
};

type EmployeeShiftContext = {
    configured: boolean;
    active: boolean;
    startTime: string;
    endTime: string;
    graceMinutes: number;
    workingDays: number[];
    locationType: string;
    locationLabel: string;
};

type EmployeeRecord = {
    date: string;
    status: AttendanceStatus | "weekend";
    checkIn?: string;
    checkOut?: string;
    hours?: string;
    note?: string;
    checkInProof?: AttendancePunchProof;
    checkOutProof?: AttendancePunchProof;
    workEntryCount?: number;
};

function time12hTo24h(timeStr?: string): string {
    if (!timeStr || timeStr === "—") return "";
    const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/i);
    if (!match) return "";
    let h = parseInt(match[1], 10);
    const m = match[2];
    const ampm = match[4]?.toLowerCase();
    if (ampm === "pm" && h < 12) h += 12;
    if (ampm === "am" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${m}`;
}

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
    present: { label: "Present", className: "bg-emerald-100 text-emerald-900 ring-emerald-600/30" },
    grace: { label: "Grace", className: "bg-purple-100 text-purple-900 ring-purple-600/30" },
    late: { label: "Late", className: "bg-amber-100 text-amber-900 ring-amber-600/30" },
    absent: { label: "Absent", className: "bg-red-100 text-red-900 ring-red-600/30" },
    leave: { label: "Leave", className: "bg-blue-100 text-blue-900 ring-blue-600/30" },
    "half-day": { label: "Half day", className: "bg-teal-100 text-teal-900 ring-teal-600/30" },
    weekend: { label: "Off day", className: "bg-gray-100 text-gray-600 ring-gray-400/30" },
    holiday: { label: "Holiday", className: "bg-purple-100 text-purple-900 ring-purple-600/30" },
};

const TH =
    "whitespace-nowrap px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-[#0a2a5e] bg-[#0a2a5e]/10 border-b border-[#0a2a5e]/15";
const TH_CENTER = `${TH} text-center`;
const TD = "px-4 py-3.5 text-sm text-gray-900 align-middle";
const TD_MUTED = "text-gray-600";
const INPUT =
    "h-10 rounded-md border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-900 shadow-sm outline-none focus:border-[#0a2a5e] focus:ring-2 focus:ring-[#0a2a5e]/20";
const TOOLBAR =
    "flex w-full flex-nowrap items-center gap-2 rounded-md border border-gray-100 bg-white p-3 shadow-sm";
const TOOLBAR_MIDDLE = "flex min-w-0 flex-1 items-center gap-2";
const BTN_EXPORT =
    "inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-gray-300 bg-white px-2.5 text-xs font-bold text-gray-900 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 sm:gap-2 sm:px-3 sm:text-sm";
const BTN_ACTION =
    "inline-flex h-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md bg-[#06b6d4] px-4 text-xs font-bold text-white hover:bg-[#05a8b8] disabled:opacity-60 sm:text-sm";
const EMPTY = "font-semibold text-gray-600";

function StatusBadge({ status, note }: { status: string; note?: string }) {
    const cfg = STATUS_STYLES[status] ?? {
        label: status,
        className: "bg-gray-100 text-gray-700 ring-gray-500/20",
    };

    const isHoliday = status === "holiday" || (status === "weekend" && note && note !== "Off day");

    const badgeLabel = isHoliday && note ? (note.split(" | ")[0] || note) : cfg.label;
    const badgeClass = isHoliday
        ? "bg-purple-100 text-purple-900 ring-purple-600/30 font-bold"
        : cfg.className;

    const fullTooltip = note
        ? note.toLowerCase().includes(cfg.label.toLowerCase())
            ? note
            : `${cfg.label} — ${note}`
        : cfg.label;

    return (
        <span
            title={fullTooltip}
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${badgeClass}`}
        >
            {badgeLabel}
        </span>
    );
}

function hasPunchDetail(proof?: AttendancePunchProof) {
    return Boolean(
        proof?.time ||
        proof?.photoUrl ||
        (proof?.latitude != null && proof?.longitude != null) ||
        proof?.address,
    );
}

function PunchTimePhoto({
    proof,
    variant,
    employeeName,
    onOpenDetail,
}: {
    proof?: AttendancePunchProof;
    variant: "in" | "out";
    employeeName: string;
    onOpenDetail: (proof: AttendancePunchProof, label: string) => void;
}) {
    if (!hasPunchDetail(proof)) {
        return <span className={EMPTY}>—</span>;
    }

    const timeClass =
        variant === "in"
            ? "font-bold tabular-nums text-[#06b6d4] hover:text-[#0891b2]"
            : "font-bold tabular-nums text-[#0a2a5e] hover:text-[#06124f]";
    const ringClass = variant === "in" ? "ring-[#06b6d4]" : "ring-[#0a2a5e]";
    const label = variant === "in" ? "Check-in" : "Check-out";
    const open = () => onOpenDetail(proof!, label);

    return (
        <span className="inline-flex items-center gap-2.5 whitespace-nowrap">
            {proof?.time ? (
                <button
                    type="button"
                    onClick={open}
                    className={`${timeClass} cursor-pointer underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/40 rounded`}
                    aria-label={`View ${label} details for ${employeeName}`}
                >
                    {proof.time}
                </button>
            ) : (
                <span className={EMPTY}>—</span>
            )}
            {proof?.photoUrl ? (
                <button
                    type="button"
                    onClick={open}
                    className={`group h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ${ringClass} ring-offset-2 transition hover:ring-offset-1 focus:outline-none focus:ring-2 focus:ring-[#06b6d4] focus:ring-offset-2`}
                    aria-label={`View ${label} details for ${employeeName}`}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={proof.photoUrl}
                        alt={`${label} photo`}
                        className="h-full w-full cursor-pointer object-cover transition group-hover:scale-105"
                        style={{ transform: "scaleX(-1)" }}
                    />
                </button>
            ) : null}
        </span>
    );
}

function PunchProofModal({
    open,
    onClose,
    employeeName,
    label,
    variant,
    proof,
    onPhotoZoom,
}: {
    open: boolean;
    onClose: () => void;
    employeeName: string;
    label: string;
    variant: "in" | "out";
    proof: AttendancePunchProof;
    onPhotoZoom: (src: string, alt: string) => void;
}) {
    useEffect(() => {
        if (!open) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = prevOverflow;
        };
    }, [open, onClose]);

    if (!open) return null;

    const accent = variant === "in" ? "#06b6d4" : "#0a2a5e";
    const hasLocation =
        proof.latitude != null &&
        proof.longitude != null &&
        Number.isFinite(proof.latitude) &&
        Number.isFinite(proof.longitude);
    const mapsUrl = hasLocation
        ? `https://www.google.com/maps?q=${proof.latitude},${proof.longitude}`
        : null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="punch-proof-title"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md overflow-hidden rounded-md bg-white shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="flex items-start justify-between gap-3 px-5 py-4 text-white"
                    style={{
                        background:
                            variant === "in"
                                ? "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)"
                                : "linear-gradient(135deg, #06124f 0%, #0a2a5e 100%)",
                    }}
                >
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-white/80">{label}</p>
                        <h3 id="punch-proof-title" className="text-lg font-bold">
                            {employeeName}
                        </h3>
                        {proof.time && (
                            <p className="mt-0.5 text-sm font-semibold text-white/95">{proof.time}</p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4 p-5">
                    {proof.photoUrl ? (
                        <button
                            type="button"
                            onClick={() => onPhotoZoom(proof.photoUrl!, `${employeeName} — ${label}`)}
                            className={`mx-auto block overflow-hidden rounded-md ring-2 ring-offset-2 transition hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[#06b6d4] ${variant === "in" ? "ring-[#06b6d4]" : "ring-[#0a2a5e]"
                                }`}
                            aria-label="View full size photo"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={proof.photoUrl}
                                alt={`${label} selfie`}
                                className="mx-auto max-h-64 w-auto max-w-full object-contain"
                                style={{ transform: "scaleX(-1)" }}
                            />
                        </button>
                    ) : (
                        <p className="text-center text-sm font-medium text-gray-500">No photo captured</p>
                    )}

                    <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-600">
                            <MapPin className="h-4 w-4" style={{ color: accent }} aria-hidden />
                            Location
                        </div>
                        {hasLocation || proof.address ? (
                            <>
                                <p className="text-sm font-medium leading-snug text-gray-900">
                                    {proof.address ??
                                        `${proof.latitude!.toFixed(5)}, ${proof.longitude!.toFixed(5)}`}
                                </p>
                                {proof.accuracy != null && (
                                    <p className="mt-1 text-xs text-gray-600">
                                        ±{Math.round(proof.accuracy)}m accuracy
                                    </p>
                                )}
                                {mapsUrl && (
                                    <a
                                        href={mapsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-2 inline-block text-sm font-bold hover:underline"
                                        style={{ color: accent }}
                                    >
                                        View on Google Maps
                                    </a>
                                )}
                            </>
                        ) : (
                            <p className="text-sm font-medium text-gray-500">Location not recorded</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function formatMonthLabel(year: number, month: number) {
    return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
    });
}

function toIsoDate(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTableDate(date: string) {
    return new Date(date + "T12:00:00").toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        weekday: "short",
    });
}

function formatDeptDesignation(department?: string | null, designation?: string | null) {
    const dept = department?.trim() || "";
    const desig = designation?.trim() || "";
    if (dept && desig) return `${dept} · ${desig}`;
    return dept || desig;
}

function isAttendanceTab(value: string | null): value is TabId {
    return value === "daily" || value === "monthly" || value === "employee";
}

function AdminEmployeeAttendancePageContent() {
    const searchParams = useSearchParams();

    const today = useMemo(() => toIsoDate(new Date()), []);
    const [tab, setTab] = useState<TabId>("daily");
    const [search, setSearch] = useState("");

    const [dailyDate, setDailyDate] = useState(today);
    const [dailyRows, setDailyRows] = useState<DailyRow[]>([]);
    const [dailyLoading, setDailyLoading] = useState(true);
    const [dailyError, setDailyError] = useState("");

    const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
    const [viewMonth, setViewMonth] = useState(() => new Date().getMonth() + 1);
    const [monthlyRows, setMonthlyRows] = useState<MonthlyRow[]>([]);
    const [monthlyLoading, setMonthlyLoading] = useState(false);
    const [monthlyError, setMonthlyError] = useState("");

    const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
    const [employeeRecords, setEmployeeRecords] = useState<EmployeeRecord[]>([]);
    const [employeeMeta, setEmployeeMeta] = useState<{
        fullName: string;
        department: string;
        designation: string;
    } | null>(null);
    const [employeeShift, setEmployeeShift] = useState<EmployeeShiftContext | null>(null);
    const [employeeLoading, setEmployeeLoading] = useState(false);
    const [employeeError, setEmployeeError] = useState("");

    const [markingKey, setMarkingKey] = useState<string | null>(null);
    const [markNote, setMarkNote] = useState("");
    const [markTarget, setMarkTarget] = useState<{ employeeId: string; name: string } | null>(null);
    const [markAbsentNote, setMarkAbsentNote] = useState("");
    const [markAbsentTarget, setMarkAbsentTarget] = useState<{ employeeId: string; name: string } | null>(null);
    const [updateTarget, setUpdateTarget] = useState<{
        employeeId: string;
        name: string;
        checkInTime: string;
        checkOutTime: string;
        checkInAddress: string;
        checkOutAddress: string;
        note: string;
    } | null>(null);
    const [viewDetailTarget, setViewDetailTarget] = useState<DailyRow | null>(null);
    const [exportBusy, setExportBusy] = useState<"excel" | "pdf" | null>(null);
    const [photoLightbox, setPhotoLightbox] = useState<{ src: string; alt: string } | null>(null);
    const [punchDetail, setPunchDetail] = useState<{
        employeeName: string;
        label: string;
        variant: "in" | "out";
        proof: AttendancePunchProof;
    } | null>(null);

    const openPunchDetail = useCallback(
        (employeeName: string, label: string, variant: "in" | "out", proof: AttendancePunchProof) => {
            setPunchDetail({ employeeName, label, variant, proof });
        },
        [],
    );

    const monthInputValue = `${viewYear}-${String(viewMonth).padStart(2, "0")}`;

    const urlEmployeeId = searchParams.get("employeeId")?.trim().toUpperCase() ?? "";

    useEffect(() => {
        const tabParam = searchParams.get("tab") as AdminAttendanceTab | null;
        if (isAttendanceTab(tabParam)) {
            setTab(tabParam);
        }

        const monthParam = searchParams.get("month");
        if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
            const [y, m] = monthParam.split("-").map(Number);
            if (y && m >= 1 && m <= 12) {
                setViewYear(y);
                setViewMonth(m);
            }
        }

        const dateParam = searchParams.get("date");
        if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
            setDailyDate(dateParam);
        }

        if (urlEmployeeId) {
            setSelectedEmployeeId(urlEmployeeId);
            if (!tabParam || tabParam === "employee") {
                setTab("employee");
            }
            if (tabParam === "daily") {
                setSearch(urlEmployeeId);
            }
        }

    }, [searchParams, urlEmployeeId]);

    const loadEmployees = useCallback(async () => {
        try {
            const resp = await fetch("/api/admin/employees", { cache: "no-store" });
            const data = await resp.json().catch(() => []);
            if (!resp.ok) return;
            const rows: EmployeeListItem[] = Array.isArray(data)
                ? data.map((r: { employee_id: string; full_name: string; department: string | null }) => ({
                    employee_id: r.employee_id,
                    full_name: r.full_name,
                    department: r.department,
                }))
                : [];
            setEmployees(rows);
            if (rows.length && !selectedEmployeeId && !urlEmployeeId) {
                setSelectedEmployeeId(rows[0].employee_id);
            } else if (urlEmployeeId && rows.some((r) => r.employee_id === urlEmployeeId)) {
                setSelectedEmployeeId(urlEmployeeId);
            }
        } catch {
            // non-blocking
        }
    }, [selectedEmployeeId, urlEmployeeId]);

    const loadDaily = useCallback(async () => {
        try {
            setDailyLoading(true);
            setDailyError("");
            const resp = await fetch(
                `/api/admin/attendance?view=daily&date=${encodeURIComponent(dailyDate)}`,
                { cache: "no-store" },
            );
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to load daily attendance");
            }
            setDailyRows(Array.isArray(data.rows) ? data.rows : []);
        } catch (error) {
            setDailyError(error instanceof Error ? error.message : "Failed to load");
            setDailyRows([]);
        } finally {
            setDailyLoading(false);
        }
    }, [dailyDate]);

    const loadMonthly = useCallback(async () => {
        try {
            setMonthlyLoading(true);
            setMonthlyError("");
            const resp = await fetch(
                `/api/admin/attendance?view=monthly&year=${viewYear}&month=${viewMonth}`,
                { cache: "no-store" },
            );
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to load monthly summary");
            }
            const raw = (Array.isArray(data.rows) ? data.rows : []) as MonthlyRowCompat[];
            setMonthlyRows(
                raw.map((r) => ({
                    ...r,
                    totalWorkingDaysInMonth:
                        typeof r.totalWorkingDaysInMonth === "number"
                            ? r.totalWorkingDaysInMonth
                            : typeof r.totalWorkingDays === "number"
                                ? r.totalWorkingDays
                                : 0,
                    totalWorkingDaysToDate:
                        typeof r.totalWorkingDaysToDate === "number"
                            ? r.totalWorkingDaysToDate
                            : typeof r.totalWorkingDays === "number"
                                ? r.totalWorkingDays
                                : 0,
                    holiday: typeof r.holiday === "number" ? r.holiday : 0,
                })),
            );
        } catch (error) {
            setMonthlyError(error instanceof Error ? error.message : "Failed to load");
            setMonthlyRows([]);
        } finally {
            setMonthlyLoading(false);
        }
    }, [viewYear, viewMonth]);

    const loadEmployeeMonthly = useCallback(async () => {
        if (!selectedEmployeeId.trim()) return;
        try {
            setEmployeeLoading(true);
            setEmployeeError("");
            const resp = await fetch(
                `/api/admin/attendance?view=employee&employeeId=${encodeURIComponent(selectedEmployeeId)}&year=${viewYear}&month=${viewMonth}`,
                { cache: "no-store" },
            );
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to load employee attendance");
            }
            setEmployeeMeta(
                data.employee
                    ? {
                        fullName: data.employee.fullName,
                        department: data.employee.department,
                        designation: data.employee.designation,
                    }
                    : null,
            );
            setEmployeeShift(
                data.shift && typeof data.shift === "object"
                    ? (data.shift as EmployeeShiftContext)
                    : null,
            );
            setEmployeeRecords(Array.isArray(data.records) ? data.records : []);
        } catch (error) {
            setEmployeeError(error instanceof Error ? error.message : "Failed to load");
            setEmployeeRecords([]);
            setEmployeeMeta(null);
            setEmployeeShift(null);
        } finally {
            setEmployeeLoading(false);
        }
    }, [selectedEmployeeId, viewYear, viewMonth]);

    useEffect(() => {
        void loadEmployees();
    }, [loadEmployees]);

    useEffect(() => {
        if (tab === "daily") void loadDaily();
    }, [tab, loadDaily]);

    useEffect(() => {
        if (tab === "monthly") void loadMonthly();
    }, [tab, loadMonthly]);

    useEffect(() => {
        if (tab === "employee") void loadEmployeeMonthly();
    }, [tab, loadEmployeeMonthly]);

    const filterText = search.trim().toLowerCase();

    const filteredDaily = useMemo(() => {
        if (!filterText) return dailyRows;
        return dailyRows.filter(
            (r) =>
                r.fullName.toLowerCase().includes(filterText) ||
                r.employeeId.toLowerCase().includes(filterText) ||
                r.department.toLowerCase().includes(filterText),
        );
    }, [dailyRows, filterText]);

    const filteredMonthly = useMemo(() => {
        if (!filterText) return monthlyRows;
        return monthlyRows.filter(
            (r) =>
                r.fullName.toLowerCase().includes(filterText) ||
                r.employeeId.toLowerCase().includes(filterText) ||
                r.department.toLowerCase().includes(filterText),
        );
    }, [monthlyRows, filterText]);

    const dailyStats = useMemo(() => {
        const present = dailyRows.filter((r) => r.status === "present" || r.status === "grace" || r.status === "late").length;
        const absent = dailyRows.filter((r) => r.status === "absent").length;
        const late = dailyRows.filter((r) => r.status === "late").length;
        const checkedOut = dailyRows.filter((r) => r.checkOut).length;
        return { present, absent, late, checkedOut, total: dailyRows.length };
    }, [dailyRows]);

    const shiftMonth = (delta: number) => {
        const d = new Date(viewYear, viewMonth - 1 + delta, 1);
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth() + 1);
    };

    const shiftDay = (delta: number) => {
        const d = new Date(dailyDate + "T12:00:00");
        d.setDate(d.getDate() + delta);
        setDailyDate(toIsoDate(d));
    };

    const handleMarkPresent = async () => {
        if (!markTarget) return;
        try {
            setMarkingKey(`${markTarget.employeeId}-${dailyDate}`);
            const resp = await fetch("/api/admin/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "mark-present",
                    employeeId: markTarget.employeeId,
                    date: dailyDate,
                    note: markNote.trim() || undefined,
                }),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to mark present");
            }
            setMarkTarget(null);
            setMarkNote("");
            await loadDaily();
            if (tab === "monthly") await loadMonthly();
            if (tab === "employee" && selectedEmployeeId === markTarget.employeeId) {
                await loadEmployeeMonthly();
            }
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to mark present");
        } finally {
            setMarkingKey(null);
        }
    };

    const handleMarkAbsent = async () => {
        if (!markAbsentTarget) return;
        try {
            setMarkingKey(`${markAbsentTarget.employeeId}-${dailyDate}`);
            const resp = await fetch("/api/admin/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "mark-absent",
                    employeeId: markAbsentTarget.employeeId,
                    date: dailyDate,
                    note: markAbsentNote.trim() || undefined,
                }),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to mark absent");
            }
            setMarkAbsentTarget(null);
            setMarkAbsentNote("");
            await loadDaily();
            if (tab === "monthly") await loadMonthly();
            if (tab === "employee" && selectedEmployeeId === markAbsentTarget.employeeId) {
                await loadEmployeeMonthly();
            }
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to mark absent");
        } finally {
            setMarkingKey(null);
        }
    };

    const handleUpdateRecord = async () => {
        if (!updateTarget) return;
        try {
            setMarkingKey(`${updateTarget.employeeId}-${dailyDate}`);
            const resp = await fetch("/api/admin/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "update-record",
                    employeeId: updateTarget.employeeId,
                    date: dailyDate,
                    checkInTime: updateTarget.checkInTime || undefined,
                    checkOutTime: updateTarget.checkOutTime || undefined,
                    checkInAddress: updateTarget.checkInAddress || undefined,
                    checkOutAddress: updateTarget.checkOutAddress || undefined,
                    note: updateTarget.note.trim() || undefined,
                }),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to update attendance");
            }
            setUpdateTarget(null);
            await loadDaily();
            if (tab === "monthly") await loadMonthly();
            if (tab === "employee" && selectedEmployeeId === updateTarget.employeeId) {
                await loadEmployeeMonthly();
            }
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to update attendance");
        } finally {
            setMarkingKey(null);
        }
    };

    const tabs: { id: TabId; label: string; icon: typeof Calendar }[] = [
        { id: "daily", label: "Daily check-in / out", icon: Clock },
        { id: "monthly", label: "Monthly summary", icon: Calendar },
        { id: "employee", label: "Employee-wise", icon: Users },
    ];

    const dailyDateLabel = useMemo(
        () =>
            new Date(dailyDate + "T12:00:00").toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
            }),
        [dailyDate],
    );

    const monthLabel = useMemo(() => formatMonthLabel(viewYear, viewMonth), [viewYear, viewMonth]);

    const dailyExportRows = useMemo<AttendanceDailyExportRow[]>(
        () =>
            filteredDaily.map((r) => ({
                employeeId: r.employeeId,
                fullName: r.fullName,
                deptDesignation: formatDeptDesignation(r.department, r.designation) || "—",
                date: dailyDate,
                status: formatAttendanceStatusLabel(r.status),
                checkIn: r.checkIn || "—",
                checkOut: r.checkOut || "—",
                workingHours: r.hours || "—",
            })),
        [filteredDaily, dailyDate],
    );

    const monthlyExportRows = useMemo<AttendanceMonthlyExportRow[]>(
        () =>
            filteredMonthly.map((r) => ({
                employeeId: r.employeeId,
                fullName: r.fullName,
                department: r.department || "—",
                present: r.present,
                late: r.late,
                absent: r.absent,
                leave: r.leave,
                halfDay: r.halfDay,
                totalPresent: r.totalPresent,
                totalWorkingDays: r.totalWorkingDaysInMonth,
                weekOff: r.weekOff,
                holiday: r.holiday ?? 0,
            })),
        [filteredMonthly],
    );

    const employeeExportRows = useMemo<AttendanceEmployeeExportRow[]>(
        () =>
            employeeRecords.map((r) => ({
                date: formatTableDate(r.date),
                status: formatAttendanceStatusLabel(r.status),
                checkIn: r.checkIn || "—",
                checkOut: r.checkOut || "—",
                workingHours: r.hours || "—",
            })),
        [employeeRecords],
    );

    const employeeExportLabel = useMemo(() => {
        if (employeeMeta?.fullName) {
            return `${employeeMeta.fullName} (${selectedEmployeeId})`;
        }
        return selectedEmployeeId || "Employee";
    }, [employeeMeta, selectedEmployeeId]);

    const exportCount = useMemo(() => {
        if (tab === "daily") return dailyExportRows.length;
        if (tab === "monthly") return monthlyExportRows.length;
        return employeeExportRows.length;
    }, [tab, dailyExportRows.length, monthlyExportRows.length, employeeExportRows.length]);

    const tabLoading =
        tab === "daily" ? dailyLoading : tab === "monthly" ? monthlyLoading : employeeLoading;

    const canExport = exportCount > 0 && !tabLoading;

    const runExportExcel = async () => {
        if (!canExport) return;
        try {
            setExportBusy("excel");
            if (tab === "daily") {
                await exportDailyAttendanceExcel(dailyExportRows, dailyDateLabel);
            } else if (tab === "monthly") {
                await exportMonthlyAttendanceExcel(monthlyExportRows, monthLabel);
            } else {
                await exportEmployeeAttendanceExcel(employeeExportRows, employeeExportLabel, monthLabel);
            }
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to export Excel file.");
        } finally {
            setExportBusy(null);
        }
    };

    const runExportPdf = async () => {
        if (!canExport) return;
        try {
            setExportBusy("pdf");
            if (tab === "daily") {
                await exportDailyAttendancePdf(dailyExportRows, dailyDateLabel);
            } else if (tab === "monthly") {
                await exportMonthlyAttendancePdf(monthlyExportRows, monthLabel);
            } else {
                await exportEmployeeAttendancePdf(employeeExportRows, employeeExportLabel, monthLabel);
            }
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to export PDF.");
        } finally {
            setExportBusy(null);
        }
    };

    const toolbarControls = (
        <div className={TOOLBAR_MIDDLE}>
            <div className="relative min-w-0 flex-[1.4]">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
                <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search employee…"
                    className={`${INPUT} h-10 w-full pl-8 text-xs placeholder:text-gray-700 sm:text-sm`}
                />
            </div>
            <button
                type="button"
                onClick={() => void runExportExcel()}
                disabled={!canExport || exportBusy !== null}
                className={BTN_EXPORT}
                title={
                    canExport
                        ? `Export ${exportCount} row(s) from current tab to Excel`
                        : "No data to export"
                }
            >
                {exportBusy === "excel" ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                    <FileSpreadsheet className="h-4 w-4 text-emerald-700" aria-hidden />
                )}
                Export Excel
            </button>
            <button
                type="button"
                onClick={() => void runExportPdf()}
                disabled={!canExport || exportBusy !== null}
                className={BTN_EXPORT}
                title={
                    canExport
                        ? `Export ${exportCount} row(s) from current tab to PDF`
                        : "No data to export"
                }
            >
                {exportBusy === "pdf" ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                    <FileText className="h-4 w-4 text-red-700" aria-hidden />
                )}
                Export PDF
            </button>
        </div>
    );

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-1">
                <div className="flex flex-wrap gap-2">
                    {tabs.map((t) => {
                        const Icon = t.icon;
                        const active = tab === t.id;
                        return (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setTab(t.id)}
                                className={`inline-flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-semibold transition ${active
                                    ? "bg-[#0a2a5e] text-white shadow-sm"
                                    : "text-gray-800 hover:bg-gray-100"
                                    }`}
                            >
                                <Icon className="h-4 w-4" aria-hidden />
                                {t.label}
                            </button>
                        );
                    })}
                </div>
                <Link
                    href="/admin-dashboard/corporate-calendar"
                    className="inline-flex items-center gap-1.5 rounded-md border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-bold text-purple-800 hover:bg-purple-100 transition shadow-xs mb-1"
                    title="Manage Corporate Calendar & Holidays"
                >
                    <Calendar className="h-4 w-4 text-purple-600" aria-hidden />
                    Corporate Calendar
                </Link>
            </div>

            {/* Daily tab */}
            {tab === "daily" && (
                <div className="space-y-4">
                    <div className={TOOLBAR}>
                        <div className="flex shrink-0 items-center gap-2">
                            <button
                                type="button"
                                onClick={() => shiftDay(-1)}
                                className="flex h-10 w-9 shrink-0 items-center justify-center rounded-md border border-gray-300 text-gray-800 hover:bg-gray-50"
                                aria-label="Previous day"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <input
                                type="date"
                                value={dailyDate}
                                onChange={(e) => setDailyDate(e.target.value)}
                                className={`${INPUT} h-10 w-[9.5rem] shrink-0`}
                            />
                            <button
                                type="button"
                                onClick={() => shiftDay(1)}
                                className="flex h-10 w-9 shrink-0 items-center justify-center rounded-md border border-gray-300 text-gray-800 hover:bg-gray-50"
                                aria-label="Next day"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setDailyDate(today)}
                                className="h-10 shrink-0 rounded-md border border-[#0a2a5e]/20 bg-[#0a2a5e]/5 px-3 text-xs font-semibold text-[#0a2a5e] hover:bg-[#0a2a5e]/10"
                            >
                                Today
                            </button>
                        </div>
                        {toolbarControls}
                        <button
                            type="button"
                            onClick={() => void loadDaily()}
                            disabled={dailyLoading}
                            className={BTN_ACTION}
                        >
                            {dailyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            Refresh
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                            { label: "Present / Late", value: dailyStats.present, color: "text-emerald-700" },
                            { label: "Absent", value: dailyStats.absent, color: "text-red-700" },
                            { label: "Late", value: dailyStats.late, color: "text-amber-700" },
                            { label: "Checked out", value: dailyStats.checkedOut, color: "text-[#0a2a5e]" },
                        ].map((s) => (
                            <div
                                key={s.label}
                                className="rounded-md border border-gray-100 bg-white p-4 shadow-sm"
                            >
                                <p className="text-xs font-bold uppercase tracking-wide text-gray-700">
                                    {s.label}
                                </p>
                                <p className={`mt-1 text-2xl font-black ${s.color}`}>{s.value}</p>
                                <p className="text-xs font-medium text-gray-600">of {dailyStats.total} active</p>
                            </div>
                        ))}
                    </div>

                    {dailyError && (
                        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {dailyError}
                        </div>
                    )}

                    <div className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1000px] text-left">
                                <thead>
                                    <tr>
                                        <th className={TH}>Employee</th>
                                        <th className={TH}>Dept. / Designation</th>
                                        <th className={TH}>Check in</th>
                                        <th className={TH}>Check out</th>
                                        <th className={TH}>Working hours</th>
                                        <th className={TH}>Status</th>
                                        <th className={TH_CENTER}>Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {dailyLoading ? (
                                        <tr>
                                            <td colSpan={7} className={`${TD} py-16 text-center ${TD_MUTED}`}>
                                                <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#0a2a5e]" />
                                                <p className="mt-2 text-sm font-medium">Loading daily attendance…</p>
                                            </td>
                                        </tr>
                                    ) : filteredDaily.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className={`${TD} py-14 text-center ${TD_MUTED}`}>
                                                No employees found.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredDaily.map((row, idx) => (
                                            <tr
                                                key={row.employeeId}
                                                className={`hover:bg-[#06b6d4]/8 ${idx % 2 === 1 ? "bg-gray-50/70" : "bg-white"}`}
                                            >
                                                <td className={TD}>
                                                    <p className="font-bold text-gray-900">{row.fullName}</p>
                                                    <p className="text-xs font-semibold text-gray-600">{row.employeeId}</p>
                                                </td>
                                                <td className={`${TD} font-medium text-gray-900`}>
                                                    {formatDeptDesignation(row.department, row.designation) || (
                                                        <span className={EMPTY}>—</span>
                                                    )}
                                                </td>
                                                <td className={TD}>
                                                    <PunchTimePhoto
                                                        proof={row.checkInProof}
                                                        variant="in"
                                                        employeeName={row.fullName}
                                                        onOpenDetail={(proof, label) =>
                                                            openPunchDetail(row.fullName, label, "in", proof)
                                                        }
                                                    />
                                                </td>
                                                <td className={TD}>
                                                    <PunchTimePhoto
                                                        proof={row.checkOutProof}
                                                        variant="out"
                                                        employeeName={row.fullName}
                                                        onOpenDetail={(proof, label) =>
                                                            openPunchDetail(row.fullName, label, "out", proof)
                                                        }
                                                    />
                                                </td>
                                                <td className={`${TD} font-bold tabular-nums`}>
                                                    {row.hours ?? <span className={EMPTY}>—</span>}
                                                </td>
                                                <td className={TD}>
                                                    <StatusBadge status={row.status} note={row.note} />
                                                </td>
                                                <td className={`${TD} text-center`}>
                                                    {row.status === "weekend" ? (
                                                        <span className={`${EMPTY} text-xs`}>Off day</span>
                                                    ) : (
                                                        <div className="flex items-center justify-center gap-2">
                                                            {row.canMarkPresent && (
                                                                <button
                                                                    type="button"
                                                                    disabled={markingKey === `${row.employeeId}-${dailyDate}`}
                                                                    onClick={() =>
                                                                        setMarkTarget({
                                                                            employeeId: row.employeeId,
                                                                            name: row.fullName,
                                                                        })
                                                                    }
                                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#06b6d4] text-white shadow-sm hover:bg-[#05a8b8] disabled:opacity-60 transition-colors"
                                                                    title="Mark Present"
                                                                >
                                                                    {markingKey === `${row.employeeId}-${dailyDate}` ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <UserCheck className="h-4 w-4" />
                                                                    )}
                                                                </button>
                                                            )}
                                                            {row.canMarkAbsent && (
                                                                <button
                                                                    type="button"
                                                                    disabled={markingKey === `${row.employeeId}-${dailyDate}`}
                                                                    onClick={() =>
                                                                        setMarkAbsentTarget({
                                                                            employeeId: row.employeeId,
                                                                            name: row.fullName,
                                                                        })
                                                                    }
                                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 text-white shadow-sm hover:bg-rose-700 disabled:opacity-60 transition-colors"
                                                                    title="Mark Absent"
                                                                >
                                                                    {markingKey === `${row.employeeId}-${dailyDate}` ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <UserX className="h-4 w-4" />
                                                                    )}
                                                                </button>
                                                            )}
                                                            <button
                                                                type="button"
                                                                disabled={markingKey === `${row.employeeId}-${dailyDate}`}
                                                                onClick={() =>
                                                                    setUpdateTarget({
                                                                        employeeId: row.employeeId,
                                                                        name: row.fullName,
                                                                        checkInTime: time12hTo24h(row.checkIn),
                                                                        checkOutTime: time12hTo24h(row.checkOut),
                                                                        checkInAddress: row.checkInProof?.address ?? "",
                                                                        checkOutAddress: row.checkOutProof?.address ?? "",
                                                                        note: "",
                                                                    })
                                                                }
                                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 disabled:opacity-60 transition-colors"
                                                                title="Update Time & Location"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setViewDetailTarget(row)}
                                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#0a2a5e]/20 bg-[#0a2a5e]/5 text-[#0a2a5e] shadow-sm hover:bg-[#0a2a5e] hover:text-white transition-colors group"
                                                                title="View All Details"
                                                            >
                                                                <Eye className="h-4 w-4 text-[#0a2a5e] group-hover:text-white" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Monthly tab */}
            {tab === "monthly" && (
                <div className="space-y-4">
                    <div className={TOOLBAR}>
                        <div className="flex shrink-0 items-center gap-2">
                            <button
                                type="button"
                                onClick={() => shiftMonth(-1)}
                                className="flex h-10 w-9 shrink-0 items-center justify-center rounded-md border border-gray-300 text-gray-800 hover:bg-gray-50"
                                aria-label="Previous month"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <input
                                type="month"
                                value={monthInputValue}
                                onChange={(e) => {
                                    const [y, m] = e.target.value.split("-").map(Number);
                                    if (y && m) {
                                        setViewYear(y);
                                        setViewMonth(m);
                                    }
                                }}
                                className={`${INPUT} h-10 w-[9.5rem] shrink-0`}
                                aria-label="Month"
                            />
                            <button
                                type="button"
                                onClick={() => shiftMonth(1)}
                                className="flex h-10 w-9 shrink-0 items-center justify-center rounded-md border border-gray-300 text-gray-800 hover:bg-gray-50"
                                aria-label="Next month"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                        {toolbarControls}
                        <button
                            type="button"
                            onClick={() => void loadMonthly()}
                            disabled={monthlyLoading}
                            className={BTN_ACTION}
                        >
                            {monthlyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            Refresh
                        </button>
                    </div>

                    {monthlyError && (
                        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {monthlyError}
                        </div>
                    )}

                    <div className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-left">
                                <thead>
                                    <tr>
                                        <th className={TH}>Employee</th>
                                        <th className={TH}>Department</th>
                                        <th className={`${TH_CENTER} text-emerald-800`}>Present</th>
                                        <th className={`${TH_CENTER} text-amber-800`}>Late</th>
                                        <th className={`${TH_CENTER} text-red-800`}>Absent</th>
                                        <th className={`${TH_CENTER} text-blue-800`}>Leave</th>
                                        <th className={`${TH_CENTER} text-violet-800`}>Half day</th>
                                        <th className={`${TH_CENTER} text-[#0a2a5e]`}>Total working days</th>
                                        <th className={`${TH_CENTER} text-gray-700`}>Week off</th>
                                        <th className={`${TH_CENTER} text-purple-800`}>Holiday</th>
                                        <th className={`${TH_CENTER} text-teal-800`}>Total present</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {monthlyLoading ? (
                                        <tr>
                                            <td colSpan={11} className={`${TD} py-14 text-center ${TD_MUTED}`}>
                                                <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                            </td>
                                        </tr>
                                    ) : filteredMonthly.length === 0 ? (
                                        <tr>
                                            <td colSpan={11} className={`${TD} py-14 text-center ${TD_MUTED}`}>
                                                No data for this month.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredMonthly.map((row, idx) => (
                                            <tr
                                                key={row.employeeId}
                                                className={`cursor-pointer hover:bg-[#06b6d4]/8 ${idx % 2 === 1 ? "bg-gray-50/70" : "bg-white"}`}
                                                onClick={() => {
                                                    setSelectedEmployeeId(row.employeeId);
                                                    setTab("employee");
                                                }}
                                            >
                                                <td className={TD}>
                                                    <p className="font-bold text-gray-900">{row.fullName}</p>
                                                    <p className="text-xs font-semibold text-gray-600">{row.employeeId}</p>
                                                </td>
                                                <td className={`${TD} font-medium`}>
                                                    {row.department || <span className={EMPTY}>—</span>}
                                                </td>
                                                <td className={`${TD} text-center text-lg font-black text-emerald-800`}>
                                                    {row.present}
                                                </td>
                                                <td className={`${TD} text-center text-lg font-black text-amber-800`}>
                                                    {row.late}
                                                </td>
                                                <td className={`${TD} text-center text-lg font-black text-red-800`}>
                                                    {row.absent}
                                                </td>
                                                <td className={`${TD} text-center text-lg font-black text-blue-800`}>
                                                    {row.leave}
                                                </td>
                                                <td className={`${TD} text-center text-lg font-black text-violet-800`}>
                                                    {row.halfDay}
                                                </td>
                                                <td className={`${TD} text-center text-lg font-black text-[#0a2a5e]`}>
                                                    {row.totalWorkingDaysInMonth}
                                                </td>
                                                <td className={`${TD} text-center text-lg font-black text-gray-700`}>
                                                    {row.weekOff}
                                                </td>
                                                <td className={`${TD} text-center text-lg font-black text-purple-800`}>
                                                    {row.holiday ?? 0}
                                                </td>
                                                <td className={`${TD} text-center text-lg font-black text-teal-800`}>
                                                    {row.totalPresent}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <p className="border-t border-gray-100 px-4 py-2 text-xs text-gray-700">
                            Click a row to open employee-wise detail.
                            {viewYear === new Date().getFullYear() &&
                                viewMonth === new Date().getMonth() + 1 ? (
                                <>
                                    {" "}
                                    Present, absent, and total present are counted from month start
                                    through today; total working days and week off are for the full
                                    month (per shift schedule).
                                </>
                            ) : null}
                        </p>
                    </div>
                </div>
            )}

            {/* Employee-wise tab */}
            {tab === "employee" && (
                <div className="space-y-4">
                    <div className={TOOLBAR}>
                        <select
                            value={selectedEmployeeId}
                            onChange={(e) => setSelectedEmployeeId(e.target.value)}
                            aria-label="Employee"
                            className={`${INPUT} h-10 min-w-0 flex-[1.1] truncate text-xs sm:text-sm`}
                        >
                            {employees.map((e) => (
                                <option key={e.employee_id} value={e.employee_id}>
                                    {e.full_name} ({e.employee_id})
                                </option>
                            ))}
                        </select>
                        <input
                            type="month"
                            value={monthInputValue}
                            onChange={(e) => {
                                const [y, m] = e.target.value.split("-").map(Number);
                                if (y && m) {
                                    setViewYear(y);
                                    setViewMonth(m);
                                }
                            }}
                            aria-label="Month"
                            className={`${INPUT} h-10 w-[9.5rem] shrink-0`}
                        />
                        {toolbarControls}
                        <button
                            type="button"
                            onClick={() => void loadEmployeeMonthly()}
                            disabled={employeeLoading}
                            className={BTN_ACTION}
                        >
                            {employeeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            Load
                        </button>
                    </div>

                    {employeeMeta && (
                        <div
                            className="rounded-md border border-gray-100 p-4 text-white shadow-sm sm:p-5"
                            style={{
                                background:
                                    "linear-gradient(135deg, #06124f 0%, #0a2a5e 55%, #0d3a7a 100%)",
                            }}
                        >
                            <p className="text-xs font-bold uppercase tracking-wider text-white/90">
                                {formatMonthLabel(viewYear, viewMonth)}
                            </p>
                            <h2 className="text-xl font-bold text-white">{employeeMeta.fullName}</h2>
                            <p className="text-sm font-medium text-white/90">
                                {selectedEmployeeId} · {employeeMeta.department || "—"} ·{" "}
                                {employeeMeta.designation || "—"}
                            </p>
                            {employeeShift ? (
                                <div className="mt-4 rounded-md border border-white/15 bg-white/10 p-3 sm:p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                                                Shift schedule (attendance follows these working days)
                                            </p>
                                            <p className="mt-1 text-sm font-semibold text-white">
                                                {employeeShift.configured
                                                    ? `${employeeShift.startTime} – ${employeeShift.endTime}`
                                                    : "No shift assigned — using Mon–Fri default"}
                                                {employeeShift.configured && employeeShift.graceMinutes > 0
                                                    ? ` · ${employeeShift.graceMinutes}m grace`
                                                    : ""}
                                            </p>
                                            <div className="mt-2">
                                                <WorkingDaysPills days={employeeShift.workingDays} />
                                            </div>
                                            {!employeeShift.configured ? (
                                                <p className="mt-2 text-xs text-amber-200">
                                                    Assign a shift on the Emp. Shift page to match this
                                                    calendar to the employee&apos;s real working week.
                                                </p>
                                            ) : null}
                                        </div>
                                        <Link
                                            href="/admin-dashboard/shift"
                                            className="inline-flex shrink-0 items-center justify-center rounded-md border border-white/25 bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/20"
                                        >
                                            Edit shift
                                        </Link>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    )}

                    {employeeError && (
                        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {employeeError}
                        </div>
                    )}

                    <div className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
                        <table className="w-full min-w-[760px] text-left">
                            <thead>
                                <tr>
                                    <th className={TH}>Date</th>
                                    <th className={TH}>Status</th>
                                    <th className={`${TH} text-center`}>Work entries</th>
                                    <th className={TH}>Check in</th>
                                    <th className={TH}>Check out</th>
                                    <th className={TH}>Working hours</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {employeeLoading ? (
                                    <tr>
                                        <td colSpan={6} className={`${TD} py-14 text-center ${TD_MUTED}`}>
                                            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                        </td>
                                    </tr>
                                ) : employeeRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className={`${TD} py-14 text-center ${TD_MUTED}`}>
                                            No attendance records for this month.
                                        </td>
                                    </tr>
                                ) : (
                                    employeeRecords.map((row, idx) => (
                                        <tr
                                            key={row.date}
                                            className={`hover:bg-[#06b6d4]/8 ${idx % 2 === 1 ? "bg-gray-50/70" : "bg-white"}`}
                                        >
                                            <td className={`${TD} font-bold`}>{formatTableDate(row.date)}</td>
                                            <td className={TD}>
                                                <StatusBadge status={row.status} note={row.note} />
                                            </td>
                                            <td className={`${TD} text-center`}>
                                                {(row.workEntryCount ?? 0) > 0 ? (
                                                    <Link
                                                        href={`/admin-dashboard/work-entries?month=${monthInputValue}&employeeId=${encodeURIComponent(selectedEmployeeId)}`}
                                                        className="inline-flex min-w-[2rem] items-center justify-center rounded-full bg-[#0a2a5e]/10 px-2.5 py-1 text-xs font-bold tabular-nums text-[#0a2a5e] ring-1 ring-[#0a2a5e]/15 hover:bg-[#0a2a5e]/15"
                                                    >
                                                        {row.workEntryCount}
                                                    </Link>
                                                ) : (
                                                    <span className={EMPTY}>—</span>
                                                )}
                                            </td>
                                            <td className={TD}>
                                                <PunchTimePhoto
                                                    proof={
                                                        row.checkInProof ??
                                                        (row.checkIn
                                                            ? { time: row.checkIn }
                                                            : undefined)
                                                    }
                                                    variant="in"
                                                    employeeName={employeeMeta?.fullName ?? selectedEmployeeId}
                                                    onOpenDetail={(proof, label) =>
                                                        openPunchDetail(
                                                            employeeMeta?.fullName ?? selectedEmployeeId,
                                                            label,
                                                            "in",
                                                            proof,
                                                        )
                                                    }
                                                />
                                            </td>
                                            <td className={TD}>
                                                <PunchTimePhoto
                                                    proof={
                                                        row.checkOutProof ??
                                                        (row.checkOut
                                                            ? { time: row.checkOut }
                                                            : undefined)
                                                    }
                                                    variant="out"
                                                    employeeName={employeeMeta?.fullName ?? selectedEmployeeId}
                                                    onOpenDetail={(proof, label) =>
                                                        openPunchDetail(
                                                            employeeMeta?.fullName ?? selectedEmployeeId,
                                                            label,
                                                            "out",
                                                            proof,
                                                        )
                                                    }
                                                />
                                            </td>
                                            <td className={`${TD} font-bold tabular-nums`}>
                                                {row.hours ?? <span className={EMPTY}>—</span>}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Mark present modal */}
            {markTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-md bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-gray-900">Mark as present</h3>
                        <p className="mt-1 text-sm font-medium text-gray-800">
                            <strong className="text-gray-900">{markTarget.name}</strong> ({markTarget.employeeId}) on{" "}
                            {new Date(dailyDate + "T12:00:00").toLocaleDateString("en-IN", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                            })}
                        </p>
                        <label className="mt-4 block text-xs font-bold text-gray-800">
                            Note (optional)
                        </label>
                        <textarea
                            value={markNote}
                            onChange={(e) => setMarkNote(e.target.value)}
                            rows={2}
                            placeholder="Reason for manual present mark…"
                            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 placeholder:text-gray-600 outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/30"
                        />
                        <div className="mt-5 flex gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setMarkTarget(null);
                                    setMarkNote("");
                                }}
                                className="flex-1 rounded-md border border-gray-200 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => void handleMarkPresent()}
                                disabled={Boolean(markingKey)}
                                className="flex flex-1 items-center justify-center gap-2 rounded-md bg-[#06b6d4] py-2.5 text-sm font-bold text-white hover:bg-[#05a8b8] disabled:opacity-60"
                            >
                                {markingKey ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Check className="h-4 w-4" />
                                )}
                                Confirm present
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mark absent modal */}
            {markAbsentTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-md bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-gray-900">Mark as absent</h3>
                        <p className="mt-1 text-sm font-medium text-gray-800">
                            <strong className="text-gray-900">{markAbsentTarget.name}</strong> ({markAbsentTarget.employeeId}) on{" "}
                            {new Date(dailyDate + "T12:00:00").toLocaleDateString("en-IN", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                            })}
                        </p>
                        <label className="mt-4 block text-xs font-bold text-gray-800">
                            Note (optional)
                        </label>
                        <textarea
                            value={markAbsentNote}
                            onChange={(e) => setMarkAbsentNote(e.target.value)}
                            rows={2}
                            placeholder="Reason for manual absent mark…"
                            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 placeholder:text-gray-600 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30"
                        />
                        <div className="mt-5 flex gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setMarkAbsentTarget(null);
                                    setMarkAbsentNote("");
                                }}
                                className="flex-1 rounded-md border border-gray-200 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => void handleMarkAbsent()}
                                disabled={Boolean(markingKey)}
                                className="flex flex-1 items-center justify-center gap-2 rounded-md bg-rose-600 py-2.5 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60"
                            >
                                {markingKey ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Check className="h-4 w-4" />
                                )}
                                Confirm absent
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Update time & location modal */}
            {updateTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Update Attendance</h3>
                                <p className="text-xs font-semibold text-gray-600">
                                    <strong className="text-gray-900">{updateTarget.name}</strong> ({updateTarget.employeeId}) · {dailyDateLabel}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setUpdateTarget(null)}
                                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mt-4 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="update-checkin-time" className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                                        Check In Time
                                    </label>
                                    <input
                                        id="update-checkin-time"
                                        type="time"
                                        value={updateTarget.checkInTime}
                                        onChange={(e) => setUpdateTarget({ ...updateTarget, checkInTime: e.target.value })}
                                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-900 focus:border-[#0a2a5e] focus:outline-none focus:ring-1 focus:ring-[#0a2a5e]"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="update-checkout-time" className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                                        Check Out Time
                                    </label>
                                    <input
                                        id="update-checkout-time"
                                        type="time"
                                        value={updateTarget.checkOutTime}
                                        onChange={(e) => setUpdateTarget({ ...updateTarget, checkOutTime: e.target.value })}
                                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-900 focus:border-[#0a2a5e] focus:outline-none focus:ring-1 focus:ring-[#0a2a5e]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="update-checkin-address" className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                                    Check In Location / Address
                                </label>
                                <input
                                    id="update-checkin-address"
                                    type="text"
                                    value={updateTarget.checkInAddress}
                                    onChange={(e) => setUpdateTarget({ ...updateTarget, checkInAddress: e.target.value })}
                                    placeholder="e.g. Head Office, Sector 62, Noida"
                                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 focus:border-[#0a2a5e] focus:outline-none focus:ring-1 focus:ring-[#0a2a5e]"
                                />
                            </div>

                            <div>
                                <label htmlFor="update-checkout-address" className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                                    Check Out Location / Address (Optional)
                                </label>
                                <input
                                    id="update-checkout-address"
                                    type="text"
                                    value={updateTarget.checkOutAddress}
                                    onChange={(e) => setUpdateTarget({ ...updateTarget, checkOutAddress: e.target.value })}
                                    placeholder="e.g. Head Office, Sector 62, Noida"
                                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 focus:border-[#0a2a5e] focus:outline-none focus:ring-1 focus:ring-[#0a2a5e]"
                                />
                            </div>

                            <div>
                                <label htmlFor="update-reason-note" className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                                    Admin Note / Reason (Optional)
                                </label>
                                <input
                                    id="update-reason-note"
                                    type="text"
                                    value={updateTarget.note}
                                    onChange={(e) => setUpdateTarget({ ...updateTarget, note: e.target.value })}
                                    placeholder="e.g. Manual time correction"
                                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 focus:border-[#0a2a5e] focus:outline-none focus:ring-1 focus:ring-[#0a2a5e]"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-2.5 border-t border-gray-100 pt-4">
                            <button
                                type="button"
                                onClick={() => setUpdateTarget(null)}
                                className="rounded-md border border-gray-300 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={Boolean(markingKey)}
                                onClick={() => void handleUpdateRecord()}
                                className="inline-flex items-center gap-1.5 rounded-md bg-[#0a2a5e] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#071f47] disabled:opacity-60"
                            >
                                {markingKey ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View full attendance details modal */}
            {viewDetailTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl">
                        {/* Modal Header */}
                        <div
                            className="flex items-center justify-between px-6 py-4 text-white"
                            style={{
                                background: "linear-gradient(135deg, #06124f 0%, #0a2a5e 55%, #0d3a7a 100%)",
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-lg font-bold text-white shadow-inner">
                                    {viewDetailTarget.fullName.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">{viewDetailTarget.fullName}</h3>
                                    <p className="text-xs font-medium text-white/80">
                                        {viewDetailTarget.employeeId} · {viewDetailTarget.department || "General"} · {viewDetailTarget.designation || "Employee"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <StatusBadge status={viewDetailTarget.status} />
                                <button
                                    type="button"
                                    onClick={() => setViewDetailTarget(null)}
                                    className="rounded-full p-1.5 text-white/80 hover:bg-white/20 hover:text-white"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="max-h-[75vh] overflow-y-auto p-6 space-y-6">
                            {/* Summary Bar */}
                            <div className="grid grid-cols-3 gap-3 rounded-lg border border-gray-100 bg-gray-50/80 p-3.5 text-center">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Date</p>
                                    <p className="mt-0.5 text-sm font-bold text-gray-900">{formatTableDate(viewDetailTarget.date)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Working Hours</p>
                                    <p className="mt-0.5 text-sm font-black text-[#0a2a5e]">{viewDetailTarget.hours ?? "—"}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Work Entries</p>
                                    <p className="mt-0.5 text-sm font-bold text-emerald-700">
                                        {viewDetailTarget.workEntryCount ?? 0} entries
                                    </p>
                                </div>
                            </div>

                            {/* Check-in & Check-out Cards */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {/* Check-In Card */}
                                <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-4">
                                    <div className="flex items-center justify-between border-b border-emerald-100/60 pb-2.5">
                                        <div className="flex items-center gap-2">
                                            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">Check In</h4>
                                        </div>
                                        <span className="text-xs font-black text-emerald-700">{viewDetailTarget.checkIn || "Not checked in"}</span>
                                    </div>

                                    <div className="mt-3 space-y-3">
                                        {viewDetailTarget.checkInProof?.photoUrl ? (
                                            <div className="flex justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() => setPhotoLightbox({ src: viewDetailTarget.checkInProof!.photoUrl!, alt: `${viewDetailTarget.fullName} Check In` })}
                                                    className="group relative overflow-hidden rounded-lg border-2 border-emerald-200 shadow-sm transition hover:border-emerald-500"
                                                >
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={viewDetailTarget.checkInProof.photoUrl}
                                                        alt="Check In Photo"
                                                        className="h-28 w-28 object-cover transition duration-200 group-hover:scale-105"
                                                    />
                                                    <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition">
                                                        <Search className="h-5 w-5 text-white" />
                                                    </span>
                                                </button>
                                            </div>
                                        ) : null}

                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Location Address</p>
                                            <p className="mt-1 text-xs font-medium text-gray-800 leading-relaxed">
                                                {viewDetailTarget.checkInProof?.address || viewDetailTarget.note || "Location not recorded"}
                                            </p>
                                        </div>

                                        {viewDetailTarget.checkInProof?.latitude != null && (
                                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600">
                                                <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                                                <span>
                                                    Lat: {viewDetailTarget.checkInProof.latitude}, Long: {viewDetailTarget.checkInProof.longitude}
                                                    {viewDetailTarget.checkInProof.accuracy != null ? ` (±${viewDetailTarget.checkInProof.accuracy}m)` : ""}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Check-Out Card */}
                                <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-4">
                                    <div className="flex items-center justify-between border-b border-blue-100/60 pb-2.5">
                                        <div className="flex items-center gap-2">
                                            <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500" />
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">Check Out</h4>
                                        </div>
                                        <span className="text-xs font-black text-blue-700">{viewDetailTarget.checkOut || "Not checked out"}</span>
                                    </div>

                                    <div className="mt-3 space-y-3">
                                        {viewDetailTarget.checkOutProof?.photoUrl ? (
                                            <div className="flex justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() => setPhotoLightbox({ src: viewDetailTarget.checkOutProof!.photoUrl!, alt: `${viewDetailTarget.fullName} Check Out` })}
                                                    className="group relative overflow-hidden rounded-lg border-2 border-blue-200 shadow-sm transition hover:border-blue-500"
                                                >
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={viewDetailTarget.checkOutProof.photoUrl}
                                                        alt="Check Out Photo"
                                                        className="h-28 w-28 object-cover transition duration-200 group-hover:scale-105"
                                                    />
                                                    <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition">
                                                        <Search className="h-5 w-5 text-white" />
                                                    </span>
                                                </button>
                                            </div>
                                        ) : null}

                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Location Address</p>
                                            <p className="mt-1 text-xs font-medium text-gray-800 leading-relaxed">
                                                {viewDetailTarget.checkOutProof?.address || "Location not recorded"}
                                            </p>
                                        </div>

                                        {viewDetailTarget.checkOutProof?.latitude != null && (
                                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600">
                                                <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                                                <span>
                                                    Lat: {viewDetailTarget.checkOutProof.latitude}, Long: {viewDetailTarget.checkOutProof.longitude}
                                                    {viewDetailTarget.checkOutProof.accuracy != null ? ` (±${viewDetailTarget.checkOutProof.accuracy}m)` : ""}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Note & Remarks */}
                            {viewDetailTarget.note && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3.5">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-900">Notes / System Remarks</p>
                                    <p className="mt-1 text-xs font-semibold text-amber-800">{viewDetailTarget.note}</p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-3.5">
                            <Link
                                href={`/admin-dashboard/work-entries?month=${monthInputValue}&employeeId=${encodeURIComponent(viewDetailTarget.employeeId)}`}
                                className="text-xs font-bold text-[#06b6d4] hover:underline"
                            >
                                View Employee Work Entries &rarr;
                            </Link>
                            <button
                                type="button"
                                onClick={() => setViewDetailTarget(null)}
                                className="rounded-md bg-[#0a2a5e] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#071f47]"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {punchDetail && (
                <PunchProofModal
                    open
                    onClose={() => setPunchDetail(null)}
                    employeeName={punchDetail.employeeName}
                    label={punchDetail.label}
                    variant={punchDetail.variant}
                    proof={punchDetail.proof}
                    onPhotoZoom={(src, alt) => setPhotoLightbox({ src, alt })}
                />
            )}

            <PhotoLightbox
                open={Boolean(photoLightbox)}
                src={photoLightbox?.src ?? null}
                alt={photoLightbox?.alt}
                onClose={() => setPhotoLightbox(null)}
            />
        </div>
    );
}

export default function AdminEmployeeAttendancePage() {
    return (
        <Suspense
            fallback={
                <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-gray-500">
                    Loading attendance…
                </div>
            }
        >
            <AdminEmployeeAttendancePageContent />
        </Suspense>
    );
}
