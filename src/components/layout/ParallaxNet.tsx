"use client";
import { useEffect, useRef, useState } from "react";
import type { NetRenderer } from "@/lib/parallax-net/renderer";

// WebGL layer of the "parallax" background: Vanta NET redrawn on a bare canvas
// The renderer is imported on the first visit and then kept, so other pages never download it and coming back resumes the same net
export function ParallaxNet({ active, className }: { active: boolean; className: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<NetRenderer | null>(null);
    const [ready, setReady] = useState(false);  // Hidden until a renderer exists; without WebGL2 only the gradient shows

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!active || !canvas) return;
        let cancelled = false;

        if (rendererRef.current) {
            rendererRef.current.play();
        } else {
            // Own chunk, fetched only once a "parallax" route is shown
            import("@/lib/parallax-net/renderer").then(({ createNetRenderer }) => {
                if (cancelled) return;
                rendererRef.current = createNetRenderer(canvas);
                rendererRef.current?.play();
                setReady(rendererRef.current !== null);
            });
        }

        return () => {
            cancelled = true;
            const renderer = rendererRef.current;
            if (!renderer) return;
            renderer.pause();
            // Frees the canvas' GPU memory once the fade-out ends; returning mid-fade cancels it, rejecting the promise
            Promise.all(canvas.getAnimations().map((animation) => animation.finished)).then(
                () => renderer.release(),
                () => {},
            );
        };
    }, [active]);

    // RouteBackground never unmounts in production; this covers dev remounts (Fast Refresh, Strict Mode)
    useEffect(
        () => () => {
            rendererRef.current?.destroy();
            rendererRef.current = null;
        },
        [],
    );

    // size-full : A canvas doesn't stretch to its insets like a div, it would size to its pixel buffer instead
    return (
        <canvas
            ref={canvasRef}
            className={`${className} size-full text-parallax-net ${active && ready ? "opacity-100" : "opacity-0"}`}
        />
    );
}
