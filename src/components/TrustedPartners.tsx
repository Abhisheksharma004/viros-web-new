import pool from "@/lib/db";
import ProductArcDome from "./ProductArcDome";

async function getProducts() {
    try {
        const [rows]: any = await pool.query(
            'SELECT * FROM products ORDER BY id DESC'
        );
        return rows;
    } catch (error) {
        if (process.env.NODE_ENV !== 'production' && error && typeof error === 'object' && 'code' in error && error.code !== 'ECONNREFUSED') {
            console.error('Error fetching products for TrustedPartners:', error);
        }
        return [];
    }
}

export default async function TrustedPartners() {
    const products = await getProducts();

    if (products.length === 0) return null;

    return (
        <section className="py-24 relative overflow-hidden bg-[#f3f7fd]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header Title */}
                <div className="text-center mb-12">
                    <span className="inline-block px-4 py-2 rounded-full bg-[#06b6d4]/10 text-[#06b6d4] text-sm font-bold mb-4 border border-[#06b6d4]/20 uppercase tracking-wider">
                        PREMIUM HARDWARE RANGE
                    </span>
                    <h2 className="text-4xl md:text-5xl font-black text-[#06124f]">
                        Featured Products & Solutions
                    </h2>
                </div>

                {/* 60FPS SEQUENTIAL SLIDER SHOWCASING ALL DATABASE PRODUCTS WITHOUT OVERCROWDING */}
                <ProductArcDome products={products} />
            </div>
        </section>
    );
}
