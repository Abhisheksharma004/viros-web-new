
"use client";

import { useState, useEffect } from 'react';

export default function ContactContentManagement() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Departments State
    const [departments, setDepartments] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDept, setEditingDept] = useState<any>(null);
    const [deptForm, setDeptForm] = useState({
        title: '',
        description: '',
        email_1: '',
        email_2: '',
        phone_1: '',
        phone_2: ''
    });

    // Main Content State
    const [content, setContent] = useState({
        hero_title: '',
        hero_description: '',
        general_phone: '',
        general_email_support: '',
        general_email_info: '',
        address: '',
        care_title: '',
        care_description: '',
        care_email: '',
        care_phone: '',
        social_twitter: '',
        social_linkedin: '',
        social_facebook: '',
        social_instagram: '',
        social_youtube: ''
    });

    useEffect(() => {
        fetchContent();
        fetchDepartments();
    }, []);

    const fetchContent = async () => {
        try {
            const response = await fetch('/api/contact/content');
            if (response.ok) {
                const data = await response.json();
                // Filter out the old department fields which are no longer used
                const {
                    sales_email_1, sales_email_2, sales_phone_1, sales_phone_2,
                    tech_email, tech_phone, amc_email, amc_phone,
                    training_email, training_phone,
                    ...cleanData
                } = data;
                setContent(prev => ({ ...prev, ...cleanData }));
            }
        } catch (error) {
            console.error('Error fetching content:', error);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await fetch('/api/contact/departments');
            if (response.ok) {
                const data = await response.json();
                setDepartments(data);
            }
        } catch (error) {
            console.error('Error fetching departments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setContent(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const response = await fetch('/api/contact/content', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(content)
            });

            if (response.ok) {
                alert('Content updated successfully!');
            } else {
                alert('Failed to update content.');
            }
        } catch (error) {
            console.error('Error updating content:', error);
            alert('An error occurred while saving.');
        } finally {
            setSaving(false);
        }
    };

    // Department Management Logic
    const openAddModal = () => {
        setEditingDept(null);
        setDeptForm({
            title: '',
            description: '',
            email_1: '',
            email_2: '',
            phone_1: '',
            phone_2: ''
        });
        setIsModalOpen(true);
    };

    const openEditModal = (dept: any) => {
        setEditingDept(dept);
        setDeptForm({
            title: dept.title || '',
            description: dept.description || '',
            email_1: dept.email_1 || '',
            email_2: dept.email_2 || '',
            phone_1: dept.phone_1 || '',
            phone_2: dept.phone_2 || ''
        });
        setIsModalOpen(true);
    };

    const handleDeptSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingDept
                ? `/api/contact/departments/${editingDept.id}`
                : '/api/contact/departments';

            const method = editingDept ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(deptForm)
            });

            if (response.ok) {
                await fetchDepartments();
                setIsModalOpen(false);
            } else {
                alert('Failed to save department.');
            }
        } catch (error) {
            console.error('Error saving department:', error);
        }
    };

    const handleDeleteDepartment = async (id: number) => {
        if (!confirm('Are you sure you want to delete this department?')) return;

        try {
            const response = await fetch(`/api/contact/departments/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await fetchDepartments();
            } else {
                alert('Failed to delete department.');
            }
        } catch (error) {
            console.error('Error deleting department:', error);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-900">Loading...</div>;

    const inputClasses = "w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent outline-none transition-all";
    const textareaClasses = "w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent outline-none transition-all";
    const smallInputClasses = "w-full px-3 py-2 rounded border border-gray-300 text-gray-900 focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent outline-none transition-all";

    return (
        <div className="p-8 min-h-screen bg-gray-50">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Contact Page Management</h1>
                <p className="text-gray-500 mt-2">Update content for the main Contact Us page</p>
            </header>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 max-w-5xl">

                {/* Hero Section */}
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b">Hero Section</h3>
                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Page Title</label>
                            <input name="hero_title" value={content.hero_title} onChange={handleChange} className={inputClasses} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                            <textarea name="hero_description" rows={2} value={content.hero_description} onChange={handleChange} className={textareaClasses} />
                        </div>
                    </div>
                </div>

                {/* General Information */}
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b">General Contact Info (Left Sidebar)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Main Phone</label>
                            <input name="general_phone" value={content.general_phone} onChange={handleChange} className={inputClasses} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Headquarters Address</label>
                            <textarea name="address" rows={3} value={content.address} onChange={handleChange} className={textareaClasses} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Support Email</label>
                            <input name="general_email_support" value={content.general_email_support} onChange={handleChange} className={inputClasses} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Info Email</label>
                            <input name="general_email_info" value={content.general_email_info} onChange={handleChange} className={inputClasses} />
                        </div>
                    </div>
                </div>

                {/* Dynamic Departments Section */}
                <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-200">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Department Cards</h3>
                            <p className="text-sm text-gray-500">Manage the department contact cards displayed on the contact page.</p>
                        </div>
                        <button
                            type="button"
                            onClick={openAddModal}
                            className="px-4 py-2 bg-[#06b6d4] text-white text-sm font-bold rounded-lg hover:bg-cyan-600 transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            Add Department
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {departments.map((dept) => (
                            <div key={dept.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-[#06124f] text-lg">{dept.title}</h4>
                                    <div className="flex gap-2 transition-opacity">
                                        <button
                                            type="button"
                                            onClick={() => openEditModal(dept)}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md"
                                            title="Edit"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteDepartment(dept.id)}
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"
                                            title="Delete"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                                <p className="text-gray-500 text-sm mb-3 line-clamp-2">{dept.description}</p>
                                <div className="space-y-1 text-sm">
                                    {dept.email_1 && <div className="text-gray-700 flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap"><span className="w-4 h-4 text-cyan-500 flex-shrink-0">✉</span> {dept.email_1}</div>}
                                    {dept.phone_1 && <div className="text-gray-700 flex items-center gap-2"><span className="w-4 h-4 text-green-500 flex-shrink-0">📞</span> {dept.phone_1}</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Customer Care Section */}
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b">Customer Care Box (Bottom)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Section Title</label>
                            <input name="care_title" value={content.care_title} onChange={handleChange} className={inputClasses} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                            <textarea name="care_description" rows={2} value={content.care_description} onChange={handleChange} className={textareaClasses} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Care Email</label>
                            <input name="care_email" value={content.care_email} onChange={handleChange} className={inputClasses} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Care Phone</label>
                            <input name="care_phone" value={content.care_phone} onChange={handleChange} className={inputClasses} />
                        </div>
                    </div>
                </div>

                {/* Social Media */}
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b">Social Media Links</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold text-gray-700 w-24">Twitter / X:</span>
                            <input name="social_twitter" value={content.social_twitter} onChange={handleChange} className={smallInputClasses} />
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold text-gray-700 w-24">LinkedIn:</span>
                            <input name="social_linkedin" value={content.social_linkedin} onChange={handleChange} className={smallInputClasses} />
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold text-gray-700 w-24">Facebook:</span>
                            <input name="social_facebook" value={content.social_facebook} onChange={handleChange} className={smallInputClasses} />
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold text-gray-700 w-24">Instagram:</span>
                            <input name="social_instagram" value={content.social_instagram} onChange={handleChange} className={smallInputClasses} />
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold text-gray-700 w-24">YouTube:</span>
                            <input name="social_youtube" value={content.social_youtube} onChange={handleChange} className={smallInputClasses} />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-8 py-3 bg-[#06124f] text-white font-bold rounded-xl hover:bg-[#06b6d4] transition-colors shadow-lg hover:shadow-xl disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>

            {/* Department Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-[#06124f]">
                                {editingDept ? 'Edit Department' : 'Add New Department'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleDeptSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Department Title *</label>
                                <input
                                    required
                                    value={deptForm.title}
                                    onChange={(e) => setDeptForm({ ...deptForm, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] outline-none text-gray-900"
                                    placeholder="e.g. Sales Department"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                                <input
                                    value={deptForm.description}
                                    onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] outline-none text-gray-900"
                                    placeholder="Short description of services"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Email 1</label>
                                    <input
                                        value={deptForm.email_1}
                                        onChange={(e) => setDeptForm({ ...deptForm, email_1: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] outline-none text-gray-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Email 2</label>
                                    <input
                                        value={deptForm.email_2}
                                        onChange={(e) => setDeptForm({ ...deptForm, email_2: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] outline-none text-gray-900"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Phone 1</label>
                                    <input
                                        value={deptForm.phone_1}
                                        onChange={(e) => setDeptForm({ ...deptForm, phone_1: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] outline-none text-gray-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Phone 2</label>
                                    <input
                                        value={deptForm.phone_2}
                                        onChange={(e) => setDeptForm({ ...deptForm, phone_2: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] outline-none text-gray-900"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-[#06124f] text-white font-bold rounded-lg hover:bg-[#06b6d4] transition-colors shadow-lg"
                                >
                                    {editingDept ? 'Save Changes' : 'Create Department'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
