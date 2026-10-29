import { aimCamera, type CameraConfig, type CameraView, type NetConfig } from "./scene";

// The one motion every net draws: a single clock, spin, and camera
// The net fading in picks up exactly where the one fading out is, and both paint the same frame until the fade ends

export interface Motion {
    turn: number;      // Spin so far, in seconds at the leading net's spinRate; a dot's angle is its start plus its spin times this
    view: CameraView;  // Eases toward the leading net's camera, aimed by the pointer
}

// A net on screen; paints the current motion, false while it still needs another frame (shaders still linking)
export type Draw = () => boolean;

interface Leader {
    draw: Draw;
    net: NetConfig;
    camera: CameraConfig;
}

export const motion: Motion = { turn: 0, view: { x: 0, y: 0, z: 0, fov: 0 } };

const aim: CameraView = { ...motion.view };
const pointer = { x: 0.5, y: 0.5 };  // Fraction of the window; kept across hand-offs, so the next camera aims where the last one did
const draws = new Set<Draw>();       // The leader and every net still fading out
let leader: Leader | null = null;
let placed = false;                  // Whether the first leader has set the view yet
let moving = false;
let frameId = 0;
let lastFrame = 0;
let reducedMotion: MediaQueryList | null = null;

// Shows a net and hands it the motion; under reduced motion, it draws one still frame instead
export function lead(draw: Draw, net: NetConfig, camera: CameraConfig) {
    leader = { draw, net, camera };
    draws.add(draw);
    reducedMotion ??= window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotion.addEventListener("change", onMotionPreference);

    // The first net starts at rest; every later one starts from the view the last one left and eases to its own camera
    aimCamera(camera, aim, pointer.x, pointer.y);
    if (!placed) Object.assign(motion.view, aim);
    placed = true;

    updateMotion();
    requestFrame();
}

// Takes the motion back from a net; it keeps drawing until hide(), so its fade-out matches the net fading in
export function follow(draw: Draw) {
    if (leader?.draw !== draw) return;
    leader = null;
    reducedMotion?.removeEventListener("change", onMotionPreference);
    updateMotion();
}

// Stops drawing a net
export function hide(draw: Draw) {
    follow(draw);
    draws.delete(draw);
    if (draws.size) return;
    cancelAnimationFrame(frameId);
    frameId = 0;
}

// Paints every net on the next frame, e.g. once a lost WebGL context comes back
export function requestFrame() {
    if (draws.size) frameId ||= requestAnimationFrame(frame);
}

function onMotionPreference() {
    updateMotion();
    requestFrame();
}

// Drift and pointer parallax run only while a net leads without a reduced-motion preference
function updateMotion() {
    // Holding still, the view jumps straight to the leader's camera instead of easing there
    if (leader && reducedMotion?.matches) Object.assign(motion.view, aim);

    const next = leader !== null && !reducedMotion?.matches;
    if (next === moving) return;
    moving = next;
    if (moving) {
        lastFrame = 0;
        window.addEventListener("pointermove", onPointer, { passive: true });
        window.addEventListener("pointerdown", onPointer, { passive: true });
    } else {
        window.removeEventListener("pointermove", onPointer);
        window.removeEventListener("pointerdown", onPointer);
    }
}

function onPointer(event: PointerEvent) {
    pointer.x = event.clientX / window.innerWidth;
    pointer.y = event.clientY / window.innerHeight;
}

function frame(now: number) {
    frameId = 0;
    if (moving && leader) {
        // Capped, so coming back to a background tab doesn't jump
        const delta = lastFrame ? Math.min((now - lastFrame) / 1000, 0.1) : 0;
        lastFrame = now;
        motion.turn += leader.net.spinRate * delta;

        // Vanta's per-frame ease, rescaled to any refresh rate
        const ease = 1 - (1 - leader.camera.ease) ** (delta * 60);
        aimCamera(leader.camera, aim, pointer.x, pointer.y);
        for (const key of ["x", "y", "z", "fov"] as const) motion.view[key] += (aim[key] - motion.view[key]) * ease;
    }

    // One step of motion, then every net paints it, so a crossfade never shows two different frames
    let waiting = false;
    for (const draw of draws) waiting = !draw() || waiting;

    // Loops while moving; otherwise only until every net has painted its still frame
    if (moving || waiting) requestFrame();
}
