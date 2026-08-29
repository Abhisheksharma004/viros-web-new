"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
    ShoppingBag, Package, Search, Filter, RefreshCw,
    Download, Eye, Trash2, CheckCircle2, Clock, Truck,
    AlertCircle, Phone, Mail, MapPin, Building,
    Calendar, ArrowUpDown, ChevronRight, X, Printer,
    MessageSquare, ExternalLink, ShieldCheck, Check,
    CreditCard, Tag, DollarSign, Wallet, Send, Link as LinkIcon,
    Copy, Edit3
} from "lucide-react";
import Toast from "@/components/Toast";
import Link from "next/link";

interface ProductOrder {
    id: number;
    order_ref: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    company_name?: string;
    gstin?: string;
    product_name: string;
    category?: string;
    quantity: number;
    unit_price?: string;
    total_amount: number;
    payment_method: string;
    delivery_address: string;
    city: string;
    pincode: string;
    state?: string;
    order_notes?: string;
    tracking_number?: string;
    tracking_link?: string;
    courier_name?: string;
    otp_verified: boolean;
    order_status: "confirmed" | "processing" | "dispatched" | "out_for_delivery" | "delivered" | "cancelled" | string;
    payment_status: "paid" | "cod_pending" | "unpaid" | "refunded" | string;
    created_at: string;
    updated_at: string;
}

