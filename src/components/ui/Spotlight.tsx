"use client";
import { useEffect, useId, useRef } from "react";

// Distance from a host's center, in host lengths (its longer side), where its lights are halfway between their min and max strength
// The longer side, so a tall divider bar fades along its length the way a wide pill fades along its width
const FALLOFF = 0.275;

// Outline of a host that isn't a box, in its own SVG coordinates; the lights paint copies of it instead of the host's border-radius box
type Shape = { viewBox: string; path: string };

// Every mounted light and the host it sits in; one set of window listeners and one frame per pointer move serve them all
const lights = new Map<HTMLElement, HTMLElement>();
let pointer: { x: number; y: number } | null = null;  // Window px of the last pointer event; null until the first one
let present = false;                                   // A mouse or pen is in the window, or a touch is down
let frameId = 0;

// Pointer light and border glow on its host, ported from React Bits' MagicBento spotlight and border glow without its stars, tilt, magnetism, click wave, or intro
// Lit wherever the pointer is on screen: strongest with it on the host's center, weaker the farther away, never below the min strengths in globals.css
// Rendered as a child of the host it lights, so the host stays plain markup and its Server Component stays on the server
// A shaped host, like an Experience marker, passes its outline; the lights then paint over two copies of it, a fill and an edge ring clipped inside, so they follow every edge
//* The host needs relative and isolate: relative sizes the lights to the host; isolate keeps a box host's -z-1 lights above its fill but under its text
export function Spotlight({ shape }: { shape?: Shape }) {
    const lightRef = useRef<HTMLSpanElement>(null);
    const clipId = useId();

    useEffect(() => {
        const light = lightRef.current;
        const host = light?.parentElement;
        if (!light || !host) return;
        return track(light, host);
    }, []);

    if (!shape) {
        return (
            <span
                ref={lightRef}
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-1 rounded-[inherit] spotlight"
            />
        );
    }

    // No -z-1: a shaped host has no text to stay under, so its lights paint over the shape
    return (
        <span
            ref={lightRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 spotlight"
        >
            <svg viewBox={shape.viewBox}>
                <path d={shape.path} />
            </svg>
            <svg viewBox={shape.viewBox}>
                <clipPath id={clipId}>
                    <path d={shape.path} />
                </clipPath>
                <path
                    d={shape.path}
                    clipPath={`url(#${clipId})`}
                />
            </svg>
        </span>
    );
}

// Adds a light to the shared set, listening only while at least one is mounted; returns the cleanup
function track(light: HTMLElement, host: HTMLElement): () => void {
    if (!lights.size) listen();
    lights.set(light, host);
    requestFrame();
    return () => {
        lights.delete(light);
        if (!lights.size) unlisten();
    };
}

function requestFrame() {
    frameId ||= requestAnimationFrame(frame);
}

function frame() {
    frameId = 0;
    // Every box is read before any light is written, so a write never forces a fresh layout for the next read
    const boxes = Array.from(lights, ([light, host]) => [light, host.getBoundingClientRect()] as const);
    for (const [light, box] of boxes) aim(light, box);
}

// Over the host, the lights sit on the pointer; outside it, on the host's nearest edge point, so the side facing the pointer always glows
// --spotlight-near is 1 on the center and 1 / (1 + d²) at d FALLOFF lengths away, peaking smoothly; with no pointer it drops to 0, leaving the min strengths
function aim(light: HTMLElement, box: DOMRect) {
    const centerX = box.left + box.width / 2;
    const centerY = box.top + box.height / 2;
    const { x, y } = pointer ?? { x: centerX, y: centerY };
    const distance = Math.hypot(x - centerX, y - centerY) / (FALLOFF * Math.max(1, box.width, box.height));
    light.style.setProperty("--spotlight-x", `${(clamp(x, box.left, box.right) - box.left).toFixed(1)}px`);
    light.style.setProperty("--spotlight-y", `${(clamp(y, box.top, box.bottom) - box.top).toFixed(1)}px`);
    light.style.setProperty("--spotlight-near", present ? (1 / (1 + distance ** 2)).toFixed(3) : "0");
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

function onPointer(event: PointerEvent) {
    pointer = { x: event.clientX, y: event.clientY };
    present = true;
    requestFrame();
}

// A touch has no resting spot, so lifting it dims the lights; a mouse or pen keeps them aimed where it stopped
function onRelease(event: PointerEvent) {
    if (event.pointerType === "touch") onLeave();
}

// The lights stay where the pointer was last seen, dimming to their min strengths
function onLeave() {
    present = false;
    requestFrame();
}

function listen() {
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerdown", onPointer, { passive: true });
    window.addEventListener("pointerup", onRelease, { passive: true });
    window.addEventListener("pointercancel", onRelease, { passive: true });
    window.addEventListener("scroll", requestFrame, { passive: true });  // Scrolling moves the hosts under a still pointer
    window.addEventListener("resize", requestFrame, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);  // The pointer left the window
}

function unlisten() {
    window.removeEventListener("pointermove", onPointer);
    window.removeEventListener("pointerdown", onPointer);
    window.removeEventListener("pointerup", onRelease);
    window.removeEventListener("pointercancel", onRelease);
    window.removeEventListener("scroll", requestFrame);
    window.removeEventListener("resize", requestFrame);
    document.documentElement.removeEventListener("pointerleave", onLeave);
    cancelAnimationFrame(frameId);
    frameId = 0;
}
