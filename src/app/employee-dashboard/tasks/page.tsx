"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight, Eye, Loader2, Pencil, Search, X } from "lucide-react";
import {
    EMPLOYEE_TASK_STATUSES,
    PRIORITY_FILTERS,
    STATUS_FILTERS,
    formatAssignDate,
    formatAssignedByLabel,
    formatRemarkDateTime,
    formatTaskDate,
    getPriorityStyles,
    getStatusLabel,
    getStatusStyles,
    inputClass,
    labelClass,
    selectClass,
    type PriorityFilter,
    type StatusFilter,
    type TaskRow,
    type TaskStatus,
} from "@/lib/adminTaskUiShared";

const textareaClass = `${inputClass} min-h-[100px] resize-y py-2.5`;

type ModalMode = "view" | "update" | null;
type TasksPageVariant = "my" | "history";

function employeeEditableStatus(status: TaskStatus): TaskStatus {
    if (status === "pending" || status === "in-progress" || status === "completed") {
        return status;
    }
    return "pending";
}

function isTeamTask(task: TaskRow): boolean {
    return (task.assignees?.length ?? 0) > 1;
}

function canEmployeeUpdateTask(task: TaskRow): boolean {
    return task.status !== "completed";
}

function assigneeSummary(task: TaskRow): string {
    if (task.assignees?.length) {
        return task.assignees.map((a) => a.full_name).join(", ");
    }
    return task.assignee && task.assignee !== "—" ? task.assignee : "—";
}

