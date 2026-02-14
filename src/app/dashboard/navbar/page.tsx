
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function NavbarManagement() {
    const [content, setContent] = useState({
        logo_url: '',
        brand_title: '',
        brand_subtitle: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        try {
            const response = await fetch('/api/navbar/content');
            if (response.ok) {
                const data = await response.json();
                setContent(data);
            }
        } catch (error) {
            console.error('Error fetching navbar content:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await fetch('/api/navbar/content', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(content)
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Navbar content updated successfully!' });
            } else {
                throw new Error('Failed to update');
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update content. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading...</div>;
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-[#06124f] mb-8">Navbar Management</h1>

            {message.text && (
                <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Logo Section */}
                    <div>
                        <h2 className="text-xl font-bold text-[#06124f] mb-4">Logo URL</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Image URL</label>
                                <input
                                    type="text"
                                    value={content.logo_url}
                                    onChange={(e) => setContent({ ...content, logo_url: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent outline-none transition-all text-gray-900"
                                    placeholder="/logo.png or https://example.com/logo.png"
                                />
                                <p className="text-sm text-gray-500 mt-2">Enter the URL or path to your logo image</p>
                            </div>
                            <div className="flex justify-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                                {content.logo_url ? (
                                    <div className="relative h-20 w-full flex items-center justify-center">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={content.logo_url}
                                            alt="Image Preview"
                                            className="h-16 w-auto object-contain"
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                    </div>
                                ) : (
                                    <div className="text-gray-400 text-sm">Image Preview</div>
                                )}
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-100 my-8" />

                    {/* Branding Section */}
                    <div>
                        <h2 className="text-xl font-bold text-[#06124f] mb-4">Brand Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Brand Title</label>
                                <input
                                    type="text"
                                    value={content.brand_title}
                                    onChange={(e) => setContent({ ...content, brand_title: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent outline-none transition-all text-gray-900"
                                    placeholder="VIROS"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Brand Subtitle</label>
                                <input
                                    type="text"
                                    value={content.brand_subtitle}
                                    onChange={(e) => setContent({ ...content, brand_subtitle: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent outline-none transition-all text-gray-900"
                                    placeholder="Entrepreneurs"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                        <button
                            type="submit"
                            disabled={saving}
                            className={`w-full py-3 px-6 rounded-xl text-white font-bold text-lg shadow-lg transition-all transform hover:-translate-y-1 ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-[#06124f] to-[#06b6d4] hover:shadow-xl'
                                }`}
                        >
                            {saving ? 'Saving Changes...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
