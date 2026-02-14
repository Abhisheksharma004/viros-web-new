"use client";

import { useState, useEffect } from "react";

// Helper function to extract YouTube video ID from URL
const getYouTubeVideoId = (url: string): string | null => {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
};

interface HeroSlide {
    id: number;
    title: string;
    subtitle: string;
    description: string;
    image: string;
    media_type: 'image' | 'video';
    video_url?: string;
    cta: string;
    cta_link?: string;
    cta_secondary: string;
    cta_secondary_link?: string;
    display_order: number;
    is_active: boolean | number;
}

export default function HeroPage() {
    const [slides, setSlides] = useState<HeroSlide[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
    const [deleteSlideId, setDeleteSlideId] = useState<number | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    // Form state
    const [formData, setFormData] = useState<Partial<HeroSlide>>({
        title: "",
        subtitle: "",
        description: "",
        image: "",
        media_type: 'image',
        video_url: "",
        cta: "Browse Products",
        cta_link: "/products",
        cta_secondary: "Get Quote",
        cta_secondary_link: "/contact",
        display_order: 1,
        is_active: true
    });

    useEffect(() => {
        fetchSlides();
    }, []);

    const fetchSlides = async () => {
        try {
            const response = await fetch('/api/hero-slides');
            if (response.ok) {
                const data = await response.json();
                setSlides(data);
            }
        } catch (error) {
            console.error('Error fetching slides:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNew = () => {
        setEditingSlide(null);
        setFormData({
            title: "",
            subtitle: "",
            description: "",
            image: "",
            media_type: 'image',
            video_url: "",
            cta: "Browse Products",
            cta_link: "/products",
            cta_secondary: "Get Quote",
            cta_secondary_link: "/contact",
            display_order: slides.length + 1,
            is_active: true
        });
        setShowModal(true);
    };

    const handleEdit = (slide: HeroSlide) => {
        setEditingSlide(slide);
        setFormData(slide);
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.title || !formData.subtitle || !formData.description || !formData.image) {
            alert("Please fill in all required fields");
            return;
        }

        try {
            const url = editingSlide ? `/api/hero-slides/${editingSlide.id}` : '/api/hero-slides';
            const method = editingSlide ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                fetchSlides();
                setShowModal(false);
            } else {
                const error = await response.json();
                alert(`Error: ${error.message}`);
            }
        } catch (error) {
            console.error('Error saving slide:', error);
            alert('Failed to save slide');
        }
    };

    const handleDelete = (id: number) => {
        setDeleteSlideId(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deleteSlideId) return;

        try {
            const response = await fetch(`/api/hero-slides/${deleteSlideId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                fetchSlides();
                setShowDeleteModal(false);
                setDeleteSlideId(null);
            } else {
                alert('Failed to delete slide');
            }
        } catch (error) {
            console.error('Error deleting slide:', error);
        }
    };

    const handleToggleActive = async (id: number, currentActive: any) => {
        try {
            const response = await fetch(`/api/hero-slides/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !currentActive }),
            });

            if (response.ok) {
                fetchSlides();
            }
        } catch (error) {
            console.error('Error toggling active status:', error);
        }
    };

    const moveSlide = async (fromIndex: number, toIndex: number) => {
        const updatedSlides = [...slides];
        const [movedSlide] = updatedSlides.splice(fromIndex, 1);
        updatedSlides.splice(toIndex, 0, movedSlide);

        // Optimistic update
        setSlides(updatedSlides.map((s, i) => ({ ...s, display_order: i + 1 })));

        // Update all affected slides' orders in DB
        try {
            for (let i = 0; i < updatedSlides.length; i++) {
                await fetch(`/api/hero-slides/${updatedSlides[i].id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ display_order: i + 1 }),
                });
            }
            fetchSlides(); // Refresh to be sure
        } catch (error) {
            console.error('Error reordering slides:', error);
        }
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

    const sortedSlides = [...slides].sort((a, b) => a.display_order - b.display_order);

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
                    className="inline-flex items-center px-6 py-3 bg-linear-to-r from-[#06b6d4] to-[#06124f] text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
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
                            <p className="text-2xl font-bold text-green-600">{slides.filter(s => s.is_active).length}</p>
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
                            <p className="text-2xl font-bold text-gray-400">{slides.filter(s => !s.is_active).length}</p>
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
                            className="inline-flex items-center px-6 py-3 bg-linear-to-r from-[#06b6d4] to-[#06124f] text-white font-semibold rounded-lg"
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
                            className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-move ${draggedIndex === index ? 'opacity-50' : ''
                                } ${!slide.is_active ? 'opacity-60' : ''}`}
                        >
                            <div className="flex flex-col lg:flex-row gap-6">
                                {/* Media Preview */}
                                <div className="w-full lg:w-48 h-32 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                    {slide.media_type === 'video' && slide.video_url ? (
                                        (() => {
                                            const videoId = getYouTubeVideoId(slide.video_url);
                                            return videoId ? (
                                                <iframe
                                                    src={`https://www.youtube.com/embed/${videoId}?autoplay=0&mute=1&controls=1`}
                                                    className="w-full h-full"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                    title={slide.title}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-red-400">
                                                    <span className="text-xs">Invalid Video</span>
                                                </div>
                                            );
                                        })()
                                    ) : slide.image ? (
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
                                            <div className="w-10 h-10 bg-linear-to-br from-[#06b6d4] to-[#06124f] rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0">
                                                {slide.display_order}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-lg">{slide.title}</h3>
                                                <p className="text-sm text-[#06b6d4] font-medium">{slide.subtitle}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {/* Active Toggle */}
                                            <button
                                                onClick={() => handleToggleActive(slide.id, slide.is_active)}
                                                className={`p-2 rounded-lg transition-colors ${slide.is_active
                                                    ? 'text-green-600 bg-green-50 hover:bg-green-100'
                                                    : 'text-gray-400 bg-gray-50 hover:bg-gray-100'
                                                    }`}
                                                title={slide.is_active ? "Active" : "Inactive"}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    {slide.is_active ? (
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

                                    <div className="flex flex-wrap gap-2 mb-3">
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#06b6d4]/10 text-[#06b6d4] text-xs font-medium rounded-full">
                                            <span>{slide.cta}</span>
                                            {slide.cta_link && (
                                                <>
                                                    <span className="text-[#06b6d4]/50">→</span>
                                                    <span className="text-[#06b6d4]/70">{slide.cta_link}</span>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#06124f]/10 text-[#06124f] text-xs font-medium rounded-full">
                                            <span>{slide.cta_secondary}</span>
                                            {slide.cta_secondary_link && (
                                                <>
                                                    <span className="text-[#06124f]/50">→</span>
                                                    <span className="text-[#06124f]/70">{slide.cta_secondary_link}</span>
                                                </>
                                            )}
                                        </div>
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

                            {/* Media Type Selector */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Media Type <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-4">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="media_type"
                                            value="image"
                                            checked={formData.media_type === 'image'}
                                            onChange={(e) => setFormData({ ...formData, media_type: 'image', video_url: '' })}
                                            className="w-4 h-4 text-[#06b6d4] border-gray-300 focus:ring-[#06b6d4]"
                                        />
                                        <span className="text-gray-900 font-medium">Image</span>
                                    </label>
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="media_type"
                                            value="video"
                                            checked={formData.media_type === 'video'}
                                            onChange={(e) => setFormData({ ...formData, media_type: 'video' })}
                                            className="w-4 h-4 text-[#06b6d4] border-gray-300 focus:ring-[#06b6d4]"
                                        />
                                        <span className="text-gray-900 font-medium">YouTube Video</span>
                                    </label>
                                </div>
                            </div>

                            {/* Image URL */}
                            {formData.media_type === 'image' ? (
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
                            ) : (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        YouTube Video URL <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.video_url || ''}
                                        onChange={(e) => setFormData({ ...formData, video_url: e.target.value, image: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent outline-none text-gray-900 font-medium placeholder:text-gray-400"
                                        placeholder="https://www.youtube.com/watch?v=..."
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Supported formats: youtube.com/watch?v=..., youtu.be/..., youtube.com/embed/..., youtube.com/shorts/...
                                    </p>
                                    {formData.video_url && (() => {
                                        const getVideoId = (url: string) => {
                                            const patterns = [
                                                /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
                                                /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
                                                /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
                                            ];
                                            for (const pattern of patterns) {
                                                const match = url.match(pattern);
                                                if (match) return match[1];
                                            }
                                            return null;
                                        };
                                        const videoId = getVideoId(formData.video_url);
                                        return videoId ? (
                                            <div className="mt-3 w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                                <iframe
                                                    src={`https://www.youtube.com/embed/${videoId}`}
                                                    className="w-full h-full"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                />
                                            </div>
                                        ) : (
                                            <p className="mt-2 text-sm text-red-500">Invalid YouTube URL format</p>
                                        );
                                    })()}
                                </div>
                            )}

                            {/* CTA Buttons */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Primary CTA Text
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
                                        Secondary CTA Text
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.cta_secondary}
                                        onChange={(e) => setFormData({ ...formData, cta_secondary: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent outline-none text-gray-900 font-medium placeholder:text-gray-400"
                                        placeholder="Get Quote"
                                    />
                                </div>
                            </div>

                            {/* CTA Links */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Primary Button Link
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.cta_link || "/products"}
                                        onChange={(e) => setFormData({ ...formData, cta_link: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent outline-none text-gray-900 font-medium placeholder:text-gray-400"
                                        placeholder="/products"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Examples: /products, /services, https://example.com</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Secondary Button Link
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.cta_secondary_link || "/contact"}
                                        onChange={(e) => setFormData({ ...formData, cta_secondary_link: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent outline-none text-gray-900 font-medium placeholder:text-gray-400"
                                        placeholder="/contact"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Examples: /contact, /about, /services</p>
                                </div>
                            </div>

                            {/* Active Status */}
                            <div className="flex items-center space-x-3 pt-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={!!formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4 text-[#06b6d4] border-gray-300 rounded focus:ring-[#06b6d4]"
                                />
                                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
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
                                className="px-6 py-2 bg-linear-to-r from-[#06b6d4] to-[#06124f] text-white font-semibold rounded-lg hover:shadow-lg transition-all"
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
