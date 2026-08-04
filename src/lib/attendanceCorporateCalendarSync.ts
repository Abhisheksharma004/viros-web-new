import pool from "@/lib/db";
import {
    ensureCorporateCalendarTable,
    type CorporateEventApi,
    type CorporateCalendarRow,
    mapRowToApi,
} from "@/lib/corporateCalendar";
import type { AttendanceDayRecord } from "@/lib/employeeAttendance";

const TABLE = "corporate_calendar";

export type CorporateEventForAttendance = CorporateEventApi;

export function expandCorporateDateRange(startIso: string, endIso: string): string[] {
    if (!startIso || !endIso) return [];
    const start = new Date(startIso + "T12:00:00");
    const end = new Date(endIso + "T12:00:00");
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return [];

    const dates: string[] = [];
    const cur = new Date(start);
    while (cur <= end) {
        dates.push(
            `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`
        );
        cur.setDate(cur.getDate() + 1);
    }
    return dates;
}

export async function fetchCorporateEventsForMonth(
    year: number,
    month: number
): Promise<CorporateEventForAttendance[]> {
    await ensureCorporateCalendarTable();
    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    const [rows] = await pool.query<CorporateCalendarRow[]>(
        `SELECT * FROM ${TABLE}
         WHERE start_date <= ? AND end_date >= ?
         ORDER BY start_date ASC, id ASC`,
        [end, start]
    );

    return rows.map(mapRowToApi);
}

export async function getCorporateHolidayForDate(
    dateIso: string
): Promise<CorporateEventForAttendance | null> {
    await ensureCorporateCalendarTable();
    const [rows] = await pool.query<CorporateCalendarRow[]>(
        `SELECT * FROM ${TABLE}
         WHERE event_type = 'holiday'
           AND start_date <= ? AND end_date >= ?
         LIMIT 1`,
        [dateIso, dateIso]
    );
    return rows[0] ? mapRowToApi(rows[0]) : null;
}

const CATEGORY_DISPLAY: Record<string, string> = {
    holiday: "Company Holiday",
    company_event: "Company Event",
    meeting: "Board / Town Hall",
    appraisal: "Appraisal Cycle",
    training: "Training & Workshop",
    milestone: "Project Milestone",
};

export function mergeCorporateEventsIntoAttendanceRecords(
    records: AttendanceDayRecord[],
    events: CorporateEventForAttendance[]
): AttendanceDayRecord[] {
    const byDate = new Map<string, AttendanceDayRecord>(
        records.map((r) => [r.date, { ...r }])
    );

    for (const ev of events) {
        const dates = expandCorporateDateRange(ev.start_date, ev.end_date);
        const eventDisplayText = ev.title;

        for (const d of dates) {
            const existing = byDate.get(d);
            const isHoliday = ev.event_type === "holiday";

            if (existing) {
                const hasPunch = Boolean(
                    existing.checkIn || existing.checkOut || existing.checkInProof || existing.checkOutProof
                );

                if (isHoliday) {
                    if (!hasPunch && existing.status !== "leave") {
                        byDate.set(d, {
                            ...existing,
                            status: "holiday",
                            note: eventDisplayText,
                        });
                    } else if (hasPunch) {
                        const notePrefix = existing.note ? `${existing.note} | ` : "";
                        byDate.set(d, {
                            ...existing,
                            note: `${notePrefix}Present on ${ev.title}`,
                        });
                    }
                } else {
                    const notePrefix = existing.note ? `${existing.note} | ` : "";
                    if (!existing.note?.includes(ev.title)) {
                        byDate.set(d, {
                            ...existing,
                            note: existing.note ? `${notePrefix}${eventDisplayText}` : eventDisplayText,
                        });
                    }
                }
            } else {
                byDate.set(d, {
                    date: d,
                    status: isHoliday ? "holiday" : "weekend",
                    note: eventDisplayText,
                });
            }
        }
    }

    return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}
