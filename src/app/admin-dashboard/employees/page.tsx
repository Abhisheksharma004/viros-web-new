"use client";

import { useState } from "react";

const employeeStats = [
    { label: "Total Employees", value: "48", tone: "text-[#0a2a5e]" },
    { label: "Active Today", value: "42", tone: "text-green-600" },
    { label: "On Leave", value: "4", tone: "text-amber-600" },
    { label: "New This Month", value: "3", tone: "text-[#06b6d4]" },
];

const employees = [
    { id: "EMP-1001", name: "Rahul Sharma", role: "Sales Manager", department: "Sales", email: "rahul@viros.com", status: "Active" },
    { id: "EMP-1002", name: "Priya Patel", role: "HR Executive", department: "HR", email: "priya@viros.com", status: "Active" },
    { id: "EMP-1003", name: "Amit Kumar", role: "Tech Lead", department: "IT", email: "amit@viros.com", status: "Active" },
    { id: "EMP-1004", name: "Sneha Joshi", role: "UI/UX Designer", department: "Marketing", email: "sneha@viros.com", status: "On Leave" },
    { id: "EMP-1005", name: "Vikram Singh", role: "Finance Analyst", department: "Finance", email: "vikram@viros.com", status: "Active" },
    { id: "EMP-1006", name: "Neha Verma", role: "Operations Executive", department: "Operations", email: "neha@viros.com", status: "Probation" },
];

export default function AdminEmployeesPage() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formValues, setFormValues] = useState({
        fullName: "",
        employeeId: "",
        role: "",
        department: "",
        email: "",
        status: "Active",
    });

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        setFormValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleAddEmployee = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsAddModalOpen(false);
        setFormValues({
            fullName: "",
            employeeId: "",
            role: "",
            department: "",
            email: "",
            status: "Active",
        });
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Employees</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage employee records, status and department details.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setIsAddModalOpen(true)}
                        className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#06124f] to-[#0a2a5e] hover:opacity-90 transition-opacity"
                    >
                        Add Employee
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {employeeStats.map((item) => (
                    <div key={item.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{item.label}</p>
                        <p className={`text-3xl font-black mt-2 ${item.tone}`}>{item.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h2 className="text-base font-bold text-gray-900">Employee Directory</h2>
                    <div className="text-xs text-gray-500">Showing {employees.length} employees</div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Employee</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Department</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {employees.map((employee) => (
                                <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{employee.name}</p>
                                            <p className="text-xs text-gray-400">{employee.id}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{employee.role}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{employee.department}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{employee.email}</td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                employee.status === "Active"
                                                    ? "bg-green-50 text-green-700"
                                                    : employee.status === "On Leave"
                                                    ? "bg-amber-50 text-amber-700"
                                                    : "bg-blue-50 text-blue-700"
                                            }`}
                                        >
                                            {employee.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setIsAddModalOpen(false)}
                    />
                    <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Add Employee</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Create a new employee profile.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleAddEmployee} className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                                    <input
                                        name="fullName"
                                        value={formValues.fullName}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e]"
                                        placeholder="Enter employee name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Employee ID</label>
                                    <input
                                        name="employeeId"
                                        value={formValues.employeeId}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e]"
                                        placeholder="EMP-1007"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Department</label>
                                    <input
                                        name="department"
                                        value={formValues.department}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e]"
                                        placeholder="Sales / HR / IT"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role</label>
                                    <input
                                        name="role"
                                        value={formValues.role}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e]"
                                        placeholder="Job title"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                                    <input
                                        name="email"
                                        type="email"
                                        value={formValues.email}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e]"
                                        placeholder="employee@viros.com"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                                    <select
                                        name="status"
                                        value={formValues.status}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e]"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="On Leave">On Leave</option>
                                        <option value="Probation">Probation</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#06124f] to-[#0a2a5e] hover:opacity-90 transition-opacity"
                                >
                                    Save Employee
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
