"use client";

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Globe, Eye, EyeOff, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface Partner {
    id?: number;
    name: string;
    logo_url: string;
    category: string;
    display_order: number;
    is_active: boolean;
}

export default function PartnersPage() {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
    const [formData, setFormData] = useState<Partner>({
        name: '',
        logo_url: '',
        category: '',
        display_order: 0,
        is_active: true
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchPartners();
    }, []);

    const fetchPartners = async () => {
        try {
            const res = await fetch('/api/partners');
            const data = await res.json();
            setPartners(data);
        } catch (error) {
            console.error('Error fetching partners:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (partner?: Partner) => {
        if (partner) {
            setEditingPartner(partner);
            setFormData(partner);
        } else {
            setEditingPartner(null);
            setFormData({
                name: '',
                logo_url: '',
                category: 'Hardware',
                display_order: partners.length,
                is_active: true
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPartner(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const url = editingPartner
                ? `/api/partners/${editingPartner.id}`
                : '/api/partners';
            const method = editingPartner ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                fetchPartners();
                handleCloseModal();
            }
        } catch (error) {
            console.error('Error saving partner:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this partner?')) return;
        try {
            const res = await fetch(`/api/partners/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setPartners(partners.filter(p => p.id !== id));
            }
        } catch (error) {
            console.error('Error deleting partner:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Partners Management</h1>
                    <p className="text-gray-600 mt-1">Manage trusted partner brands and strategic collaborations</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#06b6d4] to-[#06124f] text-white font-bold rounded-xl shadow-lg hover:shadow-cyan-200/50 transition-all duration-300 active:scale-95"
                >
                    <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                    <span>Add Partner</span>
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                    <Loader2 className="w-10 h-10 text-[#06b6d4] animate-spin mb-4" />
                    <p className="text-gray-500 font-medium">Loading your partners...</p>
                </div>
            ) : partners.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Globe className="text-gray-300 w-10 h-10" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">No partners found</h3>
                    <p className="text-gray-500 mb-6">Start by adding your first strategic partner.</p>
                    <button
                        onClick={() => handleOpenModal()}
                        className="px-6 py-2 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-800 transition-colors"
                    >
                        Add Your First Partner
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {partners.map((partner) => (
                        <div key={partner.id} className="relative group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 items-center flex flex-col hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleOpenModal(partner)}
                                    className="p-2 bg-white text-blue-600 rounded-lg shadow-md border border-gray-50 hover:bg-blue-50 transition-colors"
                                    title="Edit Partner"
                                >
                                    <Pencil size={14} />
                                </button>
                                <button
                                    onClick={() => handleDelete(partner.id!)}
                                    className="p-2 bg-white text-red-600 rounded-lg shadow-md border border-gray-50 hover:bg-red-50 transition-colors"
                                    title="Delete Partner"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            <div className="relative w-full aspect-square max-w-[120px] mb-4 bg-gray-50 rounded-xl overflow-hidden p-4 flex items-center justify-center">
                                <Image
                                    src={partner.logo_url}
                                    alt={partner.name}
                                    width={100}
                                    height={100}
                                    className="object-contain"
                                />
                                {!partner.is_active && (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-red-600 px-2 py-1 bg-red-50 rounded-full">Inactive</span>
                                    </div>
                                )}
                            </div>

                            <h3 className="font-bold text-gray-900 text-lg mb-1">{partner.name}</h3>
                            <p className="text-[#06b6d4] text-xs font-bold uppercase tracking-widest mb-3">{partner.category}</p>

                            <div className="flex items-center gap-2 border-t border-gray-50 pt-3 w-full justify-center">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Order: {partner.display_order}</span>
                                <span className="text-gray-300">•</span>
                                {partner.is_active ? (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase tracking-wider">
                                        <Eye size={10} /> Active
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                        <EyeOff size={10} /> Hidden
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Partner Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#06124f]/40 backdrop-blur-sm" onClick={handleCloseModal} />
                    <div className="relative bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in-up">
                        <div className="px-8 py-6 bg-gradient-to-r from-[#06124f] to-[#06b6d4] text-white flex justify-between items-center">
                            <h2 className="text-xl font-black uppercase tracking-tight">
                                {editingPartner ? 'Edit Partner' : 'Add New Partner'}
                            </h2>
                            <button onClick={handleCloseModal} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2 leading-none">Partner Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name || ""}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#06b6d4] outline-none transition-all text-gray-900"
                                        placeholder="e.g., Zebra Technologies"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2 leading-none">Logo URL</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.logo_url || ""}
                                        onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#06b6d4] outline-none transition-all text-gray-900"
                                        placeholder="https://..."
                                    />
                                    {formData.logo_url && (
                                        <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center h-24">
                                            <img src={formData.logo_url} alt="Preview" className="max-h-full object-contain" />
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2 leading-none">Category</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.category || ""}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#06b6d4] outline-none transition-all text-gray-900"
                                        placeholder="e.g., Hardware, Software, Logistics"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2 leading-none">Display Order</label>
                                        <input
                                            type="number"
                                            value={isNaN(formData.display_order) ? "" : formData.display_order}
                                            onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                                            className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#06b6d4] outline-none transition-all text-gray-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2 leading-none">Status</label>
                                        <div className="flex items-center h-[52px]">
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                                className={`flex items-center gap-2 px-6 py-2 rounded-xl border-2 transition-all font-bold ${formData.is_active
                                                    ? 'bg-green-50 border-green-200 text-green-700'
                                                    : 'bg-gray-50 border-gray-200 text-gray-500'
                                                    }`}
                                            >
                                                {formData.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                                                {formData.is_active ? 'Active' : 'Hidden'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {isSaving ? <Loader2 className="animate-spin" /> : null}
                                {isSaving ? 'Working...' : (editingPartner ? 'Update Partner' : 'Add Partner')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
