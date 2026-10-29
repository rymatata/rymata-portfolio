"use client";
import { useEffect, useRef, useState } from "react";
import type { FlatNetRenderer } from "@/lib/parallax-net/flat-renderer";

// WebGL net behind the About headshot: Vanta NET flattened to 2D, looping in place and gliding with the pointer
// Its own renderer and clock, apart from RouteBackground's nets, so neither disturbs the other through a page change
export function HeadshotNet({ className }: { className: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [ready, setReady] = useState(false);  // Hidden until a renderer exists; without WebGL2 only the photo shows

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        let cancelled = false;
        let renderer: FlatNetRenderer | null = null;

        // Own chunk, fetched only on About
        import("@/lib/parallax-net/flat-renderer").then(({ createFlatNetRenderer }) => {
            if (cancelled) return;
            renderer = createFlatNetRenderer(canvas);
            setReady(renderer !== null);
        });

        return () => {
            cancelled = true;
            renderer?.destroy();
        };
    }, []);

    // size-full : A canvas doesn't stretch to its insets like a div, it would size to its pixel buffer instead
    return (
        <canvas
            ref={canvasRef}
            aria-hidden
            className={`${className} pointer-events-none size-full text-parallax-net-about transition-opacity duration-500 ease-in-out motion-reduce:transition-none ${ready ? "opacity-100" : "opacity-0"}`}
        />
    );
}
