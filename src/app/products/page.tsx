"use client";

import Link from "next/link";
import ProductHeroSlider from "@/components/ProductHeroSlider";
import InquiryPopup from "@/components/InquiryPopup";
import ProductCard from "@/components/ProductCard";
import { useState, useEffect } from "react";

export default function ProductsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState("All");
    const [isVisible, setIsVisible] = useState(false);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<{ name: string; category: string; image: string; description: string; specs: string[] } | null>(null);

    const handleInquiry = (productName: string, productCategory: string, productImage: string, productDescription: string, productSpecs: string[]) => {
        setSelectedProduct({ name: productName, category: productCategory, image: productImage, description: productDescription, specs: productSpecs });
        setIsPopupOpen(true);
    };

    useEffect(() => {
        setIsVisible(true);
        const fetchProducts = async () => {
            try {
                const res = await fetch('/api/products');
                const data = await res.json();
                const parsedData = data.map((p: any) => ({
                    ...p,
                    specs: typeof p.specs === 'string' ? JSON.parse(p.specs) : p.specs,
                    is_featured: Boolean(p.is_featured)
                }));
                setProducts(parsedData);
            } catch (err) {
                console.error("Failed to fetch products", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const categories = ["All", ...Array.from(new Set(products.map(p => p.category)))];

    const filteredProducts = activeCategory === "All"
        ? products
        : products.filter(p => p.category === activeCategory);

    const featuredProducts = products.filter(p => p.is_featured);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#06b6d4]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <section className="relative w-full">
                <ProductHeroSlider products={featuredProducts} />
            </section>

            {/* Filter & Grid Section */}
            <section className="py-10 relative z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Category Filter */}
                    <div className="mb-10 relative z-30">
                        <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-x-visible">
                            <div className="flex sm:flex-wrap sm:justify-center gap-2 sm:gap-3 w-max sm:w-full sm:p-2 sm:rounded-3xl sm:bg-white/30 sm:backdrop-blur-xl sm:border sm:border-white/50 sm:shadow-xl">
                                {categories.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-300 shrink-0 ${activeCategory === cat
                                            ? "bg-linear-to-r from-[#06124f] to-[#06b6d4] text-white shadow-lg scale-105"
                                            : "bg-white text-[#06124f] border border-gray-200 hover:bg-gray-50 hover:scale-105 shadow-sm"
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {filteredProducts.map((product, index) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                index={index}
                                isVisible={isVisible}
                                onInquiry={handleInquiry}
                            />
                        ))}
                    </div>

                    {filteredProducts.length === 0 && (
                        <div className="text-center py-20">
                            <p className="text-xl text-gray-500">No products found in this category.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-[#06b6d4] via-[#06124f] to-[#06b6d4]" />
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-4xl font-black text-[#06124f] mb-6">Need Custom Hardware?</h2>
                    <p className="text-xl text-gray-600 mb-10">
                        We specialize in sourcing and configuring specific hardware solutions for unique business requirements.
                    </p>
                    <Link href="/contact" className="inline-block px-10 py-4 bg-linear-to-r from-[#06124f] to-[#06b6d4] text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        Contact Sales Team
                    </Link>
                </div>
            </section>

            {/* Inquiry Popup */}
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
