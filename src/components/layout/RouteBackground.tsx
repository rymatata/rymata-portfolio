"use client";
import { usePathname } from "next/navigation";
import { ParallaxNet } from "@/components/layout/ParallaxNet";
import { getBackground } from "@/lib/data/route-bg";

// Gradients can't animate, so the layers stay stacked and fade with opacity instead
const fadeLayer = "absolute inset-0 transition-opacity duration-500 ease-in-out motion-reduce:transition-none";

export function RouteBackground() {
    const { gradient, net } = getBackground(usePathname());

    return (
        // Base layer: always visible, shown alone for the "default" gradient
        <div aria-hidden className="fixed inset-0 -z-10 bg-default">
            {/* "dark" gradient : "default" pre-darkened by 55% black as its own OKLAB gradient */}
            <div className={`${fadeLayer} bg-default-dark ${gradient === "dark" ? "opacity-100" : "opacity-0"}`} />

            {/* "about" gradient */}
            <div className={`${fadeLayer} bg-about ${gradient === "about" ? "opacity-100" : "opacity-0"}`} />

            {/* Nets : One WebGL net per variant over the gradients, all drawing one shared spin and camera; each draws only while shown */}
            {/** Home <-> Projects/Resume crossfades the two nets in lockstep from where the last one was; Projects <-> Resume keeps the same net running **/}
            <ParallaxNet variant="default" active={net === "default"} className={fadeLayer} />
            <ParallaxNet variant="dark"    active={net === "dark"}    className={fadeLayer} />
        </div>
    );
}
