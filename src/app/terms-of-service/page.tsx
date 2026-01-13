
"use client";

import { useState, useEffect } from 'react';

export default function TermsOfService() {
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await fetch('/api/legal/content');
                if (response.ok) {
                    const data = await response.json();
                    if (data.terms_of_service) {
                        setContent(data.terms_of_service);
                    }
                }
            } catch (error) {
                console.error('Error fetching terms of service:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
    }, []);

    if (loading) {
        return <div className="min-h-screen flex justify-center items-center text-gray-500">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-10 pb-20">
            <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100">
                    <h1 className="text-3xl md:text-4xl font-bold text-[#06124f] mb-8 border-b border-gray-200 pb-4">Terms of Service</h1>

                    <div
                        className="prose prose-lg prose-blue max-w-none text-gray-600"
                        dangerouslySetInnerHTML={{ __html: content || '<p>No content available.</p>' }}
                    />
                </div>
            </div>
        </div>
    );
}
