"use client";

import Link from "next/link";
import Image from "next/image";
import ProductHeroSlider from "@/components/ProductHeroSlider";
import InquiryPopup from "@/components/InquiryPopup";
import { useState, useEffect, useMemo } from "react";
import {
    Search, X, SlidersHorizontal, ShieldCheck,
    Truck, Tag, Package, Eye,
    LayoutGrid, List as ListIcon, Zap,
    FileText, Download, CheckCircle2,
    ChevronRight, ArrowUpDown, RefreshCw,
    MessageSquareQuote, PhoneCall
} from "lucide-react";

interface Product {
    id: number;
    slug?: string;
    name: string;
    category: string;
    image_url: string;
    images?: string[];
    media_type?: "image" | "video";
    video_url?: string;
    description: string;
    tagline?: string;
    price_display?: string;
    specs?: string[];
    is_featured: boolean;
    stock_status?: "In Stock" | "Low Stock" | "Out of Stock" | string;
    pdf_url?: string;
}

const CATEGORY_OPTIONS = ["All", "Printers", "Scanners", "Mobility", "Software", "Consumables", "Accessories"];

// Helper to safely extract primary image URL
const parseProductImages = (imageUrl?: string): string[] => {
    if (!imageUrl) return ["/logo.png"];
    try {
        if (imageUrl.startsWith("[") && imageUrl.endsWith("]")) {
            const parsed = JSON.parse(imageUrl);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed.filter((img) => typeof img === "string" && img.trim() !== "");
            }
        }
    } catch { }
    if (imageUrl.includes(",")) {
        return imageUrl.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [imageUrl.trim()].filter(Boolean);
};

// Check if string is a valid URL or local path
const isValidImageUrl = (url?: string): boolean => {
    if (!url) return false;
    return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/");
};

