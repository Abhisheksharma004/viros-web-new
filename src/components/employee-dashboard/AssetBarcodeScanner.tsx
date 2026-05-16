"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Camera, Loader2, ScanLine, SwitchCamera, X } from "lucide-react";

type CameraDevice = { id: string; label: string };

type AssetBarcodeScannerProps = {
    onScan: (code: string) => void;
    onClose: () => void;
    disabled?: boolean;
};

/** Time for the OS/browser to release the previous camera device. */
const CAMERA_RELEASE_DELAY_MS = 400;

const SCANNER_CONFIG = {
    fps: 10,
    qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
        const size = Math.min(viewfinderWidth, viewfinderHeight) * 0.75;
        return { width: Math.floor(size), height: Math.floor(Math.min(size * 0.55, 180)) };
    },
    aspectRatio: 1,
} as const;

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isBackCamera(label: string): boolean {
    const l = label.toLowerCase();
    return l.includes("back") || l.includes("rear") || l.includes("environment");
}

function isFrontCamera(label: string): boolean {
    const l = label.toLowerCase();
    return l.includes("front") || l.includes("user") || l.includes("face");
}

function pickDefaultCameraIndex(devices: CameraDevice[]): number {
    const backIdx = devices.findIndex((d) => isBackCamera(d.label));
    if (backIdx >= 0) return backIdx;
    const notFrontIdx = devices.findIndex((d) => !isFrontCamera(d.label));
    if (notFrontIdx >= 0) return notFrontIdx;
    return 0;
}

function cameraShortLabel(label: string, index: number): string {
    if (isBackCamera(label)) return "Back";
    if (isFrontCamera(label)) return "Front";
    return label.trim() ? label.slice(0, 24) : `Camera ${index + 1}`;
}

function stopMediaTracksInContainer(containerId: string): void {
    const root = document.getElementById(containerId);
    if (!root) return;
    root.querySelectorAll("video").forEach((video) => {
        const stream = video.srcObject;
        if (stream instanceof MediaStream) {
            stream.getTracks().forEach((track) => {
                try {
                    track.stop();
                } catch {
                    /* ignore */
                }
            });
        }
        video.srcObject = null;
    });
}

