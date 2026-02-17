"use client";

import { useState, useEffect, useRef } from "react";
import ExcelJS from 'exceljs';

export default function WarrantyManagementPage() {
    const [warranties, setWarranties] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWarranty, setEditingWarranty] = useState<any>(null);
    const [viewingWarranty, setViewingWarranty] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        serial_number: "",
        product_name: "",
        warranty_type: "",
        purchase_date: "",
        expiry_date: "",
        customer_name: "",
        customer_email: "",
        customer_phone: ""
    });

    useEffect(() => {
        fetchWarranties();
    }, []);

    const fetchWarranties = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/warranties');
            const data = await response.json();
            setWarranties(data);
        } catch (err) {
            setError('Failed to fetch warranties');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (warranty: any = null) => {
        if (warranty) {
            setEditingWarranty(warranty);
            setFormData({
                serial_number: warranty.serial_number,
                product_name: warranty.product_name,
                warranty_type: warranty.warranty_type,
                purchase_date: warranty.purchase_date ? warranty.purchase_date.split('T')[0] : "",
                expiry_date: warranty.expiry_date.split('T')[0],
                customer_name: warranty.customer_name || "",
                customer_email: warranty.customer_email || "",
                customer_phone: warranty.customer_phone || ""
            });
        } else {
            setEditingWarranty(null);
            setFormData({
                serial_number: "",
                product_name: "",
                warranty_type: "",
                purchase_date: "",
                expiry_date: "",
                customer_name: "",
                customer_email: "",
                customer_phone: ""
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingWarranty(null);
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const url = editingWarranty
                ? `/api/warranties/${editingWarranty.id}`
                : '/api/warranties';

            const method = editingWarranty ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save warranty');
            }

            await fetchWarranties();
            handleCloseModal();
        } catch (err: any) {
            alert(err.message || 'Failed to save warranty');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this warranty?')) return;

        try {
            const response = await fetch(`/api/warranties/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete warranty');

            await fetchWarranties();
        } catch (err) {
            alert('Failed to delete warranty');
        }
    };

    // Helper function to convert DD-MM-YYYY to YYYY-MM-DD
    const convertExcelDate = (dateValue: any): string | null => {
        if (!dateValue) return null;

        // If it's already a valid date string in YYYY-MM-DD format
        if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return dateValue;
        }

        // If it's a DD-MM-YYYY format string
        if (typeof dateValue === 'string' && dateValue.match(/^\d{2}-\d{2}-\d{4}$/)) {
            const [day, month, year] = dateValue.split('-');
            return `${year}-${month}-${day}`;
        }

        // If it's an Excel serial number (number of days since 1900-01-01)
        if (typeof dateValue === 'number') {
            const excelEpoch = new Date(1900, 0, 1);
            const date = new Date(excelEpoch.getTime() + (dateValue - 2) * 24 * 60 * 60 * 1000);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        // Try to parse as a date object
        try {
            const date = new Date(dateValue);
            if (!isNaN(date.getTime())) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            }
        } catch (e) {
            // Ignore parsing errors
        }

        return null;
    };

    const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsImporting(true);
            const data = await file.arrayBuffer();
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(data);
            const worksheet = workbook.worksheets[0];
            const jsonData: any[] = [];
            
            // Convert worksheet to JSON
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // Skip header row
                const rowData: any = {};
                row.eachCell((cell, colNumber) => {
                    const header = worksheet.getRow(1).getCell(colNumber).value;
                    rowData[String(header)] = cell.value;
                });
                jsonData.push(rowData);
            });

            let successCount = 0;
            let errorCount = 0;

            for (const row of jsonData) {
                try {
                    const rowData = row as any;
                    const warrantyData = {
                        serial_number: rowData['Serial Number'] || rowData['serial_number'],
                        product_name: rowData['Product Name'] || rowData['product_name'],
                        warranty_type: rowData['Warranty Type'] || rowData['warranty_type'],
                        expiry_date: convertExcelDate(rowData['Expiry Date'] || rowData['expiry_date']),
                        purchase_date: convertExcelDate(rowData['Purchase Date'] || rowData['purchase_date']),
                        customer_name: rowData['Customer Name'] || rowData['customer_name'] || null,
                        customer_email: rowData['Customer Email'] || rowData['customer_email'] || null,
                        customer_phone: rowData['Customer Phone'] || rowData['customer_phone'] || null
                    };

                    // Validate required fields
                    if (!warrantyData.serial_number || !warrantyData.product_name ||
                        !warrantyData.warranty_type || !warrantyData.expiry_date) {
                        errorCount++;
                        continue;
                    }

                    const response = await fetch('/api/warranties', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(warrantyData)
                    });

                    if (response.ok) {
                        successCount++;
                    } else if (response.status === 409) {
                        // Duplicate serial number - skip this record
                        console.log(`Skipped duplicate serial number: ${warrantyData.serial_number}`);
                        errorCount++;
                    } else {
                        errorCount++;
                    }
                } catch (err) {
                    errorCount++;
                }
            }

            await fetchWarranties();
            alert(`Import completed!\nSuccessfully imported: ${successCount}\nSkipped/Failed: ${errorCount}\n\n(Duplicates are skipped automatically)`);

            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err) {
            alert('Failed to import Excel file. Please check the file format.');
        } finally {
            setIsImporting(false);
        }
    };

    const handleDownloadTemplate = async () => {
        // Create sample data for template
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Warranties');

        // Define columns
        worksheet.columns = [
            { header: 'Serial Number', key: 'serial_number', width: 20 },
            { header: 'Product Name', key: 'product_name', width: 30 },
            { header: 'Warranty Type', key: 'warranty_type', width: 20 },
            { header: 'Expiry Date', key: 'expiry_date', width: 15 },
            { header: 'Purchase Date', key: 'purchase_date', width: 15 },
            { header: 'Customer Name', key: 'customer_name', width: 25 },
            { header: 'Customer Email', key: 'customer_email', width: 30 },
            { header: 'Customer Phone', key: 'customer_phone', width: 20 }
        ];

        // Add sample data
        worksheet.addRow({
            serial_number: 'SN-EXAMPLE-001',
            product_name: 'Sample Product',
            warranty_type: 'Standard Warranty',
            expiry_date: '31-12-2026',
            purchase_date: '01-01-2024',
            customer_name: 'John Doe',
            customer_email: 'john@example.com',
            customer_phone: '+1234567890'
        });

        // Style header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF06124f' }
        };
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

        // Download file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'warranty_import_template.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // Calculate warranty stats
    const totalWarranties = warranties.length;
    const activeWarranties = warranties.filter(w => w.status === 'active').length;
    const expiredWarranties = warranties.filter(w => w.status === 'expired').length;

    // Filter warranties
    const filteredWarranties = warranties.filter(warranty => {
        const matchesSearch = warranty.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            warranty.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (warranty.customer_name && warranty.customer_name.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = statusFilter === "all" || warranty.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#06b6d4] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading warranties...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-black text-[#06124f] mb-2">Warranty Management</h1>
                <p className="text-gray-600">Manage product warranties and customer coverage</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Total Warranties Card */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg text-white transform hover:scale-105 transition-transform duration-200">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-blue-100 mb-1">Total Warranties</p>
                            <p className="text-4xl font-bold mb-2">{totalWarranties}</p>
                            <p className="text-xs text-blue-100">All registered warranties</p>
                        </div>
                        <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Active Warranties Card */}
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 shadow-lg text-white transform hover:scale-105 transition-transform duration-200">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-green-100 mb-1">Active Warranties</p>
                            <p className="text-4xl font-bold mb-2">{activeWarranties}</p>
                            <p className="text-xs text-green-100">Currently valid coverage</p>
                        </div>
                        <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Expired Warranties Card */}
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 shadow-lg text-white transform hover:scale-105 transition-transform duration-200">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-orange-100 mb-1">Expired Warranties</p>
                            <p className="text-4xl font-bold mb-2">{expiredWarranties}</p>
                            <p className="text-xs text-orange-100">Coverage ended</p>
                        </div>
                        <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex gap-4 w-full sm:w-auto">
                    <input
                        type="text"
                        placeholder="Search by serial, product, or customer..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 sm:w-80 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400"
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent outline-none text-gray-900"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="expired">Expired</option>
                    </select>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Import from Excel
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="w-full sm:w-auto px-6 py-2 bg-[#06124f] text-white font-bold rounded-lg hover:bg-[#06b6d4] transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add New Warranty
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                    {error}
                </div>
            )}

            {/* Warranties Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Serial Number</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Expiry Date</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredWarranties.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <p className="text-lg font-semibold mb-2">No warranties found</p>
                                            <p className="text-sm text-gray-400">Add your first warranty to get started</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredWarranties.map((warranty) => (
                                    <tr key={warranty.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-mono text-sm font-semibold text-gray-900">{warranty.serial_number}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-900">{warranty.product_name}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${warranty.status === 'active'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-orange-100 text-orange-800'
                                                }`}>
                                                {warranty.status === 'active' ? '✓ Active' : '⚠ Expired'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {warranty.warranty_type}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {new Date(warranty.expiry_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {warranty.customer_name || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => setViewingWarranty(warranty)}
                                                className="text-[#06124f] hover:text-[#06b6d4] mr-4 font-semibold"
                                            >
                                                View
                                            </button>
                                            <button
                                                onClick={() => handleOpenModal(warranty)}
                                                className="text-[#06b6d4] hover:text-[#06124f] mr-4 font-semibold"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(warranty.id)}
                                                className="text-red-600 hover:text-red-900 font-semibold"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={handleCloseModal}></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full z-50">
                            <div className="bg-white px-6 pt-6 pb-4">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-2xl font-black text-[#06124f]">
                                        {editingWarranty ? 'Edit Warranty' : 'Add New Warranty'}
                                    </h3>
                                    <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Serial Number *</label>
                                        <input
                                            type="text"
                                            value={formData.serial_number}
                                            onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent outline-none font-mono text-gray-900 placeholder:text-gray-400"
                                            placeholder="SN-VIROS-XXX"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Product Name *</label>
                                        <input
                                            type="text"
                                            value={formData.product_name}
                                            onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400"
                                            placeholder="Product name"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Warranty Type *</label>
                                        <select
                                            value={formData.warranty_type}
                                            onChange={(e) => setFormData({ ...formData, warranty_type: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent outline-none text-gray-900"
                                        >
                                            <option value="">Select type</option>
                                            <option value="Standard Warranty">Standard Warranty</option>
                                            <option value="Extended Coverage">Extended Coverage</option>
                                            <option value="Premium Support">Premium Support</option>
                                            <option value="Lifetime Warranty">Lifetime Warranty</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Expiry Date *</label>
                                        <input
                                            type="date"
                                            value={formData.expiry_date}
                                            onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent outline-none text-gray-900"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Purchase Date</label>
                                        <input
                                            type="date"
                                            value={formData.purchase_date}
                                            onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent outline-none text-gray-900"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Customer Name</label>
                                        <input
                                            type="text"
                                            value={formData.customer_name}
                                            onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400"
                                            placeholder="Customer name"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Customer Email</label>
                                        <input
                                            type="email"
                                            value={formData.customer_email}
                                            onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400"
                                            placeholder="customer@example.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Customer Phone</label>
                                        <input
                                            type="tel"
                                            value={formData.customer_phone}
                                            onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400"
                                            placeholder="+1 234 567 8900"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                                <button
                                    onClick={handleCloseModal}
                                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-6 py-2 bg-[#06124f] text-white font-bold rounded-lg hover:bg-[#06b6d4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? 'Saving...' : 'Save Warranty'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Details Modal */}
            {viewingWarranty && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setViewingWarranty(null)}></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full z-50">
                            <div className="bg-white px-6 pt-6 pb-4">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-2xl font-black text-[#06124f]">Warranty Details</h3>
                                    <button onClick={() => setViewingWarranty(null)} className="text-gray-400 hover:text-gray-600">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-500 mb-1">Serial Number</label>
                                            <p className="text-base font-mono font-semibold text-gray-900">{viewingWarranty.serial_number}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-500 mb-1">Status</label>
                                            <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${viewingWarranty.status === 'active'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-orange-100 text-orange-800'
                                                }`}>
                                                {viewingWarranty.status === 'active' ? '✓ Active' : '⚠ Expired'}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-500 mb-1">Product Name</label>
                                        <p className="text-base text-gray-900">{viewingWarranty.product_name}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-500 mb-1">Warranty Type</label>
                                            <p className="text-base text-gray-900">{viewingWarranty.warranty_type}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-500 mb-1">Expiry Date</label>
                                            <p className="text-base text-gray-900">
                                                {new Date(viewingWarranty.expiry_date).toLocaleDateString('en-GB', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>

                                    {viewingWarranty.purchase_date && (
                                        <div>
                                            <label className="block text-sm font-bold text-gray-500 mb-1">Purchase Date</label>
                                            <p className="text-base text-gray-900">
                                                {new Date(viewingWarranty.purchase_date).toLocaleDateString('en-GB', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    )}

                                    <div className="border-t border-gray-200 pt-4 mt-4">
                                        <h4 className="text-lg font-bold text-gray-700 mb-3">Customer Information</h4>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-500 mb-1">Name</label>
                                                <p className="text-base text-gray-900">{viewingWarranty.customer_name || '-'}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-500 mb-1">Email</label>
                                                    <p className="text-base text-gray-900">{viewingWarranty.customer_email || '-'}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-500 mb-1">Phone</label>
                                                    <p className="text-base text-gray-900">{viewingWarranty.customer_phone || '-'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 px-6 py-4 flex justify-end">
                                <button
                                    onClick={() => setViewingWarranty(null)}
                                    className="px-6 py-2 bg-[#06124f] text-white font-bold rounded-lg hover:bg-[#06b6d4] transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setIsImportModalOpen(false)}></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full z-50">
                            <div className="bg-white px-6 pt-6 pb-4">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-2xl font-black text-[#06124f]">Import Warranties from Excel</h3>
                                    <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleDownloadTemplate}
                                            className="px-4 py-2 bg-white border-2 border-[#06124f] text-[#06124f] font-bold rounded-lg hover:bg-[#06124f] hover:text-white transition-colors flex items-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Download Template
                                        </button>
                                    </div>

                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <h4 className="font-bold text-blue-900 mb-2">Excel File Format</h4>
                                        <p className="text-sm text-blue-800 mb-2">Your Excel file should have these columns:</p>
                                        <ul className="text-sm text-blue-800 space-y-1 ml-4">
                                            <li>• <strong>Serial Number</strong> (required)</li>
                                            <li>• <strong>Product Name</strong> (required)</li>
                                            <li>• <strong>Warranty Type</strong> (required)</li>
                                            <li>• <strong>Expiry Date</strong> (required)</li>
                                            <li>• Purchase Date (optional)</li>
                                            <li>• Customer Name (optional)</li>
                                            <li>• Customer Email (optional)</li>
                                            <li>• Customer Phone (optional)</li>
                                        </ul>
                                    </div>

                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#06b6d4] transition-colors">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".xlsx,.xls"
                                            onChange={handleImportExcel}
                                            className="hidden"
                                        />
                                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isImporting}
                                            className="px-6 py-3 bg-[#06124f] text-white font-bold rounded-lg hover:bg-[#06b6d4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isImporting ? 'Importing...' : 'Choose Excel File'}
                                        </button>
                                        <p className="text-sm text-gray-500 mt-2">or drag and drop</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 px-6 py-4 flex justify-end">
                                <button
                                    onClick={() => setIsImportModalOpen(false)}
                                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