function TaskCard({
    task,
    onView,
    onUpdate,
}: {
    task: TaskRow;
    onView: (task: TaskRow) => void;
    onUpdate: (task: TaskRow) => void;
}) {
    return (
        <div className="flex w-full flex-col gap-3 rounded-md border border-[#0a2a5e]/10 bg-white p-4 shadow-sm sm:p-5">
            <button
                type="button"
                onClick={() => onView(task)}
                className="flex cursor-pointer flex-col gap-3 text-left"
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#0a2a5e]">
                            {task.id}
                        </p>
                        <p className="mt-0.5 text-[11px] text-gray-500">
                            Assigned {formatAssignDate(task.assignDate)}
                            {" · "}
                            By {formatAssignedByLabel(task.assignedBy)}
                        </p>
                        <h3 className="mt-2 line-clamp-2 text-base font-bold text-gray-900">
                            {task.title}
                        </h3>
                        {task.description ? (
                            <p className="mt-1 line-clamp-2 text-sm text-gray-500">{task.description}</p>
                        ) : null}
                    </div>
                    <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-gray-400" aria-hidden />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getPriorityStyles(task.priority)}`}
                    >
                        {task.priority}
                    </span>
                    <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyles(task.status)}`}
                    >
                        {getStatusLabel(task.status)}
                    </span>
                    {isTeamTask(task) ? (
                        <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                            Team
                        </span>
                    ) : null}
                    {(task.remarks?.length ?? 0) > 0 ? (
                        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                            {task.remarks!.length} remark{task.remarks!.length === 1 ? "" : "s"}
                        </span>
                    ) : null}
                </div>

                <div className="grid grid-cols-1 gap-2 border-t border-gray-100 pt-3 text-sm sm:grid-cols-2">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                            Due date
                        </p>
                        <p
                            className={`mt-0.5 font-semibold ${
                                task.isOverdue ? "text-red-600" : "text-gray-800"
                            }`}
                        >
                            {formatTaskDate(task.dueDate)}
                        </p>
                    </div>
                    <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                            Assigned to
                        </p>
                        <p className="mt-0.5 line-clamp-2 font-medium text-gray-700">
                            {assigneeSummary(task)}
                        </p>
                    </div>
                </div>
            </button>

            {canEmployeeUpdateTask(task) ? (
                <button
                    type="button"
                    onClick={() => onUpdate(task)}
                    className="inline-flex min-h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-md bg-[#06b6d4] text-sm font-bold text-white shadow-md transition hover:bg-[#05a8b8] active:scale-[0.98]"
                >
                    <Pencil className="h-4 w-4" aria-hidden />
                    Update
                </button>
            ) : null}
        </div>
    );
}

export function EmployeeTasksPageContent({ variant = "my" }: { variant?: TasksPageVariant }) {
    const isHistory = variant === "history";
    const [tasks, setTasks] = useState<TaskRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [viewTask, setViewTask] = useState<TaskRow | null>(null);
    const [editStatus, setEditStatus] = useState<TaskStatus>("pending");
    const [editRemark, setEditRemark] = useState("");
    const [saveLoading, setSaveLoading] = useState(false);
    const [saveError, setSaveError] = useState("");

    const loadTasks = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const resp = await fetch("/api/employee/tasks", { cache: "no-store" });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                const detail =
                    typeof data.error === "string"
                        ? data.error
                        : typeof data.message === "string"
                          ? data.message
                          : "Failed to load tasks";
                throw new Error(detail);
            }
            setTasks(Array.isArray(data.tasks) ? (data.tasks as TaskRow[]) : []);
        } catch (err) {
            console.error("Error loading employee tasks:", err);
            setError(err instanceof Error ? err.message : "Failed to load tasks");
            setTasks([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadTasks();
    }, [loadTasks]);

    const scopedTasks = useMemo(() => {
        if (isHistory) return tasks.filter((t) => t.status === "completed");
        return tasks.filter((t) => t.status !== "completed");
    }, [tasks, isHistory]);

    const filteredTasks = useMemo(() => {
        const q = search.trim().toLowerCase();
        return scopedTasks.filter((task) => {
            if (!isHistory) {
                if (statusFilter === "overdue") {
                    if (!task.isOverdue) return false;
                } else if (statusFilter !== "all" && task.status !== statusFilter) {
                    return false;
                }
            }
            if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
            if (!q) return true;
            const assigneeText = assigneeSummary(task).toLowerCase();
            return (
                task.id.toLowerCase().includes(q) ||
                task.title.toLowerCase().includes(q) ||
                task.description.toLowerCase().includes(q) ||
                assigneeText.includes(q)
            );
        });
    }, [scopedTasks, search, statusFilter, priorityFilter, isHistory]);

    const stats = useMemo(() => {
        if (isHistory) {
            return [
                {
                    label: "Completed",
                    value: String(scopedTasks.length),
                    tone: "text-[#0a2a5e]",
                    ring: "ring-[#0a2a5e]/15",
                },
                {
                    label: "Team Task",
                    value: String(scopedTasks.filter((t) => isTeamTask(t)).length),
                    tone: "text-indigo-600",
                    ring: "ring-indigo-200",
                },
                {
                    label: "With Remarks",
                    value: String(scopedTasks.filter((t) => (t.remarks?.length ?? 0) > 0).length),
                    tone: "text-[#058a9a]",
                    ring: "ring-[#06b6d4]/20",
                },
                {
                    label: "High Priority",
                    value: String(scopedTasks.filter((t) => t.priority === "high").length),
                    tone: "text-red-600",
                    ring: "ring-red-200",
                },
                {
                    label: "Medium",
                    value: String(scopedTasks.filter((t) => t.priority === "medium").length),
                    tone: "text-amber-600",
                    ring: "ring-amber-200",
                },
                {
                    label: "Low",
                    value: String(scopedTasks.filter((t) => t.priority === "low").length),
                    tone: "text-gray-600",
                    ring: "ring-gray-200",
                },
            ];
        }
        return [
            {
                label: "My Tasks",
                value: String(scopedTasks.length),
                tone: "text-[#0a2a5e]",
                ring: "ring-[#06b6d4]/25",
            },
            {
                label: "Team Task",
                value: String(scopedTasks.filter((t) => isTeamTask(t)).length),
                tone: "text-indigo-600",
                ring: "ring-indigo-200",
            },
            {
                label: "Pending",
                value: String(scopedTasks.filter((t) => t.status === "pending").length),
                tone: "text-amber-600",
                ring: "ring-amber-200",
            },
            {
                label: "In Progress",
                value: String(scopedTasks.filter((t) => t.status === "in-progress").length),
                tone: "text-[#058a9a]",
                ring: "ring-[#06b6d4]/20",
            },
            {
                label: "Overdue",
                value: String(scopedTasks.filter((t) => t.isOverdue).length),
                tone: "text-red-600",
                ring: "ring-red-200",
            },
            {
                label: "Completed",
                value: String(tasks.filter((t) => t.status === "completed").length),
                tone: "text-[#0a2a5e]",
                ring: "ring-[#0a2a5e]/15",
            },
        ];
    }, [scopedTasks, tasks, isHistory]);

    const openViewModal = (task: TaskRow) => {
        setViewTask(task);
        setSaveError("");
        setModalMode("view");
    };

    const openUpdateModal = (task: TaskRow) => {
        if (!canEmployeeUpdateTask(task)) return;
        setViewTask(task);
        setEditStatus(employeeEditableStatus(task.status));
        setEditRemark("");
        setSaveError("");
        setModalMode("update");
    };

    const closeModal = () => {
        setModalMode(null);
        setViewTask(null);
        setEditRemark("");
        setSaveError("");
        setSaveLoading(false);
    };

    const mergeTaskInList = (updated: TaskRow) => {
        setTasks((prev) => prev.map((t) => (t.recordId === updated.recordId ? updated : t)));
        setViewTask(updated);
    };

    const handleSaveUpdate = async () => {
        if (!viewTask) return;
        const remark = editRemark.trim();
        const statusChanged = editStatus !== employeeEditableStatus(viewTask.status);
        if (!statusChanged && !remark) {
            setSaveError("Change status and/or add a remark before saving.");
            return;
        }

        try {
            setSaveLoading(true);
            setSaveError("");
            const resp = await fetch(`/api/employee/tasks/${viewTask.recordId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: statusChanged ? editStatus : undefined,
                    remark: remark || undefined,
                }),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(
                    typeof data.message === "string" ? data.message : "Failed to update task",
                );
            }
            const updated = data as TaskRow;
            mergeTaskInList(updated);
            setEditRemark("");
            setModalMode("view");
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : "Failed to update task");
        } finally {
            setSaveLoading(false);
        }
    };

    const emptyMessage =
        scopedTasks.length === 0
            ? isHistory
                ? "No completed tasks yet."
                : "No active tasks assigned to you yet."
            : "No tasks match your filters.";

    return (
        <div className="mx-auto w-full max-w-6xl space-y-4 sm:space-y-6">
            {/* Stats — 3 columns × 2 rows */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {stats.map((item) => (
                    <div
                        key={item.label}
                        className={`min-w-0 rounded-md border bg-white p-2.5 shadow-sm ring-1 sm:p-4 ${item.ring}`}
                    >
                        <p className="truncate text-[9px] font-bold uppercase tracking-wide text-gray-500 sm:text-xs">
                            {item.label}
                        </p>
                        <p
                            className={`mt-1 text-xl font-black leading-none sm:mt-2 sm:text-3xl ${item.tone}`}
                        >
                            {item.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Filters — single row */}
            <div
                className={`grid w-full min-w-0 items-center gap-2 ${
                    isHistory
                        ? "grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]"
                        : "grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.15fr)]"
                }`}
            >
                {!isHistory ? (
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                        className={`${selectClass} min-h-10 min-w-0 px-2 text-xs touch-manipulation sm:min-h-11 sm:px-3 sm:text-sm`}
                    >
                        {STATUS_FILTERS.map((f) => (
                            <option key={f.id} value={f.id}>
                                {f.label === "All" ? "All statuses" : f.label}
                            </option>
                        ))}
                    </select>
                ) : null}
                <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
                    className={`${selectClass} min-h-10 min-w-0 px-2 text-xs touch-manipulation sm:min-h-11 sm:px-3 sm:text-sm`}
                >
                    {PRIORITY_FILTERS.map((f) => (
                        <option key={f.id} value={f.id}>
                            {f.label === "All" ? "All" : f.label}
                        </option>
                    ))}
                </select>
                <div className="relative min-w-0">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 sm:left-3 sm:h-4 sm:w-4" />
                    <input
                        type="search"
                        placeholder="Search…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={`${inputClass} min-h-10 min-w-0 pl-8 text-xs touch-manipulation sm:min-h-11 sm:pl-9 sm:text-sm`}
                    />
                </div>
            </div>

            {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="overflow-hidden rounded-md border border-[#0a2a5e]/10 bg-white shadow-sm">
                <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3.5 sm:px-6 sm:py-4">
                    <h2 className="text-sm font-bold text-gray-900 sm:text-base">
                        {isHistory ? "Completed tasks" : "Assigned tasks"}
                    </h2>
                    <p className="shrink-0 text-xs text-gray-500">
                        {filteredTasks.length}/{scopedTasks.length}
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center gap-2 px-4 py-14 text-sm text-gray-500">
                        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                        Loading your tasks…
                    </div>
                ) : filteredTasks.length === 0 ? (
                    <p className="px-4 py-14 text-center text-sm text-gray-500">{emptyMessage}</p>
                ) : (
                    <>
                        {/* Mobile: card list */}
                        <div className="flex flex-col gap-3 p-3 md:hidden">
                            {filteredTasks.map((task) => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    onView={openViewModal}
                                    onUpdate={openUpdateModal}
                                />
                            ))}
                        </div>

                        {/* Desktop: table */}
                        <div className="hidden overflow-x-auto md:block">
                            <table className="min-w-full">
                                <thead className="border-b border-[#0a2a5e]/10 bg-[#0a2a5e]/5">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Task ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Title
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Assigned to
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Priority / Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Due date
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredTasks.map((task) => (
                                        <tr key={task.id} className="transition-colors hover:bg-[#06b6d4]/5">
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <p className="text-sm font-semibold text-[#0a2a5e]">
                                                    {task.id}
                                                </p>
                                                <p className="mt-0.5 text-xs text-gray-500">
                                                    {formatAssignDate(task.assignDate)}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {task.title}
                                                </p>
                                                <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
                                                    {task.description}
                                                </p>
                                            </td>
                                            <td className="max-w-[200px] px-6 py-4 text-sm text-gray-700">
                                                <p className="line-clamp-3">{assigneeSummary(task)}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col items-start gap-1.5">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getPriorityStyles(task.priority)}`}
                                                    >
                                                        {task.priority}
                                                    </span>
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyles(task.status)}`}
                                                    >
                                                        {getStatusLabel(task.status)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <span
                                                    className={`text-sm font-semibold ${
                                                        task.isOverdue
                                                            ? "text-red-600"
                                                            : "text-gray-700"
                                                    }`}
                                                >
                                                    {formatTaskDate(task.dueDate)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="inline-flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openViewModal(task)}
                                                        className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-[#0a2a5e]/15 bg-white text-[#0a2a5e] shadow-sm transition hover:bg-[#06b6d4]/5"
                                                        title="View task"
                                                        aria-label="View task"
                                                    >
                                                        <Eye className="h-4 w-4" aria-hidden />
                                                    </button>
                                                    {canEmployeeUpdateTask(task) ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => openUpdateModal(task)}
                                                            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md bg-[#06b6d4] text-white shadow-md transition hover:bg-[#05a8b8]"
                                                            title="Update task"
                                                            aria-label="Update task"
                                                        >
                                                            <Pencil className="h-4 w-4" aria-hidden />
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* Modals — bottom sheet on mobile, centered on desktop */}
            {viewTask && modalMode === "view" && (
                <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:px-4 sm:py-6">
                    <div
                        className="absolute inset-0 bg-black/40"
                        aria-hidden
                        onClick={closeModal}
                    />
                    <div
                        role="dialog"
                        aria-modal="true"
                        className="relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-lg border border-gray-200 bg-white shadow-2xl sm:max-h-[min(90vh,640px)] sm:rounded-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex shrink-0 flex-col items-center pt-2 sm:hidden">
                            <span className="h-1 w-10 rounded-full bg-gray-300" aria-hidden />
                        </div>
                        <div
                            className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6"
                            style={{
                                background:
                                    "linear-gradient(135deg, #06124f 0%, #0a2a5e 55%, #0d3a7a 100%)",
                            }}
                        >
                            <h3 className="text-lg font-bold text-white">Task details</h3>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-white/80 transition hover:bg-white/10 hover:text-white"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Task ID</p>
                                    <p className="mt-1 break-all text-sm font-semibold text-gray-900">
                                        {viewTask.id}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Assign date</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">
                                        {formatAssignDate(viewTask.assignDate)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Assigned by</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">
                                        {formatAssignedByLabel(viewTask.assignedBy)}
                                    </p>
                                    {viewTask.assignedBy?.email ? (
                                        <p className="mt-0.5 text-xs text-gray-500">
                                            {viewTask.assignedBy.email}
                                        </p>
                                    ) : null}
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Due date</p>
                                    <p
                                        className={`mt-1 text-sm font-semibold ${
                                            viewTask.isOverdue ? "text-red-600" : "text-gray-900"
                                        }`}
                                    >
                                        {formatTaskDate(viewTask.dueDate)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Priority</p>
                                    <div className="mt-1">
                                        <span
                                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getPriorityStyles(viewTask.priority)}`}
                                        >
                                            {viewTask.priority}
                                        </span>
                                    </div>
                                </div>
                                <div className="sm:col-span-1">
                                    <p className="text-xs font-medium text-gray-500">Status</p>
                                    <div className="mt-1">
                                        <span
                                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyles(viewTask.status)}`}
                                        >
                                            {getStatusLabel(viewTask.status)}
                                        </span>
                                    </div>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-xs font-medium text-gray-500">Title</p>
                                    <p className="mt-1 break-words text-sm font-semibold text-gray-900">
                                        {viewTask.title}
                                    </p>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-xs font-medium text-gray-500">Description</p>
                                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-700">
                                        {viewTask.description || "—"}
                                    </p>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-xs font-medium text-gray-500">Assigned to</p>
                                    {viewTask.assignees && viewTask.assignees.length > 0 ? (
                                        <ul className="mt-2 space-y-2">
                                            {viewTask.assignees.map((a) => (
                                                <li
                                                    key={a.employee_id}
                                                    className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-800"
                                                >
                                                    <span className="font-semibold">{a.full_name}</span>
                                                    <span className="mt-0.5 block text-xs text-gray-500">
                                                        {a.employee_id}
                                                        {a.department ? ` · ${a.department}` : ""}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="mt-1 text-sm font-semibold text-gray-900">
                                            {assigneeSummary(viewTask)}
                                        </p>
                                    )}
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-xs font-medium text-gray-500">Remarks</p>
                                    {viewTask.remarks && viewTask.remarks.length > 0 ? (
                                        <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto">
                                            {viewTask.remarks.map((r) => (
                                                <li
                                                    key={r.id}
                                                    className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2.5"
                                                >
                                                    <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                                                        {r.remark}
                                                    </p>
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        {r.employeeName} · {formatRemarkDateTime(r.createdAt)}
                                                    </p>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="mt-1 text-sm text-gray-500">No remarks yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex shrink-0 flex-col gap-2 border-t border-gray-100 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6">
                            {canEmployeeUpdateTask(viewTask) ? (
                                <button
                                    type="button"
                                    onClick={() => openUpdateModal(viewTask)}
                                    className="min-h-11 w-full cursor-pointer rounded-md border border-[#0a2a5e]/20 bg-white px-6 py-2.5 text-sm font-semibold text-[#0a2a5e] shadow-sm hover:bg-[#06b6d4]/5 sm:w-auto"
                                >
                                    Update task
                                </button>
                            ) : null}
                            <button
                                type="button"
                                onClick={closeModal}
                                className="min-h-11 w-full cursor-pointer rounded-md bg-[#06b6d4] px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#05a8b8] sm:w-auto"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {viewTask && modalMode === "update" && canEmployeeUpdateTask(viewTask) && (
                <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:px-4 sm:py-6">
                    <div
                        className="absolute inset-0 bg-black/40"
                        aria-hidden
                        onClick={closeModal}
                    />
                    <div
                        role="dialog"
                        aria-modal="true"
                        className="relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-lg border border-gray-200 bg-white shadow-2xl sm:max-h-[min(90vh,640px)] sm:rounded-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex shrink-0 flex-col items-center pt-2 sm:hidden">
                            <span className="h-1 w-10 rounded-full bg-gray-300" aria-hidden />
                        </div>
                        <div
                            className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6"
                            style={{
                                background:
                                    "linear-gradient(135deg, #06124f 0%, #0a2a5e 55%, #0d3a7a 100%)",
                            }}
                        >
                            <div className="min-w-0">
                                <h3 className="text-lg font-bold text-white">Update task</h3>
                                <p className="truncate text-xs text-white/80">{viewTask.id}</p>
                            </div>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-md text-white/80 transition hover:bg-white/10 hover:text-white"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6">
                            <p className="mb-4 text-sm font-semibold text-gray-900">{viewTask.title}</p>

                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="task-update-status" className={labelClass}>
                                        Status
                                    </label>
                                    <select
                                        id="task-update-status"
                                        value={editStatus}
                                        onChange={(e) =>
                                            setEditStatus(e.target.value as TaskStatus)
                                        }
                                        className={`${selectClass} w-full touch-manipulation`}
                                    >
                                        {EMPLOYEE_TASK_STATUSES.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="task-update-remark" className={labelClass}>
                                        Add remark
                                    </label>
                                    <textarea
                                        id="task-update-remark"
                                        value={editRemark}
                                        onChange={(e) => setEditRemark(e.target.value)}
                                        placeholder="Write your update or notes for this task…"
                                        rows={4}
                                        className={`${textareaClass} w-full touch-manipulation`}
                                    />
                                </div>

                                {viewTask.remarks && viewTask.remarks.length > 0 ? (
                                    <div>
                                        <p className={labelClass}>Previous remarks</p>
                                        <ul className="max-h-40 space-y-2 overflow-y-auto">
                                            {viewTask.remarks.map((r) => (
                                                <li
                                                    key={r.id}
                                                    className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                                                >
                                                    <p className="whitespace-pre-wrap break-words">
                                                        {r.remark}
                                                    </p>
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        {r.employeeName} ·{" "}
                                                        {formatRemarkDateTime(r.createdAt)}
                                                    </p>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : null}
                            </div>

                            {saveError ? (
                                <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                    {saveError}
                                </p>
                            ) : null}
                        </div>
                        <div className="flex shrink-0 flex-col gap-2 border-t border-gray-100 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6">
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={saveLoading}
                                className="min-h-11 w-full cursor-pointer rounded-md border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => void handleSaveUpdate()}
                                disabled={saveLoading}
                                className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-[#06b6d4] px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#05a8b8] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                            >
                                {saveLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                        Saving…
                                    </>
                                ) : (
                                    "Save update"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function EmployeeTasksPage() {
    return <EmployeeTasksPageContent variant="my" />;
}
