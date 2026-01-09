"use client";

import { useState, useEffect } from "react";
import {
    Printer, Code, Tags, Settings, Monitor, Plus, Trash2,
    ChevronRight, Save, X, Layout, List, HelpCircle,
    RefreshCcw, Info, Image as ImageIcon, Palmtree, Briefcase
} from "lucide-react";

interface Service {
    id: number;
    slug: string;
    title: string;
    status: "Active" | "Inactive";
    description: string;
    long_description: string;
    image_url: string;
    icon_name: string;
    gradient: string;
    features: string[];
    benefits: { title: string; description: string }[];
    specifications: { label: string; value: string }[];
    process: { step: number; title: string; description: string }[];
    faqs: { question: string; answer: string }[];
    brands: { name: string; logo: string }[];
    products: { name: string; description: string; image: string; category: string }[];
    useCases: { industry: string; scenario: string; solution: string }[];
    created_at: string;
    updated_at: string;
}

const ICON_OPTIONS = [
    { name: "Printer", icon: Printer },
    { name: "Code", icon: Code },
    { name: "Tags", icon: Tags },
    { name: "Settings", icon: Settings },
    { name: "Monitor", icon: Monitor },
    { name: "RefreshCcw", icon: RefreshCcw },
    { name: "Palmtree", icon: Palmtree }
];

