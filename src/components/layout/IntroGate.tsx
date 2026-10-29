"use client";
import { useEffect } from "react";
import { INTRO_ATTR } from "@/lib/intro";

// Ends the intro once the nav and banner slides finish, which lets the parallax net run its usual fade-in
// Under reduced motion no slides run, so the net is released right away
export function IntroGate() {
    useEffect(() => {
        const root = document.documentElement;
        if (!root.hasAttribute(INTRO_ATTR)) return;
        let cancelled = false;

        // Finished animations drop out of the list, so hydrating after the slides releases the net immediately
        // allSettled : Leaving Home mid-intro cancels the banner's slide, rejecting its promise
        const slides = document
            .getAnimations()
            .filter((animation) => animation instanceof CSSAnimation && animation.animationName.startsWith("intro-"));

        Promise.allSettled(slides.map((slide) => slide.finished)).then(() => {
            // Registered as <time>, so it always reads back in seconds
            const gap = parseFloat(getComputedStyle(root).getPropertyValue("--intro-net-delay")) * 1000 || 0;
            setTimeout(() => {
                if (!cancelled) root.removeAttribute(INTRO_ATTR);
            }, gap);
        });

        // Dev remounts (Strict Mode, Fast Refresh) rerun the effect, which picks the same slides back up
        return () => {
            cancelled = true;
        };
    }, []);

    return null;
}