export default function FlipkartProductsStorefront() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [stockFilter, setStockFilter] = useState("All");
    const [featuredOnly, setFeaturedOnly] = useState(false);
    const [hasPdfOnly, setHasPdfOnly] = useState(false);
    const [sortBy, setSortBy] = useState<"relevance" | "popular" | "price_low" | "price_high" | "newest">("relevance");
    const [viewMode, setViewMode] = useState<"list" | "grid">("list");

    // Active Card Image hover index: { [productId]: number }
    const [cardActiveImg, setCardActiveImg] = useState<{ [key: number]: number }>({});

    // Inquiry & Quick View Modals
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [inquiryProduct, setInquiryProduct] = useState<{
        name: string;
        category: string;
        image: string;
        description: string;
        specs: string[];
    } | null>(null);

    const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
    const [quickViewActiveImgIdx, setQuickViewActiveImgIdx] = useState(0);

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/products");
            if (res.ok) {
                const data = await res.json();
                const parsedData: Product[] = data.map((p: any) => {
                    const imgs = parseProductImages(p.image_url);
                    return {
                        ...p,
                        images: imgs,
                        primary_image: imgs[0] || "/logo.png",
                        specs: typeof p.specs === "string" ? JSON.parse(p.specs || "[]") : (p.specs || []),
                        is_featured: Boolean(p.is_featured),
                        stock_status: p.stock_status || "In Stock"
                    };
                });
                setProducts(parsedData);
            }
        } catch (err) {
            console.error("Failed to fetch products", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // Extract numeric price for calculations and sorting
    const extractPriceNumber = (priceStr?: string): number => {
        if (!priceStr) return 0;
        const match = priceStr.replace(/[^0-9.]/g, "");
        return parseFloat(match) || 0;
    };

    // Category list with accurate counts
    const categoryList = useMemo(() => {
        const set = new Set(["All", ...CATEGORY_OPTIONS, ...products.map((p) => p.category)]);
        return Array.from(set).filter(Boolean);
    }, [products]);

    // Filter and sort products
    const filteredProducts = useMemo(() => {
        return products
            .filter((p) => {
                const query = searchQuery.toLowerCase().trim();
                const matchSearch =
                    !query ||
                    p.name.toLowerCase().includes(query) ||
                    p.category.toLowerCase().includes(query) ||
                    (p.description && p.description.toLowerCase().includes(query)) ||
                    (p.tagline && p.tagline.toLowerCase().includes(query)) ||
                    (p.specs && p.specs.some((s) => s.toLowerCase().includes(query)));

                const matchCategory =
                    selectedCategory === "All" || p.category.toLowerCase() === selectedCategory.toLowerCase();

                const matchStock =
                    stockFilter === "All" || p.stock_status?.toLowerCase() === stockFilter.toLowerCase();

                const matchFeatured = !featuredOnly || p.is_featured;
                const matchPdf = !hasPdfOnly || Boolean(p.pdf_url);

                return matchSearch && matchCategory && matchStock && matchFeatured && matchPdf;
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
    }, [products, searchQuery, selectedCategory, stockFilter, featuredOnly, hasPdfOnly, sortBy]);

    const resetFilters = () => {
        setSearchQuery("");
        setSelectedCategory("All");
        setStockFilter("All");
        setFeaturedOnly(false);
        setHasPdfOnly(false);
        setSortBy("relevance");
    };

    const handleOpenInquiry = (product: Product) => {
        const imgs = product.images && product.images.length > 0 ? product.images : parseProductImages(product.image_url);
        setInquiryProduct({
            name: product.name,
            category: product.category,
            image: imgs[0] || "/logo.png",
            description: product.description || product.tagline || "",
            specs: product.specs || []
        });
        setIsPopupOpen(true);
    };

    return (
        <div className="bg-[#f1f3f6] min-h-screen font-sans text-gray-800 antialiased selection:bg-[#2874f0] selection:text-white">
            {/* TOP FLIPKART BREADCRUMB & PROMO STRIP */}
            <div className="bg-[#2874f0] text-white py-2 px-4 shadow-sm">
                <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-1.5 opacity-90">
                        <Link href="/" className="hover:underline">Home</Link>
                        <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                        <span className="opacity-80">Industrial Hardware</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                        <span className="font-bold text-white">
                            {selectedCategory === "All" ? "All Products" : selectedCategory}
                        </span>
                    </div>

                    {/* Trust assurances */}
                    <div className="hidden md:flex items-center gap-5 font-medium">
                        <span className="flex items-center gap-1">
                            <ShieldCheck className="w-4 h-4 text-amber-300" /> 100% Genuine OEM Hardware
                        </span>
                        <span className="flex items-center gap-1">
                            <Truck className="w-4 h-4 text-emerald-300" /> Pan-India Express Dispatch
                        </span>
                        <span className="flex items-center gap-1">
                            <Zap className="w-4 h-4 text-amber-300" /> Viros Assured Quality
                        </span>
                    </div>
                </div>
            </div>

            {/* HERO SLIDER (FEATURED PRODUCTS) */}
            {products.some(p => p.is_featured) && (
                <section className="bg-white border-b border-gray-200">
                    <ProductHeroSlider products={products.filter(p => p.is_featured)} />
                </section>
            )}

            {/* MAIN CATALOG CONTAINER */}
            <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6 space-y-3">
                {/* STORE HEADER BAR & SEARCH */}
                <div className="bg-white rounded-md shadow-xs border border-gray-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
                                {selectedCategory === "All" ? "Industrial Hardware & Barcode Catalog" : `${selectedCategory} Store`}
                            </h1>
                            <span className="bg-[#2874f0]/10 text-[#2874f0] text-xs font-bold px-2 py-0.5 rounded italic">
                                Viros Assured
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Showing <span className="font-bold text-gray-800">{filteredProducts.length}</span> of {products.length} products available for instant quote & dispatch
                        </p>
                    </div>

                    {/* Search in Storefront */}
                    <div className="relative flex-1 max-w-md w-full">
                        <input
                            type="text"
                            placeholder="Search products, brands, model (e.g. ZT411, Thermal Printer)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-9 py-2 bg-gray-50 border border-gray-300 rounded-sm text-sm focus:bg-white focus:border-[#2874f0] focus:ring-1 focus:ring-[#2874f0] outline-none text-gray-800"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* TWO-COLUMN FLIPKART SHOPPING LAYOUT */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
                    {/* LEFT SIDEBAR: FLIPKART FILTER PANEL */}
                    <div className="lg:col-span-3 bg-white rounded-md border border-gray-200 shadow-xs divide-y divide-gray-200">
                        {/* Filter Title */}
                        <div className="p-3.5 flex items-center justify-between">
                            <span className="font-bold text-sm text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                <SlidersHorizontal className="w-4 h-4 text-gray-600" /> Filters
                            </span>
                            {(searchQuery || selectedCategory !== "All" || stockFilter !== "All" || featuredOnly || hasPdfOnly) && (
                                <button
                                    onClick={resetFilters}
                                    className="text-xs font-bold text-[#2874f0] uppercase hover:underline cursor-pointer"
                                >
                                    Clear all
                                </button>
                            )}
                        </div>

                        {/* Category Filter */}
                        <div className="p-3.5 space-y-2.5">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                                Categories
                            </span>
                            <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                                {categoryList.map((cat) => {
                                    const count = cat === "All"
                                        ? products.length
                                        : products.filter((p) => p.category.toLowerCase() === cat.toLowerCase()).length;
                                    const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();

                                    return (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`w-full flex items-center justify-between text-xs py-1.5 px-2 rounded transition-colors text-left cursor-pointer ${isSelected
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

                        {/* Availability Filter */}
                        <div className="p-3.5 space-y-2.5">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                                Availability
                            </span>
                            <div className="space-y-2">
                                {["All", "In Stock", "Low Stock"].map((status) => (
                                    <label
                                        key={status}
                                        className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer font-medium hover:text-gray-900"
                                    >
                                        <input
                                            type="radio"
                                            name="storeStockFilter"
                                            checked={stockFilter === status}
                                            onChange={() => setStockFilter(status)}
                                            className="w-3.5 h-3.5 text-[#2874f0] focus:ring-[#2874f0]"
                                        />
                                        <span>{status === "All" ? "All Availability" : status}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Special Badges & Documents */}
                        <div className="p-3.5 space-y-2.5">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                                Customer Options
                            </span>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer font-medium">
                                    <input
                                        type="checkbox"
                                        checked={featuredOnly}
                                        onChange={(e) => setFeaturedOnly(e.target.checked)}
                                        className="w-4 h-4 rounded text-[#2874f0] focus:ring-[#2874f0]"
                                    />
                                    <div className="flex items-center gap-1.5">
                                        <span className="bg-[#2874f0] text-white text-[9px] font-black italic px-1.5 py-0.2 rounded-xs">
                                            Assured
                                        </span>
                                        <span>Viros Assured / Top Picks</span>
                                    </div>
                                </label>

                                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer font-medium">
                                    <input
                                        type="checkbox"
                                        checked={hasPdfOnly}
                                        onChange={(e) => setHasPdfOnly(e.target.checked)}
                                        className="w-4 h-4 rounded text-[#2874f0] focus:ring-[#2874f0]"
                                    />
                                    <div className="flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-[#2874f0]" />
                                        <span>Includes Technical Datasheet PDF</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Customer Support & Inquiry Banner */}
                        <div className="p-4 bg-[#f8fafc] text-xs space-y-2 border-t border-gray-200">
                            <span className="font-bold text-gray-800 block text-xs flex items-center gap-1.5">
                                <PhoneCall className="w-4 h-4 text-[#2874f0]" /> Need Bulk Pricing?
                            </span>
                            <p className="text-[11px] text-gray-500 leading-relaxed">
                                Get special OEM & corporate pricing with dedicated account management and AMC support.
                            </p>
                            <Link
                                href="/contact"
                                className="block w-full text-center py-1.5 bg-[#2874f0] text-white font-bold rounded text-[11px] uppercase tracking-wide hover:bg-[#1a5bc7] transition-colors"
                            >
                                Contact Sales Team
                            </Link>
                        </div>
                    </div>

                    {/* RIGHT MAIN PRODUCTS CATALOG */}
                    <div className="lg:col-span-9 space-y-3">
                        {/* FLIPKART SORT BAR */}
                        <div className="bg-white rounded-md border border-gray-200 shadow-xs px-4 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
                                        className={`pb-1 px-1 whitespace-nowrap font-medium transition-all border-b-2 cursor-pointer ${sortBy === tab.id
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
                                    className={`p-1.5 rounded transition-all cursor-pointer ${viewMode === "list" ? "bg-white text-[#2874f0] shadow-xs" : "text-gray-500 hover:text-gray-900"}`}
                                >
                                    <ListIcon className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode("grid")}
                                    title="Flipkart Grid View"
                                    className={`p-1.5 rounded transition-all cursor-pointer ${viewMode === "grid" ? "bg-white text-[#2874f0] shadow-xs" : "text-gray-500 hover:text-gray-900"}`}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* PRODUCT LISTINGS */}
                        {isLoading ? (
                            <div className="bg-white rounded-md p-16 border border-gray-200 text-center">
                                <div className="w-10 h-10 border-3 border-[#2874f0] border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <p className="text-gray-500 text-sm font-medium mt-3">Loading Flipkart Store Catalog...</p>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="bg-white rounded-md p-16 border border-gray-200 text-center">
                                <Package className="w-14 h-14 text-gray-300 mx-auto mb-2" />
                                <h3 className="text-base font-bold text-gray-800">No products match your search!</h3>
                                <p className="text-xs text-gray-500 mt-1">Please try searching with different keywords or reset your filters.</p>
                                <button
                                    onClick={resetFilters}
                                    className="mt-4 px-4 py-2 bg-[#2874f0] text-white text-xs font-bold uppercase rounded-sm cursor-pointer"
                                >
                                    Reset All Filters
                                </button>
                            </div>
                        ) : viewMode === "list" ? (
                            /* ========================================================================= */
                            /* FLIPKART CLASSIC HORIZONTAL 3-PANEL SHOPPING LIST ROW                    */
                            /* ========================================================================= */
                            <div className="bg-white rounded-md border border-gray-200 divide-y divide-gray-200 overflow-hidden shadow-xs">
                                {filteredProducts.map((product) => {
                                    const productImages = product.images && product.images.length > 0
                                        ? product.images
                                        : parseProductImages(product.image_url);

                                    const activeIndex = cardActiveImg[product.id] || 0;
                                    const displayImg = productImages[activeIndex] || productImages[0] || "/logo.png";
                                    const isImgValid = isValidImageUrl(displayImg);

                                    return (
                                        <div
                                            key={product.id}
                                            className="p-4 sm:p-5 hover:shadow-md transition-shadow duration-200 flex flex-col md:flex-row gap-5 items-start relative group"
                                        >
                                            {/* Column 1: Image Gallery & Thumbnails */}
                                            <div className="w-full md:w-56 shrink-0 flex flex-col items-center">
                                                <div
                                                    onClick={() => {
                                                        setQuickViewProduct(product);
                                                        setQuickViewActiveImgIdx(0);
                                                    }}
                                                    className="w-full h-48 bg-white rounded flex items-center justify-center p-2 relative overflow-hidden border border-gray-100 cursor-pointer"
                                                >
                                                    {isImgValid ? (
                                                        <img
                                                            src={displayImg}
                                                            alt={product.name}
                                                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                                        />
                                                    ) : (
                                                        <Package className="w-16 h-16 text-gray-300" />
                                                    )}

                                                    <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded uppercase">
                                                        {product.category}
                                                    </span>
                                                </div>

                                                {/* Multiple Thumbnail switcher */}
                                                {productImages.length > 1 && (
                                                    <div className="flex items-center gap-1.5 mt-2 overflow-x-auto max-w-full pb-1">
                                                        {productImages.map((thumb, idx) => (
                                                            <button
                                                                key={idx}
                                                                onMouseEnter={() => setCardActiveImg((prev) => ({ ...prev, [product.id]: idx }))}
                                                                onClick={() => setCardActiveImg((prev) => ({ ...prev, [product.id]: idx }))}
                                                                className={`w-8 h-8 rounded border overflow-hidden p-0.5 shrink-0 transition-all cursor-pointer ${activeIndex === idx ? "border-[#2874f0] ring-1 ring-[#2874f0]" : "border-gray-200 opacity-60 hover:opacity-100"}`}
                                                            >
                                                                <img src={thumb} alt="" className="w-full h-full object-contain" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Column 2: Product Title, Ratings, Specs */}
                                            <div className="flex-1 space-y-2">
                                                <h3
                                                    onClick={() => {
                                                        setQuickViewProduct(product);
                                                        setQuickViewActiveImgIdx(0);
                                                    }}
                                                    className="font-bold text-gray-900 text-base md:text-lg hover:text-[#2874f0] cursor-pointer transition-colors leading-snug"
                                                >
                                                    {product.name}
                                                </h3>

                                                {/* Flipkart Assured Badge */}
                                                {product.is_featured && (
                                                    <div className="flex items-center">
                                                        <span className="inline-flex items-center gap-1 bg-[#2874f0] text-white text-[10px] font-black italic px-2 py-0.5 rounded shadow-2xs">
                                                            <Zap className="w-3 h-3 fill-white" /> Viros Assured
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Tagline */}
                                                {product.tagline && (
                                                    <p className="text-xs font-medium text-gray-600 italic">
                                                        "{product.tagline}"
                                                    </p>
                                                )}

                                                {/* Technical Highlights Bullet Points */}
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
                                                </ul>
                                            </div>

                                            {/* Column 3: Price, Stock, Datasheet & Instant Quote CTA */}
                                            <div className="w-full md:w-60 shrink-0 md:text-right flex flex-col justify-between h-full pt-2 md:pt-0 border-t md:border-t-0 border-gray-100 space-y-3">
                                                <div>
                                                    <div className="flex md:flex-col items-baseline md:items-end gap-2 md:gap-0">
                                                        <span className="text-2xl font-black text-gray-900 tracking-tight">
                                                            {product.price_display || "Contact for Quote"}
                                                        </span>
                                                        <div className="flex items-center gap-2 text-xs">
                                                            <span className="text-gray-400 line-through">
                                                                ₹{((extractPriceNumber(product.price_display) || 14000) * 1.3).toFixed(0)}
                                                            </span>
                                                            <span className="text-[#388e3c] font-bold">25% off</span>
                                                        </div>
                                                    </div>

                                                    <p className="text-[11px] text-gray-500 mt-1 flex items-center md:justify-end gap-1">
                                                        <Truck className="w-3.5 h-3.5 text-gray-400" /> Free delivery in 2-3 Days
                                                    </p>

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
                                                                ● Out of Stock
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="space-y-1.5 pt-1">
                                                    {/* Instant Quote / Buy Now (Orange Flipkart CTA) */}
                                                    <button
                                                        onClick={() => handleOpenInquiry(product)}
                                                        className="w-full py-2 bg-[#fb641b] hover:bg-[#e85b17] text-white font-bold text-xs uppercase tracking-wider rounded-sm shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                                    >
                                                        <MessageSquareQuote className="w-4 h-4" /> Get Instant Quote
                                                    </button>

                                                    <div className="flex items-center gap-1.5">
                                                        {/* Datasheet Download PDF if available */}
                                                        {product.pdf_url && (
                                                            <a
                                                                href={product.pdf_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                download
                                                                className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold rounded border border-gray-300 flex items-center justify-center gap-1 transition-colors"
                                                            >
                                                                <FileText className="w-3.5 h-3.5 text-[#2874f0]" /> PDF Datasheet
                                                            </a>
                                                        )}

                                                        {/* Quick Specs View */}
                                                        <button
                                                            onClick={() => {
                                                                setQuickViewProduct(product);
                                                                setQuickViewActiveImgIdx(0);
                                                            }}
                                                            className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold rounded border border-gray-300 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" /> Quick View
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            /* ========================================================================= */
                            /* FLIPKART GRID VIEW (4-COLUMN E-COMMERCE CARD VIEW)                        */
                            /* ========================================================================= */
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {filteredProducts.map((product) => {
                                    const productImages = product.images && product.images.length > 0
                                        ? product.images
                                        : parseProductImages(product.image_url);

                                    const activeIndex = cardActiveImg[product.id] || 0;
                                    const displayImg = productImages[activeIndex] || productImages[0] || "/logo.png";
                                    const isImgValid = isValidImageUrl(displayImg);

                                    return (
                                        <div
                                            key={product.id}
                                            className="bg-white rounded-md border border-gray-200 p-4 hover:shadow-lg transition-all duration-200 flex flex-col justify-between group relative"
                                        >
                                            <div>
                                                <div
                                                    onClick={() => {
                                                        setQuickViewProduct(product);
                                                        setQuickViewActiveImgIdx(0);
                                                    }}
                                                    className="relative aspect-square w-full bg-white flex items-center justify-center p-2 border-b border-gray-100 overflow-hidden cursor-pointer"
                                                >
                                                    {isImgValid ? (
                                                        <img
                                                            src={displayImg}
                                                            alt={product.name}
                                                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                                        />
                                                    ) : (
                                                        <Package className="w-16 h-16 text-gray-300" />
                                                    )}

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

                                                {/* Dots for multi-images */}
                                                {productImages.length > 1 && (
                                                    <div className="flex items-center justify-center gap-1.5 mt-2">
                                                        {productImages.map((_, idx) => (
                                                            <button
                                                                key={idx}
                                                                onMouseEnter={() => setCardActiveImg((prev) => ({ ...prev, [product.id]: idx }))}
                                                                className={`w-2 h-2 rounded-full transition-all ${activeIndex === idx ? "bg-[#2874f0] scale-125" : "bg-gray-300"}`}
                                                            />
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="mt-3 space-y-1">
                                                    <h4
                                                        onClick={() => {
                                                            setQuickViewProduct(product);
                                                            setQuickViewActiveImgIdx(0);
                                                        }}
                                                        className="font-bold text-gray-900 text-sm line-clamp-1 hover:text-[#2874f0] cursor-pointer"
                                                    >
                                                        {product.name}
                                                    </h4>

                                                    <p className="text-[11px] text-gray-500 line-clamp-1">
                                                        {product.tagline || product.description || "High quality product"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-3 pt-2.5 border-t border-gray-100 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-base font-black text-gray-900">
                                                        {product.price_display || "Contact for Quote"}
                                                    </span>
                                                    <span className="text-[10px] text-[#388e3c] font-bold">
                                                        {product.stock_status}
                                                    </span>
                                                </div>

                                                <button
                                                    onClick={() => handleOpenInquiry(product)}
                                                    className="w-full py-1.5 bg-[#fb641b] hover:bg-[#e85b17] text-white font-bold text-xs uppercase tracking-wider rounded-sm shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                                >
                                                    <MessageSquareQuote className="w-3.5 h-3.5" /> Get Quote
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* FLIPKART STYLE QUICK VIEW MODAL */}
            {quickViewProduct && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto font-sans">
                    <div className="bg-white rounded-md shadow-2xl max-w-3xl w-full overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
                        <div className="p-3.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between shrink-0">
                            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Eye className="w-4 h-4 text-[#2874f0]" /> Product Specifications & Overview
                            </span>
                            <button
                                onClick={() => setQuickViewProduct(null)}
                                className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {(() => {
                            const pImages = quickViewProduct.images && quickViewProduct.images.length > 0
                                ? quickViewProduct.images
                                : parseProductImages(quickViewProduct.image_url);
                            const currentActiveImg = pImages[quickViewActiveImgIdx] || pImages[0] || "/logo.png";
                            const isImgValid = isValidImageUrl(currentActiveImg);

                            return (
                                <div className="p-6 overflow-y-auto space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                                        <div className="md:col-span-5 space-y-3">
                                            <div className="aspect-square bg-white rounded border border-gray-200 p-4 flex items-center justify-center relative group">
                                                {isImgValid ? (
                                                    <img
                                                        src={currentActiveImg}
                                                        alt={quickViewProduct.name}
                                                        className="w-full h-full object-contain"
                                                    />
                                                ) : (
                                                    <Package className="w-16 h-16 text-gray-300" />
                                                )}
                                                {pImages.length > 1 && (
                                                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 text-white text-[10px] rounded">
                                                        {quickViewActiveImgIdx + 1} / {pImages.length}
                                                    </span>
                                                )}
                                            </div>

                                            {pImages.length > 1 && (
                                                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                                    {pImages.map((thumb, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => setQuickViewActiveImgIdx(idx)}
                                                            className={`w-12 h-12 rounded border-2 overflow-hidden p-0.5 shrink-0 cursor-pointer ${quickViewActiveImgIdx === idx ? "border-[#2874f0]" : "border-gray-200 opacity-60 hover:opacity-100"}`}
                                                        >
                                                            <img src={thumb} alt="" className="w-full h-full object-contain" />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="md:col-span-7 space-y-3">
                                            <span className="text-[11px] font-bold text-gray-400 uppercase">
                                                {quickViewProduct.category}
                                            </span>
                                            <h2 className="text-lg font-bold text-gray-900 leading-snug">
                                                {quickViewProduct.name}
                                            </h2>

                                            {quickViewProduct.is_featured && (
                                                <div className="flex items-center">
                                                    <span className="bg-[#2874f0] text-white text-[10px] font-black italic px-2 py-0.5 rounded">
                                                        Assured
                                                    </span>
                                                </div>
                                            )}

                                            {/* Price */}
                                            <div className="pt-1">
                                                <span className="text-2xl font-black text-gray-900">
                                                    {quickViewProduct.price_display || "Contact for Quote"}
                                                </span>
                                                <span className="text-xs font-bold text-[#388e3c] block">
                                                    {quickViewProduct.stock_status}
                                                </span>
                                            </div>

                                            <p className="text-xs text-gray-600 leading-relaxed pt-2 border-t">
                                                {quickViewProduct.description || quickViewProduct.tagline || "No description provided."}
                                            </p>

                                            {/* Action CTAs in Modal */}
                                            <div className="pt-3 border-t flex flex-wrap gap-2">
                                                <button
                                                    onClick={() => {
                                                        const p = quickViewProduct;
                                                        setQuickViewProduct(null);
                                                        handleOpenInquiry(p);
                                                    }}
                                                    className="px-5 py-2.5 bg-[#fb641b] hover:bg-[#e85b17] text-white text-xs font-bold uppercase rounded shadow-xs flex items-center gap-1.5 cursor-pointer"
                                                >
                                                    <MessageSquareQuote className="w-4 h-4" /> Get Quote / Inquiry
                                                </button>

                                                {quickViewProduct.pdf_url && (
                                                    <a
                                                        href={quickViewProduct.pdf_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        download
                                                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-xs flex items-center gap-1.5 transition-colors"
                                                    >
                                                        <FileText className="w-4 h-4" /> Download Datasheet (PDF)
                                                        <Download className="w-3.5 h-3.5 ml-0.5" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Specifications Sheet Table */}
                                    {quickViewProduct.specs && quickViewProduct.specs.length > 0 && (
                                        <div className="border border-gray-200 rounded overflow-hidden">
                                            <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 font-bold text-xs text-gray-800 uppercase">
                                                Technical Specifications
                                            </div>
                                            <table className="w-full text-xs">
                                                <tbody className="divide-y divide-gray-200">
                                                    {quickViewProduct.specs.map((spec, i) => {
                                                        const isKV = spec.includes(":");
                                                        const k = isKV ? spec.split(":")[0].trim() : "Feature";
                                                        const v = isKV ? spec.split(":").slice(1).join(":").trim() : spec;
                                                        return (
                                                            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                                                                <td className="py-2.5 px-4 font-bold text-gray-600 w-1/3 border-r border-gray-200">{k}</td>
                                                                <td className="py-2.5 px-4 text-gray-800 font-medium">{v}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        <div className="p-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-end shrink-0">
                            <button
                                onClick={() => setQuickViewProduct(null)}
                                className="px-4 py-1.5 bg-gray-200 text-gray-700 text-xs font-bold uppercase rounded hover:bg-gray-300 cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* INQUIRY POPUP */}
            {inquiryProduct && (
                <InquiryPopup
                    isOpen={isPopupOpen}
                    onClose={() => setIsPopupOpen(false)}
                    productName={inquiryProduct.name}
                    productCategory={inquiryProduct.category}
                    productImage={inquiryProduct.image}
                    productDescription={inquiryProduct.description}
                    productSpecs={inquiryProduct.specs}
                />
            )}
        </div>
    );
}
