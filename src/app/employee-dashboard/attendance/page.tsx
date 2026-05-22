"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Calendar,
    Camera,
    ChevronLeft,
    ChevronRight,
    Clock,
    FileText,
    LogIn,
    LogOut,
    MapPin,
    TrendingUp,
} from "lucide-react";
import Link from "next/link";
import AttendancePunchModal, { type PunchCapture } from "@/components/employee-dashboard/AttendancePunchModal";
import PhotoLightbox from "@/components/employee-dashboard/PhotoLightbox";

type AttendanceStatus =
    | "present"
    | "absent"
    | "late"
    | "leave"
    | "leave-pending"
    | "holiday"
    | "weekend"
    | "half-day";

type LeaveRequestStatus = "pending" | "l1_approved" | "approved";

type PunchProof = {
    time?: string;
    photoUrl?: string;
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    address?: string;
};

type DayRecord = {
    date: string;
    status: AttendanceStatus;
    checkIn?: string;
    checkOut?: string;
    hours?: string;
    note?: string;
    checkInProof?: PunchProof;
    checkOutProof?: PunchProof;
    leaveRequestStatus?: LeaveRequestStatus | "rejected" | "cancelled";
};

type TodayLeaveInfo = {
    blocking: boolean;
    status: LeaveRequestStatus;
    policyName: string;
    requestId: string;
    dayType: "full" | "first-half" | "second-half";
    message: string;
};

const STATUS_CONFIG: Record<
    AttendanceStatus,
    { label: string; dot: string; bg: string; text: string }
> = {
    present: { label: "Present", dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700" },
    absent: { label: "Absent", dot: "bg-red-500", bg: "bg-red-50", text: "text-red-700" },
    late: { label: "Late", dot: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700" },
    leave: { label: "Leave", dot: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-700" },
    "leave-pending": {
        label: "Leave (pending)",
        dot: "bg-indigo-400",
        bg: "bg-indigo-50",
        text: "text-indigo-700",
    },
    holiday: { label: "Holiday", dot: "bg-purple-500", bg: "bg-purple-50", text: "text-purple-700" },
    weekend: { label: "Weekend", dot: "bg-gray-400", bg: "bg-gray-100", text: "text-gray-600" },
    "half-day": { label: "Half day", dot: "bg-teal-500", bg: "bg-teal-50", text: "text-teal-700" },
};

function formatMonthLabel(year: number, month: number) {
    return new Date(year, month, 1).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
    });
}

function formatLogTableDate(date: string) {
    return new Date(date + "T12:00:00").toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function formatLogTableDay(date: string) {
    return new Date(date + "T12:00:00").toLocaleDateString("en-IN", { weekday: "long" });
}

function formatLogMobileDate(date: string) {
    const d = new Date(date + "T12:00:00");
    const weekday = d.toLocaleDateString("en-IN", { weekday: "short" });
    const day = d.getDate();
    const month = d.toLocaleDateString("en-IN", { month: "short" });
    const year = d.getFullYear();
    return `${weekday}, ${day} ${month}, ${year}`;
}

function AttendanceLogPhoto({
    proof,
    label,
    variant,
    size = "md",
    onPhotoClick,
}: {
    proof?: PunchProof;
    label: string;
    variant: "in" | "out";
    size?: "sm" | "md";
    onPhotoClick?: (src: string, alt: string) => void;
}) {
    if (!proof?.photoUrl) {
        return <span className="text-gray-400">—</span>;
    }

    const ringClass = variant === "in" ? "ring-[#06b6d4]" : "ring-[#0a2a5e]";
    const sizeClass = size === "sm" ? "h-11 w-11" : "h-10 w-10";

    return (
        <button
            type="button"
            onClick={() => onPhotoClick?.(proof.photoUrl!, `${label} selfie`)}
            className={`group block shrink-0 overflow-hidden rounded-full ring-2 ${ringClass} ring-offset-2 transition hover:ring-offset-1 focus:outline-none focus:ring-2 focus:ring-[#06b6d4] focus:ring-offset-2 ${sizeClass}`}
            aria-label={`View full ${label} photo`}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={proof.photoUrl}
                alt={`${label} selfie`}
                className="h-full w-full cursor-zoom-in object-cover transition group-hover:scale-105"
                style={{ transform: "scaleX(-1)" }}
            />
        </button>
    );
}

function StatusBadge({ status }: { status: AttendanceStatus }) {
    const c = STATUS_CONFIG[status];
    return (
        <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${c.bg} ${c.text}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
            {c.label}
        </span>
    );
}

function AttendanceLogMobileRow({
    row,
    onPhotoClick,
}: {
    row: DayRecord;
    onPhotoClick?: (src: string, alt: string) => void;
}) {
    const hasCheckInPhoto = Boolean(row.checkInProof?.photoUrl);
    const hasCheckOutPhoto = Boolean(row.checkOutProof?.photoUrl);

    return (
        <article className="flex gap-3 px-4 py-4">
            <div className="flex shrink-0 flex-col items-center gap-2 pt-0.5">
                {hasCheckInPhoto ? (
                    <AttendanceLogPhoto
                        proof={row.checkInProof}
                        label="Check-in"
                        variant="in"
                        size="sm"
                        onPhotoClick={onPhotoClick}
                    />
                ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-gray-200 bg-gray-50">
                        <Camera className="h-4 w-4 text-gray-300" aria-hidden />
                    </div>
                )}
                {hasCheckOutPhoto && (
                    <AttendanceLogPhoto
                        proof={row.checkOutProof}
                        label="Check-out"
                        variant="out"
                        size="sm"
                        onPhotoClick={onPhotoClick}
                    />
                )}
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold leading-snug text-gray-900">
                        {formatLogMobileDate(row.date)}
                    </p>
                    <StatusBadge status={row.status} />
                </div>

                {row.note && (
                    <p className="mt-1 text-[11px] font-medium leading-snug text-amber-700">{row.note}</p>
                )}

                <div className="mt-2.5 flex flex-wrap gap-2">
                    {row.checkInProof?.time ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#06b6d4]/15 px-2.5 py-1 text-xs font-semibold text-[#058a9a]">
                            <LogIn className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            {row.checkInProof.time}
                        </span>
                    ) : null}
                    {row.checkOutProof?.time ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#0a2a5e]/10 px-2.5 py-1 text-xs font-semibold text-[#0a2a5e]">
                            <LogOut className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            {row.checkOutProof.time}
                        </span>
                    ) : null}
                </div>
            </div>
        </article>
    );
}

