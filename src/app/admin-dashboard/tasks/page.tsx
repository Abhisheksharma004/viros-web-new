"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eye, Loader2, MessageSquare, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import {
    PRIORITY_FILTERS,
    STATUS_FILTERS,
    formatAssignDate,
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
    type TaskPriority,
    type TaskRow,
    type TaskStatus,
} from "@/lib/adminTaskUiShared";

type ModalMode = "add" | "edit" | "view" | "remarks" | null;

type EmployeeOption = {
    employee_id: string;
    full_name: string;
    department: string | null;
};

export default function AdminTasksPage() {
    const [tasks, setTasks] = useState<TaskRow[]>([]);
    const [tasksLoading, setTasksLoading] = useState(true);
    const [tasksError, setTasksError] = useState("");
    const [saveError, setSaveError] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
    const [employeeFilter, setEmployeeFilter] = useState("all");
    const [dueDateFrom, setDueDateFrom] = useState("");
    const [dueDateTo, setDueDateTo] = useState("");
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
    const [viewTask, setViewTask] = useState<TaskRow | null>(null);
    const [formValues, setFormValues] = useState({
        title: "",
        priority: "medium" as TaskPriority,
        status: "pending" as TaskStatus,
        dueDate: "",
        description: "",
    });
    const [selectedAssignees, setSelectedAssignees] = useState<EmployeeOption[]>([]);
    const [assigneeQuery, setAssigneeQuery] = useState("");
    const [employees, setEmployees] = useState<EmployeeOption[]>([]);
    const [employeesLoading, setEmployeesLoading] = useState(false);
    const [assigneeOpen, setAssigneeOpen] = useState(false);
    const assigneeWrapRef = useRef<HTMLDivElement>(null);
    const assigneeLookupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const employeeFilterOptions = useMemo(() => {
        const byId = new Map<string, string>();
        for (const emp of employees) {
            byId.set(emp.employee_id, emp.full_name);
        }
        for (const task of tasks) {
            for (const a of task.assignees ?? []) {
                if (!byId.has(a.employee_id)) {
                    byId.set(a.employee_id, a.full_name);
                }
            }
        }
        return Array.from(byId.entries())
            .map(([employee_id, full_name]) => ({ employee_id, full_name }))
            .sort((a, b) => a.full_name.localeCompare(b.full_name));
    }, [employees, tasks]);

    const filteredTasks = useMemo(() => {
        const q = search.trim().toLowerCase();
        return tasks.filter((task) => {
            if (statusFilter === "overdue") {
                if (!task.isOverdue) return false;
            } else if (statusFilter !== "all" && task.status !== statusFilter) {
                return false;
            }
            if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
            if (employeeFilter !== "all") {
                const hasEmployee = (task.assignees ?? []).some(
                    (a) => a.employee_id === employeeFilter,
                );
                if (!hasEmployee) return false;
            }
            if (dueDateFrom && (!task.dueDate || task.dueDate < dueDateFrom)) return false;
            if (dueDateTo && (!task.dueDate || task.dueDate > dueDateTo)) return false;
            if (!q) return true;
            return (
                task.id.toLowerCase().includes(q) ||
                task.title.toLowerCase().includes(q) ||
                task.assignee.toLowerCase().includes(q) ||
                task.department.toLowerCase().includes(q)
            );
        });
    }, [tasks, search, statusFilter, priorityFilter, employeeFilter, dueDateFrom, dueDateTo]);

    const stats = useMemo(
        () => [
            { label: "Total Tasks", value: String(tasks.length), tone: "text-[#0a2a5e]" },
            { label: "Pending", value: String(tasks.filter((t) => t.status === "pending").length), tone: "text-amber-600" },
            {
                label: "In Progress",
                value: String(tasks.filter((t) => t.status === "in-progress").length),
                tone: "text-[#06b6d4]",
            },
            {
                label: "Completed",
                value: String(tasks.filter((t) => t.status === "completed").length),
                tone: "text-green-600",
            },
            { label: "Overdue", value: String(tasks.filter((t) => t.isOverdue).length), tone: "text-red-600" },
        ],
        [tasks],
    );

    const loadTasks = useCallback(async () => {
        try {
            setTasksLoading(true);
            setTasksError("");
            const resp = await fetch("/api/admin/tasks", { cache: "no-store" });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to load tasks");
            }
            setTasks(Array.isArray(data) ? (data as TaskRow[]) : []);
        } catch (error) {
            console.error("Error loading tasks:", error);
            setTasksError(error instanceof Error ? error.message : "Failed to load tasks");
            setTasks([]);
        } finally {
            setTasksLoading(false);
        }
    }, []);

    const loadEmployees = useCallback(async () => {
        try {
            setEmployeesLoading(true);
            const resp = await fetch("/api/admin/employees", { cache: "no-store" });
            const data = await resp.json().catch(() => []);
            if (!resp.ok) return;
            const rows: EmployeeOption[] = Array.isArray(data)
                ? data.map((r: { employee_id: string; full_name: string; department: string | null }) => ({
                      employee_id: r.employee_id,
                      full_name: r.full_name,
                      department: r.department,
                  }))
                : [];
            setEmployees(rows);
        } catch {
            setEmployees([]);
        } finally {
            setEmployeesLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadTasks();
        void loadEmployees();
    }, [loadTasks, loadEmployees]);

    useEffect(() => {
        if (modalMode !== "add" && modalMode !== "edit") return;
        void loadEmployees();
    }, [modalMode, loadEmployees]);

    const assigneeSuggestions = useMemo(() => {
        const selectedIds = new Set(selectedAssignees.map((e) => e.employee_id));
        const available = employees.filter((e) => !selectedIds.has(e.employee_id));
        const q = assigneeQuery.trim().toLowerCase();
        if (!q) return available.slice(0, 10);
        return available
            .filter(
                (e) =>
                    e.full_name.toLowerCase().includes(q) ||
                    e.employee_id.toLowerCase().includes(q),
            )
            .slice(0, 10);
    }, [employees, assigneeQuery, selectedAssignees]);

    useEffect(() => {
        if (modalMode !== "add" && modalMode !== "edit") return;

        const trimmed = assigneeQuery.trim();
        if (!trimmed || employees.length === 0) return;

        if (assigneeLookupTimerRef.current) clearTimeout(assigneeLookupTimerRef.current);
        assigneeLookupTimerRef.current = setTimeout(() => {
            const exact = employees.find(
                (e) => e.employee_id.toLowerCase() === trimmed.toLowerCase(),
            );
            if (!exact) return;
            setSelectedAssignees((prev) => {
                if (prev.some((e) => e.employee_id === exact.employee_id)) return prev;
                return [...prev, exact];
            });
            setAssigneeQuery("");
        }, 400);

        return () => {
            if (assigneeLookupTimerRef.current) clearTimeout(assigneeLookupTimerRef.current);
        };
    }, [assigneeQuery, modalMode, employees]);

    useEffect(() => {
        if (!assigneeOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (assigneeWrapRef.current && !assigneeWrapRef.current.contains(e.target as Node)) {
                setAssigneeOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [assigneeOpen]);

    const openAddModal = () => {
        setEditingRecordId(null);
        setFormValues({
            title: "",
            priority: "medium",
            status: "pending",
            dueDate: "",
            description: "",
        });
        setSelectedAssignees([]);
        setAssigneeQuery("");
        setAssigneeOpen(false);
        setSaveError("");
        setModalMode("add");
    };

    const openEditModal = (task: TaskRow) => {
        setEditingRecordId(task.recordId);
        setFormValues({
            title: task.title,
            priority: task.priority,
            status: task.status,
            dueDate: task.dueDate,
            description: task.description,
        });
        setSelectedAssignees(
            (task.assignees ?? []).map((a) => ({
                employee_id: a.employee_id,
                full_name: a.full_name,
                department: a.department,
            })),
        );
        setAssigneeQuery("");
        setAssigneeOpen(false);
        setSaveError("");
        setModalMode("edit");
    };

    const openViewModal = (task: TaskRow) => {
        setViewTask(task);
        setModalMode("view");
    };

    const openRemarksModal = (task: TaskRow) => {
        setViewTask(task);
        setModalMode("remarks");
    };

    const closeModal = () => {
        setModalMode(null);
        setEditingRecordId(null);
        setViewTask(null);
        setAssigneeOpen(false);
        setSelectedAssignees([]);
        setAssigneeQuery("");
        setSaveError("");
    };

    const isFormModal = modalMode === "add" || modalMode === "edit";

    const addAssignee = (employee: EmployeeOption) => {
        setSelectedAssignees((prev) => {
            if (prev.some((e) => e.employee_id === employee.employee_id)) return prev;
            return [...prev, employee];
        });
        setAssigneeQuery("");
        setAssigneeOpen(true);
    };

    const removeAssignee = (employeeId: string) => {
        setSelectedAssignees((prev) => prev.filter((e) => e.employee_id !== employeeId));
    };

    const handleSaveTask = async () => {
        const title = formValues.title.trim();
        if (!title) {
            setSaveError("Task title is required.");
            return;
        }
        if (selectedAssignees.length === 0) {
            setSaveError("Select at least one assignee.");
            return;
        }

        const payload = {
            title,
            description: formValues.description.trim(),
            priority: formValues.priority,
            dueDate: formValues.dueDate,
            assignees: selectedAssignees.map((e) => ({
                employee_id: e.employee_id,
                full_name: e.full_name,
                department: e.department,
            })),
        };

        try {
            setIsSaving(true);
            setSaveError("");
            const isEdit = modalMode === "edit" && editingRecordId !== null;
            const resp = await fetch(
                isEdit ? `/api/admin/tasks/${editingRecordId}` : "/api/admin/tasks",
                {
                    method: isEdit ? "PATCH" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(
                        isEdit ? { ...payload, status: formValues.status } : payload,
                    ),
                },
            );
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(
                    typeof data.message === "string"
                        ? data.message
                        : isEdit
                          ? "Failed to update task"
                          : "Failed to save task",
                );
            }
            closeModal();
            await loadTasks();
        } catch (error) {
            console.error("Error saving task:", error);
            setSaveError(error instanceof Error ? error.message : "Failed to save task");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteTask = async (task: TaskRow) => {
        if (!window.confirm(`Delete task "${task.title}"?`)) return;

        try {
            setDeletingId(task.recordId);
            const resp = await fetch(`/api/admin/tasks/${task.recordId}`, { method: "DELETE" });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to delete task");
            }
            if (viewTask?.recordId === task.recordId) closeModal();
            await loadTasks();
        } catch (error) {
            console.error("Error deleting task:", error);
            window.alert(error instanceof Error ? error.message : "Failed to delete task");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4">
                <button
                    type="button"
                    onClick={openAddModal}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#06124f] to-[#0a2a5e] hover:opacity-90 transition-opacity shadow-sm"
                >
                    <Plus className="w-4 h-4" aria-hidden />
                    Add Task
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                {stats.map((item) => (
                    <div key={item.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{item.label}</p>
                        <p className={`text-3xl font-black mt-2 ${item.tone}`}>{item.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1fr)_1.5rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.05fr)] items-center gap-2">
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    className={`${selectClass} min-w-0`}
                >
                    {STATUS_FILTERS.map((f) => (
                        <option key={f.id} value={f.id}>
                            {f.label === "All" ? "All statuses" : f.label}
                        </option>
                    ))}
                </select>
                <select
                    value={employeeFilter}
                    onChange={(e) => setEmployeeFilter(e.target.value)}
                    className={`${selectClass} min-w-0`}
                >
                    <option value="all">All employees</option>
                    {employeeFilterOptions.map((emp) => (
                        <option key={emp.employee_id} value={emp.employee_id}>
                            {emp.full_name} ({emp.employee_id})
                        </option>
                    ))}
                </select>
                <input
                    type="date"
                    value={dueDateFrom}
                    onChange={(e) => setDueDateFrom(e.target.value)}
                    className={`${inputClass} min-w-0`}
                    aria-label="Due date from"
                    title="Due date from"
                />
                <span className="text-center text-xs font-semibold text-gray-500">to</span>
                <input
                    type="date"
                    value={dueDateTo}
                    onChange={(e) => setDueDateTo(e.target.value)}
                    className={`${inputClass} min-w-0`}
                    aria-label="Due date to"
                    title="Due date to"
                />
                <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
                    className={`${selectClass} min-w-0`}
                >
                    {PRIORITY_FILTERS.map((f) => (
                        <option key={f.id} value={f.id}>
                            {f.label}
                        </option>
                    ))}
                </select>
                <div className="relative min-w-0">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="search"
                        placeholder="Search…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={`${inputClass} w-full min-w-0 pl-9`}
                    />
                </div>
            </div>

            {tasksError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {tasksError}
                </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h2 className="text-base font-bold text-gray-900">Task directory</h2>
                    <div className="text-xs text-gray-500">
                        Showing {filteredTasks.length} of {tasks.length} tasks
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Task ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Title
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Assignee
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Department
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Priority / Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Due date
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {tasksLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-sm text-gray-500">
                                        <span className="inline-flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                            Loading tasks…
                                        </span>
                                    </td>
                                </tr>
                            ) : filteredTasks.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-sm text-gray-500">
                                        {tasks.length === 0
                                            ? "No tasks yet. Click Add Task to create one."
                                            : "No tasks match your filters."}
                                    </td>
                                </tr>
                            ) : (
                                filteredTasks.map((task) => (
                                    <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="text-sm font-semibold text-[#0a2a5e]">{task.id}</p>
                                            <p className="mt-0.5 text-xs text-gray-500">
                                                {formatAssignDate(task.assignDate)}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold text-gray-900">{task.title}</p>
                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{task.assignee}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{task.department}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-start gap-1.5">
                                                <span
                                                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getPriorityStyles(task.priority)}`}
                                                >
                                                    {task.priority}
                                                </span>
                                                <span
                                                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusStyles(task.status)}`}
                                                >
                                                    {getStatusLabel(task.status)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`text-sm font-semibold ${
                                                    task.isOverdue ? "text-red-600" : "text-gray-700"
                                                }`}
                                            >
                                                {formatTaskDate(task.dueDate)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="mx-auto grid w-[5.25rem] grid-cols-2 gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => openViewModal(task)}
                                                    className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50"
                                                    title="View task"
                                                    aria-label="View task"
                                                >
                                                    <Eye className="h-4 w-4" aria-hidden />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openRemarksModal(task)}
                                                    className="relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-[#0a2a5e] shadow-sm transition hover:bg-slate-50"
                                                    title="View remarks"
                                                    aria-label="View remarks"
                                                >
                                                    <MessageSquare className="h-4 w-4" aria-hidden />
                                                    {(task.remarks?.length ?? 0) > 0 ? (
                                                        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#06b6d4] px-1 text-[10px] font-bold text-white">
                                                            {task.remarks!.length}
                                                        </span>
                                                    ) : null}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(task)}
                                                    className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-[#0a2a5e] shadow-sm transition hover:bg-slate-50"
                                                    title="Edit task"
                                                    aria-label="Edit task"
                                                >
                                                    <Pencil className="h-4 w-4" aria-hidden />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => void handleDeleteTask(task)}
                                                    disabled={deletingId === task.recordId}
                                                    className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-700 shadow-sm transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                    title="Delete task"
                                                    aria-label="Delete task"
                                                >
                                                    {deletingId === task.recordId ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" aria-hidden />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {modalMode === "remarks" && viewTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
                        aria-hidden
                        onClick={closeModal}
                    />
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="task-remarks-title"
                        className="relative flex max-h-[min(85vh,560px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-100 bg-gradient-to-r from-[#06124f] to-[#0a2a5e] px-6 py-4">
                            <div className="min-w-0">
                                <h3 id="task-remarks-title" className="text-lg font-bold text-white">
                                    Task remarks
                                </h3>
                                <p className="truncate text-xs text-cyan-100/90">
                                    {viewTask.id} · {viewTask.title}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="shrink-0 cursor-pointer rounded-lg p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" strokeWidth={2} />
                            </button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                            {viewTask.remarks && viewTask.remarks.length > 0 ? (
                                <ul className="space-y-3">
                                    {viewTask.remarks.map((r) => (
                                        <li
                                            key={r.id}
                                            className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                                        >
                                            <p className="whitespace-pre-wrap break-words text-sm text-gray-800">
                                                {r.remark}
                                            </p>
                                            <p className="mt-2 text-xs font-medium text-gray-500">
                                                {r.employeeName}
                                                {r.employeeId ? (
                                                    <span className="font-normal text-gray-400">
                                                        {" "}
                                                        ({r.employeeId})
                                                    </span>
                                                ) : null}
                                            </p>
                                            <p className="mt-0.5 text-xs text-gray-400">
                                                {formatRemarkDateTime(r.createdAt)}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <MessageSquare
                                        className="h-10 w-10 text-gray-300"
                                        aria-hidden
                                    />
                                    <p className="mt-3 text-sm font-semibold text-gray-700">
                                        No remarks yet
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Employees can add remarks when they update a task.
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="flex shrink-0 justify-end border-t border-gray-100 px-6 py-4">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="cursor-pointer rounded-lg bg-[#001540] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modalMode === "view" && viewTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" aria-hidden onClick={closeModal} />
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="task-view-title"
                        className="relative flex max-h-[min(90vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-100 px-6 py-5">
                            <h3 id="task-view-title" className="text-lg font-bold tracking-tight text-[#001540]">
                                Task details
                            </h3>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="shrink-0 cursor-pointer rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" strokeWidth={2} />
                            </button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Task ID</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">{viewTask.id}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Assign date</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">
                                        {formatAssignDate(viewTask.assignDate)}
                                    </p>
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
                                <div className="sm:col-span-2">
                                    <p className="text-xs font-medium text-gray-500">Title</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900 break-words">{viewTask.title}</p>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-xs font-medium text-gray-500">Description</p>
                                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-700">
                                        {viewTask.description}
                                    </p>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-xs font-medium text-gray-500">Assignees</p>
                                    {viewTask.assignees && viewTask.assignees.length > 0 ? (
                                        <ul className="mt-2 space-y-1.5">
                                            {viewTask.assignees.map((a) => (
                                                <li
                                                    key={a.employee_id}
                                                    className="text-sm font-semibold text-gray-900"
                                                >
                                                    {a.full_name}
                                                    <span className="ml-1 font-normal text-gray-500">
                                                        ({a.employee_id}
                                                        {a.department ? ` · ${a.department}` : ""})
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="mt-1 text-sm font-semibold text-gray-900">{viewTask.assignee}</p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Department</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">{viewTask.department}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Priority</p>
                                    <div className="mt-1">
                                        <span
                                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getPriorityStyles(viewTask.priority)}`}
                                        >
                                            {viewTask.priority}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Status</p>
                                    <div className="mt-1">
                                        <span
                                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusStyles(viewTask.status)}`}
                                        >
                                            {getStatusLabel(viewTask.status)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex shrink-0 justify-end gap-2 border-t border-gray-100 px-6 py-4">
                            <button
                                type="button"
                                onClick={() => {
                                    const task = viewTask;
                                    closeModal();
                                    if (task) openEditModal(task);
                                }}
                                className="cursor-pointer rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                            >
                                Edit
                            </button>
                            <button
                                type="button"
                                onClick={() => void handleDeleteTask(viewTask)}
                                disabled={deletingId === viewTask.recordId}
                                className="cursor-pointer rounded-lg border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Delete
                            </button>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="cursor-pointer rounded-lg bg-[#001540] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isFormModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" aria-hidden onClick={closeModal} />
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="task-form-title"
                        className="relative flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-100 bg-gradient-to-r from-[#06124f] to-[#0a2a5e] px-6 py-4">
                            <div className="min-w-0">
                                <h3 id="task-form-title" className="text-lg font-bold text-white">
                                    {modalMode === "edit" ? "Edit task" : "Add task"}
                                </h3>
                                <p className="mt-0.5 text-xs text-cyan-100/90">
                                    {modalMode === "edit"
                                        ? "Update assignees, priority, status, and due date."
                                        : "Assign work and set priority and due date."}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="shrink-0 cursor-pointer rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form
                            className="flex flex-1 flex-col gap-4 overflow-y-auto p-6"
                            onSubmit={(e) => {
                                e.preventDefault();
                                void handleSaveTask();
                            }}
                        >
                            {saveError && (
                                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                    {saveError}
                                </p>
                            )}
                            <div ref={assigneeWrapRef} className="relative">
                                <label htmlFor="task-assignee" className={labelClass}>
                                    Assignees
                                </label>
                                <div
                                    className={`relative flex min-h-11 flex-wrap items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2 py-1.5 shadow-sm focus-within:border-[#0a2a5e] focus-within:ring-2 focus-within:ring-[#0a2a5e]/20 ${
                                        selectedAssignees.length === 0 ? "pr-10" : "pr-2"
                                    }`}
                                >
                                    {selectedAssignees.map((employee) => (
                                        <span
                                            key={employee.employee_id}
                                            className="inline-flex max-w-full items-center gap-1 rounded-md bg-[#0a2a5e]/10 px-2 py-1 text-xs font-semibold text-[#0a2a5e]"
                                        >
                                            <span className="truncate">
                                                {employee.full_name}
                                                <span className="font-normal text-[#0a2a5e]/70">
                                                    {" "}
                                                    ({employee.employee_id})
                                                </span>
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeAssignee(employee.employee_id)}
                                                className="shrink-0 cursor-pointer rounded p-0.5 text-[#0a2a5e]/70 hover:bg-[#0a2a5e]/10 hover:text-[#0a2a5e]"
                                                aria-label={`Remove ${employee.full_name}`}
                                            >
                                                <X className="h-3 w-3" strokeWidth={2.5} />
                                            </button>
                                        </span>
                                    ))}
                                    <input
                                        id="task-assignee"
                                        type="text"
                                        autoComplete="off"
                                        value={assigneeQuery}
                                        onChange={(e) => {
                                            setAssigneeQuery(e.target.value);
                                            setAssigneeOpen(true);
                                        }}
                                        onFocus={() => setAssigneeOpen(true)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Backspace" && !assigneeQuery && selectedAssignees.length > 0) {
                                                const last = selectedAssignees[selectedAssignees.length - 1];
                                                removeAssignee(last.employee_id);
                                            }
                                        }}
                                        className="min-w-[140px] flex-1 border-0 bg-transparent px-1 py-1.5 text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400"
                                        placeholder={
                                            selectedAssignees.length
                                                ? "Add another employee…"
                                                : "Type name or employee ID"
                                        }
                                        role="combobox"
                                        aria-expanded={assigneeOpen}
                                        aria-autocomplete="list"
                                        aria-controls="task-assignee-listbox"
                                    />
                                    {employeesLoading && (
                                        <Loader2
                                            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400"
                                            aria-hidden
                                        />
                                    )}
                                </div>
                                {assigneeOpen && assigneeSuggestions.length > 0 && (
                                    <ul
                                        id="task-assignee-listbox"
                                        role="listbox"
                                        className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                                    >
                                        {assigneeSuggestions.map((employee) => (
                                            <li key={employee.employee_id} role="option">
                                                <button
                                                    type="button"
                                                    className="flex w-full cursor-pointer flex-col px-3 py-2 text-left hover:bg-gray-50"
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={() => addAssignee(employee)}
                                                >
                                                    <span className="text-sm font-semibold text-gray-900">
                                                        {employee.full_name}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {employee.employee_id}
                                                        {employee.department ? ` · ${employee.department}` : ""}
                                                    </span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {assigneeOpen &&
                                    !employeesLoading &&
                                    assigneeQuery.trim() &&
                                    assigneeSuggestions.length === 0 && (
                                        <p className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500 shadow-lg">
                                            No employee found. Check name or ID.
                                        </p>
                                    )}
                            </div>
                            <div>
                                <label htmlFor="task-title" className={labelClass}>
                                    Title
                                </label>
                                <input
                                    id="task-title"
                                    required
                                    value={formValues.title}
                                    onChange={(e) => setFormValues((v) => ({ ...v, title: e.target.value }))}
                                    className={inputClass}
                                    placeholder="Task title"
                                />
                            </div>
                            <div
                                className={`grid grid-cols-1 gap-4 ${modalMode === "edit" ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
                            >
                                <div className="min-w-0">
                                    <label htmlFor="task-priority" className={labelClass}>
                                        Priority
                                    </label>
                                    <select
                                        id="task-priority"
                                        value={formValues.priority}
                                        onChange={(e) =>
                                            setFormValues((v) => ({
                                                ...v,
                                                priority: e.target.value as TaskPriority,
                                            }))
                                        }
                                        className={selectClass}
                                    >
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                    </select>
                                </div>
                                {modalMode === "edit" && (
                                    <div className="min-w-0">
                                        <label htmlFor="task-status" className={labelClass}>
                                            Status
                                        </label>
                                        <select
                                            id="task-status"
                                            value={formValues.status}
                                            onChange={(e) =>
                                                setFormValues((v) => ({
                                                    ...v,
                                                    status: e.target.value as TaskStatus,
                                                }))
                                            }
                                            className={selectClass}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="completed">Completed</option>
                                            <option value="overdue">Overdue</option>
                                        </select>
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <label htmlFor="task-due" className={labelClass}>
                                        Due date
                                    </label>
                                    <input
                                        id="task-due"
                                        type="date"
                                        value={formValues.dueDate}
                                        onChange={(e) => setFormValues((v) => ({ ...v, dueDate: e.target.value }))}
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="task-desc" className={labelClass}>
                                    Description
                                </label>
                                <textarea
                                    id="task-desc"
                                    rows={3}
                                    value={formValues.description}
                                    onChange={(e) => setFormValues((v) => ({ ...v, description: e.target.value }))}
                                    className={`${inputClass} min-h-[88px] resize-none py-2.5`}
                                    placeholder="Task details…"
                                />
                            </div>
                            <div className="mt-auto flex justify-end gap-3 border-t border-gray-100 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="cursor-pointer rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#001540] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSaving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                                    {isSaving
                                        ? "Saving…"
                                        : modalMode === "edit"
                                          ? "Update task"
                                          : "Save task"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
