"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    Search, Package, Truck, CheckCircle2, Clock,
    AlertCircle, PhoneCall, ArrowRight, ShieldCheck,
    MapPin, CreditCard, Building, User, Mail,
    ChevronRight, RefreshCw, MessageSquare, XCircle,
    Calendar, Check, Copy
} from "lucide-react";

interface OrderTrackingDetails {
    id: number;
    orderRef: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    companyName?: string;
    gstin?: string;
    productName: string;
    category?: string;
    quantity: number;
    unitPrice?: string;
    totalAmount: number;
    paymentMethod: string;
    deliveryAddress: string;
    city: string;
    pincode: string;
    state?: string;
    orderNotes?: string;
    trackingNumber?: string;
    trackingLink?: string;
    courierName?: string;
    otpVerified?: boolean;
    orderStatus: string;
    paymentStatus: string;
    createdAt: string;
    updatedAt: string;
}

const ORDER_STEPS = [
    { key: "confirmed", title: "Order Confirmed", desc: "7-digit OTP verified & booking accepted" },
    { key: "processing", title: "Quality Check & Packing", desc: "Hardware inspection & packaging" },
    { key: "dispatched", title: "Dispatched / In Transit", desc: "Handed over to express courier" },
    { key: "out_for_delivery", title: "Out for Delivery", desc: "Courier out for destination delivery" },
    { key: "delivered", title: "Delivered", desc: "Consignment safely delivered" },
];

const STATUS_DETAILS: Record<string, { label: string; badgeColor: string; description: string; stepIdx: number }> = {
    confirmed: {
        label: "Order Confirmed",
        badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
        description: "Your booking is confirmed with 7-digit security OTP verification. Our operations team is allocating inventory.",
        stepIdx: 0,
    },
    pending: {
        label: "Pending Verification",
        badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
        description: "Your order has been recorded and is in verification queue.",
        stepIdx: 0,
    },
    processing: {
        label: "Quality Check & Packing",
        badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
        description: "Hardware barcode equipment is currently undergoing OEM diagnostics & secure packaging.",
        stepIdx: 1,
    },
    packed: {
        label: "Quality Check & Packing",
        badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
        description: "Package is ready and queued for dispatch with express logistics partner.",
        stepIdx: 1,
    },
    dispatched: {
        label: "Dispatched / In Transit",
        badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
        description: "Your consignment has been dispatched and is currently moving through express transit network.",
        stepIdx: 2,
    },
    shipped: {
        label: "Dispatched / In Transit",
        badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
        description: "Your consignment has been dispatched and is currently in transit.",
        stepIdx: 2,
    },
    out_for_delivery: {
        label: "Out for Delivery",
        badgeColor: "bg-cyan-100 text-cyan-800 border-cyan-200",
        description: "Consignment is out with the local delivery executive and will arrive today.",
        stepIdx: 3,
    },
    delivered: {
        label: "Delivered Successfully",
        badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
        description: "Consignment has been delivered. Viros Assured 1-Year OEM warranty is active.",
        stepIdx: 4,
    },
    cancelled: {
        label: "Order Cancelled",
        badgeColor: "bg-rose-100 text-rose-800 border-rose-200",
        description: "This booking was cancelled. If you need assistance or refund status, please contact support.",
        stepIdx: -1,
    }
};

