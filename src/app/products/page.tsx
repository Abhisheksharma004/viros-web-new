"use client";

import Link from "next/link";
import ProductHeroSlider from "@/components/ProductHeroSlider";
import InquiryPopup from "@/components/InquiryPopup";
import ProductCard from "@/components/ProductCard";
import { useState, useEffect, useMemo } from "react";
import {
    Search, X, SlidersHorizontal, ArrowUpDown, ShieldCheck,
    Truck, Wrench, Tag, Package, Printer, Scan, Smartphone,
    Box, Laptop, Sparkles, RefreshCw, CheckCircle2, ArrowRight
} from "lucide-react";

interface Product {
    id: number;
    name: string;
    category: string;
    image_url: string;
    media_type?: "image" | "video";
    video_url?: string;
    description: string;
    tagline?: string;
    price_display?: string;
    specs?: string[];
    is_featured: boolean;
    stock_status?: string;
}

const CATEGORY_ICONS: Record<string, any> = {
    All: Package,
    Printers: Printer,
    Scanners: Scan,
    Mobility: Smartphone,
    Software: Laptop,
    Consumables: Tag,
};

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [stockOnly, setStockOnly] = useState(false);
    const [sortBy, setSortBy] = useState<"featured" | "name" | "category">("featured");
    const [isVisible, setIsVisible] = useState(false);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<{
        name: string;
        category: string;
        image: string;
        description: string;
        specs: string[];
    } | null>(null);

    const handleInquiry = (
        productName: string,
        productCategory: string,
        productImage: string,
        productDescription: string,
        productSpecs: string[]
    ) => {
        setSelectedProduct({
            name: productName,
            category: productCategory,
            image: productImage,
            description: productDescription,
            specs: productSpecs
        });
        setIsPopupOpen(true);
    };

    useEffect(() => {
        setIsVisible(true);
        const fetchProducts = async () => {
            try {
                const res = await fetch("/api/products");
                if (res.ok) {
                    const data = await res.json();
                    const parsedData: Product[] = data.map((p: any) => ({
                        ...p,
                        specs: typeof p.specs === "string" ? JSON.parse(p.specs) : p.specs || [],
                        is_featured: Boolean(p.is_featured)
                    }));
                    setProducts(parsedData);
                }
            } catch (err) {
                console.error("Failed to fetch products", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const categories = useMemo(() => {
        const uniqueCats = Array.from(new Set(products.map(p => p.category)));
        return ["All", ...uniqueCats];
    }, [products]);

    const filteredAndSortedProducts = useMemo(() => {
        let result = [...products];

        // Category Filter
        if (activeCategory !== "All") {
            result = result.filter(p => p.category.toLowerCase() === activeCategory.toLowerCase());
        }

        // Search Query Filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(p =>
                p.name.toLowerCase().includes(query) ||
                p.category.toLowerCase().includes(query) ||
                p.description.toLowerCase().includes(query) ||
                (p.tagline && p.tagline.toLowerCase().includes(query)) ||
                (p.specs && p.specs.some(s => s.toLowerCase().includes(query)))
            );
        }

        // Stock Filter
        if (stockOnly) {
            result = result.filter(p => p.stock_status?.toLowerCase() === "in stock");
        }

        // Sorting
        if (sortBy === "featured") {
            result.sort((a, b) => Number(b.is_featured) - Number(a.is_featured));
        } else if (sortBy === "name") {
            result.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortBy === "category") {
            result.sort((a, b) => a.category.localeCompare(b.category));
        }

        return result;
    }, [products, activeCategory, searchQuery, stockOnly, sortBy]);

    const featuredProducts = useMemo(() => {
        return products.filter(p => p.is_featured);
    }, [products]);

    const resetFilters = () => {
        setActiveCategory("All");
        setSearchQuery("");
        setStockOnly(false);
        setSortBy("featured");
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 border-t-[#06b6d4] rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Package className="w-6 h-6 text-[#06124f] animate-pulse" />
                    </div>
                </div>
                <p className="mt-4 text-sm font-bold text-gray-500 tracking-wider uppercase">Loading Product Catalog...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Hero Section with Slider */}
            <section className="relative w-full">
                <ProductHeroSlider products={featuredProducts.length > 0 ? featuredProducts : products} />
            </section>

            {/* Value Proposition Trust Strip */}
            <section className="bg-[#06124f] border-t border-b border-white/10 text-white py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-[#06b6d4]/20 flex items-center justify-center shrink-0 text-[#06b6d4]">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-white">100% Certified</h4>
                                <p className="text-xs text-cyan-200/80 font-medium">Genuine OEM Hardware</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-[#06b6d4]/20 flex items-center justify-center shrink-0 text-[#06b6d4]">
                                <Truck className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-white">Fast Nationwide</h4>
                                <p className="text-xs text-cyan-200/80 font-medium">Express Dispatch</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-[#06b6d4]/20 flex items-center justify-center shrink-0 text-[#06b6d4]">
                                <Wrench className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-white">AMC & Repair</h4>
                                <p className="text-xs text-cyan-200/80 font-medium">Certified Technicians</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-[#06b6d4]/20 flex items-center justify-center shrink-0 text-[#06b6d4]">
                                <Tag className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-white">Custom Media</h4>
                                <p className="text-xs text-cyan-200/80 font-medium">Ribbons & RFID Labels</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Catalog Main Content */}
            <section className="py-12 relative z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Header Title */}
                    <div className="mb-8 text-center md:text-left flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-[#06b6d4]/10 text-[#06b6d4] text-xs font-black tracking-widest uppercase mb-3">
                                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                                Product Catalog & Hardware Directory
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-[#06124f] tracking-tight">
                                Explore Industrial Barcode & RFID Solutions
                            </h1>
                            <p className="text-gray-600 text-sm md:text-base mt-1 max-w-2xl">
                                Browse top-tier barcode printers, scanners, mobile terminals, and consumables tailored for warehouse, retail, and manufacturing efficiency.
                            </p>
                        </div>

                        <div className="flex items-center justify-center md:justify-end gap-3 text-xs font-bold text-gray-500">
                            <span className="bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-xs">
                                Showing <strong className="text-[#06124f]">{filteredAndSortedProducts.length}</strong> of <strong className="text-gray-900">{products.length}</strong> products
                            </span>
                        </div>
                    </div>

                    {/* Toolbar Section: Search & Controls */}
                    <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-md mb-8 space-y-4">
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">

                            {/* Search Input */}
                            <div className="relative w-full md:w-96">
                                <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search products by model, brand, spec..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-11 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent outline-none transition-all text-sm font-semibold text-gray-900 placeholder:text-gray-400"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 rounded-full"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Secondary Controls: Stock Toggle & Sort */}
                            <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 w-full md:w-auto">

                                {/* Stock Toggle */}
                                <button
                                    onClick={() => setStockOnly(!stockOnly)}
                                    className={`flex items-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${stockOnly
                                            ? "bg-green-50 text-green-700 border-green-200 shadow-xs"
                                            : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                                        }`}
                                >
                                    <span className={`w-2 h-2 rounded-full mr-2 ${stockOnly ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
                                    In Stock Only
                                </button>

                                {/* Sort Selector */}
                                <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 border border-gray-200 rounded-xl">
                                    <ArrowUpDown className="w-4 h-4 text-gray-400" />
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as any)}
                                        className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer"
                                    >
                                        <option value="featured">Sort by: Featured</option>
                                        <option value="name">Sort by: Name (A-Z)</option>
                                        <option value="category">Sort by: Category</option>
                                    </select>
                                </div>

                                {/* Reset Filters Button */}
                                {(activeCategory !== "All" || searchQuery || stockOnly || sortBy !== "featured") && (
                                    <button
                                        onClick={resetFilters}
                                        className="flex items-center px-3.5 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold transition-colors"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                                        Reset
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Category Filter Chips */}
                        <div className="pt-3 border-t border-gray-100">
                            <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
                                {categories.map((cat) => {
                                    const IconComponent = CATEGORY_ICONS[cat] || Box;
                                    const count = cat === "All"
                                        ? products.length
                                        : products.filter(p => p.category.toLowerCase() === cat.toLowerCase()).length;
                                    const isActive = activeCategory.toLowerCase() === cat.toLowerCase();

                                    return (
                                        <button
                                            key={cat}
                                            onClick={() => setActiveCategory(cat)}
                                            className={`flex items-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${isActive
                                                    ? "bg-[#06124f] text-white shadow-md shadow-[#06124f]/20 scale-102"
                                                    : "bg-gray-50 text-gray-600 border border-gray-200/80 hover:bg-gray-100 hover:text-gray-900"
                                                }`}
                                        >
                                            <IconComponent className={`w-4 h-4 mr-2 ${isActive ? "text-[#06b6d4]" : "text-gray-400"}`} />
                                            <span>{cat}</span>
                                            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? "bg-[#06b6d4] text-white" : "bg-gray-200 text-gray-700"
                                                }`}>
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Active Filter Badges */}
                    {(activeCategory !== "All" || searchQuery || stockOnly) && (
                        <div className="flex flex-wrap items-center gap-2 mb-6">
                            <span className="text-xs text-gray-500 font-medium">Active filters:</span>
                            {activeCategory !== "All" && (
                                <span className="inline-flex items-center px-3 py-1 rounded-lg bg-cyan-50 text-[#06b6d4] text-xs font-bold border border-cyan-100">
                                    Category: {activeCategory}
                                    <button onClick={() => setActiveCategory("All")} className="ml-1.5 hover:text-cyan-800">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            )}
                            {searchQuery && (
                                <span className="inline-flex items-center px-3 py-1 rounded-lg bg-cyan-50 text-[#06b6d4] text-xs font-bold border border-cyan-100">
                                    Search: "{searchQuery}"
                                    <button onClick={() => setSearchQuery("")} className="ml-1.5 hover:text-cyan-800">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            )}
                            {stockOnly && (
                                <span className="inline-flex items-center px-3 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-bold border border-green-100">
                                    In Stock Only
                                    <button onClick={() => setStockOnly(false)} className="ml-1.5 hover:text-green-900">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            )}
                        </div>
                    )}

                    {/* Product Grid */}
                    {filteredAndSortedProducts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8">
                            {filteredAndSortedProducts.map((product, index) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    index={index}
                                    isVisible={isVisible}
                                    onInquiry={handleInquiry}
                                />
                            ))}
                        </div>
                    ) : (
                        /* Empty State */
                        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm max-w-xl mx-auto my-12">
                            <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6 text-gray-400">
                                <Search className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-black text-[#06124f] mb-2">No Matching Products</h3>
                            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                                We couldn't find any products matching your selected search term or category filters.
                            </p>
                            <button
                                onClick={resetFilters}
                                className="px-6 py-3 bg-[#06124f] text-white font-bold rounded-xl shadow-lg hover:bg-[#06b6d4] transition-all text-xs uppercase tracking-wider"
                            >
                                Reset All Filters
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* Custom Sourcing & Enterprise CTA Banner */}
            <section className="py-20 bg-gradient-to-br from-[#06124f] via-[#081b70] to-[#06b6d4] relative overflow-hidden text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(6,182,212,0.15),transparent)] pointer-events-none" />
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-cyan-300 text-xs font-bold uppercase tracking-widest mb-6">
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Enterprise Hardware Procurement
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
                        Need Custom Hardware Sourcing or Specialized Accessories?
                    </h2>
                    <p className="text-cyan-100/90 text-base md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed font-light">
                        Our hardware engineering team customizes industrial scanners, thermal printers, RFID readers, and printhead replacements for high-volume enterprise operations.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/contact"
                            className="inline-flex items-center px-8 py-4 bg-[#06b6d4] text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-xl shadow-cyan-500/25 hover:bg-cyan-400 hover:scale-105 active:scale-95 transition-all"
                        >
                            Contact Sales Team <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                        <a
                            href="tel:+918377929141"
                            className="inline-flex items-center px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-white/20 transition-all"
                        >
                            Speak to an Advisor
                        </a>
                    </div>
                </div>
            </section>

            {/* Inquiry Popup Modal */}
            {selectedProduct && (
                <InquiryPopup
                    isOpen={isPopupOpen}
                    onClose={() => setIsPopupOpen(false)}
                    productName={selectedProduct.name}
                    productCategory={selectedProduct.category}
                    productImage={selectedProduct.image}
                    productDescription={selectedProduct.description}
                    productSpecs={selectedProduct.specs}
                />
            )}
        </div>
    );
}