function PunchEvidenceCard({
    label,
    capture,
    onPhotoClick,
}: {
    label: string;
    capture: PunchCapture;
    onPhotoClick?: (src: string, alt: string) => void;
}) {
    const { location } = capture;
    return (
        <div className="rounded-xl bg-white/10 border border-white/15 p-3">
            <div className="flex items-center gap-2 mb-2">
                <Camera className="h-3.5 w-3.5 text-white/70" aria-hidden />
                <p className="text-[10px] font-bold uppercase tracking-wide text-white/60">{label}</p>
            </div>
            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={() => onPhotoClick?.(capture.photoDataUrl, `${label} selfie`)}
                    className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-white/20 ring-offset-2 ring-offset-transparent transition hover:border-white/40 hover:ring-2 hover:ring-white/30 focus:outline-none focus:ring-2 focus:ring-[#06b6d4]"
                    aria-label={`View full ${label} photo`}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={capture.photoDataUrl}
                        alt={`${label} selfie`}
                        className="h-full w-full cursor-zoom-in object-cover transition group-hover:scale-105"
                        style={{ transform: "scaleX(-1)" }}
                    />
                </button>
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white">{capture.time}</p>
                    <p className="text-[11px] text-white/70 mt-1 line-clamp-2 leading-snug">
                        {location.address ??
                            `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`}
                    </p>
                    <p className="text-[10px] text-white/50 mt-0.5">±{location.accuracy}m accuracy</p>
                    <a
                        href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-semibold text-[#06b6d4] hover:underline mt-1 inline-block"
                    >
                        View on map
                    </a>
                </div>
            </div>
        </div>
    );
}

function formatLiveClock(date: Date) {
    return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

function formatTodayLabel(date: Date) {
    return date.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "short",
    });
}

function toIsoDate(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

type EmployeeShiftApi = {
    start_time: string;
    end_time: string;
    grace_minutes: number;
    working_days: number[];
    is_active: boolean;
};

function parseTime24ToMinutes(time24: string): number {
    const [h, m] = time24.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return 0;
    return h * 60 + m;
}

function parsePunchTime12ToMinutes(time12: string): number | null {
    const match = time12.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return null;
    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const period = match[3].toUpperCase();
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
}

function punchToMinutes(capture: PunchCapture): number | null {
    if (capture.punchedAt) {
        const d = new Date(capture.punchedAt);
        if (!Number.isNaN(d.getTime())) {
            return d.getHours() * 60 + d.getMinutes();
        }
    }
    return parsePunchTime12ToMinutes(capture.time);
}

function isWorkingDay(date: Date, workingDays: number[]) {
    if (!workingDays.length) return date.getDay() !== 0 && date.getDay() !== 6;
    return workingDays.includes(date.getDay());
}

export type LateCheckResult = {
    isLate: boolean;
    secondsLate: number;
    graceMinutes: number;
    shiftStartMinutes: number;
};

function formatDurationHms(totalSeconds: number) {
    const safe = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const seconds = safe % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function buildShiftDeadline(punchDate: Date, startTime24: string, graceMinutes: number) {
    const [h, m] = startTime24.split(":").map(Number);
    const deadline = new Date(punchDate);
    deadline.setHours(Number.isNaN(h) ? 9 : h, Number.isNaN(m) ? 0 : m, 0, 0);
    deadline.setMinutes(deadline.getMinutes() + graceMinutes);
    return deadline;
}

function diffSecondsBetweenPunches(checkIn: PunchCapture, checkOut: PunchCapture): number | null {
    if (checkIn.punchedAt && checkOut.punchedAt) {
        const start = new Date(checkIn.punchedAt);
        const end = new Date(checkOut.punchedAt);
        if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
            return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
        }
    }

    const inMins = punchToMinutes(checkIn);
    const outMins = punchToMinutes(checkOut);
    if (inMins === null || outMins === null) return null;
    let diffMins = outMins - inMins;
    if (diffMins < 0) diffMins += 24 * 60;
    return diffMins * 60;
}

function evaluateCheckInLate(
    capture: PunchCapture,
    shift: EmployeeShiftApi | null,
    onDate = new Date(),
): LateCheckResult {
    const graceMinutes = shift?.grace_minutes ?? 0;
    const shiftStartMinutes = shift ? parseTime24ToMinutes(shift.start_time) : 0;

    if (!shift?.is_active || !isWorkingDay(onDate, shift.working_days ?? [])) {
        return { isLate: false, secondsLate: 0, graceMinutes, shiftStartMinutes };
    }

    if (capture.punchedAt) {
        const punchAt = new Date(capture.punchedAt);
        if (!Number.isNaN(punchAt.getTime())) {
            const deadline = buildShiftDeadline(punchAt, shift.start_time, graceMinutes);
            const secondsLate = Math.max(0, Math.floor((punchAt.getTime() - deadline.getTime()) / 1000));
            return {
                isLate: secondsLate > 0,
                secondsLate,
                graceMinutes,
                shiftStartMinutes,
            };
        }
    }

    const punchMinutes = punchToMinutes(capture);
    if (punchMinutes === null) {
        return { isLate: false, secondsLate: 0, graceMinutes, shiftStartMinutes };
    }

    const allowedUntil = shiftStartMinutes + graceMinutes;
    const minutesLate = punchMinutes - allowedUntil;
    const secondsLate = Math.max(0, minutesLate) * 60;

    return {
        isLate: secondsLate > 0,
        secondsLate,
        graceMinutes,
        shiftStartMinutes,
    };
}

function formatTime12h(time24: string) {
    const [h, m] = time24.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return time24;
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function formatShiftRange(shift: EmployeeShiftApi) {
    return `${formatTime12h(shift.start_time)} – ${formatTime12h(shift.end_time)}`;
}

type TodaySessionApi = {
    record: DayRecord | null;
    checkedIn: boolean;
    checkIn: PunchCapture | null;
    checkOut: PunchCapture | null;
    late: LateCheckResult;
};

function normalizeLeaveDisplayStatus(record: DayRecord): DayRecord {
    if (
        record.leaveRequestStatus === "pending" ||
        record.leaveRequestStatus === "l1_approved"
    ) {
        if (record.status === "leave") {
            return { ...record, status: "leave-pending" };
        }
    }
    return record;
}

function mergeMonthWithWeekends(year: number, month: number, dbRecords: DayRecord[]): DayRecord[] {
    const map = new Map(dbRecords.map((r) => [r.date, r]));
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const merged: DayRecord[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
        const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const existing = map.get(iso);
        if (existing) {
            merged.push(normalizeLeaveDisplayStatus(existing));
            continue;
        }
        const dow = new Date(year, month, d).getDay();
        if (dow === 0 || dow === 6) {
            merged.push({ date: iso, status: "weekend" });
        }
    }

    return merged;
}

function applyTodaySession(
    today: TodaySessionApi,
    setters: {
        setCheckedIn: (v: boolean) => void;
        setCheckInCapture: (v: PunchCapture | null) => void;
        setCheckOutCapture: (v: PunchCapture | null) => void;
        setTodayLate: (v: LateCheckResult | null) => void;
    },
) {
    setters.setCheckedIn(today.checkedIn);
    setters.setCheckInCapture(today.checkIn);
    setters.setCheckOutCapture(today.checkOut);
    setters.setTodayLate(today.late.isLate || today.checkedIn ? today.late : null);
}

export default function EmployeeAttendancePage() {
    const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
    const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
    const [checkedIn, setCheckedIn] = useState(false);
    const [checkInCapture, setCheckInCapture] = useState<PunchCapture | null>(null);
    const [checkOutCapture, setCheckOutCapture] = useState<PunchCapture | null>(null);
    const [punchModal, setPunchModal] = useState<"check-in" | "check-out" | null>(null);
    const [currentTime, setCurrentTime] = useState("");
    const [todayLabel, setTodayLabel] = useState("");
    const [todayIso, setTodayIso] = useState("");
    const [employeeShift, setEmployeeShift] = useState<EmployeeShiftApi | null>(null);
    const [shiftLoading, setShiftLoading] = useState(true);
    const [monthRecords, setMonthRecords] = useState<DayRecord[]>([]);
    const [attendanceLoading, setAttendanceLoading] = useState(true);
    const [attendanceError, setAttendanceError] = useState("");
    const [isPunching, setIsPunching] = useState(false);
    const [todayLate, setTodayLate] = useState<LateCheckResult | null>(null);
    const [photoLightbox, setPhotoLightbox] = useState<{ src: string; alt: string } | null>(null);
    const [todayLeave, setTodayLeave] = useState<TodayLeaveInfo | null>(null);

    const openPhotoLightbox = (src: string, alt: string) => {
        setPhotoLightbox({ src, alt });
    };

    const workingDuration = useMemo(() => {
        if (!checkInCapture || !checkOutCapture) return "—";
        const seconds = diffSecondsBetweenPunches(checkInCapture, checkOutCapture);
        if (seconds === null) return "—";
        return formatDurationHms(seconds);
    }, [checkInCapture, checkOutCapture]);

    const lateDurationLabel = useMemo(() => {
        if (!todayLate?.isLate) return "";
        return formatDurationHms(todayLate.secondsLate);
    }, [todayLate]);

    const loadAttendance = async (year: number, monthIndex: number) => {
        try {
            setAttendanceLoading(true);
            setAttendanceError("");
            const apiMonth = monthIndex + 1;
            const resp = await fetch(
                `/api/employee/attendance?year=${year}&month=${apiMonth}`,
                { cache: "no-store" },
            );
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to load attendance");
            }

            const records: DayRecord[] = Array.isArray(data.records) ? data.records : [];
            setMonthRecords(records.map((r) => normalizeLeaveDisplayStatus(r as DayRecord)));
            setTodayLeave(
                data.todayLeave && typeof data.todayLeave === "object"
                    ? (data.todayLeave as TodayLeaveInfo)
                    : null,
            );

            if (data.shift) {
                setEmployeeShift(data.shift as EmployeeShiftApi);
            }
            setShiftLoading(false);

            if (data.today) {
                applyTodaySession(data.today as TodaySessionApi, {
                    setCheckedIn,
                    setCheckInCapture,
                    setCheckOutCapture,
                    setTodayLate,
                });
            }
        } catch (error) {
            console.error("Load attendance failed:", error);
            setAttendanceError(error instanceof Error ? error.message : "Failed to load attendance");
            setMonthRecords([]);
        } finally {
            setAttendanceLoading(false);
        }
    };

    const handlePunchConfirm = async (capture: PunchCapture) => {
        const mode = punchModal;
        if (!mode) return;

        try {
            setIsPunching(true);
            const resp = await fetch("/api/employee/attendance/punch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: mode,
                    time: capture.time,
                    punchedAt: capture.punchedAt,
                    photoDataUrl: capture.photoDataUrl,
                    location: capture.location,
                }),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to save punch");
            }

            if (data.today) {
                applyTodaySession(data.today as TodaySessionApi, {
                    setCheckedIn,
                    setCheckInCapture,
                    setCheckOutCapture,
                    setTodayLate,
                });
            }

            setPunchModal(null);
            await loadAttendance(viewYear, viewMonth);
        } catch (error) {
            console.error("Punch failed:", error);
            alert(error instanceof Error ? error.message : "Failed to save punch");
        } finally {
            setIsPunching(false);
        }
    };

    useEffect(() => {
        const tick = () => {
            const now = new Date();
            setCurrentTime(formatLiveClock(now));
            setTodayLabel(formatTodayLabel(now));
            setTodayIso(toIsoDate(now));
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        void loadAttendance(viewYear, viewMonth);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewYear, viewMonth]);

    const shiftTimingText = useMemo(() => {
        if (shiftLoading) return "Loading…";
        if (!employeeShift) return "Not assigned";
        const range = formatShiftRange(employeeShift);
        const grace =
            employeeShift.is_active && employeeShift.grace_minutes > 0
                ? ` · ${employeeShift.grace_minutes}m grace`
                : "";
        return employeeShift.is_active ? `${range}${grace}` : `${range} (inactive)`;
    }, [employeeShift, shiftLoading]);

    const stats = useMemo(() => {
        const working = monthRecords.filter(
            (r) => !["weekend", "holiday", "leave-pending"].includes(r.status),
        );
        return {
            present: working.filter((r) => r.status === "present" || r.status === "late").length,
            absent: working.filter((r) => r.status === "absent").length,
            late: working.filter((r) => r.status === "late").length,
            leave: working.filter((r) => r.status === "leave" || r.status === "half-day").length,
            leavePending: monthRecords.filter((r) => r.status === "leave-pending").length,
            total: working.length,
        };
    }, [monthRecords]);

    const tableRows = useMemo(
        () =>
            [...monthRecords]
                .filter(
                    (r) =>
                        r.status !== "weekend" &&
                        (r.checkIn ||
                            r.checkOut ||
                            r.status === "leave" ||
                            r.status === "half-day" ||
                            r.status === "leave-pending"),
                )
                .reverse(),
        [monthRecords],
    );

    const logStats = useMemo(() => {
        const working = monthRecords.filter((r) => !["weekend", "holiday"].includes(r.status));
        return {
            present: working.filter((r) => r.status === "present" || r.status === "late").length,
            absent: working.filter((r) => r.status === "absent").length,
            halfDay: working.filter((r) => r.status === "half-day").length,
            leave:
                working.filter((r) => r.status === "leave").length +
                working.filter((r) => r.status === "leave-pending").length,
        };
    }, [monthRecords]);

    const monthInputValue = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;

    const handleLogMonthChange = (value: string) => {
        const [y, m] = value.split("-").map(Number);
        if (y && m >= 1 && m <= 12) {
            setViewYear(y);
            setViewMonth(m - 1);
        }
    };

    const shiftMonth = (delta: number) => {
        const d = new Date(viewYear, viewMonth + delta, 1);
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
    };

    const calendarCells = useMemo(() => {
        const first = new Date(viewYear, viewMonth, 1);
        const startPad = first.getDay();
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        const cells: ({ pad: true } | { pad: false; day: number; record?: DayRecord })[] = [];

        for (let i = 0; i < startPad; i++) cells.push({ pad: true });
        for (let d = 1; d <= daysInMonth; d++) {
            const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            cells.push({ pad: false, day: d, record: monthRecords.find((r) => r.date === iso) });
        }
        return cells;
    }, [viewYear, viewMonth, monthRecords]);

    const weekdayLabels = ["S", "M", "T", "W", "T", "F", "S"];

    return (
        <div className="mx-auto w-full max-w-6xl space-y-4 pb-6 sm:space-y-6 sm:pb-8 [-webkit-tap-highlight-color:transparent]">
            <PhotoLightbox
                open={photoLightbox !== null}
                src={photoLightbox?.src ?? null}
                alt={photoLightbox?.alt}
                onClose={() => setPhotoLightbox(null)}
            />
            <AttendancePunchModal
                mode={punchModal === "check-out" ? "check-out" : "check-in"}
                open={punchModal !== null}
                onClose={() => !isPunching && setPunchModal(null)}
                onConfirm={(capture) => void handlePunchConfirm(capture)}
                submitting={isPunching}
            />
            {attendanceError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {attendanceError}
                </div>
            )}
            {todayLeave && (
                <div
                    className={`rounded-xl border px-4 py-3 text-sm ${
                        todayLeave.blocking
                            ? "border-blue-200 bg-blue-50 text-blue-900"
                            : "border-indigo-200 bg-indigo-50 text-indigo-900"
                    }`}
                >
                    <p className="font-semibold">{todayLeave.message}</p>
                    <Link
                        href="/employee-dashboard/leave"
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-[#0a2a5e] hover:text-[#06b6d4]"
                    >
                        <FileText className="h-3.5 w-3.5" aria-hidden />
                        View leave requests
                    </Link>
                </div>
            )}
            {/* Punch card + stats */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
                <div
                    className="lg:col-span-2 rounded-2xl overflow-hidden border border-gray-100 shadow-sm text-white"
                    style={{ background: "linear-gradient(135deg, #06124f 0%, #0a2a5e 55%, #0d3a7a 100%)" }}
                >
                    <div className="p-4 sm:p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                                <p className="text-white/60 text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
                                    Today · {todayLabel || "—"}
                                </p>
                                <p
                                    className="text-[2rem] leading-tight sm:text-4xl font-black mt-1 tabular-nums min-h-[2.25rem] sm:min-h-[3rem]"
                                    suppressHydrationWarning
                                >
                                    {currentTime || "--:--:--"}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                    {checkInCapture?.location ? (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-semibold max-w-full">
                                            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                            <span className="truncate">
                                                {checkInCapture.location.address ??
                                                    `${checkInCapture.location.latitude.toFixed(4)}, ${checkInCapture.location.longitude.toFixed(4)}`}
                                            </span>
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-semibold">
                                            <MapPin className="h-3.5 w-3.5" aria-hidden />
                                            GPS + photo on punch
                                        </span>
                                    )}
                                    {checkedIn ? (
                                        todayLate?.isLate ? (
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/25 border border-amber-400/50 px-3 py-1 text-xs font-semibold text-amber-100">
                                                <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                                Late · {lateDurationLabel} · in at {checkInCapture?.time ?? "—"}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 px-3 py-1 text-xs font-semibold text-emerald-200">
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                On time · {checkInCapture?.time ?? "—"}
                                            </span>
                                        )
                                    ) : checkOutCapture ? (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 border border-blue-400/40 px-3 py-1 text-xs font-semibold text-blue-100">
                                            {todayLate?.isLate ? "Late day · " : ""}
                                            Checked out at {checkOutCapture.time}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 px-3 py-1 text-xs font-semibold text-amber-100">
                                            Not checked in yet
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="w-full sm:w-auto sm:shrink-0">
                                <p className="mb-2 text-xs text-white/50 sm:text-right" suppressHydrationWarning>
                                    Shift: {shiftTimingText}
                                </p>
                                {!checkedIn && !checkOutCapture ? (
                                    todayLeave?.blocking ? (
                                        <p className="rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-center text-sm font-semibold text-white/90 sm:text-left">
                                            Check-in disabled — approved leave today
                                        </p>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setPunchModal("check-in")}
                                            disabled={isPunching || attendanceLoading}
                                            className="flex w-full min-h-[52px] items-center justify-center gap-2 rounded-xl bg-[#06b6d4] px-5 text-base font-bold text-white shadow-lg active:scale-[0.98] hover:bg-[#05a8b8] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-h-0 sm:py-2.5 sm:text-sm"
                                        >
                                            <LogIn className="h-5 w-5 sm:h-4 sm:w-4" aria-hidden />
                                            Check in
                                        </button>
                                    )
                                ) : checkedIn ? (
                                    <button
                                        type="button"
                                        onClick={() => setPunchModal("check-out")}
                                        disabled={isPunching}
                                        className="flex w-full min-h-[52px] items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/15 px-5 text-base font-bold text-white active:scale-[0.98] hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-h-0 sm:py-2.5 sm:text-sm"
                                    >
                                        <LogOut className="h-5 w-5 sm:h-4 sm:w-4" aria-hidden />
                                        Check out
                                    </button>
                                ) : null}
                            </div>
                        </div>
                        {(checkInCapture || checkOutCapture) && (
                            <>
                                <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-white/10 p-3 sm:mt-5 sm:gap-3">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wide text-white/50">Check in</p>
                                        <p className="text-sm font-bold mt-0.5">{checkInCapture?.time ?? "—"}</p>
                                        {todayLate?.isLate && (
                                            <p className="mt-0.5 text-[10px] font-semibold text-amber-200">
                                                Late (+{lateDurationLabel})
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wide text-white/50">Check out</p>
                                        <p className="text-sm font-bold mt-0.5">
                                            {checkOutCapture?.time ?? "—"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wide text-white/50">Working</p>
                                        <p className="text-sm font-bold mt-0.5">{workingDuration}</p>
                                    </div>
                                </div>
                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {checkInCapture && (
                                        <PunchEvidenceCard
                                            label="Check-in proof"
                                            capture={checkInCapture}
                                            onPhotoClick={openPhotoLightbox}
                                        />
                                    )}
                                    {checkOutCapture && (
                                        <PunchEvidenceCard
                                            label="Check-out proof"
                                            capture={checkOutCapture}
                                            onPhotoClick={openPhotoLightbox}
                                        />
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                    {[
                        { label: "Present", value: stats.present, color: "from-emerald-500 to-emerald-600" },
                        { label: "Absent", value: stats.absent, color: "from-red-500 to-red-600" },
                        { label: "Late", value: stats.late, color: "from-amber-500 to-amber-600" },
                        { label: "Leave", value: stats.leave, color: "from-blue-500 to-blue-600" },
                    ].map((s) => (
                        <div
                            key={s.label}
                            className="flex min-h-[88px] flex-col justify-between rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm sm:min-h-0 sm:p-4"
                        >
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{s.label}</p>
                            <p className="text-2xl font-black text-gray-900 mt-1">{s.value}</p>
                            <div
                                className={`mt-2 h-1 w-full rounded-full bg-gradient-to-r ${s.color} opacity-80`}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* This month summary — before calendar */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-3 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-[#0a2a5e]" aria-hidden />
                    <h3 className="text-sm font-bold text-gray-900">This month</h3>
                </div>
                <div className="space-y-3">
                    <div>
                        <div className="mb-1 flex justify-between text-xs">
                            <span className="text-gray-600">Attendance rate</span>
                            <span className="font-bold text-gray-900">
                                {stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%
                            </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-[#06b6d4] to-[#0a7c5c]"
                                style={{
                                    width: `${stats.total > 0 ? (stats.present / stats.total) * 100 : 0}%`,
                                }}
                            />
                        </div>
                    </div>
                    <p className="text-xs leading-relaxed text-gray-500">
                        You have marked present on <strong>{stats.present}</strong> of{" "}
                        <strong>{stats.total}</strong> working days this month.
                        {stats.leavePending > 0 ? (
                            <>
                                {" "}
                                <strong>{stats.leavePending}</strong> day
                                {stats.leavePending === 1 ? "" : "s"} have pending leave.
                            </>
                        ) : null}
                    </p>
                </div>
            </div>

            {/* Month calendar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-[#0a2a5e]" aria-hidden />
                        <h2 className="text-base font-bold text-gray-900">Monthly calendar</h2>
                    </div>
                    <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
                        <button
                            type="button"
                            onClick={() => shiftMonth(-1)}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-600 active:bg-gray-100 sm:h-10 sm:w-10 sm:rounded-lg"
                            aria-label="Previous month"
                        >
                            <ChevronLeft className="h-5 w-5 sm:h-4 sm:w-4" />
                        </button>
                        <span className="flex-1 text-center text-sm font-bold text-gray-900 sm:min-w-[140px] sm:flex-none">
                            {formatMonthLabel(viewYear, viewMonth)}
                        </span>
                        <button
                            type="button"
                            onClick={() => shiftMonth(1)}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-600 active:bg-gray-100 sm:h-10 sm:w-10 sm:rounded-lg"
                            aria-label="Next month"
                        >
                            <ChevronRight className="h-5 w-5 sm:h-4 sm:w-4" />
                        </button>
                    </div>
                </div>

                <div className="px-3 pb-4 sm:px-6">
                    <div className="mb-1.5 grid grid-cols-7 gap-0.5 sm:mb-2 sm:gap-1">
                        {weekdayLabels.map((d, idx) => (
                            <div
                                key={`${d}-${idx}`}
                                className="py-1 text-center text-[10px] font-semibold text-gray-400 sm:text-xs"
                            >
                                <span className="sm:hidden">{d}</span>
                                <span className="hidden sm:inline">
                                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][idx]}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                        {calendarCells.map((cell, i) => {
                            if (cell.pad) {
                                return <div key={`pad-${i}`} className="aspect-square" />;
                            }
                            const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;
                            const isToday = todayIso !== "" && iso === todayIso;
                            if (!cell.record) {
                                return (
                                    <div
                                        key={iso}
                                        className={`flex aspect-square items-center justify-center rounded-md text-[11px] font-medium text-gray-300 bg-gray-50/80 sm:rounded-lg sm:text-xs ${
                                            isToday ? "ring-2 ring-[#06b6d4]/50 ring-offset-1" : ""
                                        }`}
                                    >
                                        {cell.day}
                                    </div>
                                );
                            }
                            const cfg = STATUS_CONFIG[cell.record.status];
                            return (
                                <div
                                    key={iso}
                                    title={cell.record.note ?? cfg.label}
                                    className={`flex aspect-square flex-col items-center justify-center rounded-md border text-[11px] font-semibold transition-colors sm:rounded-lg sm:text-xs ${
                                        isToday
                                            ? "ring-2 ring-[#06b6d4] ring-offset-1 border-[#06b6d4]/30"
                                            : "border-transparent"
                                    } ${cfg.bg} ${cfg.text}`}
                                >
                                    <span>{cell.day}</span>
                                    <span className={`mt-0.5 h-1 w-1 rounded-full ${cfg.dot}`} />
                                </div>
                            );
                        })}
                    </div>
                    <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto border-t border-gray-100 px-1 pt-3 sm:mx-0 sm:flex-wrap sm:gap-3 sm:mt-4">
                        {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((key) => (
                            <span key={key} className="inline-flex items-center gap-1.5 text-xs text-gray-600">
                                <span className={`h-2 w-2 rounded-full ${STATUS_CONFIG[key].dot}`} />
                                {STATUS_CONFIG[key].label}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* My Attendance — personal record table */}
            <div className="overflow-hidden rounded-2xl border border-[#0a2a5e]/10 bg-white shadow-sm">
                <div
                    className="px-4 py-5 text-white sm:px-6"
                    style={{
                        background: "linear-gradient(135deg, #06124f 0%, #0a2a5e 55%, #0d3a7a 100%)",
                    }}
                >
                    <h2 className="text-lg font-bold sm:text-xl">My Attendance</h2>
                    <p className="mt-0.5 text-sm text-white/70">Your personal attendance record</p>

                    <div className="mt-4 w-full">
                        <label
                            htmlFor="attendance-month"
                            className="mb-2 block text-sm font-medium text-white/80"
                        >
                            Month:
                        </label>
                        <div className="flex w-full gap-2">
                            <input
                                id="attendance-month"
                                type="month"
                                value={monthInputValue}
                                onChange={(e) => handleLogMonthChange(e.target.value)}
                                className="h-11 min-w-0 flex-1 rounded-lg border border-white/25 bg-white/95 px-3 text-sm font-medium text-gray-900 outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/40"
                            />
                            <button
                                type="button"
                                onClick={() => void loadAttendance(viewYear, viewMonth)}
                                disabled={attendanceLoading}
                                className="h-11 shrink-0 rounded-lg bg-[#06b6d4] px-6 text-sm font-bold text-white shadow-md transition hover:bg-[#05a8b8] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {attendanceLoading ? "Loading…" : "Load"}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-2 border-b border-[#0a2a5e]/10 bg-[#f8fafc] px-4 py-4 sm:gap-3 sm:px-6">
                    {[
                        {
                            label: "Present",
                            value: logStats.present,
                            dot: "bg-[#06b6d4]",
                            card: "bg-white border-[#06b6d4]/25 shadow-sm",
                            text: "text-[#0a2a5e]",
                            bar: "from-[#06b6d4] to-[#0a7c5c]",
                        },
                        {
                            label: "Absent",
                            value: logStats.absent,
                            dot: "bg-red-500",
                            card: "bg-white border-red-100 shadow-sm",
                            text: "text-red-800",
                            bar: "from-red-400 to-red-600",
                        },
                        {
                            label: "Half Day",
                            value: logStats.halfDay,
                            dot: "bg-amber-500",
                            card: "bg-white border-amber-100 shadow-sm",
                            text: "text-amber-800",
                            bar: "from-amber-400 to-amber-600",
                        },
                        {
                            label: "Leave",
                            value: logStats.leave,
                            dot: "bg-[#0a2a5e]",
                            card: "bg-white border-[#0a2a5e]/15 shadow-sm",
                            text: "text-[#0a2a5e]",
                            bar: "from-[#0a2a5e] to-[#0d3a7a]",
                        },
                    ].map((card) => (
                        <div
                            key={card.label}
                            className={`flex min-w-0 flex-col gap-1 rounded-xl border px-2 py-2.5 sm:flex-row sm:items-center sm:gap-2.5 sm:px-3 sm:py-3 md:gap-3 md:px-4 ${card.card}`}
                        >
                            <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                                <span className={`h-2 w-2 shrink-0 rounded-full sm:h-2.5 sm:w-2.5 ${card.dot}`} />
                                <p
                                    className={`truncate text-[10px] font-semibold uppercase leading-tight tracking-wide sm:text-xs ${card.text}`}
                                >
                                    {card.label}
                                </p>
                            </div>
                            <p className={`text-xl font-bold leading-none sm:text-2xl ${card.text}`}>
                                {card.value}
                            </p>
                            <div className={`mt-0.5 h-0.5 w-full rounded-full bg-gradient-to-r ${card.bar} opacity-80`} />
                        </div>
                    ))}
                </div>

                {/* Mobile: card list */}
                <div className="divide-y divide-[#0a2a5e]/10 md:hidden">
                    {tableRows.length === 0 ? (
                        <p className="px-4 py-12 text-center text-sm text-gray-500">
                            No attendance records for this month.
                        </p>
                    ) : (
                        tableRows.map((row) => (
                            <AttendanceLogMobileRow
                                key={row.date}
                                row={row}
                                onPhotoClick={openPhotoLightbox}
                            />
                        ))
                    )}
                </div>

                {/* Desktop: table */}
                <div className="hidden overflow-x-auto md:block">

                    <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                        <thead>
                            <tr className="border-b border-[#0a2a5e]/10 bg-[#0a2a5e]/5">
                                <th className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#0a2a5e]/70 sm:px-6">
                                    #
                                </th>
                                <th className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#0a2a5e]/70">
                                    Date
                                </th>
                                <th className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#0a2a5e]/70">
                                    Day
                                </th>
                                <th className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#0a2a5e]/70">
                                    Status
                                </th>
                                <th className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#0a2a5e]/70">
                                    Check in
                                </th>
                                <th className="whitespace-nowrap px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-[#0a2a5e]/70">
                                    Check in photo
                                </th>
                                <th className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#0a2a5e]/70">
                                    Check out
                                </th>
                                <th className="whitespace-nowrap px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-[#0a2a5e]/70 sm:pr-6">
                                    Check out photo
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {tableRows.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-14 text-center text-sm text-gray-500">
                                        No attendance records for this month.
                                    </td>
                                </tr>
                            ) : (
                                tableRows.map((row, index) => (
                                    <tr
                                        key={row.date}
                                        className="transition-colors hover:bg-[#06b6d4]/5"
                                    >
                                        <td className="whitespace-nowrap px-4 py-4 text-gray-500 sm:px-6">
                                            {index + 1}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 font-medium text-gray-900">
                                            {formatLogTableDate(row.date)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-gray-700">
                                            {formatLogTableDay(row.date)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4">
                                            <StatusBadge status={row.status} />
                                            {row.note && (
                                                <p className="mt-1 max-w-[180px] text-[11px] font-medium text-amber-700">
                                                    {row.note}
                                                </p>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 font-semibold tabular-nums text-[#058a9a]">
                                            {row.checkInProof?.time ?? (
                                                <span className="font-normal text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <AttendanceLogPhoto
                                                proof={row.checkInProof}
                                                label="Check-in"
                                                variant="in"
                                                onPhotoClick={openPhotoLightbox}
                                            />
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 font-semibold tabular-nums text-[#0a2a5e]">
                                            {row.checkOutProof?.time ?? (
                                                <span className="font-normal text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-center sm:pr-6">
                                            <AttendanceLogPhoto
                                                proof={row.checkOutProof}
                                                label="Check-out"
                                                variant="out"
                                                onPhotoClick={openPhotoLightbox}
                                            />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <p className="border-t border-[#0a2a5e]/10 bg-[#f8fafc] px-4 py-3 text-xs text-[#0a2a5e]/60 sm:px-6">
                    {tableRows.length} record{tableRows.length === 1 ? "" : "s"} for this month
                </p>
            </div>

        </div>
    );
}
