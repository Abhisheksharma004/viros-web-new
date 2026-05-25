export const inputClass =
    "h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-900 shadow-sm outline-none focus:border-[#0a2a5e] focus:ring-2 focus:ring-[#0a2a5e]/20";
export const labelClass = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-700";
export const selectClass =
    "h-11 w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-900 shadow-sm outline-none focus:border-[#0a2a5e] focus:ring-2 focus:ring-[#0a2a5e]/20";

export type TaskStatus = "pending" | "in-progress" | "completed" | "overdue";
export type TaskPriority = "high" | "medium" | "low";
export type StatusFilter = TaskStatus | "all";
export type PriorityFilter = TaskPriority | "all";

export type TaskAssignee = {
    employee_id: string;
    full_name: string;
    department: string | null;
};

export type TaskRemark = {
    id: number;
    employeeId: string;
    employeeName: string;
    remark: string;
    createdAt: string;
};

/** Status values employees may set when updating a task */
export const EMPLOYEE_TASK_STATUSES: { id: TaskStatus; label: string }[] = [
    { id: "pending", label: "Pending" },
    { id: "in-progress", label: "In Progress" },
    { id: "completed", label: "Completed" },
];

export type TaskRow = {
    recordId: number;
    id: string;
    title: string;
    description: string;
    assignee: string;
    department: string;
    assignees?: TaskAssignee[];
    team?: string;
    priority: TaskPriority;
    /** Status stored in database (shown in table) */
    status: TaskStatus;
    /** True when due date is today or past and task is not completed */
    isOverdue: boolean;
    dueDate: string;
    createdAt: string;
    assignDate: string;
    remarks?: TaskRemark[];
};

export function formatRemarkDateTime(iso: string) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "in-progress", label: "In Progress" },
    { id: "completed", label: "Completed" },
    { id: "overdue", label: "Overdue" },
];

export const PRIORITY_FILTERS: { id: PriorityFilter; label: string }[] = [
    { id: "all", label: "All priorities" },
    { id: "high", label: "High" },
    { id: "medium", label: "Medium" },
    { id: "low", label: "Low" },
];

export function formatTaskDate(iso: string) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export function formatAssignDate(iso: string) {
    return formatTaskDate(iso);
}

/** Due today or earlier, and not completed → counts as overdue for filters/stats */
export function isTaskOverdue(storedStatus: TaskStatus, dueDate: string): boolean {
    if (storedStatus === "completed") return false;
    if (!dueDate) return false;
    const due = new Date(`${dueDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return due.getTime() <= today.getTime();
}

export function getStatusStyles(status: TaskStatus) {
    if (status === "pending") return "bg-amber-50 text-amber-700";
    if (status === "in-progress") return "bg-blue-50 text-blue-700";
    if (status === "completed") return "bg-green-50 text-green-700";
    return "bg-red-50 text-red-700";
}

export function getStatusLabel(status: TaskStatus) {
    if (status === "in-progress") return "In Progress";
    return status.charAt(0).toUpperCase() + status.slice(1);
}

export function getPriorityStyles(priority: TaskPriority) {
    if (priority === "high") return "bg-red-50 text-red-700";
    if (priority === "medium") return "bg-amber-50 text-amber-700";
    return "bg-gray-100 text-gray-700";
}
