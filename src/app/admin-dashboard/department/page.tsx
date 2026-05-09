"use client";

const departments = [
    { name: "Sales", head: "Rahul Sharma", employees: 12, status: "Active", budget: "₹8,50,000" },
    { name: "IT", head: "Amit Kumar", employees: 10, status: "Active", budget: "₹12,00,000" },
    { name: "HR", head: "Priya Patel", employees: 6, status: "Active", budget: "₹4,20,000" },
    { name: "Marketing", head: "Sneha Joshi", employees: 8, status: "Active", budget: "₹6,75,000" },
    { name: "Finance", head: "Vikram Singh", employees: 7, status: "Active", budget: "₹5,90,000" },
    { name: "Operations", head: "Neha Verma", employees: 5, status: "Growing", budget: "₹3,60,000" },
];

const departmentStats = [
    { label: "Total Departments", value: "6", tone: "text-[#0a2a5e]" },
    { label: "Total Team Members", value: "48", tone: "text-[#06b6d4]" },
    { label: "Avg Team Size", value: "8", tone: "text-purple-600" },
    { label: "Monthly Budget", value: "₹41.95L", tone: "text-green-600" },
];

export default function DepartmentPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Departments</h1>
                    <p className="text-sm text-gray-500 mt-1">Overview of all departments, team heads and allocation.</p>
                </div>
                <button
                    type="button"
                    className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#06124f] to-[#0a2a5e] hover:opacity-90 transition-opacity"
                >
                    Add Department
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {departmentStats.map((item) => (
                    <div key={item.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{item.label}</p>
                        <p className={`text-3xl font-black mt-2 ${item.tone}`}>{item.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-base font-bold text-gray-900">Department Directory</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Department</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Department Head</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Employees</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Monthly Budget</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {departments.map((department) => (
                                <tr key={department.name} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{department.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{department.head}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{department.employees}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{department.budget}</td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                department.status === "Active"
                                                    ? "bg-green-50 text-green-700"
                                                    : "bg-blue-50 text-blue-700"
                                            }`}
                                        >
                                            {department.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
