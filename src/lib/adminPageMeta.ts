export type AdminPageMeta = {
    title: string;
    subtitle?: string;
};

/** Longest paths first so nested routes match before parents. */
const ADMIN_PAGE_META_ENTRIES: { path: string; title: string; subtitle?: string }[] = [
    {
        path: "/admin-dashboard/reports/newsletter",
        title: "Newsletter",
        subtitle: "Footer newsletter subscribers.",
    },
    {
        path: "/admin-dashboard/reports/activity",
        title: "Activity Log",
        subtitle: "Admin activity records.",
    },
    {
        path: "/admin-dashboard/without-amc-report",
        title: "Without AMC Report",
        subtitle: "Non-AMC service records.",
    },
    {
        path: "/admin-dashboard/amc-report",
        title: "AMC Report",
        subtitle: "AMC service work records.",
    },
    {
        path: "/admin-dashboard/expense-management",
        title: "Expense Management",
        subtitle: "Review employee monthly expense batches and approve or reject claims.",
    },
    {
        path: "/admin-dashboard/employee-access",
        title: "Employee Access",
        subtitle: "Manage employee logins.",
    },
    {
        path: "/admin-dashboard/leave-request",
        title: "Leave requests",
        subtitle: "Approve or reject leave.",
    },
    {
        path: "/admin-dashboard/leave-policy",
        title: "Leave policy",
        subtitle: "Manage leave rules.",
    },
    {
        path: "/admin-dashboard/add-company",
        title: "Companies",
        subtitle: "Manage company records.",
    },
    {
        path: "/admin-dashboard/add-asset",
        title: "Assets",
        subtitle: "Track company assets.",
    },
    {
        path: "/admin-dashboard/attendance",
        title: "Attendance",
        subtitle: "Employee attendance records.",
    },
    {
        path: "/admin-dashboard/employees",
        title: "Employee directory",
        subtitle: "Manage employee details.",
    },
    {
        path: "/admin-dashboard/department",
        title: "Departments",
        subtitle: "Department overview.",
    },
    {
        path: "/admin-dashboard/tasks",
        title: "Tasks Management",
        subtitle: "Track assigned tasks.",
    },
    {
        path: "/admin-dashboard/settings",
        title: "Admin profile",
        subtitle: "Your display name for task assignments.",
    },
    {
        path: "/admin-dashboard/salary",
        title: "Employee salary setup",
        subtitle: "Manage salary structure.",
    },
    {
        path: "/admin-dashboard/shift",
        title: "Employee shifts",
        subtitle: "Manage work shifts.",
    },
    {
        path: "/admin-dashboard/roles",
        title: "Role directory",
        subtitle: "Manage employee roles.",
    },
    {
        path: "/admin-dashboard",
        title: "Admin Overview",
        subtitle: "Admin control panel.",
    },
];

function titleFromPath(pathname: string): string {
    const segment = pathname.split("/").filter(Boolean).pop() ?? "Admin";
    return segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

export function getAdminPageMeta(pathname: string | null): AdminPageMeta {
    if (!pathname?.startsWith("/admin-dashboard")) {
        return { title: "Admin", subtitle: "Admin panel." };
    }

    const match = ADMIN_PAGE_META_ENTRIES.find(
        (entry) => pathname === entry.path || pathname.startsWith(`${entry.path}/`),
    );

    if (match) {
        return { title: match.title, subtitle: match.subtitle };
    }

    return {
        title: titleFromPath(pathname),
        subtitle: "Admin panel.",
    };
}