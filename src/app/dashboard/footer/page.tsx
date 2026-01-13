
"use client";

import { useState, useEffect } from 'react';

export default function FooterManagement() {
    const [content, setContent] = useState({
        description: '',
        copyright_text: '',
        developer_text: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        try {
            const response = await fetch('/api/footer/content');
            if (response.ok) {
                const data = await response.json();
                setContent(data);
            }
        } catch (error) {
            console.error('Error fetching footer content:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await fetch('/api/footer/content', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(content)
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Footer content updated successfully!' });
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
            <h1 className="text-3xl font-bold text-[#06124f] mb-8">Footer Management</h1>

            {message.text && (
                <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Description Section */}
                    <div>
                        <h2 className="text-xl font-bold text-[#06124f] mb-4">Footer Description</h2>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Company Description (Below Logo)</label>
                            <textarea
                                value={content.description}
                                onChange={(e) => setContent({ ...content, description: e.target.value })}
                                rows={4}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent outline-none transition-all text-gray-900"
                                placeholder="Enter the company description..."
                            />
                            <p className="text-sm text-gray-500 mt-2">This text appears under the logo in the footer.</p>
                        </div>
                    </div>

                    <hr className="border-gray-100 my-8" />

                    {/* Branding Section */}
                    <div>
                        <h2 className="text-xl font-bold text-[#06124f] mb-4">Copyright & Credits</h2>
                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Copyright Text</label>
                                <input
                                    type="text"
                                    value={content.copyright_text}
                                    onChange={(e) => setContent({ ...content, copyright_text: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent outline-none transition-all text-gray-900"
                                    placeholder="VIROS Entrepreneurs. All rights reserved."
                                />
                                <p className="text-sm text-gray-500 mt-2">The current year is automatically added.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Developer / Footer Credit Text</label>
                                <input
                                    type="text"
                                    value={content.developer_text}
                                    onChange={(e) => setContent({ ...content, developer_text: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent outline-none transition-all text-gray-900"
                                    placeholder="Developed and maintained by..."
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
