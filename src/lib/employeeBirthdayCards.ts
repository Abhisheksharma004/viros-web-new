import type { EmployeeBirthdayAlert } from "@/lib/employeeBirthdays";

export type BirthdayWishCardData = {
    id: string;
    variant: "birthday-today" | "birthday-soon";
    eyebrow: string;
    title: string;
    subtitle: string;
    badgeText: string;
    hint?: string;
    initials: string;
};

function firstName(fullName: string) {
    const trimmed = fullName.trim();
    if (!trimmed) return "Team member";
    return trimmed.split(/\s+/)[0] ?? trimmed;
}

function birthdayWhenLabel(daysUntil: number) {
    if (daysUntil === 1) return "Tomorrow";
    if (daysUntil === 2) return "In 2 days";
    return `In ${daysUntil} days`;
}

function initialsFromName(fullName: string) {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

/** Build birthday card content from dashboard alerts (same rules: today + 2 days before). */
export function buildBirthdayWishCards(alerts: EmployeeBirthdayAlert[]): BirthdayWishCardData[] {
    return alerts.map((a) => {
        const name = firstName(a.fullName);
        const when = birthdayWhenLabel(a.daysUntil);
        const initials = initialsFromName(a.fullName);

        if (a.kind === "today") {
            return {
                id: `birthday-today-${a.employeeId}`,
                variant: "birthday-today",
                eyebrow: a.isSelf ? "Your special day" : "Birthday today",
                title: a.isSelf ? `Happy Birthday, ${name}!` : a.fullName,
                subtitle: a.isSelf
                    ? "Wishing you a wonderful year from the VIROS family"
                    : `Send your best wishes · ${a.displayDate}`,
                badgeText: "Today",
                hint: "Celebrate with the team today",
                initials,
            };
        }

        return {
            id: `birthday-soon-${a.employeeId}`,
            variant: "birthday-soon",
            eyebrow: a.isSelf ? "Your birthday" : "Upcoming birthday",
            title: a.isSelf ? `${name}, get ready!` : a.fullName,
            subtitle: a.isSelf
                ? `Your birthday is on ${a.displayDate}`
                : `Birthday on ${a.displayDate}`,
            badgeText: when,
            hint: "Plan a wish or surprise for your colleague",
            initials,
        };
    });
}
