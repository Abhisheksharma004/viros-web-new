"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Pencil, Trash2, X, Loader2, ToggleLeft, ToggleRight, Sparkles } from "lucide-react";

interface WhatsNewItem {
    id?: number;
    tag: string;
    tag_color: string;
    title: string;
    description: string;
    link: string;
    link_text: string;
    is_new: boolean | number;
    is_active: boolean | number;
    display_order: number;
}

const SITE_SLUGS = [
    { label: "Home", value: "/" },
    { label: "About", value: "/about" },
    { label: "Products", value: "/products" },
    { label: "Services", value: "/services" },
    { label: "Contact", value: "/contact" },
    { label: "Certificates", value: "/certificates" },
    { label: "Warranty", value: "/warranty" },
    { label: "Privacy Policy", value: "/privacy-policy" },
    { label: "Terms of Service", value: "/terms-of-service" },
];

const TAG_COLOR_PRESETS = [
    { label: "Navy Blue", value: "#0a2a5e" },
    { label: "Red", value: "#e63946" },
    { label: "Teal", value: "#2a9d8f" },
    { label: "Orange", value: "#f4a261" },
    { label: "Purple", value: "#7b2d8b" },
    { label: "Green", value: "#2d8b45" },
];

const emptyForm: WhatsNewItem = {
    tag: "",
    tag_color: "#0a2a5e",
    title: "",
    description: "",
    link: "/contact",
    link_text: "Learn More",
    is_new: true,
    is_active: true,
    display_order: 0,
};

