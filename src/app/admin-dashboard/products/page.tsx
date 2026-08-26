"use client";

import { useState, useEffect, useMemo } from "react";
import { useModulePermission } from "@/context/ModulePermissionContext";
import {
    Package, Plus, Search, Trash2, Edit3, Eye, Filter,
    CheckCircle, AlertCircle, X, Save, Tag, Star, Check,
    Sparkles, RefreshCw, Box, ChevronRight, ChevronLeft,
    Image as ImageIcon, Video, AlertTriangle, Truck,
    ShieldCheck, Heart, SlidersHorizontal, ArrowUpDown,
    CheckCircle2, LayoutGrid, List as ListIcon, Zap, RotateCcw,
    FileText, Download, ExternalLink
} from "lucide-react";

interface Product {
    id: number;
    slug: string;
    name: string;
    category: string;
    description: string;
    tagline: string;
    image_url: string;
    images?: string[];
    pdf_url?: string;
    media_type?: "image" | "video";
    video_url?: string;
    theme_color: string;
    specs: string[];
    is_featured: boolean;
    price_display: string;
    stock_status: "In Stock" | "Low Stock" | "Out of Stock";
    created_at?: string;
    updated_at?: string;
}

const CATEGORY_OPTIONS = ["Printers", "Scanners", "Mobility", "Software", "Consumables", "Accessories"];
const STOCK_STATUS_OPTIONS: Array<"In Stock" | "Low Stock" | "Out of Stock"> = ["In Stock", "Low Stock", "Out of Stock"];

