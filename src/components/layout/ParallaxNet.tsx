"use client";
import { useEffect, useRef, useState } from "react";
import type { NetRenderer } from "@/lib/parallax-net/renderer";
import type { NetVariant } from "@/lib/parallax-net/scene";

// The renderer reads the net's color back from the canvas' CSS color, so each variant styles it with its own token
const netColor = {
    default: "text-parallax-net",
    dark:    "text-parallax-net-dark",
} as const satisfies Record<NetVariant, string>;

// WebGL net layer of RouteBackground: Vanta NET redrawn on a bare canvas, one instance per variant
// Every variant draws one shared motion, so the net fading in picks up the spin and camera exactly where the last one was
// The renderer is imported on the first visit and then kept, so pages without the net never download it and coming back resumes the same net
export function ParallaxNet({ variant, active, className }: { variant: NetVariant; active: boolean; className: string }) {
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
            // Own chunk, fetched only once a route with the net is shown; shared by both variants
            import("@/lib/parallax-net/renderer").then(({ createNetRenderer }) => {
                if (cancelled) return;
                rendererRef.current = createNetRenderer(canvas, variant);
                rendererRef.current?.play();
                setReady(rendererRef.current !== null);
            });
        }

        return () => {
            cancelled = true;
            const renderer = rendererRef.current;
            if (!renderer) return;
            // Hands the motion to the next net but keeps drawing it, so both canvases show the same frame through the crossfade
            renderer.pause();
            // Stops drawing and frees the canvas' GPU memory once the fade-out ends; returning mid-fade cancels it, rejecting the promise
            Promise.all(canvas.getAnimations().map((animation) => animation.finished)).then(
                () => renderer.release(),
                () => {},
            );
        };
    }, [active, variant]);

    // RouteBackground never unmounts in production; this covers dev remounts (Fast Refresh, Strict Mode)
    useEffect(
        () => () => {
            rendererRef.current?.destroy();
            rendererRef.current = null;
        },
        [],
    );

    // size-full : A canvas doesn't stretch to its insets like a div, it would size to its pixel buffer instead
    // intro:opacity-0 : Held back through the first-load intro (the renderer still loads behind it); IntroGate's release starts the usual fade
    return (
        <canvas
            ref={canvasRef}
            className={`${className} size-full ${netColor[variant]} ${active && ready ? "opacity-100 intro:opacity-0" : "opacity-0"}`}
        />
    );
}