const STATUS_OPTIONS = [
    { value: "all", label: "All Statuses" },
    { value: "confirmed", label: "Confirmed", color: "bg-blue-100 text-blue-800 border-blue-200" },
    { value: "processing", label: "Processing / Packing", color: "bg-purple-100 text-purple-800 border-purple-200" },
    { value: "dispatched", label: "Dispatched", color: "bg-amber-100 text-amber-800 border-amber-200" },
    { value: "out_for_delivery", label: "Out for Delivery", color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
    { value: "delivered", label: "Delivered", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    { value: "cancelled", label: "Cancelled", color: "bg-rose-100 text-rose-800 border-rose-200" },
];

const PAYMENT_STATUS_OPTIONS = [
    { value: "all", label: "All Payments" },
    { value: "paid", label: "Paid" },
    { value: "cod_pending", label: "COD Pending" },
    { value: "unpaid", label: "Unpaid" },
    { value: "refunded", label: "Refunded" },
];

const COURIER_PRESETS = [
    { name: "Blue Dart", url: (awb: string) => `https://www.bluedart.com/tracking?trackNumber=${awb}` },
    { name: "Delhivery", url: (awb: string) => `https://www.delhivery.com/track/package/${awb}` },
    { name: "DTDC", url: (awb: string) => `https://www.dtdc.in/tracking/shipment-tracking.asp?strCnno=${awb}` },
    { name: "FedEx", url: (awb: string) => `https://www.fedex.com/fedextrack/?trknbr=${awb}` },
    { name: "Trackon", url: (awb: string) => `https://trackon.in/Tracking/MultiTracking?pin=${awb}` },
    { name: "DHL Express", url: (awb: string) => `https://www.dhl.com/in-en/home/tracking/tracking-express.html?submit=1&tracking-id=${awb}` },
    { name: "India Post Speed Post", url: () => `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx` },
    { name: "Shadowfax", url: (awb: string) => `https://tracker.shadowfax.in/#/track?awb=${awb}` },
    { name: "Xpressbees", url: (awb: string) => `https://www.xpressbees.com/shipment/tracking?awbNo=${awb}` },
    { name: "Ekart Logistics", url: (awb: string) => `https://ekartlogistics.com/shipmenttrack/${awb}` },
    { name: "Other / Hand Delivery", url: () => "" },
];

export default function AdminOrdersManagementPage() {
    const [orders, setOrders] = useState<ProductOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [paymentFilter, setPaymentFilter] = useState("all");

    // Modal & Actions
    const [selectedOrder, setSelectedOrder] = useState<ProductOrder | null>(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [copiedRef, setCopiedRef] = useState<string | null>(null);

    // 🚚 Dispatched Tracking Popup Modal State
    const [dispatchModalOrder, setDispatchModalOrder] = useState<ProductOrder | null>(null);
    const [dispatchForm, setDispatchForm] = useState({
        courier_name: "Blue Dart",
        tracking_number: "",
        tracking_link: "",
        order_notes: "",
        notify_customer: true
    });
    const [isSavingDispatch, setIsSavingDispatch] = useState(false);

    const showToast = (message: string, type: "success" | "error" = "success") => {
        setToast({ message, type });
    };

    // Fetch all orders
    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/orders?limit=200", { cache: "no-store" });
            const data = await res.json();
            if (res.ok && data.success) {
                setOrders(data.orders || []);
            } else {
                showToast("Failed to fetch orders", "error");
            }
        } catch (err) {
            console.error("Orders fetch error:", err);
            showToast("Network error while loading orders", "error");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // When status changes in dropdown:
    const handleStatusChange = (order: ProductOrder, newStatus: string) => {
        if (newStatus === "dispatched") {
            // Trigger Dispatched Tracking Popup Modal
            setDispatchModalOrder(order);
            const defaultCourier = order.courier_name || "Blue Dart";
            const currentAwb = order.tracking_number || "";
            const preset = COURIER_PRESETS.find(p => p.name === defaultCourier);
            const defaultLink = order.tracking_link || (preset && currentAwb ? preset.url(currentAwb) : "");

            setDispatchForm({
                courier_name: defaultCourier,
                tracking_number: currentAwb,
                tracking_link: defaultLink,
                order_notes: order.order_notes || "",
                notify_customer: true
            });
            return;
        }

        handleUpdateOrder(order.id, newStatus);
    };

    // Helper to auto-update tracking URL when courier or AWB changes
    const handleCourierOrAwbChange = (courierName: string, awb: string) => {
        const cleanAwb = awb.trim();
        const preset = COURIER_PRESETS.find(p => p.name.toLowerCase() === courierName.toLowerCase().trim());
        const generatedLink = preset && cleanAwb ? preset.url(cleanAwb) : dispatchForm.tracking_link;

        setDispatchForm(prev => ({
            ...prev,
            courier_name: courierName,
            tracking_number: awb,
            tracking_link: generatedLink
        }));
    };

    // Save Dispatched Details & Update Status
    const handleSaveDispatchDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!dispatchModalOrder) return;

        setIsSavingDispatch(true);
        try {
            const res = await fetch(`/api/orders/${dispatchModalOrder.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    order_status: "dispatched",
                    courier_name: dispatchForm.courier_name,
                    tracking_number: dispatchForm.tracking_number.trim(),
                    tracking_link: dispatchForm.tracking_link.trim(),
                    order_notes: dispatchForm.order_notes.trim(),
                    notify_customer: dispatchForm.notify_customer
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showToast(`Order #${dispatchModalOrder.order_ref} marked as Dispatched with tracking!`);
                setOrders((prev) =>
                    prev.map((o) =>
                        o.id === dispatchModalOrder.id
                            ? {
                                ...o,
                                order_status: "dispatched",
                                courier_name: dispatchForm.courier_name,
                                tracking_number: dispatchForm.tracking_number.trim(),
                                tracking_link: dispatchForm.tracking_link.trim(),
                                order_notes: dispatchForm.order_notes.trim()
                            }
                            : o
                    )
                );
                if (selectedOrder && selectedOrder.id === dispatchModalOrder.id) {
                    setSelectedOrder((prev) =>
                        prev
                            ? {
                                ...prev,
                                order_status: "dispatched",
                                courier_name: dispatchForm.courier_name,
                                tracking_number: dispatchForm.tracking_number.trim(),
                                tracking_link: dispatchForm.tracking_link.trim(),
                                order_notes: dispatchForm.order_notes.trim()
                            }
                            : null
                    );
                }
                setDispatchModalOrder(null);
            } else {
                showToast(data.error || "Failed to update dispatch details", "error");
            }
        } catch (err) {
            showToast("Error updating dispatch details", "error");
        } finally {
            setIsSavingDispatch(false);
        }
    };

    // Update order status or payment status
    const handleUpdateOrder = async (orderId: number, newOrderStatus?: string, newPaymentStatus?: string) => {
        setIsUpdatingStatus(true);
        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    order_status: newOrderStatus,
                    payment_status: newPaymentStatus
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showToast("Order updated successfully!");
                setOrders((prev) =>
                    prev.map((o) => {
                        if (o.id === orderId) {
                            return {
                                ...o,
                                ...(newOrderStatus ? { order_status: newOrderStatus as any } : {}),
                                ...(newPaymentStatus ? { payment_status: newPaymentStatus as any } : {})
                            };
                        }
                        return o;
                    })
                );
                if (selectedOrder && selectedOrder.id === orderId) {
                    setSelectedOrder((prev) =>
                        prev
                            ? {
                                ...prev,
                                ...(newOrderStatus ? { order_status: newOrderStatus as any } : {}),
                                ...(newPaymentStatus ? { payment_status: newPaymentStatus as any } : {})
                            }
                            : null
                    );
                }
            } else {
                showToast(data.error || "Failed to update order", "error");
            }
        } catch (err) {
            showToast("Error updating order", "error");
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    // Delete order
    const handleDeleteOrder = async (orderId: number, ref: string) => {
        if (!confirm(`Are you sure you want to delete Order #${ref}?`)) return;

        try {
            const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
            const data = await res.json();
            if (res.ok && data.success) {
                showToast(`Order #${ref} deleted successfully`);
                setOrders((prev) => prev.filter((o) => o.id !== orderId));
                if (selectedOrder?.id === orderId) setSelectedOrder(null);
            } else {
                showToast(data.error || "Failed to delete order", "error");
            }
        } catch (err) {
            showToast("Error deleting order", "error");
        }
    };

    // Copy Order Reference ID
    const handleCopyRef = (ref: string) => {
        navigator.clipboard.writeText(ref);
        setCopiedRef(ref);
        setTimeout(() => setCopiedRef(null), 2000);
        showToast(`Copied Order Ref: ${ref}`);
    };

    // Export Orders to CSV
    const exportToCSV = () => {
        if (orders.length === 0) return;
        const headers = ["Order Ref", "Customer Name", "Email", "Phone", "Product", "Quantity", "Total Amount", "Payment Method", "Payment Status", "Order Status", "Courier", "Tracking Number", "City", "Pincode", "Date"];
        const rows = filteredOrders.map(o => [
            o.order_ref,
            `"${o.customer_name}"`,
            o.customer_email,
            o.customer_phone,
            `"${o.product_name}"`,
            o.quantity,
            o.total_amount,
            o.payment_method,
            o.payment_status,
            o.order_status,
            `"${o.courier_name || ""}"`,
            `"${o.tracking_number || ""}"`,
            `"${o.city}"`,
            o.pincode,
            new Date(o.created_at).toISOString().split("T")[0]
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `viros_orders_export_${new Date().toISOString().split("T")[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Filtered orders
    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            const matchesSearch =
                searchQuery === "" ||
                order.order_ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.customer_phone.includes(searchQuery) ||
                order.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (order.tracking_number && order.tracking_number.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesStatus = statusFilter === "all" || order.order_status === statusFilter;
            const matchesPayment = paymentFilter === "all" || order.payment_status === paymentFilter;

            return matchesSearch && matchesStatus && matchesPayment;
        });
    }, [orders, searchQuery, statusFilter, paymentFilter]);

    // Metrics
    const metrics = useMemo(() => {
        const total = orders.length;
        const confirmed = orders.filter((o) => o.order_status === "confirmed").length;
        const processing = orders.filter((o) => o.order_status === "processing").length;
        const dispatched = orders.filter((o) => o.order_status === "dispatched").length;
        const delivered = orders.filter((o) => o.order_status === "delivered").length;
        const totalRevenue = orders
            .filter((o) => o.order_status !== "cancelled")
            .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

        return { total, confirmed, processing, dispatched, delivered, totalRevenue };
    }, [orders]);

    const getOrderStatusBadge = (status: string) => {
        const option = STATUS_OPTIONS.find((s) => s.value === status) || {
            label: status,
            color: "bg-gray-100 text-gray-800 border-gray-200"
        };
        return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${option.color}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                {option.label}
            </span>
        );
    };

    const getPaymentStatusBadge = (status: string) => {
        switch (status) {
            case "paid":
                return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Paid</span>;
            case "cod_pending":
                return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">COD Pending</span>;
            case "unpaid":
                return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Unpaid</span>;
            case "refunded":
                return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">Refunded</span>;
            default:
                return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-gray-100 text-gray-700">{status}</span>;
        }
    };

    return (
        <div className="space-y-6 font-sans text-gray-800 pb-12">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Top Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-[#2874f0]/10 text-[#2874f0] rounded-lg">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                                Product Orders & Hardware Bookings
                            </h1>
                            <p className="text-xs text-gray-500">
                                Manage Buy Now express orders, courier dispatch tracking numbers & invoices
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchOrders}
                        disabled={isLoading}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-lg border border-gray-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh
                    </button>
                    <button
                        onClick={exportToCSV}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                        <Download className="w-3.5 h-3.5" /> Export CSV
                    </button>
                </div>
            </div>

            {/* 1. METRICS OVERVIEW CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Total Bookings</span>
                    <span className="text-2xl font-black text-gray-900 mt-1 block">{metrics.total}</span>
                    <span className="text-[10px] text-gray-400 mt-0.5 block">All time orders</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">Confirmed (New)</span>
                    <span className="text-2xl font-black text-blue-600 mt-1 block">{metrics.confirmed}</span>
                    <span className="text-[10px] text-gray-400 mt-0.5 block">OTP Verified</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                    <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider block">Packing</span>
                    <span className="text-2xl font-black text-purple-600 mt-1 block">{metrics.processing}</span>
                    <span className="text-[10px] text-gray-400 mt-0.5 block">Quality inspection</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                    <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">Dispatched</span>
                    <span className="text-2xl font-black text-amber-600 mt-1 block">{metrics.dispatched}</span>
                    <span className="text-[10px] text-gray-400 mt-0.5 block">With courier</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                    <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Delivered</span>
                    <span className="text-2xl font-black text-emerald-600 mt-1 block">{metrics.delivered}</span>
                    <span className="text-[10px] text-gray-400 mt-0.5 block">Complete</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Gross Value</span>
                    <span className="text-xl font-black text-emerald-600 mt-1 block truncate">
                        ₹{metrics.totalRevenue.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-0.5 block">Active orders</span>
                </div>
            </div>

            {/* 2. SEARCH & FILTER TOOLBAR */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search by Order Ref (e.g. VRS-912824), Customer, Email, Phone, Product, or Tracking AWB..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs focus:border-[#2874f0] focus:ring-1 focus:ring-[#2874f0] outline-none"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                        >
                            ✕
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200">
                        <Filter className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-xs font-bold text-gray-600">Status:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent text-xs font-semibold text-gray-800 outline-none cursor-pointer"
                        >
                            {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200">
                        <CreditCard className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-xs font-bold text-gray-600">Payment:</span>
                        <select
                            value={paymentFilter}
                            onChange={(e) => setPaymentFilter(e.target.value)}
                            className="bg-transparent text-xs font-semibold text-gray-800 outline-none cursor-pointer"
                        >
                            {PAYMENT_STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* 3. ORDERS TABLE */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center space-y-3">
                        <RefreshCw className="w-8 h-8 text-[#2874f0] animate-spin mx-auto" />
                        <p className="text-xs font-bold text-gray-600">Loading customer orders...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="p-16 text-center space-y-2">
                        <Package className="w-12 h-12 text-gray-300 mx-auto" />
                        <h3 className="text-sm font-bold text-gray-800">No Orders Found</h3>
                        <p className="text-xs text-gray-500">No customer bookings match your current search or status filter.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[11px]">
                                    <th className="py-3.5 px-4">Order Ref</th>
                                    <th className="py-3.5 px-4">Customer Details</th>
                                    <th className="py-3.5 px-4">Product & Qty</th>
                                    <th className="py-3.5 px-4">Amount</th>
                                    <th className="py-3.5 px-4">Payment Status</th>
                                    <th className="py-3.5 px-4">Order Progress & Dispatch</th>
                                    <th className="py-3.5 px-4">Date</th>
                                    <th className="py-3.5 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50/70 transition-colors group">
                                        {/* Order Ref */}
                                        <td className="py-3.5 px-4 align-top font-mono font-bold">
                                            <button
                                                onClick={() => handleCopyRef(order.order_ref)}
                                                className="text-[#2874f0] hover:underline flex items-center gap-1 cursor-pointer"
                                                title="Click to copy Reference ID"
                                            >
                                                #{order.order_ref}
                                                {copiedRef === order.order_ref && <Check className="w-3 h-3 text-emerald-600" />}
                                            </button>
                                            <span className="text-[10px] text-gray-400 block font-sans">
                                                ✓ 7-Digit OTP
                                            </span>
                                        </td>

                                        {/* Customer Details */}
                                        <td className="py-3.5 px-4 align-top space-y-0.5">
                                            <strong className="text-gray-900 block text-xs">{order.customer_name}</strong>
                                            <div className="text-[11px] text-gray-500 flex items-center gap-1">
                                                <Phone className="w-3 h-3 text-gray-400" /> {order.customer_phone}
                                            </div>
                                            <div className="text-[11px] text-gray-500 truncate max-w-[180px]">
                                                {order.customer_email}
                                            </div>
                                            <div className="text-[10px] text-gray-400 flex items-center gap-1">
                                                <MapPin className="w-3 h-3 text-gray-300" /> {order.city} ({order.pincode})
                                            </div>
                                        </td>

                                        {/* Product & Qty */}
                                        <td className="py-3.5 px-4 align-top space-y-0.5 max-w-[200px]">
                                            <strong className="text-gray-800 block text-xs line-clamp-1">{order.product_name}</strong>
                                            <span className="text-[11px] text-gray-500 block">
                                                Qty: <strong className="text-gray-800">{order.quantity}</strong> • {order.category || "Hardware"}
                                            </span>
                                        </td>

                                        {/* Amount & Method */}
                                        <td className="py-3.5 px-4 align-top space-y-0.5">
                                            <span className="text-sm font-black text-gray-900 block">
                                                ₹{Number(order.total_amount || 0).toLocaleString("en-IN")}
                                            </span>
                                            <span className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-bold uppercase">
                                                {order.payment_method}
                                            </span>
                                        </td>

                                        {/* DEDICATED PAYMENT STATUS COLUMN */}
                                        <td className="py-3.5 px-4 align-top space-y-1">
                                            <div>{getPaymentStatusBadge(order.payment_status)}</div>
                                            <select
                                                value={order.payment_status}
                                                onChange={(e) => handleUpdateOrder(order.id, undefined, e.target.value)}
                                                className="mt-1 text-[11px] bg-white border border-gray-300 rounded px-1.5 py-0.5 text-gray-700 outline-none cursor-pointer"
                                            >
                                                <option value="paid">Paid</option>
                                                <option value="cod_pending">COD Pending</option>
                                                <option value="unpaid">Unpaid</option>
                                                <option value="refunded">Refunded</option>
                                            </select>
                                        </td>

                                        {/* Order Progress Status with Dispatched Modal Trigger */}
                                        <td className="py-3.5 px-4 align-top space-y-1">
                                            <div className="flex items-center gap-1.5">
                                                {getOrderStatusBadge(order.order_status)}
                                                {order.order_status === "dispatched" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleStatusChange(order, "dispatched")}
                                                        title="Edit Tracking Details"
                                                        className="text-gray-400 hover:text-[#2874f0] p-0.5 cursor-pointer"
                                                    >
                                                        <Edit3 className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>

                                            <select
                                                value={order.order_status}
                                                onChange={(e) => handleStatusChange(order, e.target.value)}
                                                className="mt-1 text-[11px] bg-white border border-gray-300 rounded px-1.5 py-0.5 text-gray-700 outline-none cursor-pointer"
                                            >
                                                <option value="confirmed">Confirmed</option>
                                                <option value="processing">Processing/Packing</option>
                                                <option value="dispatched">Dispatched</option>
                                                <option value="out_for_delivery">Out for Delivery</option>
                                                <option value="delivered">Delivered</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>

                                            {/* Tracking Number Snippet if present */}
                                            {order.tracking_number && (
                                                <div className="pt-1">
                                                    <a
                                                        href={order.tracking_link || `/track-order?orderRef=${order.order_ref}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded transition-colors"
                                                        title="Open tracking page"
                                                    >
                                                        <Truck className="w-2.5 h-2.5 text-emerald-600" />
                                                        {order.courier_name ? `${order.courier_name}: ` : ""}{order.tracking_number}
                                                    </a>
                                                </div>
                                            )}
                                        </td>

                                        {/* Date */}
                                        <td className="py-3.5 px-4 align-top text-[11px] text-gray-500 whitespace-nowrap">
                                            {new Date(order.created_at).toLocaleDateString("en-IN", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric"
                                            })}
                                            <span className="block text-[10px] text-gray-400">
                                                {new Date(order.created_at).toLocaleTimeString("en-IN", {
                                                    hour: "2-digit",
                                                    minute: "2-digit"
                                                })}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="py-3.5 px-4 align-top text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="p-1.5 text-gray-500 hover:text-[#2874f0] hover:bg-blue-50 rounded transition-colors cursor-pointer"
                                                    title="View Full Order Slip"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>

                                                <a
                                                    href={`https://wa.me/91${order.customer_phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello ${order.customer_name}, regards from Viros Hardware regarding Order #${order.order_ref} (${order.product_name}). ${order.tracking_number ? `Your tracking number is ${order.tracking_number} (${order.courier_name || "Courier"}).` : ""}`)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                                    title="WhatsApp Customer"
                                                >
                                                    <MessageSquare className="w-4 h-4" />
                                                </a>

                                                <button
                                                    onClick={() => handleDeleteOrder(order.id, order.order_ref)}
                                                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                                    title="Delete Order"
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
            </div>

            {/* ========================================================================= */}
            {/* 🚚 POPUP MODAL: DISPATCH ORDER & CONSIGNMENT TRACKING DETAILS              */}
            {/* ========================================================================= */}
            {dispatchModalOrder && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto font-sans">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-150 flex flex-col">
                        {/* Modal Header */}
                        <div className="p-4 bg-gradient-to-r from-[#06124f] to-[#2874f0] text-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-amber-400 text-gray-900 rounded-md">
                                    <Truck className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="font-bold text-sm uppercase tracking-wide block">
                                        Dispatch Order • #{dispatchModalOrder.order_ref}
                                    </span>
                                    <span className="text-[11px] text-blue-100">
                                        Enter courier partner & consignment tracking link
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setDispatchModalOrder(null)}
                                className="p-1 text-white/80 hover:text-white rounded cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleSaveDispatchDetails} className="p-5 space-y-4 text-xs">
                            {/* Order Quick Summary Card */}
                            <div className="bg-blue-50/60 p-3 rounded-lg border border-blue-200 flex items-start justify-between gap-3">
                                <div>
                                    <strong className="text-gray-900 block text-xs">{dispatchModalOrder.customer_name}</strong>
                                    <span className="text-[11px] text-gray-600 block">
                                        Product: <strong>{dispatchModalOrder.product_name}</strong> (Qty: {dispatchModalOrder.quantity})
                                    </span>
                                    <span className="text-[11px] text-gray-500 block">
                                        Location: {dispatchModalOrder.city} ({dispatchModalOrder.pincode})
                                    </span>
                                </div>
                                <span className="text-xs font-mono font-bold text-[#2874f0] bg-white px-2 py-0.5 rounded border border-blue-200">
                                    #{dispatchModalOrder.order_ref}
                                </span>
                            </div>

                            {/* 1. Courier Partner Input Field with Autocomplete Suggestions */}
                            <div className="space-y-1">
                                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                                    Courier / Logistics Partner *
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        list="courier-presets"
                                        required
                                        placeholder="e.g. Blue Dart, Delhivery, DTDC, Express Cargo, Speed Post"
                                        value={dispatchForm.courier_name}
                                        onChange={(e) => handleCourierOrAwbChange(e.target.value, dispatchForm.tracking_number)}
                                        className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-300 rounded text-xs font-semibold focus:bg-white focus:border-[#2874f0] outline-none text-gray-900"
                                    />
                                    <Truck className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                    <datalist id="courier-presets">
                                        {COURIER_PRESETS.map((preset) => (
                                            <option key={preset.name} value={preset.name} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>

                            {/* 2. Tracking / AWB Number Input */}
                            <div className="space-y-1">
                                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                                    Tracking / AWB Number (Consignment No) *
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. 1234567890 / BD8392104"
                                        value={dispatchForm.tracking_number}
                                        onChange={(e) => handleCourierOrAwbChange(dispatchForm.courier_name, e.target.value)}
                                        className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-300 rounded text-xs font-mono font-bold uppercase focus:bg-white focus:border-[#2874f0] outline-none text-gray-900"
                                    />
                                    <Package className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                </div>
                                <p className="text-[10px] text-gray-400">
                                    Customer will receive this AWB code to track their package live.
                                </p>
                            </div>

                            {/* 3. Direct Tracking Link / URL */}
                            <div className="space-y-1">
                                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
                                    <span>Direct Courier Tracking Link (URL)</span>
                                    <span className="text-[10px] text-emerald-600 font-normal">Auto-generated / Editable</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="url"
                                        placeholder="https://www.bluedart.com/tracking?trackNumber=..."
                                        value={dispatchForm.tracking_link}
                                        onChange={(e) => setDispatchForm({ ...dispatchForm, tracking_link: e.target.value })}
                                        className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-300 rounded text-xs focus:bg-white focus:border-[#2874f0] outline-none text-gray-800"
                                    />
                                    <LinkIcon className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                </div>
                            </div>

                            {/* 4. Optional Dispatch Notes */}
                            <div className="space-y-1">
                                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                                    Dispatch Remarks / Internal Notes (Optional)
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="e.g. Shipped via Air Express Cargo. Expected delivery within 48 hours."
                                    value={dispatchForm.order_notes}
                                    onChange={(e) => setDispatchForm({ ...dispatchForm, order_notes: e.target.value })}
                                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs focus:bg-white focus:border-[#2874f0] outline-none text-gray-800"
                                />
                            </div>

                            {/* 5. Customer Notification Email Checkbox */}
                            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-center gap-2.5">
                                <input
                                    type="checkbox"
                                    id="notify_customer"
                                    checked={dispatchForm.notify_customer}
                                    onChange={(e) => setDispatchForm({ ...dispatchForm, notify_customer: e.target.checked })}
                                    className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                                />
                                <label htmlFor="notify_customer" className="text-xs text-gray-700 font-medium cursor-pointer">
                                    Send official <strong>Dispatch Notification Email</strong> with tracking link to <strong className="text-gray-900">{dispatchModalOrder.customer_email}</strong>
                                </label>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setDispatchModalOrder(null)}
                                    className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingDispatch || !dispatchForm.tracking_number.trim()}
                                    className="px-6 py-2.5 bg-[#fb641b] hover:bg-[#e85b17] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                    {isSavingDispatch ? "Saving & Notifying..." : "Confirm & Mark Dispatched"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 4. ORDER DETAILS & INVOICE SLIP MODAL */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto font-sans">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
                        {/* Header */}
                        <div className="p-4 bg-gradient-to-r from-[#06124f] to-[#2874f0] text-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-amber-300" />
                                <div>
                                    <span className="font-bold text-sm uppercase tracking-wide block">
                                        Order Details • #{selectedOrder.order_ref}
                                    </span>
                                    <span className="text-[11px] text-blue-100">
                                        Placed on {new Date(selectedOrder.created_at).toLocaleString("en-IN")}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="p-1 text-white/80 hover:text-white rounded cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto space-y-5 text-xs">
                            {/* Status & Payment Controls Strip */}
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <span className="text-gray-500 block text-[11px] font-bold uppercase mb-1">Order Progress:</span>
                                    <div className="flex items-center gap-2">
                                        {getOrderStatusBadge(selectedOrder.order_status)}
                                        <select
                                            value={selectedOrder.order_status}
                                            onChange={(e) => handleStatusChange(selectedOrder, e.target.value)}
                                            disabled={isUpdatingStatus}
                                            className="px-2 py-1 bg-white border border-gray-300 rounded font-semibold text-gray-800 outline-none text-[11px] cursor-pointer"
                                        >
                                            <option value="confirmed">Confirmed</option>
                                            <option value="processing">Processing/Packing</option>
                                            <option value="dispatched">Dispatched</option>
                                            <option value="out_for_delivery">Out for Delivery</option>
                                            <option value="delivered">Delivered</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <span className="text-gray-500 block text-[11px] font-bold uppercase mb-1">Payment Status:</span>
                                    <div className="flex items-center gap-2">
                                        {getPaymentStatusBadge(selectedOrder.payment_status)}
                                        <select
                                            value={selectedOrder.payment_status}
                                            onChange={(e) => handleUpdateOrder(selectedOrder.id, undefined, e.target.value)}
                                            disabled={isUpdatingStatus}
                                            className="px-2 py-1 bg-white border border-gray-300 rounded font-semibold text-gray-800 outline-none text-[11px] cursor-pointer"
                                        >
                                            <option value="paid">Paid</option>
                                            <option value="cod_pending">COD Pending</option>
                                            <option value="unpaid">Unpaid</option>
                                            <option value="refunded">Refunded</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Consignment Tracking Info Strip if Dispatched */}
                            {selectedOrder.tracking_number && (
                                <div className="p-3.5 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-between gap-3">
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                                            Dispatch & Tracking Details
                                        </span>
                                        <div className="text-xs text-gray-800 font-bold mt-0.5">
                                            {selectedOrder.courier_name || "Courier"}: <span className="font-mono text-emerald-800">{selectedOrder.tracking_number}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {selectedOrder.tracking_link && (
                                            <a
                                                href={selectedOrder.tracking_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded flex items-center gap-1"
                                            >
                                                Track Online <ExternalLink className="w-3 h-3" />
                                            </a>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handleStatusChange(selectedOrder, "dispatched")}
                                            className="px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-700 font-bold border border-gray-300 rounded text-[11px] cursor-pointer"
                                        >
                                            Edit Tracking
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Item & Price Table */}
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="bg-gray-100 px-4 py-2 font-bold text-gray-800 uppercase text-[11px] flex justify-between items-center">
                                    <span>Purchased Hardware</span>
                                    <span>Mode: {selectedOrder.payment_method.toUpperCase()}</span>
                                </div>
                                <table className="w-full">
                                    <tbody className="divide-y divide-gray-200">
                                        <tr>
                                            <td className="p-3 font-semibold text-gray-600 w-1/3 bg-gray-50/50">Product Name:</td>
                                            <td className="p-3 font-bold text-gray-900">{selectedOrder.product_name}</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-semibold text-gray-600 bg-gray-50/50">Category:</td>
                                            <td className="p-3 text-gray-800">{selectedOrder.category || "Hardware"}</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-semibold text-gray-600 bg-gray-50/50">Quantity:</td>
                                            <td className="p-3 font-bold text-gray-800">{selectedOrder.quantity} Unit(s)</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-semibold text-gray-600 bg-gray-50/50">Unit Price:</td>
                                            <td className="p-3 text-gray-800">{selectedOrder.unit_price || "Standard"}</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-semibold text-gray-600 bg-gray-50/50">Total Payable:</td>
                                            <td className="p-3 text-base font-black text-emerald-600">
                                                ₹{Number(selectedOrder.total_amount || 0).toLocaleString("en-IN")}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-semibold text-gray-600 bg-gray-50/50">Payment Verification:</td>
                                            <td className="p-3 font-bold text-gray-800">
                                                {getPaymentStatusBadge(selectedOrder.payment_status)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Customer & Shipping Address */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5">
                                    <strong className="text-gray-900 block border-b pb-1 font-bold">Customer Info</strong>
                                    <p><strong>Name:</strong> {selectedOrder.customer_name}</p>
                                    <p><strong>Email:</strong> {selectedOrder.customer_email}</p>
                                    <p><strong>Phone:</strong> {selectedOrder.customer_phone}</p>
                                    {selectedOrder.company_name && <p><strong>Company:</strong> {selectedOrder.company_name}</p>}
                                    {selectedOrder.gstin && <p><strong>GSTIN:</strong> {selectedOrder.gstin}</p>}
                                </div>

                                <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5">
                                    <strong className="text-gray-900 block border-b pb-1 font-bold">Delivery Destination</strong>
                                    <p className="text-gray-700">{selectedOrder.delivery_address}</p>
                                    <p className="text-gray-700 font-medium">{selectedOrder.city} {selectedOrder.state ? `, ${selectedOrder.state}` : ""} - {selectedOrder.pincode}</p>
                                </div>
                            </div>

                            {/* Quick Links & Tracking */}
                            <div className="flex items-center justify-between border-t pt-3">
                                <Link
                                    href={`/track-order?orderRef=${selectedOrder.order_ref}`}
                                    target="_blank"
                                    className="text-[#2874f0] font-bold hover:underline flex items-center gap-1"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" /> Open Public Tracking Page
                                </Link>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => window.print()}
                                        className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded flex items-center gap-1 cursor-pointer"
                                    >
                                        <Printer className="w-3.5 h-3.5" /> Print Slip
                                    </button>
                                    <button
                                        onClick={() => setSelectedOrder(null)}
                                        className="px-4 py-1.5 bg-gray-800 text-white font-bold rounded hover:bg-gray-900 cursor-pointer"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
