"use client";

import { useEffect, useRef } from "react";

export type HeroVortexTheme = "default" | "birthday-today" | "birthday-soon" | "corporate-event";

const PALETTE: Record<HeroVortexTheme, string[]> = {
    default: ["#38bdf8", "#60a5fa", "#818cf8", "#22d3ee"],
    "birthday-today": ["#fb923c", "#f472b6", "#fbbf24", "#fb7185"],
    "birthday-soon": ["#c084fc", "#e879f9", "#a78bfa", "#f472b6"],
    "corporate-event": ["#60a5fa", "#38bdf8", "#818cf8", "#a78bfa"],
};

type HeroVortexBackgroundProps = {
    theme?: HeroVortexTheme;
    active?: boolean;
    className?: string;
};

export default function HeroVortexBackground({
    theme = "default",
    active = true,
    className = "",
}: HeroVortexBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!active) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const parent = canvas.parentElement;
        if (!parent) return;

        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const colors = PALETTE[theme];
        let frameId = 0;
        let time = 0;
        let running = true;

        const resize = () => {
            const { width, height } = parent.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.max(1, Math.floor(width * dpr));
            canvas.height = Math.max(1, Math.floor(height * dpr));
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        const draw = () => {
            const width = parent.clientWidth;
            const height = parent.clientHeight;
            if (width <= 0 || height <= 0) {
                frameId = requestAnimationFrame(draw);
                return;
            }

            ctx.clearRect(0, 0, width, height);

            const cx = width * 0.58;
            const cy = height * 0.42;
            const maxRadius = Math.max(width, height) * 0.82;
            const arms = 5;
            const spiralTurns = 3.8;

            for (let arm = 0; arm < arms; arm++) {
                const color = colors[arm % colors.length];
                ctx.strokeStyle = color;
                ctx.globalAlpha = 0.2;
                ctx.lineWidth = 1.25;
                ctx.beginPath();

                const armOffset = (arm * Math.PI * 2) / arms;
                const segments = 140;

                for (let i = 0; i <= segments; i++) {
                    const progress = i / segments;
                    const angle =
                        progress * Math.PI * spiralTurns + armOffset + (reducedMotion ? 0 : time * 0.0035);
                    const radius = progress * maxRadius;
                    const x = cx + Math.cos(angle) * radius;
                    const y = cy + Math.sin(angle) * radius;

                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }

                ctx.stroke();
            }

            const particleCount = 28;
            for (let i = 0; i < particleCount; i++) {
                const progress = (i / particleCount + (reducedMotion ? 0 : time * 0.00025)) % 1;
                const angle = progress * Math.PI * spiralTurns * 1.15 + (reducedMotion ? 0 : time * 0.004);
                const radius = progress * maxRadius * 0.72;
                const x = cx + Math.cos(angle) * radius;
                const y = cy + Math.sin(angle) * radius;

                ctx.globalAlpha = 0.12 + (1 - progress) * 0.28;
                ctx.fillStyle = colors[i % colors.length];
                ctx.beginPath();
                ctx.arc(x, y, 0.8 + (1 - progress) * 2.2, 0, Math.PI * 2);
                ctx.fill();
            }

            const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius * 0.45);
            glow.addColorStop(0, `${colors[0]}22`);
            glow.addColorStop(1, "transparent");
            ctx.globalAlpha = 1;
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, width, height);

            if (!reducedMotion) time += 1;
            if (running) frameId = requestAnimationFrame(draw);
        };

        resize();
        draw();

        const observer = new ResizeObserver(resize);
        observer.observe(parent);

        return () => {
            running = false;
            cancelAnimationFrame(frameId);
            observer.disconnect();
        };
    }, [theme, active]);

    return (
        <canvas
            ref={canvasRef}
            className={`pointer-events-none absolute inset-0 z-0 h-full w-full opacity-90 ${className}`}
            aria-hidden
        />
    );
}