export default function AssetBarcodeScanner({ onScan, onClose, disabled }: AssetBarcodeScannerProps) {
    const containerId = useId().replace(/:/g, "");
    const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
    const onScanRef = useRef(onScan);
    const switchLockRef = useRef(false);

    const [cameraError, setCameraError] = useState("");
    const [isStarting, setIsStarting] = useState(true);
    const [isSwitching, setIsSwitching] = useState(false);
    const [cameras, setCameras] = useState<CameraDevice[]>([]);
    const [activeCameraIndex, setActiveCameraIndex] = useState(0);

    useEffect(() => {
        onScanRef.current = onScan;
    }, [onScan]);

    const getFormats = useCallback(async () => {
        const { Html5QrcodeSupportedFormats } = await import("html5-qrcode");
        return [
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.DATA_MATRIX,
        ];
    }, []);

    const releaseScanner = useCallback(async () => {
        const scanner = scannerRef.current;
        scannerRef.current = null;

        if (scanner) {
            try {
                const state = scanner.getState();
                // 2 = SCANNING, 3 = PAUSED
                if (state === 2 || state === 3) {
                    await scanner.stop();
                }
            } catch {
                /* ignore stop errors */
            }
            try {
                scanner.clear();
            } catch {
                /* ignore clear errors */
            }
        }

        stopMediaTracksInContainer(containerId);
        await delay(CAMERA_RELEASE_DELAY_MS);
    }, [containerId]);

    const startWithDeviceId = useCallback(
        async (deviceId: string) => {
            if (scannerRef.current) {
                await releaseScanner();
            }

            stopMediaTracksInContainer(containerId);

            const { Html5Qrcode } = await import("html5-qrcode");
            const formats = await getFormats();

            const scanner = new Html5Qrcode(containerId, { formatsToSupport: formats, verbose: false });
            scannerRef.current = scanner;

            await scanner.start(
                deviceId,
                SCANNER_CONFIG,
                (decodedText) => {
                    const value = decodedText.trim();
                    if (!value) return;
                    void (async () => {
                        await releaseScanner();
                        onScanRef.current(value);
                    })();
                },
                () => {
                    /* per-frame decode miss */
                },
            );
        },
        [containerId, getFormats, releaseScanner],
    );

    const switchCamera = useCallback(async () => {
        if (cameras.length < 2 || switchLockRef.current || disabled) return;

        const nextIndex = (activeCameraIndex + 1) % cameras.length;
        const nextDevice = cameras[nextIndex];
        const prevDevice = cameras[activeCameraIndex];
        if (!nextDevice) return;

        switchLockRef.current = true;
        setIsSwitching(true);
        setCameraError("");

        try {
            try {
                await startWithDeviceId(nextDevice.id);
            } catch (firstErr) {
                console.warn("Camera switch first attempt failed, retrying:", firstErr);
                await delay(CAMERA_RELEASE_DELAY_MS);
                await startWithDeviceId(nextDevice.id);
            }
            setActiveCameraIndex(nextIndex);
        } catch (err) {
            console.error("Camera switch failed:", err);
            try {
                if (prevDevice) {
                    await delay(CAMERA_RELEASE_DELAY_MS);
                    await startWithDeviceId(prevDevice.id);
                    setCameraError("");
                } else {
                    throw err;
                }
            } catch {
                setCameraError("Could not switch camera. Close and reopen the scanner, or use manual entry.");
            }
        } finally {
            switchLockRef.current = false;
            setIsSwitching(false);
        }
    }, [activeCameraIndex, cameras, disabled, releaseScanner, startWithDeviceId]);

    useEffect(() => {
        if (disabled) return;

        let cancelled = false;

        const init = async () => {
            setCameraError("");
            setIsStarting(true);

            try {
                const { Html5Qrcode } = await import("html5-qrcode");
                if (cancelled) return;

                const devices = await Html5Qrcode.getCameras();
                if (cancelled) return;

                if (devices.length === 0) {
                    setCameraError("No camera found on this device.");
                    setIsStarting(false);
                    return;
                }

                setCameras(devices);

                const defaultIndex = pickDefaultCameraIndex(devices);
                setActiveCameraIndex(defaultIndex);

                await startWithDeviceId(devices[defaultIndex]!.id);
                if (!cancelled) setIsStarting(false);
            } catch (err) {
                if (cancelled) return;
                console.error("Barcode scanner start failed:", err);
                setCameraError(
                    err instanceof Error
                        ? err.message
                        : "Unable to access the camera. Check permissions or use manual entry.",
                );
                setIsStarting(false);
            }
        };

        void init();

        return () => {
            cancelled = true;
            void releaseScanner();
        };
    }, [disabled, releaseScanner, startWithDeviceId]);

    const activeLabel =
        cameras[activeCameraIndex] != null
            ? cameraShortLabel(cameras[activeCameraIndex]!.label, activeCameraIndex)
            : "Camera";

    const showViewfinder = !cameraError;
    const busy = isStarting || isSwitching;

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-black sm:items-center sm:justify-center sm:bg-black/60 sm:p-4 sm:backdrop-blur-[1px]">
            <div className="absolute inset-0 hidden sm:block" aria-hidden onClick={onClose} />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="barcode-scanner-title"
                className="relative flex h-full w-full flex-col overflow-hidden bg-white sm:h-auto sm:max-h-[min(100dvh,640px)] sm:max-w-md sm:rounded-2xl sm:border sm:border-gray-200 sm:shadow-2xl"
            >
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:pt-3">
                    <h3 id="barcode-scanner-title" className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <ScanLine className="h-5 w-5 text-[#0d4f3c]" aria-hidden />
                        Scan asset barcode
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center rounded-xl p-2.5 text-gray-500 touch-manipulation transition hover:bg-gray-100 hover:text-gray-700 active:scale-95"
                        aria-label="Close scanner"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="relative flex min-h-0 flex-1 flex-col bg-gray-900 sm:flex-none">
                    <div
                        id={containerId}
                        className={`min-h-0 flex-1 w-full sm:min-h-[280px] [&_video]:!h-full [&_video]:!w-full [&_video]:!object-cover ${busy ? "invisible" : ""}`}
                    />
                    {busy && !cameraError ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-900 text-white">
                            <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
                            <p className="text-sm">{isSwitching ? "Switching camera…" : "Starting camera…"}</p>
                        </div>
                    ) : null}
                    {cameraError ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900/90 px-6 text-center text-white">
                            <Camera className="h-10 w-10 text-white/70" aria-hidden />
                            <p className="max-w-xs text-sm">{cameraError}</p>
                        </div>
                    ) : null}

                    {showViewfinder && cameras.length > 1 && !busy ? (
                        <button
                            type="button"
                            onClick={() => void switchCamera()}
                            disabled={isSwitching || disabled}
                            className="absolute bottom-4 right-4 inline-flex min-h-[3rem] items-center gap-2 rounded-full bg-black/60 px-4 py-3 text-sm font-semibold text-white backdrop-blur-sm transition touch-manipulation hover:bg-black/75 active:scale-95 disabled:opacity-50 sm:bottom-3 sm:right-3 sm:min-h-0 sm:px-3 sm:py-2 sm:text-xs"
                            aria-label={`Switch camera. Currently using ${activeLabel} camera`}
                        >
                            <SwitchCamera className="h-5 w-5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
                            {activeLabel}
                        </button>
                    ) : null}
                </div>

                <p
                    className="shrink-0 border-t border-gray-100 px-4 py-3 text-center text-xs text-gray-500 sm:text-left"
                    style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
                >
                    Point the camera at the asset tag or barcode.
                    {cameras.length > 1 ? " Tap the camera button to switch between front and back." : ""}
                </p>
            </div>
        </div>
    );
}
