"use client";

import { useState, useEffect } from "react";
import {
    Package, Layout, Image as ImageIcon, List, Settings, Plus, X,
    Save, Trash2, ChevronRight, Star, Tag, Smartphone, Printer,
    Scan, Box, Lightbulb
} from "lucide-react";

interface Product {
    id: number;
    slug: string;
    name: string;
    category: string;
    description: string;
    tagline: string;
    image_url: string;
    media_type?: 'image' | 'video';
    video_url?: string;
    theme_color: string;
    specs: string[];
    is_featured: boolean;
    price_display: string;
    stock_status: 'In Stock' | 'Low Stock' | 'Out of Stock';
    created_at: string;
    updated_at: string;
}

const CATEGORY_OPTIONS = ["Printers", "Scanners", "Mobility", "Software", "Consumables"];
const STOCK_STATUS_OPTIONS = ["In Stock", "Low Stock", "Out of Stock"];

// Extract YouTube video ID from URL (supports regular videos and Shorts)
const getYouTubeVideoId = (url: string): string | null => {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
};

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState("general");

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/products");
            if (!response.ok) throw new Error("Failed to fetch products");
            const data = await response.json();
            const parsedData = data.map((p: any) => ({
                ...p,
                specs: typeof p.specs === 'string' ? JSON.parse(p.specs) : p.specs,
                is_featured: Boolean(p.is_featured)
            }));
            setProducts(parsedData);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const [showFormModal, setShowFormModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<Product>>({
        name: "",
        slug: "",
        category: "Printers",
        description: "",
        tagline: "",
        image_url: "",
        media_type: 'image',
        video_url: "",
        theme_color: "from-[#06b6d4] to-[#06124f]",
        specs: [],
        is_featured: false,
        price_display: "",
        stock_status: "In Stock"
    });

    const openAddModal = () => {
        setIsEditing(false);
        setFormData({
            name: "",
            slug: "",
            category: "Printers",
            description: "",
            tagline: "",
            image_url: "",
            media_type: 'image',
            video_url: "",
            theme_color: "from-[#06b6d4] to-[#06124f]",
            specs: [],
            is_featured: false,
            price_display: "",
            stock_status: "In Stock"
        });
        setActiveTab("general");
        setShowFormModal(true);
    };

    const openEditModal = (product: Product) => {
        setIsEditing(true);
        setSelectedProductId(product.id);
        setFormData(product);
        setActiveTab("general");
        setShowFormModal(true);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = isEditing ? `/api/products/${selectedProductId}` : "/api/products";
            const method = isEditing ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error("Failed to save product");

            setShowFormModal(false);
            fetchProducts();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const confirmDelete = async () => {
        if (selectedProductId) {
            try {
                const response = await fetch(`/api/products/${selectedProductId}`, {
                    method: "DELETE",
                });
                if (!response.ok) throw new Error("Failed to delete product");

                setProducts(products.filter(p => p.id !== selectedProductId));
                setShowDeleteModal(false);
                setSelectedProductId(null);
            } catch (err: any) {
                alert(err.message);
            }
        }
    };

    const addSpec = () => {
        setFormData({
            ...formData,
            specs: [...(formData.specs || []), ""]
        });
    };

    const removeSpec = (index: number) => {
        const newSpecs = [...(formData.specs || [])];
        newSpecs.splice(index, 1);
        setFormData({ ...formData, specs: newSpecs });
    };

    const updateSpec = (index: number, value: string) => {
        const newSpecs = [...(formData.specs || [])];
        newSpecs[index] = value;
        setFormData({ ...formData, specs: newSpecs });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#06b6d4]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Products Management</h1>
                    <p className="text-gray-600 mt-1">Add and manage products with Hero Slider integration</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#06124f] to-[#06b6d4] text-white font-semibold rounded-xl shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 hover:-translate-y-0.5"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Add New Product
                </button>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Search by name or category..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] outline-none transition-all placeholder:text-gray-500 text-gray-900"
                        />
                        <Box className="w-5 h-5 text-gray-600 absolute left-3 top-2.5" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                    <div key={product.id} className="group bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                        <div className="relative h-48 bg-gray-50 overflow-hidden p-6">
                            <div className={`absolute inset-0 bg-gradient-to-br ${product.theme_color} opacity-5 group-hover:opacity-10 transition-opacity`} />
                            {product.media_type === 'video' && product.video_url ? (
                                // YouTube Video
                                (() => {
                                    const videoId = getYouTubeVideoId(product.video_url);
                                    return videoId ? (
                                        <div className="w-full h-full relative z-10">
                                            <iframe
                                                src={`https://www.youtube.com/embed/${videoId}?autoplay=0&mute=1&controls=1&modestbranding=1&rel=0`}
                                                className="w-full h-full rounded-lg"
                                                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        </div>
                                    ) : product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-contain relative z-10 drop-shadow-2xl group-hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-200">
                                            <Package size={64} />
                                        </div>
                                    );
                                })()
                            ) : product.image_url ? (
                                <img src={product.image_url} alt={product.name} className="w-full h-full object-contain relative z-10 drop-shadow-2xl group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-200">
                                    <Package size={64} />
                                </div>
                            )}
                            {product.is_featured && (
                                <div className="absolute top-4 right-4 z-20">
                                    <div className="bg-yellow-400 text-white p-2 rounded-lg shadow-lg">
                                        <Star size={16} fill="white" />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-3 py-1 bg-cyan-50 text-[#06b6d4] rounded-full text-[10px] font-black uppercase tracking-widest">
                                    {product.category}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${product.stock_status === 'In Stock' ? 'bg-green-50 text-green-600' :
                                    product.stock_status === 'Low Stock' ? 'bg-orange-50 text-orange-600' :
                                        'bg-red-50 text-red-600'
                                    }`}>
                                    {product.stock_status}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-[#06124f] mb-1 line-clamp-1">{product.name}</h3>
                            <p className="text-sm text-gray-500 mb-6 line-clamp-2">{product.description}</p>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                <span className="font-bold text-[#06b6d4]">{product.price_display || "Contact for Quote"}</span>
                                <div className="flex space-x-1">
                                    <button onClick={() => openEditModal(product)} className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors">
                                        <ChevronRight size={20} />
                                    </button>
                                    <button onClick={() => { setSelectedProductId(product.id); setShowDeleteModal(true); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showFormModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-[#06124f]">
                            <div>
                                <h2 className="text-2xl font-black text-white flex items-center">
                                    <Package className="mr-3 text-[#06b6d4]" />
                                    {isEditing ? "Edit Product" : "Add New Product"}
                                </h2>
                                <p className="text-cyan-400 font-bold">Define visuals and technical specs</p>
                            </div>
                            <button onClick={() => setShowFormModal(false)} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex bg-white shadow-inner">
                            {[
                                { id: 'general', label: 'Basic Info', icon: List },
                                { id: 'visuals', label: 'Visuals & Slider', icon: Smartphone },
                                { id: 'specs', label: 'Specifications', icon: Settings }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center px-8 py-5 text-sm font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === tab.id
                                        ? 'border-[#06b6d4] text-[#06b6d4] bg-cyan-50/20'
                                        : 'border-transparent text-gray-600 hover:text-gray-900'}`}
                                >
                                    <tab.icon size={16} className="mr-2" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 bg-white">
                            <form id="productForm" onSubmit={handleFormSubmit} className="space-y-8">
                                {activeTab === 'general' && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-700 uppercase tracking-[0.2em] mb-2">Product Name</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.name || ""}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all font-bold text-gray-900 placeholder:text-gray-400"
                                                    placeholder="e.g. Zebra ZT411"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-700 uppercase tracking-[0.2em] mb-2">Product Slug</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.slug || ""}
                                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all font-bold text-gray-800 placeholder:text-gray-400"
                                                    placeholder="zebra-zt411"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-700 uppercase tracking-[0.2em] mb-2">Category</label>
                                                <select
                                                    value={formData.category || "Printers"}
                                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all font-bold text-[#06124f]"
                                                >
                                                    {CATEGORY_OPTIONS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-700 uppercase tracking-[0.2em] mb-2">Stock Status</label>
                                                <select
                                                    value={formData.stock_status || "In Stock"}
                                                    onChange={(e) => setFormData({ ...formData, stock_status: e.target.value as any })}
                                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all font-bold text-[#06124f]"
                                                >
                                                    {STOCK_STATUS_OPTIONS.map(status => <option key={status} value={status}>{status}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-gray-700 uppercase tracking-[0.2em] mb-2">Price Label (Optional)</label>
                                            <input
                                                type="text"
                                                value={formData.price_display || ""}
                                                onChange={(e) => setFormData({ ...formData, price_display: e.target.value })}
                                                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all font-bold text-gray-800 placeholder:text-gray-400"
                                                placeholder="$1,299 or Contact for Quote"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-gray-700 uppercase tracking-[0.2em] mb-2">Short Description</label>
                                            <textarea
                                                value={formData.description || ""}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all font-medium text-gray-800 placeholder:text-gray-400 min-h-[120px]"
                                                placeholder="Describe the product for the grid view..."
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'visuals' && (
                                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                                        <div className="flex items-center justify-between p-6 bg-cyan-50 rounded-[2rem] border-2 border-dashed border-cyan-200">
                                            <div className="flex items-center">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 transition-all ${formData.is_featured ? 'bg-[#06b6d4] text-white' : 'bg-gray-200 text-gray-400'}`}>
                                                    <Star size={24} fill={formData.is_featured ? "white" : "none"} />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-[#06124f]">Featured in Hero Slider</h4>
                                                    <p className="text-xs text-cyan-600/70 font-bold uppercase tracking-widest">Display on homepage hero section</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, is_featured: !formData.is_featured })}
                                                className={`w-14 h-8 rounded-full transition-all relative ${formData.is_featured ? 'bg-[#06b6d4]' : 'bg-gray-300'}`}
                                            >
                                                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all ${formData.is_featured ? 'right-1' : 'left-1'}`} />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-6">
                                                {/* Media Type Selector */}
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-700 uppercase tracking-[0.2em] mb-3">Media Type</label>
                                                    <div className="flex gap-4">
                                                        <label className="flex items-center space-x-2 cursor-pointer">
                                                            <input
                                                                type="radio"
                                                                name="media_type"
                                                                value="image"
                                                                checked={formData.media_type === 'image' || !formData.media_type}
                                                                onChange={() => setFormData({ ...formData, media_type: 'image', video_url: '' })}
                                                                className="w- 4 h-4 text-[#06b6d4] border-gray-300 focus:ring-[#06b6d4]"
                                                            />
                                                            <span className="text-gray-900 font-bold">Image</span>
                                                        </label>
                                                        <label className="flex items-center space-x-2 cursor-pointer">
                                                            <input
                                                                type="radio"
                                                                name="media_type"
                                                                value="video"
                                                                checked={formData.media_type === 'video'}
                                                                onChange={() => setFormData({ ...formData, media_type: 'video' })}
                                                                className="w-4 h-4 text-[#06b6d4] border-gray-300 focus:ring-[#06b6d4]"
                                                            />
                                                            <span className="text-gray-900 font-bold">YouTube Video</span>
                                                        </label>
                                                    </div>
                                                </div>

                                                {/* Image URL or Video URL based on selection */}
                                                {formData.media_type === 'video' ? (
                                                    <div>
                                                        <label className="block text-[10px] font-black text-gray-700 uppercase tracking-[0.2em] mb-2">YouTube Video URL</label>
                                                        <input
                                                            type="text"
                                                            value={formData.video_url || ""}
                                                            onChange={(e) => setFormData({ ...formData, video_url: e.target.value, image_url: e.target.value })}
                                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-cyan-500/10 outline-none font-bold text-gray-800"
                                                            placeholder="https://www.youtube.com/watch?v=..."
                                                        />
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Supported: youtube.com/watch?v=..., youtu.be/..., youtube.com/embed/..., youtube.com/shorts/...
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <label className="block text-[10px] font-black text-gray-700 uppercase tracking-[0.2em] mb-2">Image URL</label>
                                                        <input
                                                            type="text"
                                                            value={formData.image_url || ""}
                                                            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-cyan-500/10 outline-none font-bold text-gray-800"
                                                        />
                                                    </div>
                                                )}
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-700 uppercase tracking-[0.2em] mb-2">Hero Tagline</label>
                                                    <input
                                                        type="text"
                                                        value={formData.tagline || ""}
                                                        onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-cyan-500/10 outline-none font-bold text-gray-800 placeholder:text-gray-400"
                                                        placeholder="e.g. Rugged Durability for Industrial Needs"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-700 uppercase tracking-[0.2em] mb-2">Theme Gradient</label>
                                                    <input
                                                        type="text"
                                                        value={formData.theme_color || ""}
                                                        onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-cyan-500/10 outline-none font-bold text-gray-800 mb-4"
                                                    />
                                                    <div className={`h-24 w-full rounded-[2rem] shadow-xl relative overflow-hidden bg-gradient-to-br ${formData.theme_color}`}>
                                                        {formData.image_url && (
                                                            <div className="absolute inset-0 flex items-center justify-center opacity-40">
                                                                <img src={formData.image_url} alt="Preview" className="w-1/2 h-1/2 object-contain grayscale brightness-0 invert" />
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <span className="text-white text-[10px] font-black uppercase tracking-[0.3em]">Theme Preview</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 rounded-[2rem] p-6 border border-gray-100 flex flex-col items-center justify-center min-h-[300px]">
                                                {formData.media_type === 'video' && formData.video_url ? (
                                                    // YouTube Video Preview
                                                    (() => {
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
                                                            <iframe
                                                                src={`https://www.youtube.com/embed/${videoId}`}
                                                                className="w-full aspect-video rounded-xl"
                                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                allowFullScreen
                                                            />
                                                        ) : (
                                                            <div className="text-center text-red-400">
                                                                <p className="font-bold">Invalid YouTube URL</p>
                                                            </div>
                                                        );
                                                    })()
                                                ) : formData.image_url ? (
                                                    <img src={formData.image_url} alt="Preview" className="max-w-full max-h-[250px] object-contain drop-shadow-2xl" />
                                                ) : (
                                                    <div className="text-center text-gray-300">
                                                        <ImageIcon size={64} className="mx-auto mb-2 opacity-20" />
                                                        <p className="font-bold opacity-30">No Media Provided</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'specs' && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-lg font-black text-[#06124f]">Technical Specifications</h4>
                                            <button
                                                type="button"
                                                onClick={addSpec}
                                                className="px-4 py-2 bg-cyan-50 text-[#06b6d4] font-black rounded-xl text-xs flex items-center hover:bg-cyan-100 transition-colors"
                                            >
                                                <Plus size={14} className="mr-1" /> Add Spec
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {formData.specs?.map((spec, i) => (
                                                <div key={i} className="flex gap-2 group animate-in fade-in zoom-in-95 duration-200">
                                                    <div className="flex-1 relative">
                                                        <input
                                                            value={spec || ""}
                                                            onChange={(e) => updateSpec(i, e.target.value)}
                                                            className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-200 outline-none font-bold text-sm text-gray-900 placeholder:text-gray-400"
                                                            placeholder="e.g. 600 DPI Resolution"
                                                        />
                                                        <div className="absolute left-[-10px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                    <button type="button" onClick={() => removeSpec(i)} className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            ))}
                                            {(formData.specs?.length || 0) === 0 && (
                                                <div className="col-span-2 py-12 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                                                    <Settings size={40} className="mx-auto mb-2 text-gray-300" />
                                                    <p className="text-gray-400 font-bold">No specifications added yet</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>

                        <div className="p-10 border-t border-gray-100 bg-gray-50/50 flex space-x-4 justify-end">
                            <button
                                type="button"
                                onClick={() => setShowFormModal(false)}
                                className="px-10 py-4 text-gray-400 font-black uppercase tracking-widest text-xs hover:text-gray-600 transition-all border-2 border-transparent hover:border-gray-200 rounded-2xl"
                            >
                                Discard
                            </button>
                            <button
                                form="productForm"
                                type="submit"
                                className="px-12 py-4 bg-[#06b6d4] text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all flex items-center"
                            >
                                <Save size={18} className="mr-3" />
                                {isEditing ? "Save Product" : "Publish Product"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="fixed inset-0 bg-[#06124f]/80 backdrop-blur-xl flex items-center justify-center z-[200] p-4">
                    <div className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl text-center">
                        <div className="w-24 h-24 bg-red-100 rounded-[2rem] flex items-center justify-center mx-auto mb-8 transform -rotate-6">
                            <Trash2 size={48} className="text-red-500" />
                        </div>
                        <h3 className="text-3xl font-black text-[#06124f] mb-4">Are you sure?</h3>
                        <p className="text-gray-500 font-medium mb-12 leading-relaxed px-4">
                            Deleting this product will remove it from the catalog and any active promotions. This action is permanent.
                        </p>
                        <div className="flex gap-4">
                            <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-5 text-gray-400 font-black uppercase tracking-widest text-xs hover:bg-gray-50 rounded-[2rem] transition-all">
                                No, Cancel
                            </button>
                            <button onClick={confirmDelete} className="flex-1 py-5 bg-red-500 text-white font-black uppercase tracking-widest text-xs rounded-[2rem] shadow-xl shadow-red-500/20 hover:scale-105 transition-all">
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
