"use client";

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Star, CheckCircle, Clock, Loader2, User } from 'lucide-react';

interface Testimonial {
    id?: number;
    name: string;
    email?: string;
    role: string;
    company: string;
    content: string;
    rating: number;
    status: 'Pending' | 'Approved';
    display_order: number;
}

export default function TestimonialsPage() {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
    const [formData, setFormData] = useState<Testimonial>({
        name: '',
        email: '',
        role: '',
        company: '',
        content: '',
        rating: 5,
        status: 'Pending',
        display_order: 0
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchTestimonials();
    }, []);

    const fetchTestimonials = async () => {
        try {
            const res = await fetch('/api/testimonials?admin=true');
            const data = await res.json();
            setTestimonials(data);
        } catch (error) {
            console.error('Error fetching testimonials:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (testimonial?: Testimonial) => {
        if (testimonial) {
            setEditingTestimonial(testimonial);
            setFormData(testimonial);
        } else {
            setEditingTestimonial(null);
            setFormData({
                name: '',
                email: '',
                role: '',
                company: '',
                content: '',
                rating: 5,
                status: 'Pending',
                display_order: testimonials.length
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTestimonial(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const url = editingTestimonial
                ? `/api/testimonials/${editingTestimonial.id}`
                : '/api/testimonials';
            const method = editingTestimonial ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                fetchTestimonials();
                handleCloseModal();
            }
        } catch (error) {
            console.error('Error saving testimonial:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleApprove = async (testimonial: Testimonial) => {
        try {
            const res = await fetch(`/api/testimonials/${testimonial.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...testimonial, status: 'Approved' }),
            });
            if (res.ok) fetchTestimonials();
        } catch (error) {
            console.error('Error approving testimonial:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this testimonial?')) return;
        try {
            const res = await fetch(`/api/testimonials/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setTestimonials(testimonials.filter(t => t.id !== id));
            }
        } catch (error) {
            console.error('Error deleting testimonial:', error);
        }
    };

    return (
        <div className="space-y-6 text-gray-900">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Testimonials Management</h1>
                    <p className="text-gray-600 mt-1">Manage and approve client feedback for the home page</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#06b6d4] to-[#06124f] text-white font-bold rounded-xl shadow-lg hover:shadow-cyan-200/50 transition-all duration-300 active:scale-95"
                >
                    <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                    <span>Add Testimonial</span>
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                    <Loader2 className="w-10 h-10 text-[#06b6d4] animate-spin mb-4" />
                    <p className="text-gray-500 font-medium">Loading testimonials...</p>
                </div>
            ) : testimonials.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Star className="text-gray-300 w-10 h-10" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">No testimonials yet</h3>
                    <p className="text-gray-500 mb-6">Start by adding your first customer feedback.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {testimonials.map((testimonial) => (
                        <div key={testimonial.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">
                            <div className="flex-1">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-[#06124f] font-bold text-xl">
                                        {testimonial.name[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg leading-tight">{testimonial.name}</h3>
                                        <p className="text-sm text-gray-500">{testimonial.role}, {testimonial.company}</p>
                                        {testimonial.email && (
                                            <p className="text-xs text-gray-400 mt-0.5">{testimonial.email}</p>
                                        )}
                                    </div>
                                    <div className="ml-auto flex items-center gap-1">
                                        {testimonial.status === 'Approved' ? (
                                            <span className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100 uppercase tracking-wider">
                                                <CheckCircle size={12} /> Approved
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 px-3 py-1 bg-yellow-50 text-yellow-700 text-xs font-bold rounded-full border border-yellow-100 uppercase tracking-wider">
                                                <Clock size={12} /> Pending Review
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-1 mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={16} className={i < testimonial.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />
                                    ))}
                                </div>

                                <p className="text-gray-700 italic leading-relaxed text-lg mb-6">
                                    "{testimonial.content}"
                                </p>

                                <div className="flex items-center gap-4 pt-4 border-t border-gray-50">
                                    {testimonial.status === 'Pending' && (
                                        <button
                                            onClick={() => handleApprove(testimonial)}
                                            className="px-4 py-2 bg-green-600 text-white font-bold text-xs rounded-lg hover:bg-green-700 transition-colors uppercase tracking-widest"
                                        >
                                            Approve Now
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleOpenModal(testimonial)}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-bold text-xs rounded-lg hover:bg-gray-200 transition-colors uppercase tracking-widest"
                                    >
                                        <Pencil size={14} /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(testimonial.id!)}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 font-bold text-xs rounded-lg hover:bg-red-100 transition-colors uppercase tracking-widest"
                                    >
                                        <Trash2 size={14} /> Delete
                                    </button>
                                    <div className="ml-auto text-xs font-bold text-gray-400 uppercase tracking-widest">
                                        Display Order: {testimonial.display_order}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#06124f]/40 backdrop-blur-sm" onClick={handleCloseModal} />
                    <div className="relative bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in-up">
                        <div className="px-8 py-6 bg-gradient-to-r from-[#06124f] to-[#06b6d4] text-white flex justify-between items-center">
                            <h2 className="text-xl font-black uppercase tracking-tight">
                                {editingTestimonial ? 'Edit Testimonial' : 'Add Testimonial'}
                            </h2>
                            <button onClick={handleCloseModal} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">Author Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name || ""}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#06b6d4] outline-none"
                                        placeholder="e.g. Rahul Sharma"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        value={formData.email || ""}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#06b6d4] outline-none"
                                        placeholder="e.g. rahul@company.com"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">Role/Title</label>
                                    <input
                                        type="text"
                                        value={formData.role || ""}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#06b6d4] outline-none"
                                        placeholder="e.g. CEO"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">Company</label>
                                    <input
                                        type="text"
                                        value={formData.company || ""}
                                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#06b6d4] outline-none"
                                        placeholder="e.g. Tata Group"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">Rating (1-5)</label>
                                    <select
                                        value={formData.rating}
                                        onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#06b6d4] outline-none"
                                    >
                                        {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} Stars</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">Testimonial Content</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={formData.content || ""}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#06b6d4] outline-none"
                                    placeholder="Share the customer's experience..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#06b6d4] outline-none"
                                    >
                                        <option value="Approved">Approved</option>
                                        <option value="Pending">Pending Review</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">Display Order</label>
                                    <input
                                        type="number"
                                        value={isNaN(formData.display_order) ? "" : formData.display_order}
                                        onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#06b6d4] outline-none"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {isSaving ? <Loader2 className="animate-spin" /> : null}
                                {isSaving ? 'Working...' : (editingTestimonial ? 'Update Testimonial' : 'Add Testimonial')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
