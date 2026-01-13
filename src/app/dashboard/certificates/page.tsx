"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Save, X, Loader2, Image as ImageIcon } from "lucide-react";

interface Certificate {
    id: number;
    title: string;
    issuer: string;
    year: string;
    image_url: string | null;
    description: string | null;
    display_order: number;
    is_active: boolean;
}

export default function CertificatesManagement() {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingCertificate, setEditingCertificate] = useState<Certificate | null>(null);

    const [formData, setFormData] = useState({
        title: "",
        issuer: "",
        year: "",
        image_url: "",
        description: "",
        is_active: true
    });

    useEffect(() => {
        fetchCertificates();
    }, []);

    const fetchCertificates = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/certificates');
            const data = await response.json();
            setCertificates(data);
        } catch (error) {
            console.error('Error fetching certificates:', error);
            setError('Failed to load certificates');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingCertificate(null);
        setFormData({
            title: "",
            issuer: "",
            year: new Date().getFullYear().toString(),
            image_url: "",
            description: "",
            is_active: true
        });
        setShowModal(true);
    };

    const handleEdit = (cert: Certificate) => {
        setEditingCertificate(cert);
        setFormData({
            title: cert.title,
            issuer: cert.issuer,
            year: cert.year,
            image_url: cert.image_url || "",
            description: cert.description || "",
            is_active: cert.is_active
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.title || !formData.issuer || !formData.year) {
            alert('Please fill in all required fields');
            return;
        }

        setIsSaving(true);
        try {
            if (editingCertificate) {
                // Update existing
                const response = await fetch(`/api/certificates/${editingCertificate.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                if (!response.ok) throw new Error('Failed to update');
            } else {
                // Create new
                const response = await fetch('/api/certificates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                if (!response.ok) throw new Error('Failed to create');
            }

            await fetchCertificates();
            setShowModal(false);
        } catch (error) {
            console.error('Error saving certificate:', error);
            alert('Failed to save certificate');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this certificate?')) return;

        try {
            const response = await fetch(`/api/certificates/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete');

            await fetchCertificates();
        } catch (error) {
            console.error('Error deleting certificate:', error);
            alert('Failed to delete certificate');
        }
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Certificates Management</h1>
                        <p className="text-gray-600 mt-2">Manage your awards, certifications, and recognitions</p>
                    </div>
                    <button
                        onClick={handleAdd}
                        className="flex items-center space-x-2 px-6 py-3 bg-[#06124f] text-white rounded-lg hover:bg-[#06b6d4] transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add Certificate</span>
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 mb-6">
                    {error}
                </div>
            )}

            {/* Loading State */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-[#06b6d4]" />
                </div>
            ) : (
                /* Certificates Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {certificates.map((cert) => (
                        <div
                            key={cert.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group"
                        >
                            {/* Image */}
                            <div className="relative h-48 bg-gray-100 overflow-hidden">
                                {cert.image_url ? (
                                    <img
                                        src={cert.image_url}
                                        alt={cert.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <ImageIcon className="w-12 h-12" />
                                    </div>
                                )}
                                {/* Year Badge */}
                                <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur rounded-full text-xs font-bold text-[#06124f]">
                                    {cert.year}
                                </div>
                                {/* Active Status */}
                                {!cert.is_active && (
                                    <div className="absolute top-3 left-3 px-3 py-1 bg-red-500 text-white rounded-full text-xs font-bold">
                                        Inactive
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <p className="text-[#06b6d4] text-xs font-bold uppercase tracking-wider mb-2">
                                    {cert.issuer}
                                </p>
                                <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2">
                                    {cert.title}
                                </h3>
                                <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                                    {cert.description || 'No description provided'}
                                </p>

                                {/* Actions */}
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleEdit(cert)}
                                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-[#06b6d4] hover:text-white transition-all duration-200"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        <span>Edit</span>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(cert.id)}
                                        className="flex items-center justify-center px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all duration-200"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!isLoading && certificates.length === 0 && (
                <div className="text-center py-20">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ImageIcon className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No certificates yet</h3>
                    <p className="text-gray-600 mb-6">Get started by adding your first certificate</p>
                    <button
                        onClick={handleAdd}
                        className="inline-flex items-center space-x-2 px-6 py-3 bg-[#06124f] text-white rounded-lg hover:bg-[#06b6d4] transition-all duration-300"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add Certificate</span>
                    </button>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {editingCertificate ? 'Edit Certificate' : 'Add New Certificate'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent outline-none transition-all"
                                    placeholder="e.g., ISO 9001:2015 Certification"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            {/* Issuer */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Issuer <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent outline-none transition-all"
                                    placeholder="e.g., International Organization for Standardization"
                                    value={formData.issuer}
                                    onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                                />
                            </div>

                            {/* Year */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Year <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent outline-none transition-all"
                                    placeholder="e.g., 2023"
                                    value={formData.year}
                                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                />
                            </div>

                            {/* Image URL */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Image URL
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent outline-none transition-all"
                                    placeholder="https://example.com/image.jpg"
                                    value={formData.image_url}
                                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                />
                                {formData.image_url && (
                                    <div className="mt-3 rounded-lg overflow-hidden border border-gray-200">
                                        <img
                                            src={formData.image_url}
                                            alt="Preview"
                                            className="w-full h-48 object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EInvalid URL%3C/text%3E%3C/svg%3E';
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent outline-none transition-all min-h-24"
                                    placeholder="Brief description of the certificate..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            {/* Active Status */}
                            <div className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    className="w-5 h-5 text-[#06b6d4] border-gray-300 rounded focus:ring-[#06b6d4]"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                                    Display on public page
                                </label>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-100">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-6 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center space-x-2 px-6 py-3 bg-[#06124f] text-white rounded-lg hover:bg-[#06b6d4] transition-all duration-200 disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        <span>Save Certificate</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
