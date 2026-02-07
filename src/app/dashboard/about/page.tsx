"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Save, X, Loader2, Image as ImageIcon, Link as LinkIcon, Users, Rocket, Target, Star, History } from "lucide-react";

export default function AboutManagementPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [aboutData, setAboutData] = useState({
        title: "",
        subtitle: "",
        description: "",
        mission: "",
        vision: "",
        video_url: "",
        cta_title: "",
        cta_subtitle: "",
        cta_primary_text: "",
        cta_secondary_text: "",
        homepage_badge: "",
        homepage_title: "",
        homepage_description: "",
        homepage_image_url: "",
        homepage_card_title: "",
        homepage_card_subtitle: ""
    });

    const [stats, setStats] = useState<any[]>([]);
    const [values, setValues] = useState<any[]>([]);
    const [milestones, setMilestones] = useState<any[]>([]);
    const [team, setTeam] = useState<any[]>([]);
    const [features, setFeatures] = useState<any[]>([]);

    // Modal States
    const [showModal, setShowModal] = useState<any>(null); // { type: 'stat' | 'value' | 'milestone' | 'team' | 'feature', data?: any }

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [aboutRes, statsRes, valuesRes, milestonesRes, teamRes, featuresRes] = await Promise.all([
                fetch("/api/about/content"),
                fetch("/api/about/stats"),
                fetch("/api/about/values"),
                fetch("/api/about/milestones"),
                fetch("/api/team-members"),
                fetch("/api/about/features")
            ]);

            const about = await aboutRes.json();
            const statsData = await statsRes.json();
            const valuesData = await valuesRes.json();
            const milestonesData = await milestonesRes.json();
            const teamData = await teamRes.json();
            const featuresData = await featuresRes.json();

            // Normalize about data to avoid null values in inputs
            const normalizedAbout = { ...about };
            if (about) {
                Object.keys(about).forEach(key => {
                    if (about[key] === null) (normalizedAbout as any)[key] = "";
                });
            }
            setAboutData(normalizedAbout || {});

            setStats(Array.isArray(statsData) ? statsData : []);
            setValues(Array.isArray(valuesData) ? valuesData : []);
            setMilestones(Array.isArray(milestonesData) ? milestonesData : []);
            setTeam(Array.isArray(teamData) ? teamData : []);
            setFeatures(Array.isArray(featuresData) ? featuresData : []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMainSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/about/content", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(aboutData)
            });
            if (!res.ok) throw new Error("Failed to save main content");
            alert("Main content saved successfully!");
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (type: string, id: number) => {
        if (!confirm("Are you sure you want to delete this item?")) return;
        try {
            let url = "";
            if (type === 'stat') url = `/api/about/stats/${id}`;
            if (type === 'value') url = `/api/about/values/${id}`;
            if (type === 'milestone') url = `/api/about/milestones/${id}`;
            if (type === 'team') url = `/api/team-members/${id}`;
            if (type === 'feature') url = `/api/about/features/${id}`;

            const res = await fetch(url, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete item");
            fetchData();
        } catch (err: any) {
            alert(err.message);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-[#06b6d4]" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Page Header */}
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">About Page Management</h1>
                    <p className="text-gray-600 mt-1">Design and manage your company story</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={fetchData}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Refresh Data
                    </button>
                    <button
                        onClick={handleMainSave}
                        disabled={isSaving}
                        className="flex items-center space-x-2 px-6 py-2 bg-[#06124f] text-white rounded-lg hover:bg-black transition-all disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>Save All Content</span>
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
                    Error: {error}
                </div>
            )}

            {/* Homepage About Section */}
            <div className="bg-linear-to-br from-[#06124f] to-[#06124f]/90 p-8 rounded-2xl shadow-xl text-white border border-[#06b6d4]/20">
                <div className="flex items-center space-x-3 mb-6">
                    <svg className="w-6 h-6 text-[#06b6d4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <h2 className="text-2xl font-bold">Homepage About Section</h2>
                    <span className="text-xs bg-[#06b6d4]/20 px-3 py-1 rounded-full border border-[#06b6d4]/30">Displayed on Homepage</span>
                </div>
                <p className="text-white/70 mb-6 text-sm">Manage the "About" section that appears on your homepage</p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium opacity-90 mb-2">Badge Text</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg outline-none focus:bg-white/20 focus:border-[#06b6d4] transition-all text-white placeholder:text-white/50"
                                placeholder="e.g., WHO WE ARE"
                                value={aboutData.homepage_badge}
                                onChange={(e) => setAboutData({ ...aboutData, homepage_badge: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium opacity-90 mb-2">Section Title</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg outline-none focus:bg-white/20 focus:border-[#06b6d4] transition-all text-white placeholder:text-white/50"
                                placeholder="e.g., Complete Barcode Solutions Provider"
                                value={aboutData.homepage_title}
                                onChange={(e) => setAboutData({ ...aboutData, homepage_title: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium opacity-90 mb-2">Description</label>
                            <textarea
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg outline-none focus:bg-white/20 focus:border-[#06b6d4] transition-all text-white placeholder:text-white/50 min-h-32"
                                placeholder="Brief description of your company..."
                                value={aboutData.homepage_description}
                                onChange={(e) => setAboutData({ ...aboutData, homepage_description: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium opacity-90 mb-2">Image URL</label>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-3.5 w-4 h-4 text-white/50" />
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg outline-none focus:bg-white/20 focus:border-[#06b6d4] transition-all text-white placeholder:text-white/50"
                                    placeholder="https://example.com/image.jpg"
                                    value={aboutData.homepage_image_url}
                                    onChange={(e) => setAboutData({ ...aboutData, homepage_image_url: e.target.value })}
                                />
                            </div>
                            {aboutData.homepage_image_url && (
                                <div className="mt-2 rounded-lg overflow-hidden border border-white/20">
                                    <img
                                        src={aboutData.homepage_image_url}
                                        alt="Preview"
                                        className="w-full h-32 object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EInvalid URL%3C/text%3E%3C/svg%3E';
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium opacity-90 mb-2">Floating Card Title</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg outline-none focus:bg-white/20 focus:border-[#06b6d4] transition-all text-white placeholder:text-white/50"
                                placeholder="e.g., Trusted Partner"
                                value={aboutData.homepage_card_title}
                                onChange={(e) => setAboutData({ ...aboutData, homepage_card_title: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium opacity-90 mb-2">Floating Card Subtitle</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg outline-none focus:bg-white/20 focus:border-[#06b6d4] transition-all text-white placeholder:text-white/50"
                                placeholder="e.g., Helping businesses scale since 2018"
                                value={aboutData.homepage_card_subtitle}
                                onChange={(e) => setAboutData({ ...aboutData, homepage_card_subtitle: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Hero & Main Info */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                    <div className="flex items-center space-x-2 mb-4">
                        <Rocket className="w-5 h-5 text-[#06b6d4]" />
                        <h2 className="text-xl font-bold text-gray-900">Hero & Brand Story</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Page Title</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#06b6d4] outline-none text-gray-900"
                                value={aboutData.title}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAboutData({ ...aboutData, title: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#06b6d4] outline-none text-gray-900"
                                value={aboutData.subtitle}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAboutData({ ...aboutData, subtitle: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#06b6d4] outline-none min-h-30 text-gray-900"
                                value={aboutData.description}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAboutData({ ...aboutData, description: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Company Video URL (YouTube/Vimeo)</label>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#06b6d4] outline-none text-gray-900"
                                    placeholder="https://youtube.com/..."
                                    value={aboutData.video_url}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAboutData({ ...aboutData, video_url: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mission & Vision */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                    <div className="flex items-center space-x-2 mb-4">
                        <Target className="w-5 h-5 text-[#06b6d4]" />
                        <h2 className="text-xl font-bold text-gray-900">Mission & Vision</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Our Mission</label>
                            <textarea
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#06b6d4] outline-none min-h-25 text-gray-900"
                                value={aboutData.mission}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAboutData({ ...aboutData, mission: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Our Vision</label>
                            <textarea
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#06b6d4] outline-none min-h-25 text-gray-900"
                                value={aboutData.vision}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAboutData({ ...aboutData, vision: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistics Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-2">
                        <Star className="w-5 h-5 text-[#06b6d4]" />
                        <h2 className="text-xl font-bold text-gray-900">Key Statistics</h2>
                    </div>
                    <button
                        onClick={() => setShowModal({ type: 'stat' })}
                        className="flex items-center space-x-2 px-4 py-2 bg-[#06b6d4] text-white rounded-lg hover:bg-[#06124f] transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Stat</span>
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat) => (
                        <div key={stat.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50/50 group hover:border-[#06b6d4] transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-2xl font-bold text-[#06124f]">{stat.value}</span>
                                <div className="flex space-x-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setShowModal({ type: 'stat', data: stat })} className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded" aria-label="Edit Stat"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete('stat', stat.id)} className="p-1.5 hover:text-red-600 hover:bg-red-50 rounded" aria-label="Delete Stat"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Core Values Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Star className="text-[#06b6d4]" /> Core Values</h2>
                    <button onClick={() => setShowModal({ type: 'value' })} className="px-4 py-2 bg-[#06b6d4] text-white rounded-lg hover:bg-[#06124f] transition-colors flex items-center gap-2">
                        <Plus size={18} /> Add Value
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {values.map((v) => (
                        <div key={v.id} className="p-5 border rounded-xl hover:border-[#06b6d4] group bg-white shadow-xs transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="text-3xl p-3 bg-gray-50 rounded-lg">{v.icon}</div>
                                <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setShowModal({ type: 'value', data: v })} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" aria-label="Edit Value"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete('value', v.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" aria-label="Delete Value"><Trash2 size={16} /></button>
                                </div>
                            </div>
                            <h3 className="font-bold text-lg mb-2 text-gray-900">{v.title}</h3>
                            <p className="text-gray-600 text-sm">{v.description}</p>
                            {v.gradient && <div className="mt-3 text-xs text-gray-400">Gradient: {v.gradient}</div>}
                        </div>
                    ))}
                </div>
            </div>

            {/* Team Members Management */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-2">
                        <Users className="w-5 h-5 text-[#06b6d4]" />
                        <h2 className="text-xl font-bold text-gray-900">Leadership Team</h2>
                    </div>
                    <button
                        onClick={() => setShowModal({ type: 'team' })}
                        className="flex items-center space-x-2 px-4 py-2 bg-[#06b6d4] text-white rounded-lg hover:bg-[#06124f] transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Team Member</span>
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {team.map((member) => (
                        <div key={member.id} className="group relative bg-gray-50/50 rounded-2xl p-5 border border-transparent hover:border-[#06b6d4] transition-all">
                            <div className="flex items-center space-x-4 mb-4">
                                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                                    {member.image ? (
                                        <img src={member.image} alt={member.name} className="object-cover w-full h-full" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center"><ImageIcon className="text-gray-400" /></div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 truncate">{member.name}</h3>
                                    <p className="text-sm text-[#06b6d4] font-semibold">{member.role}</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-3 mb-4">{member.bio}</p>
                            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                                <div className="flex space-x-2">
                                    {member.linkedin && <LinkIcon className="w-4 h-4 text-blue-600" />}
                                    {member.instagram && <LinkIcon className="w-4 h-4 text-pink-600" />}
                                </div>
                                <div className="flex space-x-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setShowModal({ type: 'team', data: member })} className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded" aria-label="Edit Team Member"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete('team', member.id)} className="p-1.5 hover:text-red-600 hover:bg-red-50 rounded" aria-label="Delete Team Member"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Product Categories / Features */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Rocket className="text-[#06b6d4]" /> Product Categories</h2>
                    <button onClick={() => setShowModal({ type: 'feature' })} className="px-4 py-2 bg-[#06b6d4] text-white rounded-lg hover:bg-[#06124f] transition-colors flex items-center gap-2">
                        <Plus size={18} /> Add Category
                    </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {features.map((f) => (
                        <div key={f.id} className="p-4 border rounded-xl hover:border-[#06b6d4] group transition-all">
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-2 bg-gray-50 rounded-lg">{f.icon}</div>
                                <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setShowModal({ type: 'feature', data: f })} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" aria-label="Edit Feature"><Edit2 size={14} /></button>
                                    <button onClick={() => handleDelete('feature', f.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" aria-label="Delete Feature"><Trash2 size={14} /></button>
                                </div>
                            </div>
                            <h3 className="font-bold text-sm mb-1 text-gray-900">{f.title}</h3>
                            <p className="text-xs text-gray-600 line-clamp-2">{f.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Milestones Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><History className="text-[#06b6d4]" /> Our Journey</h2>
                    <button onClick={() => setShowModal({ type: 'milestone' })} className="px-4 py-2 bg-[#06b6d4] text-white rounded-lg hover:bg-[#06124f] transition-colors flex items-center gap-2">
                        <Plus size={18} /> Add Milestone
                    </button>
                </div>
                <div className="space-y-4">
                    {milestones.map((m) => (
                        <div key={m.id} className="flex gap-4 p-4 border-l-4 border-[#06b6d4] bg-gray-50/50 group rounded-r-xl">
                            <div className="text-xl font-black text-[#06b6d4] w-20">{m.year}</div>
                            <div className="flex-1">
                                <h3 className="font-bold mb-1 text-gray-900">{m.title}</h3>
                                <p className="text-sm text-gray-600">{m.description}</p>
                            </div>
                            <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setShowModal({ type: 'milestone', data: m })} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" aria-label="Edit Milestone"><Edit2 size={16} /></button>
                                <button onClick={() => handleDelete('milestone', m.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" aria-label="Delete Milestone"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA Section Config */}
            <div className="bg-[#06124f] p-8 rounded-2xl shadow-xl text-white">
                <div className="flex items-center space-x-3 mb-6">
                    <Save className="w-6 h-6 text-[#06b6d4]" />
                    <h2 className="text-2xl font-bold">CTA Section Configuration</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium opacity-80 mb-1">CTA Main Title</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg outline-none focus:bg-white/20 transition-all text-white placeholder:text-white/60"
                                value={aboutData.cta_title}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAboutData({ ...aboutData, cta_title: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium opacity-80 mb-1">CTA Subtitle Content</label>
                            <textarea
                                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg outline-none focus:bg-white/20 transition-all text-white min-h-25 placeholder:text-white/60"
                                value={aboutData.cta_subtitle}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAboutData({ ...aboutData, cta_subtitle: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium opacity-80 mb-1">Primary Button Text</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg outline-none focus:bg-white/20 transition-all text-white placeholder:text-white/60"
                                value={aboutData.cta_primary_text}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAboutData({ ...aboutData, cta_primary_text: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium opacity-80 mb-1">Secondary Button Text</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg outline-none focus:bg-white/20 transition-all text-white placeholder:text-white/60"
                                value={aboutData.cta_secondary_text}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAboutData({ ...aboutData, cta_secondary_text: e.target.value })}
                            />
                        </div>
                        <div className="pt-4">
                            <button
                                onClick={handleMainSave}
                                className="w-full py-4 bg-[#06b6d4] rounded-xl font-bold hover:bg-white hover:text-[#06124f] transition-all shadow-lg"
                            >
                                Save All About Page Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals for CRUD operations */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h3 className="text-xl font-bold">
                                {showModal.data ? 'Edit' : 'Add'} {showModal.type.charAt(0).toUpperCase() + showModal.type.slice(1)}
                            </h3>
                            <button onClick={() => setShowModal(null)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[70vh]">
                            <ModalForm
                                type={showModal.type}
                                data={showModal.data}
                                onCancel={() => setShowModal(null)}
                                onSuccess={() => { setShowModal(null); fetchData(); }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Sub-component for form handling
function ModalForm({ type, data, onCancel, onSuccess }: any) {
    const isEdit = !!data;
    const [formData, setFormData] = useState<any>(() => {
        if (!data) return {};
        const normalized = { ...data };
        Object.keys(normalized).forEach(key => {
            if (normalized[key] === null) normalized[key] = "";
        });
        return normalized;
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            let url = "";
            if (type === 'stat') url = isEdit ? `/api/about/stats/${data.id}` : "/api/about/stats";
            if (type === 'value') url = isEdit ? `/api/about/values/${data.id}` : "/api/about/values";
            if (type === 'milestone') url = isEdit ? `/api/about/milestones/${data.id}` : "/api/about/milestones";
            if (type === 'team') url = isEdit ? `/api/team-members/${data.id}` : "/api/team-members";
            if (type === 'feature') url = isEdit ? `/api/about/features/${data.id}` : "/api/about/features";

            const method = isEdit ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error("Operation failed");
            onSuccess();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {type === 'stat' && (
                <>
                    <input className="w-full p-2 border rounded-lg text-gray-900" placeholder="Label (e.g., Happy Clients)" value={formData.label || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, label: e.target.value })} required />
                    <input className="w-full p-2 border rounded-lg text-gray-900" placeholder="Value (e.g., 500+)" value={formData.value || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, value: e.target.value })} required />
                    <input className="w-full p-2 border rounded-lg text-gray-900" placeholder="Icon (SVG string)" value={formData.icon || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, icon: e.target.value })} />
                </>
            )}
            {type === 'value' && (
                <>
                    <input className="w-full p-2 border rounded-lg text-gray-900" placeholder="Title" value={formData.title || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })} required />
                    <textarea className="w-full p-2 border rounded-lg text-gray-900" placeholder="Description" value={formData.description || ""} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })} required />
                    <input className="w-full p-2 border rounded-lg text-gray-900" placeholder="Icon (SVG string or emoji)" value={formData.icon || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, icon: e.target.value })} />
                    <input className="w-full p-2 border rounded-lg text-gray-900" placeholder="Gradient (e.g., from-blue-500 to-cyan-500)" value={formData.gradient || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, gradient: e.target.value })} />
                </>
            )}
            {type === 'milestone' && (
                <>
                    <input className="w-full p-2 border rounded-lg text-gray-900" placeholder="Year" value={formData.year || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, year: e.target.value })} required />
                    <input className="w-full p-2 border rounded-lg text-gray-900" placeholder="Title" value={formData.title || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })} required />
                    <textarea className="w-full p-2 border rounded-lg text-gray-900" placeholder="Description" value={formData.description || ""} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })} required />
                </>
            )}
            {type === 'team' && (
                <>
                    <input className="w-full p-2 border rounded-lg text-gray-900" placeholder="Name" value={formData.name || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })} required />
                    <input className="w-full p-2 border rounded-lg text-gray-900" placeholder="Role" value={formData.role || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, role: e.target.value })} required />
                    <input className="w-full p-2 border rounded-lg text-gray-900" placeholder="Image URL" value={formData.image || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, image: e.target.value })} />
                    <textarea className="w-full p-2 border rounded-lg text-gray-900" placeholder="Bio" value={formData.bio || ""} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, bio: e.target.value })} />
                    <input className="w-full p-2 border rounded-lg text-gray-900" placeholder="LinkedIn URL" value={formData.linkedin || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, linkedin: e.target.value })} />
                    <input className="w-full p-2 border rounded-lg text-gray-900" placeholder="Instagram/Twitter URL" value={formData.instagram || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, instagram: e.target.value })} />
                </>
            )}
            {type === 'feature' && (
                <>
                    <input className="w-full p-2 border rounded-lg text-gray-900" placeholder="Title" value={formData.title || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })} required />
                    <textarea className="w-full p-2 border rounded-lg text-gray-900" placeholder="Description" value={formData.description || ""} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })} required />
                    <input className="w-full p-2 border rounded-lg text-gray-900" placeholder="Icon (SVG string)" value={formData.icon || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, icon: e.target.value })} />
                </>
            )}
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-6 py-2 bg-[#06b6d4] text-white rounded-lg font-bold flex items-center gap-2">
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isEdit ? 'Update' : 'Create'}
                </button>
            </div>
        </form>
    );
}