function TrackOrderContent() {
    const searchParams = useSearchParams();
    const [orderRefInput, setOrderRefInput] = useState("");
    const [emailInput, setEmailInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [order, setOrder] = useState<OrderTrackingDetails | null>(null);
    const [copied, setCopied] = useState(false);

    const performTrack = useCallback(async (ref: string, email?: string) => {
        if (!ref.trim()) return;
        setIsLoading(true);
        setErrorMsg("");

        try {
            let url = `/api/orders/track?orderRef=${encodeURIComponent(ref.trim())}&_t=${Date.now()}`;
            if (email?.trim()) {
                url += `&email=${encodeURIComponent(email.trim())}`;
            }

            const res = await fetch(url, { cache: "no-store" });
            const data = await res.json();

            if (res.ok && data.success) {
                setOrder(data.order);
            } else {
                setOrder(null);
                setErrorMsg(data.error || "Order not found. Please verify your Order Reference ID.");
            }
        } catch (err) {
            console.error("Tracking fetch error:", err);
            setErrorMsg("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const queryRef = searchParams.get("orderRef");
        const queryEmail = searchParams.get("email");
        if (queryRef) {
            setOrderRefInput(queryRef);
            if (queryEmail) setEmailInput(queryEmail);
            performTrack(queryRef, queryEmail || undefined);
        }
    }, [searchParams, performTrack]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        performTrack(orderRefInput, emailInput);
    };

    const handleCopyRef = () => {
        if (!order) return;
        navigator.clipboard.writeText(order.orderRef);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const currentStatusKey = (order?.orderStatus || "confirmed").toLowerCase();
    const statusInfo = STATUS_DETAILS[currentStatusKey] || {
        label: order?.orderStatus?.toUpperCase() || "CONFIRMED",
        badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
        description: "Order is recorded and processing.",
        stepIdx: 0,
    };

    const isCancelled = currentStatusKey === "cancelled";
    const currentStepIdx = statusInfo.stepIdx;

    return (
        <div className="bg-[#f1f3f6] min-h-screen font-sans text-gray-800 antialiased selection:bg-[#2874f0] selection:text-white pb-12">
            {/* Top Breadcrumb */}
            <div className="bg-[#2874f0] text-white py-2.5 px-4 shadow-sm">
                <div className="max-w-5xl mx-auto flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 opacity-90">
                        <Link href="/" className="hover:underline">Home</Link>
                        <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                        <Link href="/products" className="hover:underline">Products</Link>
                        <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                        <span className="font-bold text-white">Track Hardware Booking</span>
                    </div>
                    <span className="hidden sm:flex items-center gap-1 text-emerald-200">
                        <ShieldCheck className="w-4 h-4" /> Live Consignment Tracking
                    </span>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-5">
                {/* TRACKING SEARCH BOX */}
                <div className="bg-white rounded-lg border border-gray-200 p-5 sm:p-6 shadow-xs space-y-4">
                    <div>
                        <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                            <Truck className="w-6 h-6 text-[#2874f0]" /> Track Your Hardware Booking
                        </h1>
                        <p className="text-xs text-gray-500 mt-1">
                            Enter the <strong>Order Reference ID</strong> (e.g. <code>VRS-123456</code>) sent to your email after Buy Now checkout.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
                        <div className="sm:col-span-6 relative">
                            <input
                                type="text"
                                required
                                placeholder="Order Reference ID (e.g. VRS-839210)"
                                value={orderRefInput}
                                onChange={(e) => setOrderRefInput(e.target.value.toUpperCase())}
                                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded text-xs font-mono font-bold uppercase tracking-wider focus:bg-white focus:border-[#2874f0] outline-none text-gray-900"
                            />
                            <Package className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>

                        <div className="sm:col-span-4 relative">
                            <input
                                type="email"
                                placeholder="Email (Optional for security)"
                                value={emailInput}
                                onChange={(e) => setEmailInput(e.target.value)}
                                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded text-xs focus:bg-white focus:border-[#2874f0] outline-none text-gray-900"
                            />
                            <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>

                        <div className="sm:col-span-2">
                            <button
                                type="submit"
                                disabled={isLoading || !orderRefInput.trim()}
                                className="w-full h-full py-2.5 bg-[#2874f0] hover:bg-[#1a5bc7] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                {isLoading ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Search className="w-4 h-4" /> Track
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {errorMsg && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in-50">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}
                </div>

                {/* TRACKING DETAILS DISPLAY */}
                {order && (
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-200 animate-in fade-in-50 duration-200">
                        {/* Order Header Summary */}
                        <div className="p-5 sm:p-6 bg-linear-to-r from-blue-50/50 via-white to-gray-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs text-gray-500 font-bold uppercase">Order Reference:</span>
                                    <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                        <span className="text-sm font-mono font-black text-[#2874f0]">
                                            #{order.orderRef}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleCopyRef}
                                            title="Copy Order Reference"
                                            className="text-gray-400 hover:text-[#2874f0] transition-colors p-0.5 cursor-pointer"
                                        >
                                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>

                                    {/* Prominent Live Status Badge */}
                                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${statusInfo.badgeColor} flex items-center gap-1 shadow-2xs`}>
                                        {isCancelled ? <XCircle className="w-3.5 h-3.5 text-rose-600" /> : <CheckCircle2 className="w-3.5 h-3.5 text-current" />}
                                        {statusInfo.label}
                                    </span>
                                </div>

                                <h2 className="text-lg font-bold text-gray-900 pt-1">
                                    {order.productName}
                                </h2>

                                <p className="text-xs text-gray-500 flex items-center gap-2">
                                    <span>
                                        Placed on: {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit"
                                        })}
                                    </span>
                                    <span>•</span>
                                    <button
                                        type="button"
                                        onClick={() => performTrack(order.orderRef, emailInput)}
                                        disabled={isLoading}
                                        className="text-[#2874f0] hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                                    >
                                        <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} /> Refresh Status
                                    </button>
                                </p>
                            </div>

                            <div className="text-left sm:text-right bg-white sm:bg-transparent p-3 sm:p-0 rounded border sm:border-0 border-gray-200 w-full sm:w-auto">
                                <span className="text-xs text-gray-500 block">Total Payable:</span>
                                <span className="text-2xl font-black text-emerald-600 block">
                                    ₹{order.totalAmount.toLocaleString("en-IN")}
                                </span>
                                <span className="text-[11px] text-gray-600 block font-bold mt-0.5">
                                    {order.paymentMethod?.toUpperCase()} • {order.paymentStatus?.replace("_", " ").toUpperCase()}
                                </span>
                            </div>
                        </div>

                        {/* STATUS EXPLANATION BANNER */}
                        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-start gap-3">
                            <div className={`p-2 rounded-full shrink-0 ${isCancelled ? "bg-rose-100 text-rose-600" : "bg-[#2874f0]/10 text-[#2874f0]"}`}>
                                {isCancelled ? <AlertCircle className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
                            </div>
                            <div className="space-y-0.5 text-xs">
                                <strong className="text-gray-900 font-bold block text-sm">
                                    {isCancelled ? "Order Booking Cancelled" : `Current Stage: ${statusInfo.label}`}
                                </strong>
                                <p className="text-gray-600 leading-relaxed">
                                    {statusInfo.description}
                                </p>
                            </div>
                        </div>

                        {/* VISUAL ORDER STATUS PROGRESS TIMELINE (If not cancelled) */}
                        {!isCancelled && (
                            <div className="p-5 sm:p-8 bg-white">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-6">
                                    Live Consignment Tracking Timeline
                                </h3>

                                <div className="relative">
                                    {/* Desktop Timeline */}
                                    <div className="hidden sm:grid grid-cols-5 gap-2 relative">
                                        {/* Background Bar */}
                                        <div className="absolute top-4 left-6 right-6 h-1 bg-gray-200 -z-0">
                                            <div
                                                className="h-full bg-emerald-500 transition-all duration-500"
                                                style={{ width: `${(Math.max(0, currentStepIdx) / (ORDER_STEPS.length - 1)) * 100}%` }}
                                            />
                                        </div>

                                        {ORDER_STEPS.map((step, idx) => {
                                            const isCompleted = idx <= currentStepIdx;
                                            const isCurrent = idx === currentStepIdx;

                                            return (
                                                <div key={step.key} className="flex flex-col items-center text-center z-10">
                                                    <div
                                                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs transition-all ${isCompleted
                                                            ? "bg-emerald-500 text-white ring-4 ring-emerald-50 scale-105"
                                                            : "bg-white border-2 border-gray-300 text-gray-400"
                                                            }`}
                                                    >
                                                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                                                    </div>

                                                    <span
                                                        className={`text-xs font-bold mt-2.5 leading-snug ${isCurrent ? "text-[#2874f0] font-black" : isCompleted ? "text-gray-800" : "text-gray-400"
                                                            }`}
                                                    >
                                                        {step.title}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 mt-0.5 max-w-[130px] leading-tight">
                                                        {step.desc}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Mobile Vertical Timeline */}
                                    <div className="sm:hidden space-y-5 relative border-l-2 border-emerald-500 ml-4 pl-5">
                                        {ORDER_STEPS.map((step, idx) => {
                                            const isCompleted = idx <= currentStepIdx;
                                            const isCurrent = idx === currentStepIdx;

                                            return (
                                                <div key={step.key} className="relative">
                                                    <div
                                                        className={`absolute -left-[27px] top-0.5 w-4 h-4 rounded-full border-2 ${isCompleted ? "bg-emerald-500 border-white ring-2 ring-emerald-400" : "bg-white border-gray-300"
                                                            }`}
                                                    />
                                                    <div>
                                                        <span
                                                            className={`text-xs font-bold block ${isCurrent ? "text-[#2874f0] font-black" : isCompleted ? "text-gray-800" : "text-gray-400"
                                                                }`}
                                                        >
                                                            {step.title}
                                                        </span>
                                                        <span className="text-[11px] text-gray-400 block">
                                                            {step.desc}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* COURIER DISPATCH & AWB CONSIGNMENT CARD */}
                        {(order.trackingNumber || order.courierName || order.trackingLink) && (
                            <div className="p-5 bg-gradient-to-r from-emerald-50 to-blue-50 border-b border-gray-200">
                                <div className="max-w-2xl mx-auto bg-white rounded-lg p-4 border-2 border-emerald-400 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                            Live Courier Dispatch Details
                                        </span>
                                        <div className="text-xs text-gray-700 font-semibold pt-1">
                                            Courier Partner: <strong className="text-gray-900">{order.courierName || "Express Courier Logistics"}</strong>
                                        </div>
                                        {order.trackingNumber && (
                                            <div className="flex items-center gap-2 pt-0.5">
                                                <span className="text-xs text-gray-500 font-medium">Tracking / AWB:</span>
                                                <span className="font-mono text-sm font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                    {order.trackingNumber}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        {order.trackingLink && (
                                            <a
                                                href={order.trackingLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase rounded shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                                            >
                                                Track on Courier Website <ArrowRight className="w-3.5 h-3.5" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ORDER ITEM & DELIVERY DETAILS */}
                        <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50">
                            {/* Product & Pricing Breakdown */}
                            <div className="bg-white p-4 rounded-md border border-gray-200 space-y-3">
                                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                                    <Package className="w-4 h-4 text-[#2874f0]" /> Order Summary
                                </h4>
                                <div className="space-y-1.5 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Item:</span>
                                        <strong className="text-gray-800 text-right truncate max-w-[200px]">{order.productName}</strong>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Category:</span>
                                        <span className="text-gray-700">{order.category || "Hardware"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Quantity:</span>
                                        <span className="text-gray-800 font-bold">{order.quantity} Unit(s)</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Unit Price:</span>
                                        <span className="text-gray-700">{order.unitPrice || "Standard"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Delivery Charge:</span>
                                        <span className="text-emerald-600 font-bold">FREE Express</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Security Verification:</span>
                                        <span className="text-blue-600 font-bold">✓ 7-Digit OTP Verified</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-2 mt-1 text-sm font-bold">
                                        <span>Total Amount:</span>
                                        <span className="text-emerald-600 font-black">
                                            ₹{order.totalAmount.toLocaleString("en-IN")}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Shipping & Contact Destination */}
                            <div className="bg-white p-4 rounded-md border border-gray-200 space-y-3">
                                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                                    <MapPin className="w-4 h-4 text-[#2874f0]" /> Delivery Destination
                                </h4>
                                <div className="text-xs space-y-1 text-gray-700 leading-relaxed">
                                    <strong className="text-gray-900 block text-sm">{order.customerName}</strong>
                                    {order.companyName && (
                                        <span className="text-gray-500 block text-[11px]">🏢 {order.companyName}</span>
                                    )}
                                    {order.gstin && (
                                        <span className="text-gray-500 block text-[11px]">GSTIN: {order.gstin}</span>
                                    )}
                                    <p className="text-gray-600">{order.deliveryAddress}</p>
                                    <p className="text-gray-600 font-medium">
                                        {order.city} {order.state ? `, ${order.state}` : ""} - {order.pincode}
                                    </p>
                                    <div className="pt-1 text-gray-500 space-y-0.5 text-[11px] border-t">
                                        <p>📞 Phone: <strong>{order.customerPhone}</strong></p>
                                        <p>📧 Email: <strong>{order.customerEmail}</strong></p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Customer Support Strip */}
                        <div className="p-4 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                            <span className="text-gray-600 flex items-center gap-2">
                                <PhoneCall className="w-4 h-4 text-[#2874f0]" /> Need instant dispatch or courier tracking assistance?
                            </span>
                            <div className="flex items-center gap-2">
                                <a
                                    href={`https://wa.me/918377929141?text=${encodeURIComponent(`Hi Viros Team, I want tracking update for Order #${order.orderRef}`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded flex items-center gap-1.5 transition-colors"
                                >
                                    <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Support
                                </a>
                                <Link
                                    href="/contact"
                                    className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded border border-gray-300"
                                >
                                    Contact Us
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function TrackOrderPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#f1f3f6] flex items-center justify-center p-8">
                <div className="w-8 h-8 border-3 border-[#2874f0] border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <TrackOrderContent />
        </Suspense>
    );
}
