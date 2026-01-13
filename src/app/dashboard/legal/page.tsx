
"use client";

import { useState, useEffect } from 'react';

export default function LegalManagement() {
    const [content, setContent] = useState({
        privacy_policy: '',
        terms_of_service: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        try {
            const response = await fetch('/api/legal/content');
            if (response.ok) {
                const data = await response.json();
                // If empty, we could potentially load default template, but for now leave empty/what is in DB
                if (data && (data.privacy_policy || data.terms_of_service)) {
                    setContent({
                        privacy_policy: data.privacy_policy || '',
                        terms_of_service: data.terms_of_service || ''
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching legal content:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await fetch('/api/legal/content', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(content)
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Legal pages updated successfully!' });
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
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-[#06124f] mb-8">Legal Pages Management</h1>

            {message.text && (
                <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* Privacy Policy */}
                    <div>
                        <h2 className="text-xl font-bold text-[#06124f] mb-4">Privacy Policy Content</h2>
                        <p className="text-sm text-gray-500 mb-2">Supports HTML formatting (e.g. &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;)</p>
                        <textarea
                            value={content.privacy_policy}
                            onChange={(e) => setContent({ ...content, privacy_policy: e.target.value })}
                            rows={15}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent outline-none transition-all text-gray-900 font-mono text-sm"
                            placeholder="Enter HTML content for Privacy Policy..."
                        />
                    </div>

                    <hr className="border-gray-100" />

                    {/* Terms of Service */}
                    <div>
                        <h2 className="text-xl font-bold text-[#06124f] mb-4">Terms of Service Content</h2>
                        <p className="text-sm text-gray-500 mb-2">Supports HTML formatting</p>
                        <textarea
                            value={content.terms_of_service}
                            onChange={(e) => setContent({ ...content, terms_of_service: e.target.value })}
                            rows={15}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent outline-none transition-all text-gray-900 font-mono text-sm"
                            placeholder="Enter HTML content for Terms of Service..."
                        />
                    </div>

                    <div className="pt-6 border-t border-gray-100 sticky bottom-0 bg-white pb-4">
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
