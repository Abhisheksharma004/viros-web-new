"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import InquiryPopup from "./InquiryPopup";
import {
    Package, Eye, Zap, Truck, ShieldCheck,
    FileText, Download, MessageSquareQuote, ArrowRight,
    Sparkles, X, RefreshCw, ShoppingBag, CheckCircle,
    CheckCircle2, MapPin, CreditCard, Clock, KeyRound, Lock
} from "lucide-react";

interface Product {
    id: number;
    name: string;
    category: string;
    image_url: string;
    images?: string[];
    media_type?: "image" | "video";
    video_url?: string;
    description: string;
    tagline?: string;
    price_display?: string;
    is_featured: boolean;
    stock_status: string;
    specs?: string[];
    slug?: string;
    pdf_url?: string;
}

// Helper to safely extract images
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

const isValidImageUrl = (url?: string): boolean => {
    if (!url) return false;
    return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/");
};

export default function FeaturedProducts() {
    const router = useRouter();
    const [isVisible, setIsVisible] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState("All");

    // Interactive card images hover
    const [cardActiveImg, setCardActiveImg] = useState<{ [key: number]: number }>({});

    // 1. Modals - Inquiry Popup State
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<{
        name: string;
        category: string;
        image: string;
        description: string;
        specs: string[];
    } | null>(null);

    // 2. Quick View Modal State
    const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
    const [quickViewActiveImgIdx, setQuickViewActiveImgIdx] = useState(0);

    const handleInquiry = (product: Product) => {
        const imgs = product.images && product.images.length > 0 ? product.images : parseProductImages(product.image_url);
        setSelectedProduct({
            name: product.name,
            category: product.category,
            image: imgs[0] || "/logo.png",
            description: product.description || product.tagline || "",
            specs: product.specs || []
        });
        setIsPopupOpen(true);
    };

    // Open Dedicated Buy Now Page
    const handleOpenBuyNow = (product: Product) => {
        const params = new URLSearchParams();
        if (product.id) params.set("id", String(product.id));
        if (product.name) params.set("name", product.name);
        if (product.price_display) params.set("price", product.price_display);
        if (product.category) params.set("category", product.category);
        if (product.image_url) params.set("img", product.image_url);
        router.push(`/buy-now?${params.toString()}`);
    };



    useEffect(() => {
        fetchProducts();

        const fallbackTimer = setTimeout(() => setIsVisible(true), 600);
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    clearTimeout(fallbackTimer);
                }
            },
            { threshold: 0, rootMargin: "0px 0px -50px 0px" }
        );

        const section = document.getElementById("featured-products");
        if (section) observer.observe(section);

        return () => {
            clearTimeout(fallbackTimer);
            if (section) observer.unobserve(section);
        };
    }, []);

    // Fisher-Yates random shuffle algorithm
    const shuffleArray = <T,>(array: T[]): T[] => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    const fetchProducts = async () => {
        try {
            const response = await fetch("/api/products", { cache: "no-store" });
            if (response.ok) {
                const data = await response.json();
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
                // Shuffle array on every page load so refreshed page displays new random products
                const shuffled = shuffleArray(parsedData);
                setProducts(shuffled);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };

    const extractPriceNumber = (priceStr?: string): number => {
        if (!priceStr) return 0;
        const match = priceStr.replace(/[^0-9.]/g, "");
        return parseFloat(match) || 0;
    };

    // Format price with INR currency symbol
    const formatPriceDisplay = (priceStr?: string): string => {
        if (!priceStr) return "Contact for Quote";
        const num = extractPriceNumber(priceStr);
        if (num <= 0) return priceStr;
        return `₹${num.toLocaleString("en-IN")}`;
    };


    // Filter categories
    const categories = useMemo(() => {
        const unique = Array.from(new Set(products.map(p => p.category)));
        return ["All", ...unique.slice(0, 5)];
    }, [products]);

    // Filtered list with dynamic random ordering on category switches
    const displayProducts = useMemo(() => {
        let filtered = products;
        if (activeCategory !== "All") {
            filtered = filtered.filter(p => p.category.toLowerCase() === activeCategory.toLowerCase());
        }
        return filtered.slice(0, 8);
    }, [products, activeCategory]);

    return (
        <section id="featured-products" className="py-10 md:py-16 bg-[#f1f3f6] font-sans antialiased text-gray-800 relative">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 space-y-4">
                {/* Flipkart Style Section Header */}
                <div className="bg-white rounded-md shadow-xs border border-gray-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
                                Deals of the Day • Featured Products
                            </h2>
                            <span className="bg-[#2874f0]/10 text-[#2874f0] text-xs font-bold px-2 py-0.5 rounded italic">
                                Viros Assured
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Top-rated industrial barcode printers, scanners, mobile computers & consumables
                        </p>
                    </div>

                    {/* Category Tabs & View All */}
                    <div className="flex flex-wrap items-center gap-2">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all cursor-pointer ${activeCategory === cat
                                    ? "bg-[#2874f0] text-white font-bold shadow-xs"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                        <button
                            onClick={() => setProducts((prev) => shuffleArray(prev))}
                            title="Shuffle / Next Deals"
                            className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-sm border border-gray-300 transition-colors flex items-center justify-center cursor-pointer"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <Link
                            href="/products"
                            className="px-3.5 py-1.5 bg-[#2874f0] hover:bg-[#1a5bc7] text-white text-xs font-bold uppercase rounded-sm shadow-xs transition-colors flex items-center gap-1"
                        >
                            View All <ChevronRightIcon className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>

                {/* Flipkart 4-Column Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="bg-white rounded-md p-4 border border-gray-200 animate-pulse space-y-3">
                                <div className="aspect-square bg-gray-100 rounded-sm"></div>
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                                    <div className="h-5 bg-gray-100 rounded w-1/3"></div>
                                </div>
                                <div className="h-8 bg-gray-200 rounded-sm mt-3"></div>
                            </div>
                        ))}
                    </div>
                ) : displayProducts.length === 0 ? (
                    <div className="bg-white rounded-md p-14 text-center border border-gray-200 shadow-xs">
                        <Package className="w-14 h-14 text-gray-300 mx-auto mb-2" />
                        <h3 className="text-base font-bold text-gray-800">No featured products in this category</h3>
                        <p className="text-xs text-gray-500 mt-1">Please explore our complete catalog.</p>
                        <Link
                            href="/products"
                            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#2874f0] text-white text-xs font-bold uppercase rounded-sm"
                        >
                            View Full Store
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {displayProducts.map((product) => {
                            const productImages = product.images && product.images.length > 0
                                ? product.images
                                : parseProductImages(product.image_url);

                            const activeIndex = cardActiveImg[product.id] || 0;
                            const displayImg = productImages[activeIndex] || productImages[0] || "/logo.png";
                            const isImgValid = isValidImageUrl(displayImg);

                            return (
                                <div
                                    key={product.id}
                                    className="bg-white rounded-md border border-gray-200 p-3.5 hover:shadow-lg transition-all duration-200 flex flex-col justify-between group relative"
                                >
                                    <div>
                                        {/* Product Image */}
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

                                            {/* Badges */}
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
                                                        className={`w-2 h-2 rounded-full transition-all cursor-pointer ${activeIndex === idx ? "bg-[#2874f0] scale-125" : "bg-gray-300"}`}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {/* Product Details */}
                                        <div className="mt-2.5 space-y-1">
                                            <h3
                                                onClick={() => {
                                                    setQuickViewProduct(product);
                                                    setQuickViewActiveImgIdx(0);
                                                }}
                                                className="font-bold text-gray-900 text-sm line-clamp-1 hover:text-[#2874f0] cursor-pointer transition-colors"
                                            >
                                                {product.name}
                                            </h3>

                                            <p className="text-[11px] text-gray-500 line-clamp-1">
                                                {product.tagline || product.description || "High performance hardware"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Pricing & Action Buttons */}
                                    <div className="mt-3 pt-2.5 border-t border-gray-100 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-base font-black text-gray-900">
                                                    {formatPriceDisplay(product.price_display)}
                                                </span>
                                                {extractPriceNumber(product.price_display) > 0 && (
                                                    <span className="text-[10px] text-gray-500 font-medium whitespace-nowrap">
                                                        (Incl. GST)
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-[#388e3c] font-bold">
                                                {product.stock_status}
                                            </span>
                                        </div>

                                        {/* Buy Now & Quote Action Buttons */}
                                        <div className="grid grid-cols-2 gap-1.5">
                                            <button
                                                onClick={() => handleOpenBuyNow(product)}
                                                className="py-1.5 bg-[#fb641b] hover:bg-[#e85b17] text-white font-bold text-xs uppercase tracking-wider rounded-sm shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                            >
                                                <Zap className="w-3.5 h-3.5 fill-white" /> Buy Now
                                            </button>
                                            <button
                                                onClick={() => handleInquiry(product)}
                                                className="py-1.5 bg-[#2874f0] hover:bg-[#1a5bc7] text-white font-bold text-xs uppercase tracking-wider rounded-sm shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                            >
                                                <MessageSquareQuote className="w-3.5 h-3.5" /> Quote
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-1.5 pt-0.5">
                                            {product.pdf_url && (
                                                <a
                                                    href={product.pdf_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    download
                                                    className="flex-1 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold rounded border border-gray-300 flex items-center justify-center gap-1 transition-colors"
                                                >
                                                    <FileText className="w-3 h-3 text-[#2874f0]" /> PDF
                                                </a>
                                            )}
                                            <button
                                                onClick={() => {
                                                    setQuickViewProduct(product);
                                                    setQuickViewActiveImgIdx(0);
                                                }}
                                                className="flex-1 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold rounded border border-gray-300 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                            >
                                                <Eye className="w-3 h-3" /> Quick View
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* FLIPKART QUICK VIEW MODAL */}
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
                                                <div className="flex items-baseline gap-1.5">
                                                    <span className="text-2xl font-black text-gray-900">
                                                        {formatPriceDisplay(quickViewProduct.price_display)}
                                                    </span>
                                                    {extractPriceNumber(quickViewProduct.price_display) > 0 && (
                                                        <span className="text-xs text-gray-500 font-medium">
                                                            (Incl. GST)
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs font-bold text-[#388e3c] block">
                                                    {quickViewProduct.stock_status}
                                                </span>
                                            </div>

                                            <p className="text-xs text-gray-600 leading-relaxed pt-2 border-t">
                                                {quickViewProduct.description || quickViewProduct.tagline || "No description provided."}
                                            </p>

                                            {/* Action CTAs in Modal */}
                                            <div className="pt-3 border-t flex flex-wrap gap-2">
                                                {/* Buy Now from Modal */}
                                                <button
                                                    onClick={() => {
                                                        const p = quickViewProduct;
                                                        setQuickViewProduct(null);
                                                        handleOpenBuyNow(p);
                                                    }}
                                                    className="px-5 py-2.5 bg-[#fb641b] hover:bg-[#e85b17] text-white text-xs font-bold uppercase rounded shadow-xs flex items-center gap-1.5 cursor-pointer"
                                                >
                                                    <Zap className="w-4 h-4 fill-white" /> Buy Now
                                                </button>

                                                {/* Get Quote / Inquiry */}
                                                <button
                                                    onClick={() => {
                                                        const p = quickViewProduct;
                                                        setQuickViewProduct(null);
                                                        handleInquiry(p);
                                                    }}
                                                    className="px-5 py-2.5 bg-[#2874f0] hover:bg-[#1a5bc7] text-white text-xs font-bold uppercase rounded shadow-xs flex items-center gap-1.5 cursor-pointer"
                                                >
                                                    <MessageSquareQuote className="w-4 h-4" /> Get Quote
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
        </section>
    );
}

function ChevronRightIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m9 18 6-6-6-6" />
        </svg>
    );
}
