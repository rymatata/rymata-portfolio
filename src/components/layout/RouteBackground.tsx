"use client";
import { usePathname } from "next/navigation";
import { getBackground } from "@/lib/data/route-bg";

// Gradients can't animate, so the layers stay stacked and fade with opacity instead
const fadeLayer = "absolute inset-0 transition-opacity duration-500 ease-in-out motion-reduce:transition-none";

export function RouteBackground() {
    const background = getBackground(usePathname());

    return (
        // Base layer: always visible, shown alone for "default"
        <div aria-hidden className="fixed inset-0 -z-10 bg-default">
            {/* "default-dark" background; "default" pre-darkened by 55% black as its own OKLAB gradient */}
            <div className={`${fadeLayer} bg-default-dark ${background === "dark" ? "opacity-100" : "opacity-0"}`} />

            {/* "about" background */}
            <div className={`${fadeLayer} bg-about ${background === "about" ? "opacity-100" : "opacity-0"}`} />
        </div>
    );
}
