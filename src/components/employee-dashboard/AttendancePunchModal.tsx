"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    Camera,
    Loader2,
    MapPin,
    RefreshCw,
    X,
} from "lucide-react";
import PhotoLightbox from "@/components/employee-dashboard/PhotoLightbox";

export type PunchLocation = {
    latitude: number;
    longitude: number;
    accuracy: number;
    address?: string;
};

export type PunchCapture = {
    time: string;
    /** ISO timestamp for accurate late / duration calculations */
    punchedAt: string;
    photoDataUrl: string;
    location: PunchLocation;
};

type AttendancePunchModalProps = {
    mode: "check-in" | "check-out";
    open: boolean;
    onClose: () => void;
    onConfirm: (capture: PunchCapture) => void;
    submitting?: boolean;
};

function formatTime(d: Date) {
    return d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
    });
}

async function reverseGeocode(lat: number, lng: number): Promise<string | undefined> {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`,
            { headers: { Accept: "application/json" } },
        );
        if (!res.ok) return undefined;
        const data = (await res.json()) as { display_name?: string };
        return typeof data.display_name === "string" ? data.display_name : undefined;
    } catch {
        return undefined;
    }
}

export default function AttendancePunchModal({
    mode,
    open,
    onClose,
    onConfirm,
    submitting: submittingExternal = false,
}: AttendancePunchModalProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [location, setLocation] = useState<PunchLocation | null>(null);
    const [locationError, setLocationError] = useState("");
    const [locationLoading, setLocationLoading] = useState(false);

    const [cameraError, setCameraError] = useState("");
    const [cameraReady, setCameraReady] = useState(false);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [previewPhoto, setPreviewPhoto] = useState(false);

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
        setCameraReady(false);
    }, []);

    const fetchLocation = useCallback(async () => {
        setLocationLoading(true);
        setLocationError("");
        setLocation(null);

        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported on this device.");
            setLocationLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const base: PunchLocation = {
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy: Math.round(pos.coords.accuracy),
                };
                const address = await reverseGeocode(base.latitude, base.longitude);
                setLocation(address ? { ...base, address } : base);
                setLocationLoading(false);
            },
            (err) => {
                setLocationError(
                    err.code === 1
                        ? "Location permission denied. Allow location to punch attendance."
                        : "Could not get your location. Try again outdoors or enable GPS.",
                );
                setLocationLoading(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
        );
    }, []);

    const startCamera = useCallback(async () => {
        setCameraError("");
        setCapturedPhoto(null);
        stopCamera();

        if (!navigator.mediaDevices?.getUserMedia) {
            setCameraError("Camera is not supported on this device.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } },
                audio: false,
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            setCameraReady(true);
        } catch {
            setCameraError("Camera permission denied or unavailable. Allow camera access to continue.");
        }
    }, [stopCamera]);

    useEffect(() => {
        if (!open) {
            stopCamera();
            setCapturedPhoto(null);
            setPreviewPhoto(false);
            setLocation(null);
            setLocationError("");
            setCameraError("");
            return;
        }

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        void fetchLocation();
        void startCamera();

        return () => {
            document.body.style.overflow = prevOverflow;
            stopCamera();
        };
    }, [open, fetchLocation, startCamera, stopCamera]);

    const capturePhoto = () => {
        const video = videoRef.current;
        if (!video || !cameraReady) return;

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 640;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setCapturedPhoto(canvas.toDataURL("image/jpeg", 0.85));
        stopCamera();
    };

    const retakePhoto = () => {
        setCapturedPhoto(null);
        void startCamera();
    };

    const handleConfirm = async () => {
        if (!location || !capturedPhoto || submittingExternal) return;
        setSubmitting(true);
        try {
            const punchedAt = new Date();
            await onConfirm({
                time: formatTime(punchedAt),
                punchedAt: punchedAt.toISOString(),
                photoDataUrl: capturedPhoto,
                location,
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (!open) return null;

    const title = mode === "check-in" ? "Check in" : "Check out";
    const busy = submitting || submittingExternal;
    const canSubmit = Boolean(location && capturedPhoto && !busy);

    return (
        <>
            <PhotoLightbox
                open={previewPhoto && Boolean(capturedPhoto)}
                src={capturedPhoto}
                alt="Captured selfie"
                onClose={() => setPreviewPhoto(false)}
            />
            <div
                className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4"
                role="presentation"
            >
                <button
                    type="button"
                    className="absolute inset-0 bg-[#06124f]/60 backdrop-blur-sm"
                    onClick={() => !busy && onClose()}
                    aria-label="Close dialog backdrop"
                />

                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="punch-modal-title"
                    className="relative flex max-h-[min(92dvh,100%)] w-full max-w-lg flex-col overflow-hidden rounded-t-lg border border-[#0a2a5e]/10 bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-md"
                >
                    {/* Header */}
                    <div
                        className="relative shrink-0 px-4 pb-4 pt-5 text-white sm:px-5 sm:pt-5"
                        style={{
                            background: "linear-gradient(135deg, #06124f 0%, #0a2a5e 55%, #0d3a7a 100%)",
                        }}
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={busy}
                            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-md bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-50 sm:right-4 sm:top-4"
                            aria-label="Close"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <div className="pr-12">
                            <h2 id="punch-modal-title" className="text-xl font-bold sm:text-2xl">
                                {title}
                            </h2>
                            <p className="mt-1 text-sm text-white/75">
                                Capture your selfie, then confirm GPS location
                            </p>
                        </div>
                    </div>

                    {/* Scrollable body */}
                    <div className="flex-1 overflow-y-auto overscroll-contain bg-[#f8fafc] p-4 sm:p-5">
                        <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-5">
                            {/* Live selfie */}
                            <section className="overflow-hidden rounded-md border border-[#0a2a5e]/10 bg-white shadow-sm">
                                <div className="flex items-center gap-2 border-b border-[#0a2a5e]/10 bg-[#0a2a5e]/5 px-4 py-3">
                                    <Camera className="h-4 w-4 shrink-0 text-[#0a2a5e]" aria-hidden />
                                    <span className="text-sm font-bold text-[#0a2a5e]">Live selfie</span>
                                    {capturedPhoto && (
                                        <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                            Captured
                                        </span>
                                    )}
                                </div>
                                <div className="relative aspect-square mx-auto w-full max-w-[300px] bg-gray-900 sm:max-w-[320px]">
                                    {!capturedPhoto ? (
                                        <>
                                            <video
                                                ref={videoRef}
                                                playsInline
                                                muted
                                                className="absolute inset-0 h-full w-full object-cover"
                                                style={{ transform: "scaleX(-1)" }}
                                            />
                                            {!cameraReady && !cameraError && (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/90">
                                                    <Loader2 className="h-6 w-6 animate-spin" />
                                                    <p className="text-sm font-medium">Starting camera…</p>
                                                </div>
                                            )}
                                            {cameraError && (
                                                <div className="absolute inset-0 flex items-center justify-center p-4">
                                                    <p className="rounded-md bg-red-500/90 px-3 py-2 text-center text-sm text-white">
                                                        {cameraError}
                                                    </p>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setPreviewPhoto(true)}
                                            className="absolute inset-0 h-full w-full cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-[#06b6d4] focus:ring-inset"
                                            aria-label="View full size photo"
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={capturedPhoto}
                                                alt="Captured attendance selfie"
                                                className="h-full w-full object-cover"
                                                style={{ transform: "scaleX(-1)" }}
                                            />
                                            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                                                Tap to enlarge
                                            </span>
                                        </button>
                                    )}
                                </div>
                            </section>

                            {/* Live location */}
                            <section className="flex flex-col overflow-hidden rounded-md border border-[#0a2a5e]/10 bg-white shadow-sm">
                                <div className="flex items-center justify-between gap-2 border-b border-[#0a2a5e]/10 bg-[#0a2a5e]/5 px-4 py-3">
                                    <div className="flex items-center gap-2 text-sm font-bold text-[#0a2a5e]">
                                        <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                                        Live location
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => void fetchLocation()}
                                        disabled={locationLoading}
                                        className="inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-md border border-[#0a2a5e]/15 bg-white px-3 text-xs font-semibold text-[#0a2a5e] transition hover:bg-[#0a2a5e]/5 disabled:opacity-50"
                                    >
                                        <RefreshCw
                                            className={`h-3.5 w-3.5 ${locationLoading ? "animate-spin" : ""}`}
                                        />
                                        Refresh
                                    </button>
                                </div>
                                <div className="flex flex-1 flex-col justify-center p-4">
                                    {locationLoading && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#06b6d4]" />
                                            Getting GPS coordinates…
                                        </div>
                                    )}
                                    {locationError && (
                                        <p className="rounded-md border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                                            {locationError}
                                        </p>
                                    )}
                                    {location && !locationLoading && (
                                        <div className="space-y-2">
                                            <p className="text-sm leading-relaxed text-gray-800">
                                                {location.address ??
                                                    `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}{" "}
                                                · ±{location.accuracy}m
                                            </p>
                                            <a
                                                href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-sm font-semibold text-[#06b6d4] hover:underline"
                                            >
                                                Open in Maps →
                                            </a>
                                        </div>
                                    )}
                                    {!locationLoading && !locationError && !location && (
                                        <p className="text-sm text-gray-500">Waiting for location…</p>
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>

                    {/* Footer actions */}
                    <div className="shrink-0 border-t border-[#0a2a5e]/10 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
                        {!capturedPhoto ? (
                            <button
                                type="button"
                                onClick={capturePhoto}
                                disabled={!cameraReady}
                                className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-md bg-[#06b6d4] text-base font-bold text-white shadow-lg shadow-[#06b6d4]/25 transition active:scale-[0.98] hover:bg-[#05a8b8] disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-[48px] sm:text-sm"
                            >
                                <Camera className="h-5 w-5" aria-hidden />
                                Capture photo
                            </button>
                        ) : (
                            <div className="flex flex-col gap-2.5 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={retakePhoto}
                                    disabled={busy}
                                    className="min-h-[52px] flex-1 rounded-md border border-[#0a2a5e]/20 bg-white text-base font-bold text-[#0a2a5e] transition active:bg-[#0a2a5e]/5 disabled:opacity-50 sm:min-h-[48px] sm:text-sm"
                                >
                                    Retake
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void handleConfirm()}
                                    disabled={!canSubmit}
                                    className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-md bg-[#06124f] text-base font-bold text-white shadow-lg shadow-[#06124f]/20 transition active:scale-[0.98] hover:bg-[#0a2a5e] disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-[48px] sm:text-sm"
                                >
                                    {busy ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Saving…
                                        </>
                                    ) : (
                                        `Confirm ${mode === "check-in" ? "check-in" : "check-out"}`
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