// Helper to parse multiple images from image_url
const parseProductImages = (imageUrl?: string): string[] => {
    if (!imageUrl) return [];
    try {
        if (imageUrl.startsWith("[") && imageUrl.endsWith("]")) {
            const parsed = JSON.parse(imageUrl);
            if (Array.isArray(parsed)) {
                return parsed.filter((img) => typeof img === "string" && img.trim() !== "");
            }
        }
    } catch { }
    if (imageUrl.includes(",")) {
        return imageUrl.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [imageUrl.trim()].filter(Boolean);
};

// Helper to extract YouTube video ID from URL
const getYouTubeVideoId = (url?: string): string | null => {
    if (!url) return null;
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

// Helper to auto-generate slug
const generateSlug = (text: string) => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
};

export default function FlipkartAdminProductsPage() {
    const { write: canWrite, delete: canDelete, admin: isAdmin } = useModulePermission();

    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Flipkart-style Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [stockFilter, setStockFilter] = useState<string>("All");
    const [featuredOnly, setFeaturedOnly] = useState(false);
    const [sortBy, setSortBy] = useState<"relevance" | "popular" | "price_low" | "price_high" | "newest">("relevance");
    const [viewMode, setViewMode] = useState<"list" | "grid">("list");

    // Active Card Image hover indexes: { [productId]: number }
    const [cardActiveImg, setCardActiveImg] = useState<{ [key: number]: number }>({});

    // Modals
    const [showFormModal, setShowFormModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
    const [previewActiveImageIdx, setPreviewActiveImageIdx] = useState(0);
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Multiple images state in modal
    const [imagesList, setImagesList] = useState<string[]>([]);
    const [newImageUrlInput, setNewImageUrlInput] = useState("");
    const [newSpecInput, setNewSpecInput] = useState("");

    // Form State
    const [formData, setFormData] = useState<Partial<Product>>({
        name: "",
        slug: "",
        category: "Printers",
        description: "",
        tagline: "",
        image_url: "",
        pdf_url: "",
        media_type: "image",
        video_url: "",
        theme_color: "from-[#06124f] to-[#06b6d4]",
        specs: [],
        is_featured: false,
        price_display: "",
        stock_status: "In Stock"
    });

    const fetchProducts = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/products");
            if (!response.ok) throw new Error("Failed to fetch products");
            const data = await response.json();
            const parsedData = data.map((p: any) => {
                const parsedImages = parseProductImages(p.image_url);
                return {
                    ...p,
                    images: parsedImages,
                    primary_image: parsedImages[0] || "",
                    specs: typeof p.specs === "string" ? JSON.parse(p.specs || "[]") : (p.specs || []),
                    is_featured: Boolean(p.is_featured),
                    stock_status: p.stock_status || "In Stock"
                };
            });
            setProducts(parsedData);
        } catch (err: any) {
            setError(err.message || "Something went wrong while fetching products");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // Summary Statistics
    const stats = useMemo(() => {
        const total = products.length;
        const inStock = products.filter(p => p.stock_status === "In Stock").length;
        const lowStock = products.filter(p => p.stock_status === "Low Stock").length;
        const outOfStock = products.filter(p => p.stock_status === "Out of Stock").length;
        const featured = products.filter(p => p.is_featured).length;
        return { total, inStock, lowStock, outOfStock, featured };
    }, [products]);

    // Categories list
    const categoryList = useMemo(() => {
        const set = new Set(["All", ...CATEGORY_OPTIONS, ...products.map(p => p.category)]);
        return Array.from(set).filter(Boolean);
    }, [products]);

    // Parse numeric price for sorting
    const extractPriceNumber = (priceStr?: string): number => {
        if (!priceStr) return 0;
        const match = priceStr.replace(/[^0-9.]/g, "");
        return parseFloat(match) || 0;
    };

    // Filter & Sort Logic
    const filteredProducts = useMemo(() => {
        return products
            .filter((p) => {
                const matchSearch =
                    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));

                const matchCategory =
                    selectedCategory === "All" || p.category.toLowerCase() === selectedCategory.toLowerCase();

                const matchStock =
                    stockFilter === "All" || p.stock_status === stockFilter;

                const matchFeatured = !featuredOnly || p.is_featured;

                return matchSearch && matchCategory && matchStock && matchFeatured;
            })
            .sort((a, b) => {
                if (sortBy === "popular" || sortBy === "relevance") {
                    return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
                }
                if (sortBy === "price_low") {
                    return extractPriceNumber(a.price_display) - extractPriceNumber(b.price_display);
                }
                if (sortBy === "price_high") {
                    return extractPriceNumber(b.price_display) - extractPriceNumber(a.price_display);
                }
                if (sortBy === "newest") {
                    return (b.id || 0) - (a.id || 0);
                }
                return 0;
            });
    }, [products, searchTerm, selectedCategory, stockFilter, featuredOnly, sortBy]);

    const resetFilters = () => {
        setSearchTerm("");
        setSelectedCategory("All");
        setStockFilter("All");
        setFeaturedOnly(false);
        setSortBy("relevance");
    };

    // Form handlers
    const openAddModal = () => {
        setIsEditing(false);
        setSelectedProductId(null);
        setFormData({
            name: "",
            slug: "",
            category: "Printers",
            description: "",
            tagline: "",
            image_url: "",
            pdf_url: "",
            media_type: "image",
            video_url: "",
            theme_color: "from-[#06124f] to-[#06b6d4]",
            specs: [],
            is_featured: false,
            price_display: "",
            stock_status: "In Stock"
        });
        setImagesList([]);
        setNewImageUrlInput("");
        setNewSpecInput("");
        setShowFormModal(true);
    };

    const openEditModal = (product: Product) => {
        setIsEditing(true);
        setSelectedProductId(product.id);
        const currentImages = product.images && product.images.length > 0
            ? product.images
            : parseProductImages(product.image_url);

        setImagesList(currentImages);
        setNewImageUrlInput("");
        setFormData({
            ...product,
            pdf_url: product.pdf_url || "",
            specs: product.specs || []
        });
        setNewSpecInput("");
        setShowFormModal(true);
    };

    const handleNameChange = (name: string) => {
        if (!isEditing && (!formData.slug || formData.slug === generateSlug(formData.name || ""))) {
            setFormData(prev => ({
                ...prev,
                name,
                slug: generateSlug(name)
            }));
        } else {
            setFormData(prev => ({ ...prev, name }));
        }
    };

    const handleAddImage = () => {
        if (!newImageUrlInput.trim()) return;
        const urlsToAdd = newImageUrlInput
            .split(/[\n,]+/)
            .map(u => u.trim())
            .filter(u => u.length > 0);

        if (urlsToAdd.length > 0) {
            setImagesList(prev => [...prev, ...urlsToAdd]);
            setNewImageUrlInput("");
        }
    };

    const handleRemoveImage = (index: number) => {
        setImagesList(prev => prev.filter((_, i) => i !== index));
    };

    const handleSetCoverImage = (index: number) => {
        if (index === 0) return;
        setImagesList(prev => {
            const item = prev[index];
            const remaining = prev.filter((_, i) => i !== index);
            return [item, ...remaining];
        });
    };

    const handleAddSpec = () => {
        if (!newSpecInput.trim()) return;
        setFormData(prev => ({
            ...prev,
            specs: [...(prev.specs || []), newSpecInput.trim()]
        }));
        setNewSpecInput("");
    };

    const handleRemoveSpec = (index: number) => {
        setFormData(prev => {
            const updated = [...(prev.specs || [])];
            updated.splice(index, 1);
            return { ...prev, specs: updated };
        });
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const url = isEditing ? `/api/products/${selectedProductId}` : "/api/products";
            const method = isEditing ? "PUT" : "POST";

            let finalImageUrl = "";
            if (imagesList.length === 1) {
                finalImageUrl = imagesList[0];
            } else if (imagesList.length > 1) {
                finalImageUrl = JSON.stringify(imagesList);
            }

            const payload = {
                ...formData,
                slug: formData.slug || generateSlug(formData.name || ""),
                image_url: finalImageUrl,
                specs: formData.specs || [],
                is_featured: Boolean(formData.is_featured)
            };

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to save product");
            }

            setShowFormModal(false);
            await fetchProducts();
        } catch (err: any) {
            alert(err.message || "An error occurred while saving");
        } finally {
            setIsSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!selectedProductId) return;
        try {
            const response = await fetch(`/api/products/${selectedProductId}`, {
                method: "DELETE",
            });
            if (!response.ok) throw new Error("Failed to delete product");

            setProducts(prev => prev.filter(p => p.id !== selectedProductId));
            setShowDeleteModal(false);
            setSelectedProductId(null);
        } catch (err: any) {
            alert(err.message || "Failed to delete product");
        }
    };

    return (
        <div className="bg-[#f1f3f6] min-h-screen -m-6 p-4 lg:p-6 space-y-4 font-sans text-gray-800">
            {/* TOP FLIPKART HEADER BAR */}
            <div className="bg-white rounded-md shadow-xs border border-gray-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="w-10 h-10 rounded-md bg-[#2874f0] text-white flex items-center justify-center font-black text-lg italic shadow-xs">
                        V
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                                Products Catalog
                            </h1>
                            <span className="bg-[#2874f0]/10 text-[#2874f0] text-[11px] font-bold px-2 py-0.5 rounded italic">
                                Viros Assured
                            </span>
                        </div>
                        <p className="text-xs text-gray-500">
                            Showing <span className="font-bold text-gray-800">{filteredProducts.length}</span> of {products.length} products
                        </p>
                    </div>
                </div>

                {/* Search in Catalog */}
                <div className="relative flex-1 max-w-md w-full">
                    <input
                        type="text"
                        placeholder="Search for products, brands and more..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-9 py-2 bg-gray-50 border border-gray-300 rounded-sm text-sm focus:bg-white focus:border-[#2874f0] focus:ring-1 focus:ring-[#2874f0] outline-none text-gray-800"
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Actions & Refresh */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <button
                        onClick={fetchProducts}
                        disabled={isLoading}
                        title="Refresh"
                        className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-sm transition-all border border-gray-200"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#2874f0]" : ""}`} />
                    </button>

                    {(canWrite || isAdmin) && (
                        <button
                            onClick={openAddModal}
                            className="inline-flex items-center px-4 py-2 bg-[#fb641b] hover:bg-[#e85b17] text-white font-bold text-sm rounded-sm shadow-xs transition-all duration-150 uppercase tracking-wide cursor-pointer"
                        >
                            <Plus className="w-4 h-4 mr-1.5" />
                            Add Product
                        </button>
                    )}
                </div>
            </div>

            {/* MAIN TWO-COLUMN FLIPKART LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* LEFT SIDEBAR: FLIPKART FILTERS */}
                <div className="lg:col-span-3 bg-white rounded-md border border-gray-200 shadow-xs divide-y divide-gray-200">
                    {/* Filter Header */}
                    <div className="p-4 flex items-center justify-between">
                        <span className="font-bold text-base text-gray-900 uppercase tracking-wider flex items-center gap-2">
                            <SlidersHorizontal className="w-4 h-4 text-gray-600" /> Filters
                        </span>
                        {(searchTerm || selectedCategory !== "All" || stockFilter !== "All" || featuredOnly) && (
                            <button
                                onClick={resetFilters}
                                className="text-xs font-bold text-[#2874f0] uppercase hover:underline"
                            >
                                Clear all
                            </button>
                        )}
                    </div>

                    {/* Category Filter */}
                    <div className="p-4 space-y-3">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                            Categories
                        </span>
                        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                            {categoryList.map((cat) => {
                                const count = cat === "All"
                                    ? products.length
                                    : products.filter(p => p.category.toLowerCase() === cat.toLowerCase()).length;
                                const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();

                                return (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`w-full flex items-center justify-between text-xs py-1.5 px-2 rounded transition-colors text-left ${isSelected
                                            ? "bg-[#2874f0]/10 text-[#2874f0] font-bold"
                                            : "text-gray-700 hover:bg-gray-50 font-medium"
                                            }`}
                                    >
                                        <span className="truncate">{cat}</span>
                                        <span className="text-[11px] text-gray-400">({count})</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Stock Status Filter */}
                    <div className="p-4 space-y-3">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                            Availability
                        </span>
                        <div className="space-y-2">
                            {["All", "In Stock", "Low Stock", "Out of Stock"].map((status) => (
                                <label
                                    key={status}
                                    className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer font-medium hover:text-gray-900"
                                >
                                    <input
                                        type="radio"
                                        name="stockFilter"
                                        checked={stockFilter === status}
                                        onChange={() => setStockFilter(status)}
                                        className="w-3.5 h-3.5 text-[#2874f0] focus:ring-[#2874f0]"
                                    />
                                    <span>{status === "All" ? "Include All Stock" : status}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Flipkart Assured / Featured Toggle */}
                    <div className="p-4 space-y-3">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                            Special Badges
                        </span>
                        <label className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer font-medium">
                            <input
                                type="checkbox"
                                checked={featuredOnly}
                                onChange={(e) => setFeaturedOnly(e.target.checked)}
                                className="w-4 h-4 rounded text-[#2874f0] focus:ring-[#2874f0]"
                            />
                            <div className="flex items-center gap-1.5">
                                <span className="bg-[#2874f0] text-white text-[10px] font-black italic px-1.5 py-0.2 rounded-xs">
                                    Plus
                                </span>
                                <span>Featured / Top Sellers</span>
                            </div>
                        </label>
                    </div>

                    {/* Quick Stats Box */}
                    <div className="p-4 bg-gray-50/70 text-xs space-y-2">
                        <span className="font-bold text-gray-600 block uppercase text-[10px] tracking-wider">Inventory Metrics</span>
                        <div className="flex justify-between text-gray-600">
                            <span>In Stock:</span>
                            <span className="font-bold text-emerald-600">{stats.inStock}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Low Stock:</span>
                            <span className="font-bold text-amber-600">{stats.lowStock}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Out of Stock:</span>
                            <span className="font-bold text-rose-600">{stats.outOfStock}</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT MAIN PRODUCTS CONTENT */}
                <div className="lg:col-span-9 space-y-3">
                    {/* FLIPKART SORT BAR */}
                    <div className="bg-white rounded-md border border-gray-200 shadow-xs px-4 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        {/* Sort Tabs */}
                        <div className="flex items-center gap-1 sm:gap-4 overflow-x-auto text-xs pb-1 sm:pb-0 w-full sm:w-auto">
                            <span className="font-bold text-gray-900 mr-1 whitespace-nowrap">Sort By:</span>
                            {[
                                { id: "relevance", label: "Relevance" },
                                { id: "popular", label: "Popularity" },
                                { id: "price_low", label: "Price -- Low to High" },
                                { id: "price_high", label: "Price -- High to Low" },
                                { id: "newest", label: "Newest First" },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setSortBy(tab.id as any)}
                                    className={`pb-1 px-1 whitespace-nowrap font-medium transition-all border-b-2 ${sortBy === tab.id
                                        ? "text-[#2874f0] border-[#2874f0] font-bold"
                                        : "text-gray-600 border-transparent hover:text-gray-900"
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* View Switcher: List vs Grid */}
                        <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded border border-gray-200 shrink-0">
                            <button
                                onClick={() => setViewMode("list")}
                                title="Flipkart List View"
                                className={`p-1.5 rounded transition-all ${viewMode === "list" ? "bg-white text-[#2874f0] shadow-xs" : "text-gray-500 hover:text-gray-900"}`}
                            >
                                <ListIcon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode("grid")}
                                title="Flipkart Grid View"
                                className={`p-1.5 rounded transition-all ${viewMode === "grid" ? "bg-white text-[#2874f0] shadow-xs" : "text-gray-500 hover:text-gray-900"}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* PRODUCTS CONTAINER */}
                    {isLoading ? (
                        <div className="bg-white rounded-md p-16 border border-gray-200 text-center">
                            <div className="w-10 h-10 border-3 border-[#2874f0] border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <p className="text-gray-500 text-sm font-medium mt-3">Loading Flipkart Catalog...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-white rounded-md p-8 border border-rose-200 text-center">
                            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
                            <h3 className="font-bold text-gray-800">Failed to load catalog</h3>
                            <p className="text-xs text-rose-600 mt-1">{error}</p>
                            <button onClick={fetchProducts} className="mt-3 px-4 py-1.5 bg-[#2874f0] text-white text-xs font-bold rounded">
                                Retry
                            </button>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="bg-white rounded-md p-16 border border-gray-200 text-center">
                            <Package className="w-14 h-14 text-gray-300 mx-auto mb-2" />
                            <h3 className="text-base font-bold text-gray-800">Sorry, no products found!</h3>
                            <p className="text-xs text-gray-500 mt-1">Please check the spelling or try resetting your filters.</p>
                            <button
                                onClick={resetFilters}
                                className="mt-4 px-4 py-2 bg-[#2874f0] text-white text-xs font-bold uppercase rounded-sm"
                            >
                                Reset All Filters
                            </button>
                        </div>
                    ) : viewMode === "list" ? (
                        /* ========================================================================= */
                        /* FLIPKART CLASSIC LIST VIEW (HORIZONTAL 3-PANEL ROW)                      */
                        /* ========================================================================= */
                        <div className="bg-white rounded-md border border-gray-200 divide-y divide-gray-200 overflow-hidden shadow-xs">
                            {filteredProducts.map((product) => {
                                const productImages = product.images && product.images.length > 0
                                    ? product.images
                                    : parseProductImages(product.image_url);

                                const activeIndex = cardActiveImg[product.id] || 0;
                                const displayImg = productImages[activeIndex] || productImages[0] || "";

                                return (
                                    <div
                                        key={product.id}
                                        className="p-4 sm:p-5 hover:shadow-md transition-shadow duration-200 flex flex-col md:flex-row gap-5 items-start relative group"
                                    >
                                        {/* Column 1: Product Media & Gallery Thumbnails */}
                                        <div className="w-full md:w-56 shrink-0 flex flex-col items-center">
                                            <div className="w-full h-48 bg-white rounded flex items-center justify-center p-2 relative overflow-hidden border border-gray-100">
                                                {displayImg ? (
                                                    <img
                                                        src={displayImg}
                                                        alt={product.name}
                                                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                ) : (
                                                    <Package className="w-16 h-16 text-gray-300" />
                                                )}

                                                {/* Category tag */}
                                                <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded uppercase">
                                                    {product.category}
                                                </span>
                                            </div>

                                            {/* Thumbnail switcher if multiple images */}
                                            {productImages.length > 1 && (
                                                <div className="flex items-center gap-1.5 mt-2 overflow-x-auto max-w-full pb-1">
                                                    {productImages.map((thumb, idx) => (
                                                        <button
                                                            key={idx}
                                                            onMouseEnter={() => setCardActiveImg(prev => ({ ...prev, [product.id]: idx }))}
                                                            onClick={() => setCardActiveImg(prev => ({ ...prev, [product.id]: idx }))}
                                                            className={`w-8 h-8 rounded border overflow-hidden p-0.5 shrink-0 transition-all ${activeIndex === idx ? "border-[#2874f0] ring-1 ring-[#2874f0]" : "border-gray-200 opacity-60"}`}
                                                        >
                                                            <img src={thumb} alt="" className="w-full h-full object-contain" />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Column 2: Details & Specs */}
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <h3
                                                    onClick={() => {
                                                        setPreviewProduct(product);
                                                        setPreviewActiveImageIdx(0);
                                                        setShowPreviewModal(true);
                                                    }}
                                                    className="font-bold text-gray-900 text-base md:text-lg hover:text-[#2874f0] cursor-pointer transition-colors"
                                                >
                                                    {product.name}
                                                </h3>
                                            </div>

                                            {/* Flipkart Rating & Assured Badge */}
                                            <div className="flex items-center gap-2.5">
                                                <span className="inline-flex items-center gap-1 bg-[#388e3c] text-white text-xs font-bold px-1.5 py-0.5 rounded">
                                                    4.4 <Star className="w-3 h-3 fill-white" />
                                                </span>
                                                <span className="text-xs text-gray-500 font-medium">
                                                    (1,420 Ratings & 180 Reviews)
                                                </span>
                                                {product.is_featured && (
                                                    <span className="inline-flex items-center gap-1 bg-[#2874f0] text-white text-[10px] font-black italic px-2 py-0.5 rounded shadow-2xs">
                                                        <Zap className="w-3 h-3 fill-white" /> Viros Assured
                                                    </span>
                                                )}
                                            </div>

                                            {/* Tagline */}
                                            {product.tagline && (
                                                <p className="text-xs font-medium text-gray-600 italic">
                                                    "{product.tagline}"
                                                </p>
                                            )}

                                            {/* Specifications bullet points */}
                                            <ul className="text-xs text-gray-600 space-y-1 pt-1">
                                                {product.specs && product.specs.length > 0 ? (
                                                    product.specs.slice(0, 4).map((spec, i) => (
                                                        <li key={i} className="flex items-center gap-2">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0"></span>
                                                            <span className="line-clamp-1">{spec}</span>
                                                        </li>
                                                    ))
                                                ) : (
                                                    <li className="text-gray-400 italic">
                                                        {product.description ? product.description.slice(0, 120) + "..." : "Standard industrial specifications apply."}
                                                    </li>
                                                )}
                                                <li className="flex items-center gap-2 text-gray-500 font-mono text-[11px]">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0"></span>
                                                    Slug: /{product.slug}
                                                </li>
                                            </ul>
                                        </div>

                                        {/* Column 3: Price, Stock & Actions */}
                                        <div className="w-full md:w-56 shrink-0 md:text-right flex flex-col justify-between h-full pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                                            <div>
                                                {/* Price Section */}
                                                <div className="flex md:flex-col items-baseline md:items-end gap-2 md:gap-0">
                                                    <span className="text-2xl font-black text-gray-900 tracking-tight">
                                                        {product.price_display || "₹ Quote"}
                                                    </span>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className="text-gray-400 line-through">₹{((extractPriceNumber(product.price_display) || 1200) * 1.3).toFixed(0)}</span>
                                                        <span className="text-[#388e3c] font-bold">25% off</span>
                                                    </div>
                                                </div>

                                                <p className="text-[11px] text-gray-500 mt-1 flex items-center md:justify-end gap-1">
                                                    <Truck className="w-3.5 h-3.5 text-gray-400" /> Free delivery in 2-3 Days
                                                </p>

                                                {/* Stock status indicator */}
                                                <div className="mt-2 flex items-center md:justify-end">
                                                    {product.stock_status === "In Stock" ? (
                                                        <span className="text-xs font-bold text-[#388e3c] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                            ● In Stock
                                                        </span>
                                                    ) : product.stock_status === "Low Stock" ? (
                                                        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                                            ● Low Stock (Hurry!)
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                                            ● Currently Out of Stock
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Buttons Row */}
                                            <div className="flex items-center md:justify-end gap-1.5 mt-4">
                                                <button
                                                    onClick={() => {
                                                        setPreviewProduct(product);
                                                        setPreviewActiveImageIdx(0);
                                                        setShowPreviewModal(true);
                                                    }}
                                                    title="Quick Preview"
                                                    className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded flex items-center gap-1 transition-colors"
                                                >
                                                    <Eye className="w-3.5 h-3.5" /> Preview
                                                </button>

                                                {(canWrite || isAdmin) && (
                                                    <button
                                                        onClick={() => openEditModal(product)}
                                                        title="Edit Product"
                                                        className="px-2.5 py-1.5 bg-[#2874f0] hover:bg-[#1a5bc7] text-white text-xs font-bold rounded flex items-center gap-1 transition-colors"
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5" /> Edit
                                                    </button>
                                                )}

                                                {(canDelete || isAdmin) && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedProductId(product.id);
                                                            setShowDeleteModal(true);
                                                        }}
                                                        title="Delete Product"
                                                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* ========================================================================= */
                        /* FLIPKART GRID VIEW (4-COLUMN CARD VIEW)                                  */
                        /* ========================================================================= */
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {filteredProducts.map((product) => {
                                const productImages = product.images && product.images.length > 0
                                    ? product.images
                                    : parseProductImages(product.image_url);

                                const activeIndex = cardActiveImg[product.id] || 0;
                                const displayImg = productImages[activeIndex] || productImages[0] || "";

                                return (
                                    <div
                                        key={product.id}
                                        className="bg-white rounded-md border border-gray-200 p-4 hover:shadow-lg transition-all duration-200 flex flex-col justify-between group relative"
                                    >
                                        {/* Image Area */}
                                        <div>
                                            <div className="relative aspect-square w-full bg-white flex items-center justify-center p-2 border-b border-gray-100 overflow-hidden">
                                                {displayImg ? (
                                                    <img
                                                        src={displayImg}
                                                        alt={product.name}
                                                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                ) : (
                                                    <Package className="w-16 h-16 text-gray-300" />
                                                )}

                                                {/* Top Badges */}
                                                <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                                                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-bold rounded uppercase">
                                                        {product.category}
                                                    </span>
                                                    {product.is_featured && (
                                                        <span className="bg-[#2874f0] text-white text-[9px] font-black italic px-1.5 py-0.5 rounded shadow-xs">
                                                            Assured
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Multi-image thumbnail dots */}
                                            {productImages.length > 1 && (
                                                <div className="flex items-center justify-center gap-1.5 mt-2">
                                                    {productImages.map((_, idx) => (
                                                        <button
                                                            key={idx}
                                                            onMouseEnter={() => setCardActiveImg(prev => ({ ...prev, [product.id]: idx }))}
                                                            className={`w-2 h-2 rounded-full transition-all ${activeIndex === idx ? "bg-[#2874f0] scale-125" : "bg-gray-300"}`}
                                                        />
                                                    ))}
                                                </div>
                                            )}

                                            {/* Product Info */}
                                            <div className="mt-3 space-y-1">
                                                <h4
                                                    onClick={() => {
                                                        setPreviewProduct(product);
                                                        setPreviewActiveImageIdx(0);
                                                        setShowPreviewModal(true);
                                                    }}
                                                    className="font-bold text-gray-900 text-sm line-clamp-1 hover:text-[#2874f0] cursor-pointer"
                                                >
                                                    {product.name}
                                                </h4>

                                                <p className="text-[11px] text-gray-500 line-clamp-1">
                                                    {product.tagline || product.description || "High quality product"}
                                                </p>

                                                {/* Rating badge */}
                                                <div className="flex items-center gap-2 pt-0.5">
                                                    <span className="inline-flex items-center gap-0.5 bg-[#388e3c] text-white text-[10px] font-bold px-1.5 py-0.2 rounded">
                                                        4.3 <Star className="w-2.5 h-2.5 fill-white" />
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-medium">(854)</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bottom Price & Controls */}
                                        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                                            <div>
                                                <span className="text-base font-black text-gray-900">
                                                    {product.price_display || "₹ Quote"}
                                                </span>
                                                <span className="text-[10px] text-[#388e3c] font-bold block">
                                                    {product.stock_status}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => {
                                                        setPreviewProduct(product);
                                                        setPreviewActiveImageIdx(0);
                                                        setShowPreviewModal(true);
                                                    }}
                                                    className="p-1.5 text-gray-500 hover:text-[#2874f0] hover:bg-gray-100 rounded"
                                                    title="Preview"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                {(canWrite || isAdmin) && (
                                                    <button
                                                        onClick={() => openEditModal(product)}
                                                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded"
                                                        title="Edit"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {(canDelete || isAdmin) && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedProductId(product.id);
                                                            setShowDeleteModal(true);
                                                        }}
                                                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* FLIPKART ADD / EDIT PRODUCT MODAL */}
            {showFormModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto font-sans">
                    <div className="bg-white rounded-md shadow-2xl max-w-3xl w-full my-8 overflow-hidden border border-gray-300 animate-in zoom-in-95 duration-150">
                        {/* Header */}
                        <div className="px-6 py-4 bg-[#2874f0] text-white flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <Package className="w-5 h-5" />
                                <div>
                                    <h2 className="text-base font-bold uppercase tracking-wide">
                                        {isEditing ? "Edit Product Details" : "Add New Product to Catalog"}
                                    </h2>
                                    <p className="text-xs text-blue-100">
                                        Fill in product title, multiple image gallery, specifications, and pricing.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowFormModal(false)}
                                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleFormSubmit} className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
                            {/* Section 1: Core details */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b pb-1">
                                    1. Basic Product Info
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                            Product Name <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name || ""}
                                            onChange={(e) => handleNameChange(e.target.value)}
                                            placeholder="e.g. Zebra ZT411 Industrial Label Printer"
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm focus:bg-white focus:border-[#2874f0] outline-none font-medium"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                            Product Slug <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.slug || ""}
                                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                            placeholder="e.g. zebra-zt411"
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm font-mono focus:bg-white focus:border-[#2874f0] outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                            Category <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={formData.category || "Printers"}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm focus:bg-white focus:border-[#2874f0] outline-none"
                                        >
                                            {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                            Stock Status
                                        </label>
                                        <select
                                            value={formData.stock_status || "In Stock"}
                                            onChange={(e) => setFormData({ ...formData, stock_status: e.target.value as any })}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm focus:bg-white focus:border-[#2874f0] outline-none"
                                        >
                                            {STOCK_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                            Price Display
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.price_display || ""}
                                            onChange={(e) => setFormData({ ...formData, price_display: e.target.value })}
                                            placeholder="e.g. ₹18,499 or $499"
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm focus:bg-white focus:border-[#2874f0] outline-none font-bold text-gray-900"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                        Short Tagline
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.tagline || ""}
                                        onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                                        placeholder="e.g. Rugged Industrial Durability with Advanced Connectivity"
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm focus:bg-white focus:border-[#2874f0] outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={formData.description || ""}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Detailed specifications and overview..."
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm focus:bg-white focus:border-[#2874f0] outline-none"
                                    />
                                </div>
                            </div>

                            {/* Section 2: Multiple Image Gallery */}
                            <div className="space-y-4 border-t pt-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        2. Flipkart Multi-Image Gallery
                                    </h3>
                                    <span className="text-xs text-[#2874f0] font-bold">
                                        {imagesList.length} {imagesList.length === 1 ? "Photo" : "Photos"}
                                    </span>
                                </div>

                                <div className="space-y-3 bg-[#f1f3f6] p-4 rounded border border-gray-200">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newImageUrlInput}
                                            onChange={(e) => setNewImageUrlInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    handleAddImage();
                                                }
                                            }}
                                            placeholder="Paste Image URL (or multiple comma-separated URLs)..."
                                            className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:border-[#2874f0] outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddImage}
                                            className="px-4 py-2 bg-[#2874f0] hover:bg-[#1a5bc7] text-white text-xs font-bold uppercase rounded shadow-xs"
                                        >
                                            + Add Photo
                                        </button>
                                    </div>

                                    {imagesList.length > 0 ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                                            {imagesList.map((imgUrl, index) => (
                                                <div
                                                    key={index}
                                                    className={`bg-white rounded p-2 border relative flex flex-col justify-between ${index === 0 ? "border-[#2874f0] ring-1 ring-[#2874f0]" : "border-gray-200"}`}
                                                >
                                                    <div className="aspect-square bg-gray-50 rounded flex items-center justify-center p-1 relative overflow-hidden">
                                                        <img src={imgUrl} alt="" className="w-full h-full object-contain" />
                                                        {index === 0 ? (
                                                            <span className="absolute top-1 left-1 bg-[#2874f0] text-white text-[9px] font-black px-1 rounded">
                                                                Cover
                                                            </span>
                                                        ) : (
                                                            <span className="absolute top-1 left-1 bg-gray-800/80 text-white text-[9px] px-1 rounded">
                                                                #{index + 1}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="mt-2 pt-1 border-t border-gray-100 flex items-center justify-between text-xs">
                                                        {index !== 0 ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSetCoverImage(index)}
                                                                className="text-[10px] font-bold text-[#2874f0] hover:underline"
                                                            >
                                                                Set Cover
                                                            </button>
                                                        ) : (
                                                            <span className="text-[10px] text-gray-400 font-bold">Main Photo</span>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveImage(index)}
                                                            className="text-rose-500 hover:text-rose-700 p-0.5"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-400 italic text-center py-4 bg-white rounded border border-dashed border-gray-300">
                                            No images added yet. Add product photos for customer gallery.
                                        </p>
                                    )}
                                </div>

                                {/* Assured / Featured check */}
                                <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-[#2874f0] text-white text-xs font-black italic px-2 py-0.5 rounded">
                                            Assured
                                        </span>
                                        <span className="text-xs font-bold text-gray-700">Mark as Featured / Flipkart Top Seller</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={Boolean(formData.is_featured)}
                                        onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                                        className="w-4 h-4 text-[#2874f0] rounded focus:ring-[#2874f0]"
                                    />
                                </div>
                            </div>

                            {/* Section 3: Technical Highlights */}
                            <div className="space-y-3 border-t pt-4">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    3. Product Highlights & Specs
                                </h3>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newSpecInput}
                                        onChange={(e) => setNewSpecInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleAddSpec();
                                            }
                                        }}
                                        placeholder="Add bullet highlight (e.g. 203 DPI Resolution, Thermal Transfer)..."
                                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm focus:bg-white focus:border-[#2874f0] outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddSpec}
                                        className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold uppercase rounded"
                                    >
                                        + Add Point
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {formData.specs?.map((spec, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 border border-gray-300 rounded text-xs text-gray-800"
                                        >
                                            <span>• {spec}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSpec(index)}
                                                className="text-gray-400 hover:text-rose-600"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Section 4: Product Datasheet / Brochure PDF Download Link */}
                            <div className="space-y-3 border-t pt-4 bg-[#f8fafc] -mx-6 px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <FileText className="w-4 h-4 text-[#2874f0]" />
                                        4. Product Datasheet / Technical PDF Link
                                    </h3>
                                    {formData.pdf_url && (
                                        <a
                                            href={formData.pdf_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs font-bold text-[#2874f0] hover:underline flex items-center gap-1"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" /> Test PDF Link
                                        </a>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={formData.pdf_url || ""}
                                        onChange={(e) => setFormData({ ...formData, pdf_url: e.target.value })}
                                        placeholder="Paste PDF link (e.g. https://.../datasheet.pdf or /datasheets/model.pdf)..."
                                        className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:border-[#2874f0] outline-none font-mono text-xs"
                                    />
                                    {formData.pdf_url && (
                                        <a
                                            href={formData.pdf_url}
                                            target="_blank"
                                            download
                                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold uppercase rounded flex items-center gap-1.5 border border-gray-300 shrink-0"
                                        >
                                            <Download className="w-3.5 h-3.5" /> Download
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Footer Submit Buttons */}
                            <div className="pt-2 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowFormModal(false)}
                                    className="px-5 py-2 text-xs font-bold uppercase text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-6 py-2 bg-[#fb641b] hover:bg-[#e85b17] text-white text-xs font-bold uppercase tracking-wider rounded shadow-xs disabled:opacity-50"
                                >
                                    {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Publish Product"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* FLIPKART STYLE PRODUCT PREVIEW MODAL */}
            {showPreviewModal && previewProduct && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto font-sans">
                    <div className="bg-white rounded-md shadow-2xl max-w-3xl w-full overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-150">
                        {/* Header */}
                        <div className="p-3.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Eye className="w-4 h-4 text-[#2874f0]" /> Flipkart Storefront View
                            </span>
                            <button
                                onClick={() => setShowPreviewModal(false)}
                                className="p-1 text-gray-400 hover:text-gray-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {(() => {
                            const pImages = previewProduct.images && previewProduct.images.length > 0
                                ? previewProduct.images
                                : parseProductImages(previewProduct.image_url);
                            const currentActiveImg = pImages[previewActiveImageIdx] || pImages[0] || "";

                            return (
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                                        {/* Left: Interactive Image Gallery */}
                                        <div className="md:col-span-5 space-y-3">
                                            <div className="aspect-square bg-white rounded border border-gray-200 p-4 flex items-center justify-center relative group">
                                                {currentActiveImg ? (
                                                    <img
                                                        src={currentActiveImg}
                                                        alt={previewProduct.name}
                                                        className="w-full h-full object-contain"
                                                    />
                                                ) : (
                                                    <Package className="w-16 h-16 text-gray-300" />
                                                )}

                                                {pImages.length > 1 && (
                                                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 text-white text-[10px] rounded">
                                                        {previewActiveImageIdx + 1} / {pImages.length}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Thumbnail Strip */}
                                            {pImages.length > 1 && (
                                                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                                    {pImages.map((thumb, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => setPreviewActiveImageIdx(idx)}
                                                            className={`w-12 h-12 rounded border-2 overflow-hidden p-0.5 shrink-0 ${previewActiveImageIdx === idx ? "border-[#2874f0]" : "border-gray-200 opacity-60 hover:opacity-100"}`}
                                                        >
                                                            <img src={thumb} alt="" className="w-full h-full object-contain" />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Right: Product Specs & Pricing */}
                                        <div className="md:col-span-7 space-y-3">
                                            <span className="text-[11px] font-bold text-gray-400 uppercase">
                                                {previewProduct.category}
                                            </span>
                                            <h2 className="text-lg font-bold text-gray-900 leading-snug">
                                                {previewProduct.name}
                                            </h2>

                                            {/* Rating & Assured Badge */}
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center gap-0.5 bg-[#388e3c] text-white text-xs font-bold px-1.5 py-0.5 rounded">
                                                    4.4 <Star className="w-3 h-3 fill-white" />
                                                </span>
                                                <span className="text-xs text-gray-500 font-medium">(2,140 Ratings)</span>
                                                {previewProduct.is_featured && (
                                                    <span className="bg-[#2874f0] text-white text-[10px] font-black italic px-2 py-0.5 rounded">
                                                        Assured
                                                    </span>
                                                )}
                                            </div>

                                            {/* Price */}
                                            <div className="pt-1">
                                                <span className="text-2xl font-black text-gray-900">
                                                    {previewProduct.price_display || "Contact for Quote"}
                                                </span>
                                                <span className="text-xs font-bold text-[#388e3c] block">
                                                    {previewProduct.stock_status}
                                                </span>
                                            </div>

                                            {/* Highlights */}
                                            {previewProduct.specs && previewProduct.specs.length > 0 && (
                                                <div className="pt-2 border-t">
                                                    <p className="text-xs font-bold text-gray-700 uppercase mb-1.5">Key Highlights</p>
                                                    <ul className="text-xs text-gray-600 space-y-1">
                                                        {previewProduct.specs.map((s, i) => (
                                                            <li key={i} className="flex items-center gap-1.5">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0"></span>
                                                                <span>{s}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            <p className="text-xs text-gray-600 pt-2 border-t leading-relaxed">
                                                {previewProduct.description || "No full description provided."}
                                            </p>

                                            {/* Datasheet Download Button */}
                                            {previewProduct.pdf_url && (
                                                <div className="pt-3 border-t">
                                                    <a
                                                        href={previewProduct.pdf_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        download
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-xs transition-colors"
                                                    >
                                                        <FileText className="w-4 h-4" /> Download Datasheet (PDF)
                                                        <Download className="w-3.5 h-3.5 ml-0.5" />
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Modal Footer */}
                        <div className="p-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                            <span className="text-xs text-gray-400 font-mono">ID: #{previewProduct.id}</span>
                            <div className="flex gap-2">
                                {(canWrite || isAdmin) && (
                                    <button
                                        onClick={() => {
                                            setShowPreviewModal(false);
                                            openEditModal(previewProduct);
                                        }}
                                        className="px-4 py-1.5 bg-[#2874f0] text-white text-xs font-bold uppercase rounded hover:bg-[#1a5bc7]"
                                    >
                                        Edit Product
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowPreviewModal(false)}
                                    className="px-4 py-1.5 bg-gray-200 text-gray-700 text-xs font-bold uppercase rounded hover:bg-gray-300"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
                    <div className="bg-white rounded-md p-6 max-w-sm w-full shadow-2xl text-center border border-gray-200">
                        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-1">Delete Product?</h3>
                        <p className="text-xs text-gray-500 mb-5 leading-relaxed">
                            Are you sure you want to permanently remove this product from the catalog?
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 py-2 bg-gray-100 text-gray-700 text-xs font-bold uppercase rounded hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 py-2 bg-rose-600 text-white text-xs font-bold uppercase rounded hover:bg-rose-700"
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