export default function WhatsNewDashboardPage() {
    const [items, setItems] = useState<WhatsNewItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<WhatsNewItem | null>(null);
    const [formData, setFormData] = useState<WhatsNewItem>(emptyForm);
    const [isSaving, setIsSaving] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showSlugDropdown, setShowSlugDropdown] = useState(false);
    const slugRef = useRef<HTMLDivElement>(null);

    // Close slug dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (slugRef.current && !slugRef.current.contains(e.target as Node)) {
                setShowSlugDropdown(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/whats-new");
            const data = await res.json();
            setItems(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching items:", error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (item?: WhatsNewItem) => {
        if (item) {
            setEditingItem(item);
            setFormData({ ...item });
        } else {
            setEditingItem(null);
            setFormData({ ...emptyForm, display_order: items.length + 1 });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const url = editingItem ? `/api/whats-new/${editingItem.id}` : "/api/whats-new";
            const method = editingItem ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                await fetchItems();
                closeModal();
            }
        } catch (error) {
            console.error("Error saving item:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const confirmDelete = (id: number) => {
        setDeleteId(id);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/whats-new/${deleteId}`, { method: "DELETE" });
            if (res.ok) {
                await fetchItems();
                setShowDeleteModal(false);
                setDeleteId(null);
            }
        } catch (error) {
            console.error("Error deleting item:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const toggleActive = async (item: WhatsNewItem) => {
        try {
            await fetch(`/api/whats-new/${item.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_active: item.is_active ? 0 : 1 }),
            });
            await fetchItems();
        } catch (error) {
            console.error("Error toggling item:", error);
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 rounded-xl" style={{ background: "rgba(0,188,212,0.12)" }}>
                            <Sparkles className="w-6 h-6" style={{ color: "#00bcd4" }} />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800">What&apos;s New</h1>
                    </div>
                    <p className="text-gray-500 text-sm ml-14">Manage the &quot;What&apos;s New&quot; side panel items shown on the homepage</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 hover:scale-105"
                    style={{ background: "linear-gradient(135deg, #0a2a5e, #1a4a8a)" }}
                >
                    <Plus className="w-4 h-4" />
                    Add New Item
                </button>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                    { label: "Total Items", value: items.length, color: "#0a2a5e" },
                    { label: "Active", value: items.filter((i) => i.is_active).length, color: "#2a9d8f" },
                    { label: "Marked New", value: items.filter((i) => i.is_new).length, color: "#e63946" },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg" style={{ background: stat.color }}>
                            {stat.value}
                        </div>
                        <span className="text-gray-600 text-sm font-medium">{stat.label}</span>
                    </div>
                ))}
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No items yet. Add your first announcement!</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tag</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Link</th>
                                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">New Badge</th>
                                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {items.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-5 py-4">
                                        <span
                                            className="inline-block px-2.5 py-1 rounded-full text-xs font-black tracking-wider text-white uppercase"
                                            style={{ background: item.tag_color }}
                                        >
                                            {item.tag}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="font-medium text-gray-800 leading-snug line-clamp-2 max-w-xs">{item.title}</p>
                                        <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{item.description}</p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="text-blue-600 text-xs font-medium">{item.link}</span>
                                        <p className="text-gray-400 text-xs">{item.link_text}</p>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        {item.is_new ? (
                                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-black" style={{ background: "#f0c040", color: "#0a2a5e" }}>NEW</span>
                                        ) : (
                                            <span className="text-gray-300 text-xs">—</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <button
                                            onClick={() => toggleActive(item)}
                                            className="flex items-center gap-1 mx-auto text-xs font-medium transition-colors"
                                            style={{ color: item.is_active ? "#2a9d8f" : "#9ca3af" }}
                                        >
                                            {item.is_active
                                                ? <><ToggleRight className="w-5 h-5" /> Active</>
                                                : <><ToggleLeft className="w-5 h-5" /> Inactive</>
                                            }
                                        </button>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => openModal(item)}
                                                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => confirmDelete(item.id!)}
                                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100" style={{ background: "linear-gradient(135deg, #0a2a5e, #1a4a8a)" }}>
                            <h2 className="text-white font-bold text-base">
                                {editingItem ? "Edit Item" : "Add New Item"}
                            </h2>
                            <button onClick={closeModal} className="text-white/70 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
                            {/* Tag + Color */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tag Label *</label>
                                    <input
                                        name="tag"
                                        value={formData.tag}
                                        onChange={handleChange}
                                        placeholder="e.g. PRODUCT LAUNCH"
                                        required
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-400 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tag Color</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {TAG_COLOR_PRESETS.map((c) => (
                                            <button
                                                key={c.value}
                                                type="button"
                                                title={c.label}
                                                onClick={() => setFormData((prev) => ({ ...prev, tag_color: c.value }))}
                                                className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                                                style={{
                                                    background: c.value,
                                                    borderColor: formData.tag_color === c.value ? "#000" : "transparent",
                                                }}
                                            />
                                        ))}
                                        <input
                                            type="color"
                                            name="tag_color"
                                            value={formData.tag_color}
                                            onChange={handleChange}
                                            className="w-6 h-6 rounded cursor-pointer border border-gray-200"
                                            title="Custom color"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Title *</label>
                                <input
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="Announcement title"
                                    required
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-400 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description *</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Short description"
                                    required
                                    rows={3}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-400 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 resize-none"
                                />
                            </div>

                            {/* Link + Link Text */}
                            <div className="grid grid-cols-2 gap-4">
                                <div ref={slugRef} className="relative">
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Link URL</label>
                                    <input
                                        name="link"
                                        value={formData.link}
                                        onChange={(e) => {
                                            handleChange(e);
                                            setShowSlugDropdown(true);
                                        }}
                                        onFocus={() => setShowSlugDropdown(true)}
                                        placeholder="/contact"
                                        autoComplete="off"
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-400 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                                    />
                                    {showSlugDropdown && (
                                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
                                            {SITE_SLUGS.filter(
                                                (s) => !formData.link || s.value.includes(formData.link) || s.label.toLowerCase().includes(formData.link.toLowerCase())
                                            ).map((slug) => (
                                                <button
                                                    key={slug.value}
                                                    type="button"
                                                    onMouseDown={() => {
                                                        setFormData((prev) => ({ ...prev, link: slug.value }));
                                                        setShowSlugDropdown(false);
                                                    }}
                                                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center justify-between group"
                                                >
                                                    <span className="font-medium text-gray-700 group-hover:text-blue-700">{slug.label}</span>
                                                    <span className="text-xs text-gray-400 group-hover:text-blue-500 font-mono">{slug.value}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Button Text</label>
                                    <input
                                        name="link_text"
                                        value={formData.link_text}
                                        onChange={handleChange}
                                        placeholder="Learn More"
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-400 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                                    />
                                </div>
                            </div>

                            {/* Display Order */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Display Order</label>
                                <input
                                    type="number"
                                    name="display_order"
                                    value={formData.display_order}
                                    onChange={handleChange}
                                    min={0}
                                    className="w-28 px-3 py-2 bg-gray-50 border border-gray-400 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                                />
                            </div>

                            {/* Toggles */}
                            <div className="flex gap-6">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        name="is_new"
                                        checked={!!formData.is_new}
                                        onChange={handleChange}
                                        className="w-4 h-4 accent-yellow-400"
                                    />
                                    <span className="text-sm text-gray-700">Show <span className="font-bold text-yellow-600">NEW</span> badge</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={!!formData.is_active}
                                        onChange={handleChange}
                                        className="w-4 h-4 accent-teal-500"
                                    />
                                    <span className="text-sm text-gray-700">Active (visible on site)</span>
                                </label>
                            </div>

                            {/* Preview */}
                            <div className="rounded-xl overflow-hidden border border-gray-200 mt-1">
                                <div className="flex items-center justify-between px-4 py-2" style={{ background: formData.tag_color }}>
                                    <span className="text-white text-xs font-black tracking-widest uppercase">{formData.tag || "TAG"}</span>
                                    {formData.is_new && (
                                        <span className="text-xs font-black rounded-full px-2 py-0.5" style={{ background: "#f0c040", color: "#0a2a5e" }}>NEW</span>
                                    )}
                                </div>
                                <div className="p-3 bg-white">
                                    <p className="font-semibold text-gray-800 text-xs leading-snug">{formData.title || "Item title"}</p>
                                    <p className="text-gray-400 text-xs mt-1">{formData.description || "Description preview"}</p>
                                    <span className="inline-block mt-2 text-xs font-bold px-3 py-1 rounded-full text-white" style={{ background: formData.tag_color }}>
                                        {formData.link_text || "Learn More"} →
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-5 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-5 py-2 rounded-xl text-white font-semibold text-sm flex items-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
                                    style={{ background: "linear-gradient(135deg, #0a2a5e, #1a4a8a)" }}
                                >
                                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingItem ? "Save Changes" : "Add Item"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-6 h-6 text-red-500" />
                        </div>
                        <h3 className="text-gray-800 font-bold text-base mb-1">Delete this item?</h3>
                        <p className="text-gray-500 text-sm mb-6">This action cannot be undone.</p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-5 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="px-5 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold flex items-center gap-2 hover:bg-red-600 disabled:opacity-60"
                            >
                                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
