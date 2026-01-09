"use client";

import { useState } from "react";

interface HeroSlide {
    id: number;
    title: string;
    subtitle: string;
    description: string;
    image: string;
    cta: string;
    ctaSecondary: string;
    order: number;
    isActive: boolean;
}

// Initial mock data - matches the Hero component structure
const initialSlides: HeroSlide[] = [
    {
        id: 1,
        title: "Complete Barcode Solutions",
        subtitle: "Modern Business Operations",
        description: "From barcode label printers and handheld scanners to Android mobile devices and custom software solutions - we provide everything you need for efficient business operations.",
        image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
        cta: "Browse Products",
        ctaSecondary: "Get Quote",
        order: 1,
        isActive: true
    },
    {
        id: 2,
        title: "Professional Label Printers",
        subtitle: "Thermal & Direct Thermal",
        description: "Professional-grade thermal and direct thermal barcode label printers for industrial, desktop, and mobile applications with superior print quality.",
        image: "https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
        cta: "View Printers",
        ctaSecondary: "Learn More",
        order: 2,
        isActive: true
    },
    {
        id: 3,
        title: "Advanced Scanner Technology",
        subtitle: "1D & 2D Barcode Reading",
        description: "High-performance handheld and mobile barcode scanners with advanced reading capabilities for 1D and 2D barcodes with wireless connectivity.",
        image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
        cta: "View Scanners",
        ctaSecondary: "Contact Us",
        order: 3,
        isActive: true
    }
];

