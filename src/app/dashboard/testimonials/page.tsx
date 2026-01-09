"use client";

import { useState } from "react";

const mockTestimonials = [
    { id: 1, name: "John Doe", company: "ABC Corp", rating: 5, text: "Excellent service and products!", status: "Approved", date: "2024-01-05" },
    { id: 2, name: "Jane Smith", company: "XYZ Ltd", rating: 4, text: "Very professional team", status: "Pending", date: "2024-01-04" },
    { id: 3, name: "Mike Johnson", company: "Tech Solutions", rating: 5, text: "Highly recommend!", status: "Approved", date: "2024-01-03" }
];

export default function TestimonialsPage() {
    const [testimonials] = useState(mockTestimonials);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Testimonials Management</h1>
                    <p className="text-gray-600 mt-1">Manage customer reviews and feedback</p>
                </div>
                <button className="px-6 py-3 bg-gradient-to-r from-[#06b6d4] to-[#06124f] text-white font-semibold rounded-lg">
                    Add Testimonial
                </button>
            </div>

            <div className="grid gap-6">
                {testimonials.map((testimonial) => (
                    <div key={testimonial.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-[#06b6d4] to-[#06124f] rounded-full flex items-center justify-center text-white font-bold">
                                    {testimonial.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{testimonial.name}</h3>
                                    <p className="text-sm text-gray-600">{testimonial.company}</p>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${testimonial.status === "Approved" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                                }`}>
                                {testimonial.status}
                            </span>
                        </div>
                        <div className="flex mb-3">
                            {[...Array(5)].map((_, i) => (
                                <svg key={i} className={`w-5 h-5 ${i < testimonial.rating ? "text-yellow-400" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            ))}
                        </div>
                        <p className="text-gray-700 mb-4">"{testimonial.text}"</p>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">{testimonial.date}</span>
                            <div className="flex space-x-2">
                                {testimonial.status === "Pending" && (
                                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                        Approve
                                    </button>
                                )}
                                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
