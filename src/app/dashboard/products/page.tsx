"use client";

import { useState } from "react";

const mockProducts = [
    { id: 1, name: "Zebra ZT411 Industrial Printer", category: "Printers", price: "$1,299", stock: "In Stock", image: "🖨️" },
    { id: 2, name: "Honeywell Granit 1991i Scanner", category: "Scanners", price: "$899", stock: "In Stock", image: "📱" },
    { id: 3, name: "Zebra TC52 Mobile Computer", category: "Mobile Devices", price: "$1,499", stock: "Low Stock", image: "📲" },
    { id: 4, name: "TSC TTP-247 Desktop Printer", category: "Printers", price: "$599", stock: "In Stock", image: "🖨️" }
];

export default function ProductsPage() {
    const [products] = useState(mockProducts);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Products Management</h1>
                    <p className="text-gray-600 mt-1">Manage your product catalog</p>
                </div>
                <button className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#06b6d4] to-[#06124f] text-white font-semibold rounded-lg hover:shadow-lg transition-all">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add New Product
                </button>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] outline-none"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                    <div key={product.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all">
                        <div className="text-6xl mb-4 text-center">{product.image}</div>
                        <h3 className="font-bold text-gray-900 mb-2">{product.name}</h3>
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                            <span>{product.category}</span>
                            <span className="font-semibold text-[#06b6d4]">{product.price}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className={`text-xs px-3 py-1 rounded-full ${product.stock === "In Stock" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}`}>
                                {product.stock}
                            </span>
                            <div className="flex space-x-2">
                                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
                                <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
