"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ShoppingBag, ShieldCheck, Truck, CheckCircle2,
    Lock, ArrowLeft, KeyRound, Clock, AlertCircle,
    Phone, Mail, MapPin, Building, CreditCard,
    Check, Zap, RefreshCw, ChevronRight, FileText,
    MessageSquare, HelpCircle, Star, Package
} from "lucide-react";

interface ProductItem {
    id: number | string;
    name: string;
    category?: string;
    price_display?: string;
    image_url?: string;
    images?: string[];
    description?: string;
    stock_status?: string;
}

function extractPriceNumber(priceDisplay?: string): number {
    if (!priceDisplay) return 12000;
    const cleaned = priceDisplay.replace(/[^0-9]/g, "");
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) || parsed <= 0 ? 12000 : parsed;
}

function BuyNowPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const productId = searchParams.get("id");
    const paramName = searchParams.get("name") || searchParams.get("product");
    const paramPrice = searchParams.get("price");
    const paramCategory = searchParams.get("category");
    const paramImg = searchParams.get("img");

    const [product, setProduct] = useState<ProductItem | null>(null);
    const [isLoadingProduct, setIsLoadingProduct] = useState(true);
    const [qty, setQty] = useState(1);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        pincode: "",
        state: "",
        company: "",
        gstin: "",
        orderNotes: ""
    });

    const [paymentMethod, setPaymentMethod] = useState<"online" | "po">("online");

    // OTP State
    const [step, setStep] = useState<"details" | "otp" | "success">("details");
    const [enteredOtp, setEnteredOtp] = useState("");
    const [otpError, setOtpError] = useState("");
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
    const [otpTimer, setOtpTimer] = useState(0);

    // Success State
    const [orderSuccess, setOrderSuccess] = useState<{
        orderId: string;
        productName: string;
        totalAmount: number;
        qty: number;
    } | null>(null);

    // Fetch product details
    useEffect(() => {
        const loadProduct = async () => {
            setIsLoadingProduct(true);
            if (productId) {
                try {
                    const res = await fetch(`/api/products/${productId}`);
                    if (res.ok) {
                        const data = await res.json();
                        setProduct(data);
                        setIsLoadingProduct(false);
                        return;
                    }
                } catch (err) {
                    console.error("Failed to load product by ID:", err);
                }
            }

            // Fallback to URL query params if direct ID fetch is not found
            if (paramName) {
                setProduct({
                    id: productId || "custom",
                    name: decodeURIComponent(paramName),
                    price_display: paramPrice ? decodeURIComponent(paramPrice) : "₹12,000",
                    category: paramCategory ? decodeURIComponent(paramCategory) : "Hardware",
                    image_url: paramImg ? decodeURIComponent(paramImg) : "/logo.png"
                });
            } else {
                // Fetch first featured product as fallback
                try {
                    const res = await fetch("/api/products");
                    if (res.ok) {
                        const data = await res.json();
                        const list = data.products || data || [];
                        if (list.length > 0) {
                            setProduct(list[0]);
                        }
                    }
                } catch (e) {
                    console.error("Fallback load error:", e);
                }
            }
            setIsLoadingProduct(false);
        };

        loadProduct();
    }, [productId, paramName, paramPrice, paramCategory, paramImg]);

    // OTP Countdown Timer
    useEffect(() => {
        let interval: any = null;
        if (otpTimer > 0) {
            interval = setInterval(() => {
                setOtpTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [otpTimer]);

    // Pricing calculation
    const unitPrice = extractPriceNumber(product?.price_display);
    const subtotal = unitPrice * qty;
    const deliveryFee = 0; // FREE Express Delivery
    const totalAmount = subtotal + deliveryFee;

    // Send 7-Digit OTP
    const handleSendBookingOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!product) return;

        if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.address.trim() || !formData.city.trim() || !formData.pincode.trim()) {
            setOtpError("Please fill in all mandatory fields with asterisks (*).");
            return;
        }

        setIsSendingOtp(true);
        setOtpError("");

        try {
            const res = await fetch("/api/products/order-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "send_otp",
                    email: formData.email.trim(),
                    name: formData.name.trim(),
                    productName: product.name
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setStep("otp");
                setOtpTimer(60);
                setEnteredOtp("");
                window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
                setOtpError(data.error || "Failed to send 7-digit OTP. Please check email address and try again.");
            }
        } catch (err) {
            console.error("Failed to send OTP:", err);
            setOtpError("Network error. Please try again.");
        } finally {
            setIsSendingOtp(false);
        }
    };

    // Resend OTP
    const handleResendOtp = async () => {
        if (!product || isSendingOtp) return;
        setIsSendingOtp(true);
        setOtpError("");

        try {
            const res = await fetch("/api/products/order-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "send_otp",
                    email: formData.email.trim(),
                    name: formData.name.trim(),
                    productName: product.name
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setOtpTimer(60);
                setEnteredOtp("");
            } else {
                setOtpError(data.error || "Failed to resend OTP.");
            }
        } catch (err) {
            setOtpError("Failed to resend OTP.");
        } finally {
            setIsSendingOtp(false);
        }
    };

    // Verify 7-Digit OTP & Book Order
    const handleVerifyOtpAndBook = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!product) return;

        const cleanOtp = enteredOtp.trim();
        if (cleanOtp.length !== 7) {
            setOtpError("Please enter the complete 7-digit security OTP sent to your email");
            return;
        }

        setIsVerifyingOtp(true);
        setOtpError("");

        try {
            const res = await fetch("/api/products/order-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "verify_and_order",
                    email: formData.email.trim(),
                    otp: cleanOtp,
                    name: formData.name.trim(),
                    orderData: {
                        productName: product.name,
                        category: product.category || "Hardware",
                        qty: qty,
                        priceDisplay: product.price_display || `₹${unitPrice.toLocaleString("en-IN")}`,
                        totalAmount: totalAmount,
                        paymentMethod: paymentMethod,
                        name: formData.name.trim(),
                        phone: formData.phone.trim(),
                        address: formData.address.trim(),
                        city: formData.city.trim(),
                        pincode: formData.pincode.trim(),
                        state: formData.state.trim() || undefined,
                        company: formData.company.trim() || undefined,
                        gstin: formData.gstin.trim() || undefined,
                        orderNotes: formData.orderNotes.trim() || undefined
                    }
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setOrderSuccess({
                    orderId: data.orderId || "VRS-" + Math.floor(100000 + Math.random() * 900000),
                    productName: product.name,
                    totalAmount: totalAmount,
                    qty: qty
                });
                setStep("success");
                window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
                setOtpError(data.error || "Invalid 7-digit OTP. Please check your email inbox or spam folder.");
            }
        } catch (err) {
            console.error("OTP verification error:", err);
            setOtpError("Error verifying OTP. Please try again.");
        } finally {
            setIsVerifyingOtp(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f1f3f6] text-gray-800 font-sans pb-16">
            {/* Top Navigation Bar */}
            <header className="bg-[#2874f0] text-white shadow-md sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="p-1.5 hover:bg-white/10 rounded text-white flex items-center gap-1 text-xs font-bold uppercase transition-colors cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                        <div className="h-5 w-px bg-white/20 hidden sm:block"></div>
                        <h1 className="text-sm sm:text-base font-bold tracking-tight flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4 text-amber-300" />
                            Buy Now Product
                        </h1>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                        <span className="hidden md:flex items-center gap-1.5 text-blue-100 bg-white/10 px-3 py-1 rounded-full text-[11px] font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" /> 100% Genuine OEM Hardware
                        </span>
                        <span className="text-[11px] font-bold text-white flex items-center gap-1">
                            <Lock className="w-3 h-3 text-emerald-300" /> 256-Bit SSL Encrypted
                        </span>
                    </div>
                </div>
            </header>

            {/* Stepper Progress Bar */}
            <div className="bg-white border-b border-gray-200 shadow-2xs">
                <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-center gap-2 sm:gap-6 text-xs font-bold text-gray-500">
                    <div className={`flex items-center gap-1.5 ${step === "details" ? "text-[#2874f0] font-black" : "text-emerald-600"}`}>
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${step === "details" ? "bg-[#2874f0]" : "bg-emerald-600"}`}>
                            {step !== "details" ? "✓" : "1"}
                        </span>
                        <span>Delivery Details</span>
                    </div>

                    <ChevronRight className="w-3.5 h-3.5 text-gray-300" />

                    <div className={`flex items-center gap-1.5 ${step === "otp" ? "text-[#2874f0] font-black" : step === "success" ? "text-emerald-600" : "text-gray-400"}`}>
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === "otp" ? "bg-[#2874f0] text-white" : step === "success" ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-600"}`}>
                            {step === "success" ? "✓" : "2"}
                        </span>
                        <span>7-Digit Email OTP</span>
                    </div>

                    <ChevronRight className="w-3.5 h-3.5 text-gray-300" />

                    <div className={`flex items-center gap-1.5 ${step === "success" ? "text-emerald-600 font-black" : "text-gray-400"}`}>
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === "success" ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-600"}`}>
                            3
                        </span>
                        <span>Confirmed</span>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
                {isLoadingProduct ? (
                    <div className="bg-white rounded-lg p-12 text-center space-y-3 shadow-xs border border-gray-200">
                        <RefreshCw className="w-8 h-8 text-[#2874f0] animate-spin mx-auto" />
                        <h3 className="text-sm font-bold text-gray-800">Loading Product Booking Details...</h3>
                    </div>
                ) : !product ? (
                    <div className="bg-white rounded-lg p-12 text-center space-y-4 shadow-xs border border-gray-200 max-w-md mx-auto">
                        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
                        <h3 className="text-base font-bold text-gray-900">Product Not Found</h3>
                        <p className="text-xs text-gray-500">Please select a product from our catalog to proceed with Buy Now checkout.</p>
                        <Link
                            href="/products"
                            className="inline-block px-6 py-2.5 bg-[#2874f0] text-white text-xs font-bold uppercase rounded shadow-xs hover:bg-[#1a5bc7]"
                        >
                            Browse Products Catalog
                        </Link>
                    </div>
                ) : step === "success" && orderSuccess ? (
                    /* ========================================================================= */
                    /* STEP 3: ORDER SUCCESS CELEBRATION CARD                                    */
                    /* ========================================================================= */
                    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden text-center p-6 sm:p-10 space-y-5 animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>

                        <div>
                            <h2 className="text-2xl font-black text-gray-900">
                                Hardware Booking Confirmed!
                            </h2>
                            <p className="text-xs text-gray-500 mt-1">
                                Thank you, <strong className="text-gray-900">{formData.name}</strong>. Your express order has been placed successfully.
                            </p>
                            <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200 mt-3">
                                7-Digit Security OTP Verified
                            </span>
                        </div>

                        {/* Order Summary Slip */}
                        <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 text-left space-y-2.5 text-xs max-w-lg mx-auto">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500 font-bold uppercase tracking-wider">Order Reference ID:</span>
                                <strong className="font-mono text-sm font-black text-[#2874f0]">#{orderSuccess.orderId}</strong>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500 font-medium">Product Item:</span>
                                <strong className="text-gray-900 text-right truncate max-w-[220px]">{orderSuccess.productName}</strong>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500 font-medium">Quantity:</span>
                                <span className="text-gray-800 font-bold">{orderSuccess.qty} Unit(s)</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500 font-medium">Payment Mode:</span>
                                <span className="font-bold text-gray-800 uppercase">{paymentMethod}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500 font-medium">Delivery Destination:</span>
                                <span className="text-gray-800 text-right truncate max-w-[220px]">
                                    {formData.city} ({formData.pincode})
                                </span>
                            </div>
                            <div className="flex justify-between pt-1 text-sm font-bold">
                                <span>Total Payable Amount:</span>
                                <strong className="text-base text-emerald-600 font-black">
                                    ₹{orderSuccess.totalAmount.toLocaleString("en-IN")}
                                </strong>
                            </div>
                        </div>

                        <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                            A confirmation email and tax invoice copy have been sent to <strong>{formData.email}</strong>. Our dispatch executive will contact you at <strong>{formData.phone}</strong> for delivery coordination.
                        </p>

                        <div className="pt-3 flex flex-wrap justify-center gap-3">
                            <Link
                                href={`/track-order?orderRef=${orderSuccess.orderId}`}
                                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                                <Truck className="w-4 h-4" /> Track Order Status Live
                            </Link>

                            <Link
                                href="/products"
                                className="px-6 py-2.5 bg-[#2874f0] hover:bg-[#1a5bc7] text-white text-xs font-bold uppercase tracking-wider rounded shadow-xs transition-colors cursor-pointer"
                            >
                                Browse More Products
                            </Link>
                        </div>
                    </div>
                ) : (
                    /* ========================================================================= */
                    /* STEP 1 & 2: TWO-COLUMN CHECKOUT LAYOUT                                    */
                    /* ========================================================================= */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* LEFT COLUMN (Forms & OTP) */}
                        <div className="lg:col-span-8 space-y-5">
                            {/* Selected Product Card */}
                            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-16 h-16 bg-gray-50 rounded border border-gray-200 p-1.5 flex items-center justify-center shrink-0">
                                        <img
                                            src={
                                                (product.images && product.images[0]) ||
                                                product.image_url ||
                                                "/logo.png"
                                            }
                                            alt={product.name}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-[#2874f0] uppercase tracking-wider bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                            {product.category || "Hardware"}
                                        </span>
                                        <h2 className="text-sm sm:text-base font-bold text-gray-900 mt-1 line-clamp-1">
                                            {product.name}
                                        </h2>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-base font-black text-gray-900">
                                                ₹{unitPrice.toLocaleString("en-IN")}
                                            </span>
                                            <span className="text-[11px] text-emerald-600 font-bold">
                                                ✓ In Stock (Express Dispatch)
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Quantity Counter */}
                                <div className="flex items-center gap-3 self-end sm:self-center">
                                    <span className="text-xs font-bold text-gray-600">Quantity:</span>
                                    <div className="flex items-center border border-gray-300 rounded bg-white overflow-hidden shadow-2xs">
                                        <button
                                            type="button"
                                            onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                                            disabled={qty <= 1 || step === "otp"}
                                            className="px-3 py-1.5 text-sm font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
                                        >
                                            -
                                        </button>
                                        <span className="px-3.5 py-1.5 text-xs font-bold text-gray-900 border-x border-gray-200 bg-gray-50/50">
                                            {qty}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setQty((prev) => prev + 1)}
                                            disabled={step === "otp"}
                                            className="px-3 py-1.5 text-sm font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* STEP 2: 7-DIGIT OTP VERIFICATION CARD */}
                            {step === "otp" ? (
                                <div className="bg-white rounded-lg p-6 sm:p-8 border-2 border-[#2874f0] shadow-md space-y-5 animate-in fade-in-50">
                                    <div className="text-center space-y-1.5">
                                        <div className="w-12 h-12 rounded-full bg-[#2874f0]/10 text-[#2874f0] flex items-center justify-center mx-auto mb-2">
                                            <KeyRound className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">
                                            Enter 7-Digit Security OTP
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                            We have sent a 7-digit security OTP to verify your booking:<br />
                                            <strong className="text-gray-900 font-bold text-sm">{formData.email}</strong>
                                        </p>
                                    </div>

                                    {otpError && (
                                        <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                                            <AlertCircle className="w-4 h-4 shrink-0" />
                                            <span>{otpError}</span>
                                        </div>
                                    )}

                                    <form onSubmit={handleVerifyOtpAndBook} className="space-y-4 max-w-sm mx-auto">
                                        <div className="space-y-1.5 text-center">
                                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                7-Digit OTP Code
                                            </label>
                                            <input
                                                type="text"
                                                maxLength={7}
                                                autoFocus
                                                required
                                                placeholder="•••••••"
                                                value={enteredOtp}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 7);
                                                    setEnteredOtp(val);
                                                    setOtpError("");
                                                }}
                                                className="w-full text-center tracking-[8px] text-2xl font-mono font-black py-3 px-4 bg-gray-50 border-2 border-[#2874f0] rounded focus:bg-white outline-none text-[#2874f0]"
                                            />
                                            <p className="text-[11px] text-gray-400">
                                                Enter the 7 numbers received on your email.
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100">
                                            <button
                                                type="button"
                                                onClick={() => setStep("details")}
                                                className="text-gray-500 hover:text-gray-900 font-medium cursor-pointer"
                                            >
                                                ← Edit Information
                                            </button>

                                            {otpTimer > 0 ? (
                                                <span className="text-gray-500 flex items-center gap-1 font-mono text-[11px]">
                                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                    Resend in {otpTimer}s
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={handleResendOtp}
                                                    disabled={isSendingOtp}
                                                    className="text-[#2874f0] font-bold hover:underline cursor-pointer"
                                                >
                                                    {isSendingOtp ? "Sending..." : "Resend OTP"}
                                                </button>
                                            )}
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isVerifyingOtp || enteredOtp.length !== 7}
                                            className="w-full py-3.5 bg-[#fb641b] hover:bg-[#e85b17] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            {isVerifyingOtp ? "Verifying OTP & Booking Order..." : "Confirm 7-Digit OTP & Book Now"}
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                /* STEP 1: CUSTOMER & DELIVERY ADDRESS FORM */
                                <form onSubmit={handleSendBookingOtp} className="space-y-5">
                                    {/* 1. Customer Details */}
                                    <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-xs space-y-4">
                                        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
                                            <MapPin className="w-4 h-4 text-[#2874f0]" />
                                            1. Delivery Destination & Contact Details
                                        </h3>

                                        {otpError && (
                                            <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs font-bold flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4 shrink-0" />
                                                <span>{otpError}</span>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                                            <div>
                                                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                                    Full Customer Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="e.g. Abhishek Kumar"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded text-xs focus:bg-white focus:border-[#2874f0] outline-none text-gray-900"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                                    Mobile Number (WhatsApp) *
                                                </label>
                                                <input
                                                    type="tel"
                                                    required
                                                    placeholder="e.g. 9876543210"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded text-xs focus:bg-white focus:border-[#2874f0] outline-none text-gray-900"
                                                />
                                            </div>

                                            <div className="sm:col-span-2">
                                                <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center justify-between">
                                                    <span>Email Address *</span>
                                                    <span className="text-[#2874f0] text-[10px] font-normal">Instant verification code sent here</span>
                                                </label>
                                                <input
                                                    type="email"
                                                    required
                                                    placeholder="e.g. abhishek@company.com"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded text-xs focus:bg-white focus:border-[#2874f0] outline-none text-gray-900 font-medium"
                                                />
                                            </div>

                                            <div className="sm:col-span-2">
                                                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                                    Complete Delivery Address *
                                                </label>
                                                <textarea
                                                    rows={2}
                                                    required
                                                    placeholder="Plot/Building No, Industrial Area, Street, Landmark..."
                                                    value={formData.address}
                                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded text-xs focus:bg-white focus:border-[#2874f0] outline-none text-gray-900"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                                    City / District *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="e.g. Mumbai / Delhi / Chapra"
                                                    value={formData.city}
                                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded text-xs focus:bg-white focus:border-[#2874f0] outline-none text-gray-900"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                                    Pincode *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="e.g. 841301 / 110001"
                                                    value={formData.pincode}
                                                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded text-xs focus:bg-white focus:border-[#2874f0] outline-none text-gray-900"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                                    State (Optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Bihar / Maharashtra"
                                                    value={formData.state}
                                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded text-xs focus:bg-white focus:border-[#2874f0] outline-none text-gray-900"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                                    Company Name (Optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Sharma Tech Ltd"
                                                    value={formData.company}
                                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded text-xs focus:bg-white focus:border-[#2874f0] outline-none text-gray-900"
                                                />
                                            </div>

                                            <div className="sm:col-span-2">
                                                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                                    GSTIN Number (Optional for Tax Credit)
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. 27AAAAA0000A1Z5"
                                                    value={formData.gstin}
                                                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded text-xs focus:bg-white focus:border-[#2874f0] outline-none text-gray-900 font-mono uppercase"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. Payment & Invoice Preference */}
                                    <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-xs space-y-4">
                                        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
                                            <CreditCard className="w-4 h-4 text-[#2874f0]" />
                                            2. Payment & Invoice Preference
                                        </h3>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {[
                                                { id: "online", label: "UPI / Bank Transfer", desc: "Instant digital payment via QR / NEFT" },
                                                { id: "po", label: "Proforma Invoice (PO)", desc: "Official B2B tax invoice with GST details" },
                                            ].map((m) => (
                                                <label
                                                    key={m.id}
                                                    className={`p-3 rounded-lg border text-xs cursor-pointer flex flex-col justify-between transition-all ${paymentMethod === m.id
                                                        ? "border-[#2874f0] bg-blue-50/40 ring-1 ring-[#2874f0] text-gray-900"
                                                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name="paymentMethod"
                                                            checked={paymentMethod === m.id}
                                                            onChange={() => setPaymentMethod(m.id as any)}
                                                            className="w-4 h-4 text-[#2874f0] cursor-pointer"
                                                        />
                                                        <span className="font-bold text-gray-900">{m.label}</span>
                                                    </div>
                                                    <span className="text-[11px] text-gray-500 mt-1 pl-6">{m.desc}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={isSendingOtp}
                                        className="w-full py-3.5 bg-[#fb641b] hover:bg-[#e85b17] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <Zap className="w-4 h-4 fill-white" />
                                        {isSendingOtp ? "Send OTP to Email..." : "Proceed to OTP Verification"}
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* RIGHT COLUMN (Sticky Order Summary & Trust Guarantee) */}
                        <div className="lg:col-span-4 space-y-4 sticky top-20">
                            <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-xs space-y-4 text-xs">
                                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b pb-2 flex items-center justify-between">
                                    <span>Price Summary</span>
                                    <span className="text-gray-400 font-normal">({qty} Unit{qty > 1 ? "s" : ""})</span>
                                </h3>

                                <div className="space-y-2.5">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Item Price ({qty} × ₹{unitPrice.toLocaleString("en-IN")}):</span>
                                        <strong className="text-gray-900">₹{subtotal.toLocaleString("en-IN")}</strong>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Nationwide Express Delivery:</span>
                                        <span className="text-emerald-600 font-bold">FREE</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Viros OEM Warranty:</span>
                                        <span className="text-[#2874f0] font-bold">1 Year Included</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>7-Digit OTP Verification:</span>
                                        <span className="text-blue-600 font-bold">Included</span>
                                    </div>

                                    <div className="border-t pt-3 flex justify-between items-baseline">
                                        <div>
                                            <span className="text-sm font-bold text-gray-900 block">Total Amount:</span>
                                            <span className="text-[10px] text-gray-400">Inclusive of all taxes</span>
                                        </div>
                                        <span className="text-xl font-black text-[#fb641b]">
                                            ₹{totalAmount.toLocaleString("en-IN")}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Trust & Guarantee Strip */}
                            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-2xs space-y-2.5 text-xs text-gray-600">
                                <div className="flex items-start gap-2.5">
                                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <span><strong>100% Genuine Guarantee:</strong> Direct OEM certified barcode & RFID hardware.</span>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <Truck className="w-4 h-4 text-[#2874f0] shrink-0 mt-0.5" />
                                    <span><strong>Express Logistics:</strong> Safe shipping via Blue Dart, Delhivery, DTDC with live tracking.</span>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <Phone className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                                    <span><strong>Direct Support:</strong> Call us at <strong>+91 8377929141</strong> for queries.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default function BuyNowPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#f1f3f6] flex items-center justify-center p-6">
                <div className="text-center space-y-3">
                    <RefreshCw className="w-8 h-8 text-[#2874f0] animate-spin mx-auto" />
                    <p className="text-xs font-bold text-gray-600">Loading Buy Now Checkout Page...</p>
                </div>
            </div>
        }>
            <BuyNowPageContent />
        </Suspense>
    );
}