export default function HeroPage() {
    const [slides, setSlides] = useState<HeroSlide[]>(initialSlides);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
    const [deleteSlideId, setDeleteSlideId] = useState<number | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    // Form state
    const [formData, setFormData] = useState<HeroSlide>({
        id: 0,
        title: "",
        subtitle: "",
        description: "",
        image: "",
        cta: "Browse Products",
        ctaSecondary: "Get Quote",
        order: slides.length + 1,
        isActive: true
    });

    const handleAddNew = () => {
        setEditingSlide(null);
        setFormData({
            id: Date.now(),
            title: "",
            subtitle: "",
            description: "",
            image: "",
            cta: "Browse Products",
            ctaSecondary: "Get Quote",
            order: slides.length + 1,
            isActive: true
        });
        setShowModal(true);
    };

    const handleEdit = (slide: HeroSlide) => {
        setEditingSlide(slide);
        setFormData(slide);
        setShowModal(true);
    };

    const handleSave = () => {
        if (!formData.title || !formData.subtitle || !formData.description || !formData.image) {
            alert("Please fill in all required fields");
            return;
        }

        if (editingSlide) {
            // Update existing slide
            setSlides(slides.map(s => s.id === editingSlide.id ? formData : s));
        } else {
            // Add new slide
            setSlides([...slides, formData]);
        }
        setShowModal(false);
    };

    const handleDelete = (id: number) => {
        setDeleteSlideId(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (deleteSlideId) {
            const updatedSlides = slides.filter(s => s.id !== deleteSlideId);
            // Reorder remaining slides
            const reorderedSlides = updatedSlides.map((slide, index) => ({
                ...slide,
                order: index + 1
            }));
            setSlides(reorderedSlides);
        }
        setShowDeleteModal(false);
        setDeleteSlideId(null);
    };

    const handleToggleActive = (id: number) => {
        setSlides(slides.map(s => 
            s.id === id ? { ...s, isActive: !s.isActive } : s
        ));
    };

    const moveSlide = (fromIndex: number, toIndex: number) => {
        const updatedSlides = [...slides];
        const [movedSlide] = updatedSlides.splice(fromIndex, 1);
        updatedSlides.splice(toIndex, 0, movedSlide);
        
        // Update order property
        const reorderedSlides = updatedSlides.map((slide, index) => ({
            ...slide,
            order: index + 1
        }));
        
        setSlides(reorderedSlides);
    };

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;
        
        moveSlide(draggedIndex, index);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const sortedSlides = [...slides].sort((a, b) => a.order - b.order);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Hero Slider Management</h1>
                    <p className="text-gray-600 mt-1">Manage homepage hero slider content</p>
                </div>
                <button 
                    onClick={handleAddNew}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#06b6d4] to-[#06124f] text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add New Slide
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Slides</p>
                            <p className="text-2xl font-bold text-gray-900">{slides.length}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Active Slides</p>
                            <p className="text-2xl font-bold text-green-600">{slides.filter(s => s.isActive).length}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Inactive Slides</p>
                            <p className="text-2xl font-bold text-gray-400">{slides.filter(s => !s.isActive).length}</p>
                        </div>
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start space-x-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                    <h4 className="font-semibold text-blue-900 mb-1">Drag to Reorder</h4>
                    <p className="text-sm text-blue-700">Drag and drop slides to change their display order on the homepage. Only active slides will appear on the website.</p>
                </div>
            </div>

            {/* Slides List */}
            <div className="space-y-4">
                {sortedSlides.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center">
                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Slides Yet</h3>
                        <p className="text-gray-600 mb-4">Create your first hero slide to get started</p>
                        <button 
                            onClick={handleAddNew}
                            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#06b6d4] to-[#06124f] text-white font-semibold rounded-lg"
                        >
                            Add Your First Slide
                        </button>
                    </div>
                ) : (
                    sortedSlides.map((slide, index) => (
                        <div
                            key={slide.id}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-move ${
                                draggedIndex === index ? 'opacity-50' : ''
                            } ${!slide.isActive ? 'opacity-60' : ''}`}
                        >
                            <div className="flex flex-col lg:flex-row gap-6">
                                {/* Image Preview */}
                                <div className="w-full lg:w-48 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                    {slide.image ? (
                                        <img 
                                            src={slide.image} 
                                            alt={slide.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-[#06b6d4] to-[#06124f] rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0">
                                                {slide.order}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-lg">{slide.title}</h3>
                                                <p className="text-sm text-[#06b6d4] font-medium">{slide.subtitle}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {/* Active Toggle */}
                                            <button
                                                onClick={() => handleToggleActive(slide.id)}
                                                className={`p-2 rounded-lg transition-colors ${
                                                    slide.isActive 
                                                        ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                                                        : 'text-gray-400 bg-gray-50 hover:bg-gray-100'
                                                }`}
                                                title={slide.isActive ? "Active" : "Inactive"}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    {slide.isActive ? (
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    ) : (
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                    )}
                                                </svg>
                                            </button>
                                            
                                            {/* Edit */}
                                            <button 
                                                onClick={() => handleEdit(slide)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            
                                            {/* Delete */}
                                            <button 
                                                onClick={() => handleDelete(slide.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{slide.description}</p>
                                    
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-3 py-1 bg-[#06b6d4]/10 text-[#06b6d4] text-xs font-medium rounded-full">
                                            {slide.cta}
                                        </span>
                                        <span className="px-3 py-1 bg-[#06124f]/10 text-[#06124f] text-xs font-medium rounded-full">
                                            {slide.ctaSecondary}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {editingSlide ? 'Edit Slide' : 'Add New Slide'}
                            </h2>
                            <button 
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-5">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent outline-none text-gray-900 font-medium placeholder:text-gray-400"
                                    placeholder="Complete Barcode Solutions"
                                />
                            </div>

                            {/* Subtitle */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Subtitle <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.subtitle}
                                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent outline-none text-gray-900 font-medium placeholder:text-gray-400"
                                    placeholder="Modern Business Operations"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent outline-none resize-none text-gray-900 font-medium placeholder:text-gray-400"
                                    placeholder="Enter a compelling description for this slide..."
                                />
                            </div>

                            {/* Image URL */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Image URL <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="url"
                                    value={formData.image}
                                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent outline-none text-gray-900 font-medium placeholder:text-gray-400"
                                    placeholder="https://images.unsplash.com/..."
                                />
                                {formData.image && (
                                    <div className="mt-3 w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                                        <img 
                                            src={formData.image} 
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.src = '';
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* CTA Buttons */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Primary CTA
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.cta}
                                        onChange={(e) => setFormData({ ...formData, cta: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent outline-none text-gray-900 font-medium placeholder:text-gray-400"
                                        placeholder="Browse Products"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Secondary CTA
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.ctaSecondary}
                                        onChange={(e) => setFormData({ ...formData, ctaSecondary: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent outline-none text-gray-900 font-medium placeholder:text-gray-400"
                                        placeholder="Get Quote"
                                    />
                                </div>
                            </div>

                            {/* Active Status */}
                            <div className="flex items-center space-x-3 pt-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4 text-[#06b6d4] border-gray-300 rounded focus:ring-[#06b6d4]"
                                />
                                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                                    Set as active (visible on homepage)
                                </label>
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t border-gray-200">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-6 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2 bg-gradient-to-r from-[#06b6d4] to-[#06124f] text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                            >
                                {editingSlide ? 'Update Slide' : 'Create Slide'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Slide</h3>
                        <p className="text-gray-600 text-center mb-6">
                            Are you sure you want to delete this slide? This action cannot be undone.
                        </p>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
