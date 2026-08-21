"use client";

import { useState } from 'react';
import { X, Send, Loader2, Package } from 'lucide-react';
import Toast from './Toast';

interface InquiryPopupProps {
    isOpen: boolean;
    onClose: () => void;
    productName: string;
    productCategory: string;
    productImage?: string;
    productDescription?: string;
    productSpecs?: string[];
}

export default function InquiryPopup({
    isOpen,
    onClose,
    productName,
    productCategory,
    productImage,
    productDescription,
    productSpecs
}: InquiryPopupProps) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        message: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/inquiry', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    product: productName,
                    category: productCategory,
                    productImage: productImage || null,
                    productDescription: productDescription || null,
                    productSpecs: productSpecs || null,
                    source: 'product_inquiry_popup',
                    subject: `Product Inquiry: ${productName}`
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setToast({
                    message: `Inquiry for "${productName}" submitted successfully!`,
                    type: 'success'
                });

                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    company: '',
                    message: '',
                });

                setTimeout(() => {
                    onClose();
                }, 1500);
            } else {
                setToast({
                    message: data.message || 'Failed to submit inquiry. Please try again.',
                    type: 'error'
                });
            }
        } catch (error) {
            console.error('Error submitting inquiry:', error);
            setToast({
                message: 'Network error. Please try again later.',
                type: 'error'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-xs p-4 sm:p-6 overflow-hidden">
                <div className="absolute inset-0" onClick={onClose} />

                {/* Exact Dashboard Modal Container */}
                <div
                    role="dialog"
                    aria-modal="true"
                    className="relative z-10 w-full max-w-xl bg-white rounded-md shadow-2xl border border-gray-100 overflow-hidden flex flex-col my-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header - Dashboard Gradient */}
                    <div
                        className="flex items-center justify-between px-6 py-4 text-white shrink-0"
                        style={{ background: "linear-gradient(135deg, #06124f, #0a2a5e)" }}
                    >
                        <div className="flex items-center gap-2 font-bold text-base text-white">
                            <Package className="h-5 w-5 text-teal-300" />
                            Product Inquiry: {productName}
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md p-1 text-white/70 hover:bg-white/10 hover:text-white transition cursor-pointer"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Form Body */}
                    <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-sm text-gray-700">
                        {/* Product Tag */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
                            <div>
                                <span className="text-xs text-gray-400 block font-semibold uppercase">Category</span>
                                <span className="text-xs font-bold text-blue-700">{productCategory}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-xs text-gray-400 block font-semibold uppercase">Selected Product</span>
                                <span className="text-xs font-bold text-gray-900">{productName}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="Your full name"
                                    className="w-full px-3.5 py-2 rounded-md border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e]"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Company Name
                                </label>
                                <input
                                    type="text"
                                    name="company"
                                    value={formData.company}
                                    onChange={handleChange}
                                    placeholder="Company / Organization"
                                    className="w-full px-3.5 py-2 rounded-md border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e]"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="name@company.com"
                                    className="w-full px-3.5 py-2 rounded-md border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e]"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                    placeholder="+91 98765 43210"
                                    className="w-full px-3.5 py-2 rounded-md border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e]"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                Requirements / Quantity <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                required
                                rows={3}
                                placeholder="Describe required units, deployment site, or specifications..."
                                className="w-full px-3.5 py-2 rounded-md border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0a2a5e]/20 focus:border-[#0a2a5e]"
                            />
                        </div>

                        {/* Modal Action Footer */}
                        <div className="px-6 py-4 bg-gray-50 -mx-6 -mb-6 mt-6 border-t border-gray-100 flex justify-end gap-3 rounded-b-md">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 rounded-md cursor-pointer transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#06124f] to-[#0a2a5e] hover:opacity-90 rounded-md transition-opacity cursor-pointer shadow-sm disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Sending...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        <span>Request Quote</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
