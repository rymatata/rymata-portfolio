"use client";
import { useEffect, useRef } from "react";

interface TiltProps {
    className: string;
    amplitude?: number;    // Degrees of tilt with the pointer on the area's rim
    smoothness?: number;   // 0 to 1; low snaps to the pointer, high glides and settles with a soft bounce
    perspective?: number;  // Viewing distance as a multiple of the area's width, so the depth reads the same at any size
    falloff?: number;      // Distance past the rim, in area widths, where the tilt is down to half
    children: React.ReactNode;
}

interface Spring {
    value: number;     // Degrees
    velocity: number;  // Degrees per second
}

// Pointer-driven 3D tilt, ported from React Bits' TiltedCard without its glare, shadow, scale, caption, flip, or intro
// Follows the pointer anywhere in the window: full strength over the area, weaker the farther away, but never flat while the pointer is in the window
// A touch tilts toward the finger until it lifts; on the area, a sideways drag keeps tilting instead of going to the browser
//* Holds still under reduced motion, like the parallax nets
export function Tilt({ className, amplitude = 12, smoothness = 0.6, perspective = 800 / 300, falloff = 1, children }: TiltProps) {
    const areaRef = useRef<HTMLDivElement>(null);
    const bodyRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const area = areaRef.current;
        const body = bodyRef.current;
        if (!area || !body) return;
        return trackTilt(area, body, amplitude, smoothness, perspective, falloff);
    }, [amplitude, smoothness, perspective, falloff]);

    // touch-pan-y touch-pinch-zoom : Vertical drags and pinches still scroll and zoom
    return (
        <div ref={areaRef} className={`${className} touch-pan-y touch-pinch-zoom`}>
            <div ref={bodyRef} className="size-full">
                {children}
            </div>
        </div>
    );
}

// Tilts the body toward the pointer wherever it is in the window; returns the cleanup
function trackTilt(area: HTMLElement, body: HTMLElement, amplitude: number, smoothness: number, perspective: number, falloff: number): () => void {
    // TiltedCard's spring: quick and fully damped at 0 smoothness, slower with a soft bounce at 1
    const omega = 20 * 0.2 ** smoothness;  // Natural frequency, rad/s
    const zeta = 1 - 0.3 * smoothness;     // Damping ratio
    const pitch: Spring = { value: 0, velocity: 0 };  // rotateX, from the pointer's height
    const yaw: Spring = { value: 0, velocity: 0 };    // rotateY, from the pointer's side
    const aim = { x: 0, y: 0 };                       // Toward the pointer; ±1 at the area's rim, shrinking beyond it
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    let pointer: { x: number; y: number } | null = null;  // Window px; null until it first moves, and once it leaves the window or a touch lifts
    let visible = false;
    let frameId = 0;
    let lastFrame = 0;

    // Runs only while on screen; coming back picks up wherever the pointer went meanwhile
    const intersectionObserver = new IntersectionObserver((entries) => {
        visible = entries.at(-1)?.isIntersecting ?? visible;
        requestFrame();
    });

    function onPointer(event: PointerEvent) {
        pointer = { x: event.clientX, y: event.clientY };
        requestFrame();
    }

    // A touch has no resting spot, so lifting it settles the body flat; a mouse or pen keeps aiming where it stopped
    function onRelease(event: PointerEvent) {
        if (event.pointerType === "touch") onLeave();
    }

    function onLeave() {
        pointer = null;
        requestFrame();
    }

    function requestFrame() {
        if (visible) frameId ||= requestAnimationFrame(frame);
    }

    function frame(now: number) {
        frameId = 0;
        // Capped, so a long frame can't jolt the springs
        const delta = lastFrame ? Math.min((now - lastFrame) / 1000, 0.05) : 0;
        lastFrame = now;

        // Measured every frame, so scrolling under a still pointer turns the tilt too
        const box = area.getBoundingClientRect();
        aimAtPointer(box);

        // The side toward the pointer sinks away, as if pressed; flat under reduced motion
        const tilt = reducedMotion.matches ? 0 : amplitude;
        const pitching = stepSpring(pitch, -aim.y * tilt, omega, zeta, delta);
        const yawing = stepSpring(yaw, aim.x * tilt, omega, zeta, delta);

        // Dropped at rest, so the resting body isn't left on its own 3D layer
        body.style.transform = pitch.value || yaw.value
            ? `perspective(${(box.width * perspective).toFixed(1)}px) rotateX(${pitch.value.toFixed(3)}deg) rotateY(${yaw.value.toFixed(3)}deg)`
            : "";

        // Loops until both springs settle or the area leaves the screen; the next pointer, scroll, or visibility change starts it again
        if (pitching || yawing) requestFrame();
        if (!frameId) lastFrame = 0;
    }

    // Over the area, the aim runs from 0 at its center to ±1 at its rim
    // Beyond the rim it points at the pointer, at 1 / (1 + distance past the rim / falloff widths): half strength one falloff away, never 0
    function aimAtPointer(box: DOMRect) {
        if (!pointer) {
            aim.x = aim.y = 0;
            return;
        }
        const offsetX = pointer.x - (box.left + box.width / 2);
        const offsetY = pointer.y - (box.top + box.height / 2);
        aim.x = offsetX / (box.width / 2);
        aim.y = offsetY / (box.height / 2);

        const reach = Math.hypot(aim.x, aim.y);  // 1 on the rim
        if (reach <= 1) return;
        const past = Math.hypot(offsetX, offsetY) * (1 - 1 / reach);  // px past the rim
        const strength = 1 / (1 + past / (falloff * box.width));
        aim.x *= strength / reach;
        aim.y *= strength / reach;
    }

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerdown", onPointer, { passive: true });
    window.addEventListener("pointerup", onRelease, { passive: true });
    window.addEventListener("pointercancel", onRelease, { passive: true });
    window.addEventListener("scroll", requestFrame, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);  // The pointer left the window
    reducedMotion.addEventListener("change", requestFrame);              // Turning it on mid-tilt settles the body flat
    intersectionObserver.observe(area);                                  // Reports right away, starting the first frame if on screen

    return () => {
        window.removeEventListener("pointermove", onPointer);
        window.removeEventListener("pointerdown", onPointer);
        window.removeEventListener("pointerup", onRelease);
        window.removeEventListener("pointercancel", onRelease);
        window.removeEventListener("scroll", requestFrame);
        document.documentElement.removeEventListener("pointerleave", onLeave);
        reducedMotion.removeEventListener("change", requestFrame);
        intersectionObserver.disconnect();
        cancelAnimationFrame(frameId);
        body.style.transform = "";
    };
}

// One damped-spring step toward the target, sub-stepped at 240 Hz so a long frame stays stable; false once settled
function stepSpring(spring: Spring, target: number, omega: number, zeta: number, delta: number): boolean {
    const steps = Math.max(1, Math.ceil(delta * 240));
    const h = delta / steps;
    for (let i = 0; i < steps; i++) {
        spring.velocity += (omega * omega * (target - spring.value) - 2 * zeta * omega * spring.velocity) * h;
        spring.value += spring.velocity * h;
    }

    const settled = Math.abs(target - spring.value) < 0.001 && Math.abs(spring.velocity) < 0.01;
    if (settled) {
        spring.value = target;
        spring.velocity = 0;
    }
    return !settled;
}