export default function ServicesPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState("general");

    const fetchServices = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/services");
            if (!response.ok) throw new Error("Failed to fetch services");
            const data = await response.json();
            // Parse JSON strings from database
            const parsedData = data.map((s: any) => ({
                ...s,
                features: typeof s.features === 'string' ? JSON.parse(s.features) : s.features,
                benefits: typeof s.benefits === 'string' ? JSON.parse(s.benefits) : s.benefits,
                specifications: typeof s.specifications === 'string' ? JSON.parse(s.specifications) : s.specifications,
                process: typeof s.process === 'string' ? JSON.parse(s.process) : s.process,
                faqs: typeof s.faqs === 'string' ? JSON.parse(s.faqs) : s.faqs,
                brands: typeof s.brands === 'string' ? JSON.parse(s.brands) : s.brands,
                products: typeof s.products === 'string' ? JSON.parse(s.products) : s.products,
                useCases: typeof s.useCases === 'string' ? JSON.parse(s.useCases) : s.useCases
            }));
            setServices(parsedData);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const filteredServices = services.filter(service =>
        service.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const [showFormModal, setShowFormModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<Service>>({
        title: "",
        slug: "",
        status: "Active",
        description: "",
        long_description: "",
        image_url: "",
        icon_name: "Printer",
        gradient: "from-[#06b6d4] to-[#06124f]",
        features: [],
        benefits: [],
        specifications: [],
        process: [],
        faqs: [],
        brands: [],
        products: [],
        useCases: []
    });

    const openAddModal = () => {
        setIsEditing(false);
        setFormData({
            title: "",
            slug: "",
            status: "Active",
            description: "",
            long_description: "",
            image_url: "",
            icon_name: "Printer",
            gradient: "from-[#06b6d4] to-[#06124f]",
            features: [],
            benefits: [],
            specifications: [],
            process: [],
            faqs: [],
            brands: [],
            products: [],
            useCases: []
        });
        setActiveTab("general");
        setShowFormModal(true);
    };

    const openEditModal = (service: Service) => {
        setIsEditing(true);
        setSelectedServiceId(service.id);
        setFormData(service);
        setActiveTab("general");
        setShowFormModal(true);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = isEditing ? `/api/services/${selectedServiceId}` : "/api/services";
            const method = isEditing ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error("Failed to save service");

            setShowFormModal(false);
            fetchServices();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const confirmDelete = async () => {
        if (selectedServiceId) {
            try {
                const response = await fetch(`/api/services/${selectedServiceId}`, {
                    method: "DELETE",
                });
                if (!response.ok) throw new Error("Failed to delete service");

                setServices(services.filter(s => s.id !== selectedServiceId));
                setShowDeleteModal(false);
                setSelectedServiceId(null);
            } catch (err: any) {
                alert(err.message);
            }
        }
    };

    const addListField = (field: string, defaultValue: any) => {
        setFormData({
            ...formData,
            [field]: [...((formData as any)[field] || []), defaultValue]
        });
    };

    const removeListField = (field: string, index: number) => {
        const newList = [...((formData as any)[field] || [])];
        newList.splice(index, 1);
        setFormData({ ...formData, [field]: newList });
    };

    const updateListField = (field: string, index: number, value: any) => {
        const newList = [...((formData as any)[field] || [])];
        newList[index] = value;
        setFormData({ ...formData, [field]: newList });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#06b6d4]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Services Management</h1>
                    <p className="text-gray-600 mt-1">Manage all your rich service content</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#06b6d4] to-[#06124f] text-white font-semibold rounded-lg shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 hover:-translate-y-0.5"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Add New Service
                </button>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">{error}</div>}

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search services..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent outline-none placeholder:text-gray-500 text-gray-900"
                    />
                    <Info className="w-5 h-5 text-gray-600 absolute left-3 top-2.5" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredServices.map((service) => (
                    <div key={service.id} className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                        <div className={`h-2 bg-gradient-to-r ${service.gradient}`} />
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-[#06b6d4] group-hover:scale-110 transition-transform">
                                    {(() => {
                                        const IconComp = ICON_OPTIONS.find(i => i.name === service.icon_name)?.icon || Printer;
                                        return <IconComp size={24} />;
                                    })()}
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${service.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {service.status}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
                            <p className="text-sm text-gray-500 line-clamp-2 mb-6">{service.description}</p>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                <span className="text-xs text-gray-400">Slug: {service.slug}</span>
                                <div className="flex space-x-1">
                                    <button onClick={() => openEditModal(service)} className="p-2 text-[#06b6d4] hover:bg-cyan-50 rounded-lg transition-colors">
                                        <ChevronRight size={18} />
                                    </button>
                                    <button onClick={() => { setSelectedServiceId(service.id); setShowDeleteModal(true); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showFormModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-[#06124f]">
                                    {isEditing ? "Edit Service" : "Add New Service"}
                                </h2>
                                <p className="text-sm text-gray-700 font-medium">Configure your rich service content</p>
                            </div>
                            <button onClick={() => setShowFormModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex border-b border-gray-100 bg-white">
                            {[
                                { id: 'general', label: 'General Info', icon: Layout },
                                { id: 'visuals', label: 'Visuals', icon: ImageIcon },
                                { id: 'content', label: 'Content & Specs', icon: List },
                                { id: 'solutions', label: 'Solutions & Partners', icon: Briefcase },
                                { id: 'advanced', label: 'Advanced (FAQs)', icon: HelpCircle }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center px-6 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === tab.id
                                        ? 'border-[#06b6d4] text-[#06b6d4] bg-cyan-50/30'
                                        : 'border-transparent text-gray-600 hover:text-gray-900'}`}
                                >
                                    <tab.icon size={16} className="mr-2" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 bg-white">
                            <form id="serviceForm" onSubmit={handleFormSubmit} className="space-y-6">
                                {activeTab === 'general' && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">Service Title</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.title || ""}
                                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#06b6d4] outline-none transition-all text-gray-900"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">URL Slug</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.slug || ""}
                                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#06b6d4] outline-none text-gray-900"
                                                    placeholder="e.g. hardware-solutions"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">Status</label>
                                            <select
                                                value={formData.status || "Active"}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#06b6d4] outline-none text-gray-900"
                                            >
                                                <option value="Active">Active</option>
                                                <option value="Inactive">Inactive</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">Short Description</label>
                                            <textarea
                                                value={formData.description || ""}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#06b6d4] outline-none h-24 text-gray-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">Detailed Long Description</label>
                                            <textarea
                                                value={formData.long_description || ""}
                                                onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#06b6d4] outline-none h-32 text-gray-900"
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'visuals' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                        <div>
                                            <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">Image URL</label>
                                            <input
                                                type="text"
                                                value={formData.image_url || ""}
                                                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#06b6d4] outline-none mb-2 text-gray-900"
                                            />
                                            {formData.image_url && (
                                                <div className="relative h-48 w-full rounded-2xl overflow-hidden border border-gray-100 shadow-inner mt-4 bg-gray-50">
                                                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-4">Select Icon</label>
                                                <div className="grid grid-cols-4 gap-2">
                                                    {ICON_OPTIONS.map((opt) => (
                                                        <button
                                                            key={opt.name}
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, icon_name: opt.name })}
                                                            className={`p-4 rounded-xl flex items-center justify-center transition-all ${formData.icon_name === opt.name
                                                                ? 'bg-[#06b6d4] text-white shadow-lg shadow-cyan-500/20 scale-110'
                                                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                                                        >
                                                            <opt.icon size={20} />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">Gradient Style</label>
                                                <input
                                                    type="text"
                                                    value={formData.gradient || ""}
                                                    onChange={(e) => setFormData({ ...formData, gradient: e.target.value })}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#06b6d4] outline-none text-gray-900"
                                                    placeholder="from-[#color] to-[#color]"
                                                />
                                                <div className={`h-16 w-full rounded-xl mt-4 bg-gradient-to-r ${formData.gradient} shadow-md`} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'content' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                        <div>
                                            <div className="flex justify-between items-center mb-4">
                                                <label className="text-xs font-black text-gray-700 uppercase tracking-wider">Features</label>
                                                <button type="button" onClick={() => addListField('features', '')} className="text-xs font-bold text-[#06b6d4] hover:underline flex items-center">
                                                    <Plus size={14} className="mr-1" /> Add Feature
                                                </button>
                                            </div>
                                            <div className="space-y-2">
                                                {formData.features?.map((f, i) => (
                                                    <div key={i} className="flex gap-2">
                                                        <input
                                                            value={f || ""}
                                                            onChange={(e) => updateListField('features', i, e.target.value)}
                                                            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#06b6d4] outline-none text-gray-900"
                                                            placeholder="Feature description..."
                                                        />
                                                        <button type="button" onClick={() => removeListField('features', i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-4">
                                                <label className="text-xs font-black text-gray-700 uppercase tracking-wider">Benefits</label>
                                                <button type="button" onClick={() => addListField('benefits', { title: '', description: '' })} className="text-xs font-bold text-[#06b6d4] hover:underline flex items-center">
                                                    <Plus size={14} className="mr-1" /> Add Benefit
                                                </button>
                                            </div>
                                            <div className="space-y-4">
                                                {formData.benefits?.map((b, i) => (
                                                    <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                                                        <div className="flex justify-between">
                                                            <input
                                                                placeholder="Benefit Title"
                                                                value={b.title || ""}
                                                                onChange={(e) => updateListField('benefits', i, { ...b, title: e.target.value })}
                                                                className="flex-1 font-bold bg-transparent outline-none border-b border-gray-200 focus:border-[#06b6d4] text-gray-900 placeholder:text-gray-500"
                                                            />
                                                            <button type="button" onClick={() => removeListField('benefits', i)} className="text-red-400 hover:text-red-600">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                        <textarea
                                                            placeholder="Short benefit description..."
                                                            value={b.description || ""}
                                                            onChange={(e) => updateListField('benefits', i, { ...b, description: e.target.value })}
                                                            className="w-full text-sm bg-transparent outline-none border-b border-gray-200 focus:border-[#06b6d4] text-gray-900 placeholder:text-gray-500 resize-none"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-4">
                                                <label className="text-xs font-black text-gray-700 uppercase tracking-wider">Technical Specifications</label>
                                                <button type="button" onClick={() => addListField('specifications', { label: '', value: '' })} className="text-xs font-bold text-[#06b6d4] hover:underline flex items-center">
                                                    <Plus size={14} className="mr-1" /> Add Spec
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {formData.specifications?.map((s, i) => (
                                                    <div key={i} className="flex gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                        <div className="flex-1 space-y-2">
                                                            <input
                                                                placeholder="Label (e.g. Memory)"
                                                                value={s.label || ""}
                                                                onChange={(e) => updateListField('specifications', i, { ...s, label: e.target.value })}
                                                                className="w-full text-xs font-bold bg-transparent outline-none border-b border-gray-200 text-gray-900"
                                                            />
                                                            <input
                                                                placeholder="Value (e.g. 8GB)"
                                                                value={s.value || ""}
                                                                onChange={(e) => updateListField('specifications', i, { ...s, value: e.target.value })}
                                                                className="w-full text-sm bg-transparent outline-none text-[#06b6d4] font-medium"
                                                            />
                                                        </div>
                                                        <button type="button" onClick={() => removeListField('specifications', i)} className="text-red-400 hover:text-red-600 self-center">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'solutions' && (
                                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2">
                                        {/* Brands Section */}
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-sm font-black text-[#06124f] uppercase tracking-wider">Partner Brands</h4>
                                                <button type="button" onClick={() => addListField('brands', { name: '', logo: '' })} className="text-xs font-bold text-[#06b6d4] hover:underline flex items-center">
                                                    <Plus size={14} className="mr-1" /> Add Brand
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {formData.brands?.map((brand, i) => (
                                                    <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex gap-4">
                                                        <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center p-2 border border-gray-100 overflow-hidden">
                                                            {brand.logo ? <img src={brand.logo} alt="Logo" className="max-h-full max-w-full object-contain" /> : <ImageIcon className="text-gray-300" />}
                                                        </div>
                                                        <div className="flex-1 space-y-2">
                                                            <input
                                                                placeholder="Brand Name"
                                                                value={brand.name || ""}
                                                                onChange={(e) => updateListField('brands', i, { ...brand, name: e.target.value })}
                                                                className="w-full text-sm font-bold bg-transparent outline-none border-b border-gray-200 text-gray-900"
                                                            />
                                                            <input
                                                                placeholder="Logo URL"
                                                                value={brand.logo || ""}
                                                                onChange={(e) => updateListField('brands', i, { ...brand, logo: e.target.value })}
                                                                className="w-full text-xs bg-transparent outline-none text-gray-500"
                                                            />
                                                        </div>
                                                        <button type="button" onClick={() => removeListField('brands', i)} className="text-red-400 hover:text-red-600 self-center">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Products Section */}
                                        <div className="space-y-4 pt-6 border-t border-gray-100">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-sm font-black text-[#06124f] uppercase tracking-wider">Featured Products</h4>
                                                <button type="button" onClick={() => addListField('products', { name: '', description: '', image: '', category: '' })} className="text-xs font-bold text-[#06b6d4] hover:underline flex items-center">
                                                    <Plus size={14} className="mr-1" /> Add Product
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 gap-6">
                                                {formData.products?.map((product, i) => (
                                                    <div key={i} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col md:flex-row gap-6">
                                                        <div className="w-full md:w-32 h-32 bg-white rounded-xl flex items-center justify-center p-2 border border-gray-100 overflow-hidden shrink-0">
                                                            {product.image ? <img src={product.image} alt="Product" className="max-h-full max-w-full object-contain" /> : <ImageIcon className="text-gray-300" />}
                                                        </div>
                                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="space-y-3">
                                                                <input
                                                                    placeholder="Product Name"
                                                                    value={product.name || ""}
                                                                    onChange={(e) => updateListField('products', i, { ...product, name: e.target.value })}
                                                                    className="w-full font-bold bg-transparent outline-none border-b border-gray-200 text-gray-900"
                                                                />
                                                                <input
                                                                    placeholder="Category (e.g. Printers)"
                                                                    value={product.category || ""}
                                                                    onChange={(e) => updateListField('products', i, { ...product, category: e.target.value })}
                                                                    className="w-full text-sm bg-transparent outline-none border-b border-gray-200 text-[#06b6d4] font-medium"
                                                                />
                                                                <input
                                                                    placeholder="Image URL"
                                                                    value={product.image || ""}
                                                                    onChange={(e) => updateListField('products', i, { ...product, image: e.target.value })}
                                                                    className="w-full text-xs bg-transparent outline-none text-gray-500"
                                                                />
                                                            </div>
                                                            <textarea
                                                                placeholder="Product Description"
                                                                value={product.description || ""}
                                                                onChange={(e) => updateListField('products', i, { ...product, description: e.target.value })}
                                                                className="w-full h-full text-sm bg-transparent outline-none border border-gray-200 rounded-lg p-3 text-gray-600 resize-none"
                                                            />
                                                        </div>
                                                        <button type="button" onClick={() => removeListField('products', i)} className="text-red-400 hover:text-red-600 self-center">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Use Cases Section */}
                                        <div className="space-y-4 pt-6 border-t border-gray-100">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-sm font-black text-[#06124f] uppercase tracking-wider">Industry Use Cases</h4>
                                                <button type="button" onClick={() => addListField('useCases', { industry: '', scenario: '', solution: '' })} className="text-xs font-bold text-[#06b6d4] hover:underline flex items-center">
                                                    <Plus size={14} className="mr-1" /> Add Use Case
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {formData.useCases?.map((uc, i) => (
                                                    <div key={i} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                                                        <div className="flex justify-between items-start">
                                                            <input
                                                                placeholder="Industry (e.g. Retail)"
                                                                value={uc.industry || ""}
                                                                onChange={(e) => updateListField('useCases', i, { ...uc, industry: e.target.value })}
                                                                className="flex-1 font-bold bg-transparent outline-none border-b border-gray-200 text-[#06124f]"
                                                            />
                                                            <button type="button" onClick={() => removeListField('useCases', i)} className="text-red-400 hover:text-red-600 ml-2">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Challenge</label>
                                                            <textarea
                                                                placeholder="The scenario or problem..."
                                                                value={uc.scenario || ""}
                                                                onChange={(e) => updateListField('useCases', i, { ...uc, scenario: e.target.value })}
                                                                className="w-full text-sm bg-transparent outline-none border-b border-gray-200 text-gray-600 resize-none"
                                                                rows={2}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-[#06b6d4] uppercase tracking-widest">Our Solution</label>
                                                            <textarea
                                                                placeholder="How we solved it..."
                                                                value={uc.solution || ""}
                                                                onChange={(e) => updateListField('useCases', i, { ...uc, solution: e.target.value })}
                                                                className="w-full text-sm bg-transparent outline-none border-b border-gray-200 text-gray-600 resize-none"
                                                                rows={2}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'advanced' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                        <div>
                                            <div className="flex justify-between items-center mb-4">
                                                <label className="text-xs font-black text-gray-700 uppercase tracking-wider">Delivery Process</label>
                                                <button type="button" onClick={() => addListField('process', { step: (formData.process?.length || 0) + 1, title: '', description: '' })} className="text-xs font-bold text-[#06b6d4] hover:underline flex items-center">
                                                    <Plus size={14} className="mr-1" /> Add Step
                                                </button>
                                            </div>
                                            <div className="space-y-3">
                                                {formData.process?.map((p, i) => (
                                                    <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                                                        <div className="w-10 h-10 bg-[#06124f] text-white rounded-lg flex items-center justify-center font-black flex-shrink-0">
                                                            {p.step}
                                                        </div>
                                                        <div className="flex-1 space-y-2">
                                                            <input
                                                                placeholder="Step Title"
                                                                value={p.title || ""}
                                                                onChange={(e) => updateListField('process', i, { ...p, title: e.target.value })}
                                                                className="w-full font-bold bg-transparent outline-none border-b border-transparent focus:border-cyan-200 text-gray-900 placeholder:text-gray-500"
                                                            />
                                                            <input
                                                                placeholder="Description"
                                                                value={p.description || ""}
                                                                onChange={(e) => updateListField('process', i, { ...p, description: e.target.value })}
                                                                className="w-full text-sm bg-transparent outline-none border-b border-transparent focus:border-cyan-200 text-gray-900 placeholder:text-gray-500"
                                                            />
                                                        </div>
                                                        <button type="button" onClick={() => removeListField('process', i)} className="text-red-400 hover:text-red-600 self-center">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-4">
                                                <label className="text-xs font-black text-gray-700 uppercase tracking-wider">FAQs</label>
                                                <button type="button" onClick={() => addListField('faqs', { question: '', answer: '' })} className="text-xs font-bold text-[#06b6d4] hover:underline flex items-center">
                                                    <Plus size={14} className="mr-1" /> Add FAQ
                                                </button>
                                            </div>
                                            <div className="space-y-4">
                                                {formData.faqs?.map((f, i) => (
                                                    <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                                                        <div className="flex justify-between">
                                                            <input
                                                                placeholder="Question"
                                                                value={f.question || ""}
                                                                onChange={(e) => updateListField('faqs', i, { ...f, question: e.target.value })}
                                                                className="flex-1 font-bold bg-transparent outline-none border-b border-gray-200 focus:border-[#06b6d4] text-gray-900 placeholder:text-gray-500"
                                                            />
                                                            <button type="button" onClick={() => removeListField('faqs', i)} className="text-red-400 hover:text-red-600">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                        <textarea
                                                            placeholder="Answer..."
                                                            value={f.answer || ""}
                                                            onChange={(e) => updateListField('faqs', i, { ...f, answer: e.target.value })}
                                                            className="w-full text-sm bg-transparent outline-none border-b border-gray-200 focus:border-[#06b6d4] text-gray-900 placeholder:text-gray-500 min-h-[60px]"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex space-x-3 justify-end">
                            <button
                                type="button"
                                onClick={() => setShowFormModal(false)}
                                className="px-6 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-white transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                form="serviceForm"
                                type="submit"
                                className="px-8 py-3 bg-gradient-to-r from-[#06b6d4] to-[#06124f] text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all flex items-center"
                            >
                                <Save size={18} className="mr-2" />
                                {isEditing ? "Update Service" : "Create Service"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                                <Trash2 size={40} className="text-red-600" />
                            </div>
                            <h3 className="text-2xl font-black text-[#06124f] mb-2">Delete Service?</h3>
                            <p className="text-gray-500 mb-8 leading-relaxed">
                                You are about to remove this service from your public site. This action is irreversible.
                            </p>
                            <div className="flex space-x-3">
                                <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-3 border-2 border-gray-100 text-gray-400 font-bold rounded-xl hover:bg-gray-50">
                                    No, Keep it
                                </button>
                                <button onClick={confirmDelete} className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200">
                                    Yes, Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
