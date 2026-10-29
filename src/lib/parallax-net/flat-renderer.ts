import { FLAT_NET, buildFlatScene, type FlatNetConfig, type FlatScene } from "./flat-scene";
import { MAX_PIXEL_RATIO, createNetPainter, type NetPainter } from "./gpu";
import { seededRandom } from "./scene";

// Home's view-space light at its rest camera, straight up in the world, so these dots shade like Home's
const LIGHT = new Float32Array([0, Math.SQRT1_2, Math.SQRT1_2]);

export interface FlatNetRenderer {
    /* Stops the loop and frees every GPU resource */
    destroy(): void;
}

// Starts right away with its own clock, apart from the route nets' shared motion
// Loops only while the canvas is on screen; under reduced motion, draws one still frame instead
// null without WebGL2 or with only software rendering, leaving the photo alone
export function createFlatNetRenderer(canvas: HTMLCanvasElement): FlatNetRenderer | null {
    const net = FLAT_NET;

    // A new layout on every visit, as Vanta lays out a new net on every load
    const scene = buildFlatScene(net, seededRandom(Math.floor(Math.random() * 2 ** 32)));
    const painter = createNetPainter(canvas, { count: scene.dots.length, pairs: scene.pairs, maxDistance: net.maxDistance, dotRadius: net.dotRadius });

    return painter && flatNetRenderer(canvas, painter, scene, net);
}

function flatNetRenderer(canvas: HTMLCanvasElement, painter: NetPainter, scene: FlatScene, net: FlatNetConfig): FlatNetRenderer {
    // xyzw per dot, uploaded every frame; z stays 0
    const positions = new Float32Array(scene.dots.length * 4);
    const matrix = new Float32Array(16);
    const offset = { x: 0, y: 0 };  // How far the whole net has glided from center; eases toward aim
    const aim = { x: 0, y: 0 };
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    let pointer: { x: number; y: number } | null = null;  // Window px; until the pointer first moves, the net aims at rest
    let time = 0;                                         // Seconds of drift so far
    let visible = false;
    let moving = false;
    let frameId = 0;
    let lastFrame = 0;
    let pixelRatio = 1;

    const resizeObserver = new ResizeObserver(resize);
    const intersectionObserver = new IntersectionObserver((entries) => {
        visible = entries.at(-1)?.isIntersecting ?? visible;
        updateMotion();
    });

    function destroy() {
        resizeObserver.disconnect();
        intersectionObserver.disconnect();
        reducedMotion.removeEventListener("change", updateMotion);
        canvas.removeEventListener("webglcontextrestored", requestFrame);
        window.removeEventListener("pointermove", onPointer);
        window.removeEventListener("pointerdown", onPointer);
        cancelAnimationFrame(frameId);
        painter.destroy();
    }

    function resize() {
        pixelRatio = Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO);
        const width = Math.round((canvas.clientWidth || 1) * pixelRatio);
        const height = Math.round((canvas.clientHeight || 1) * pixelRatio);
        if (canvas.width === width && canvas.height === height) return;
        canvas.width = width;
        canvas.height = height;

        // Resizing wipes the canvas; repaint now so the frame about to show isn't blank
        if (!draw()) requestFrame();
    }

    // Drift and parallax run only while on screen without a reduced-motion preference
    function updateMotion() {
        // Holding still, the net rests at center
        if (reducedMotion.matches) offset.x = offset.y = 0;

        const next = visible && !reducedMotion.matches;
        if (next !== moving) {
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
        requestFrame();
    }

    function onPointer(event: PointerEvent) {
        pointer = { x: event.clientX, y: event.clientY };
    }

    function requestFrame() {
        frameId ||= requestAnimationFrame(frame);
    }

    function frame(now: number) {
        frameId = 0;
        if (moving) {
            // Capped, so coming back to a background tab doesn't jump
            const delta = lastFrame ? Math.min((now - lastFrame) / 1000, 0.1) : 0;
            lastFrame = now;
            time += delta;

            // Vanta's per-frame ease, rescaled to any refresh rate
            const ease = 1 - (1 - net.ease) ** (delta * 60);
            aimAtPointer();
            offset.x += (aim.x - offset.x) * ease;
            offset.y += (aim.y - offset.y) * ease;
        }

        // Loops while moving; otherwise only until the still frame has painted
        const waiting = !draw();
        if (moving || waiting) requestFrame();
    }

    // The net glides opposite the pointer, as Vanta's net appears to while its camera follows it
    // Measured from the canvas' own center, so the net moves about itself; half a window away aims the farthest
    function aimAtPointer() {
        if (!pointer) return;
        const box = canvas.getBoundingClientRect();
        const reach = (distance: number, half: number) => Math.min(Math.max(distance / half, -1), 1);
        aim.x = -reach(pointer.x - (box.left + box.width / 2), window.innerWidth / 2) * net.shift;
        aim.y = reach(pointer.y - (box.top + box.height / 2), window.innerHeight / 2) * net.shift;  // World y points up, the window's down
    }

    // Paints the drift and glide; false while the shaders are still linking, true once painted or if it never can
    function draw(): boolean {
        // Each dot loops around its home instead of Vanta's spin around the Y axis
        scene.dots.forEach((dot, i) => {
            const angle = dot.angle + dot.spin * net.driftRate * time;
            positions[i * 4] = dot.x + net.drift * Math.cos(angle);
            positions[i * 4 + 1] = dot.y + net.drift * Math.sin(angle);
        });

        //* Orthographic: one scale fits the band to the canvas, a px short of each edge to keep the anti-aliased rims
        //* The glide is only a translation, so the net moves as one piece
        const { width, height } = canvas;
        const scale = Math.min((width - 2) / net.width, (height - 2) / net.height);  // Device px per world unit
        const x = (2 * scale) / width;
        const y = (2 * scale) / height;
        matrix.set([
            x,            0,            0, 0,
            0,            y,            0, 0,
            0,            0,            1, 0,
            offset.x * x, offset.y * y, 0, 1,
        ]);

        // Without perspective w stays 1, so the scale doubles as the dots' focal length
        return painter.paint(positions, matrix, LIGHT, scale, (net.lineWidth / 2) * pixelRatio);
    }

    resize();
    resizeObserver.observe(canvas);
    intersectionObserver.observe(canvas);  // Reports right away, starting the loop if on screen
    reducedMotion.addEventListener("change", updateMotion);
    canvas.addEventListener("webglcontextrestored", requestFrame);

    return { destroy };
}
