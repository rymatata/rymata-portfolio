import { MAX_PIXEL_RATIO, createNetPainter, type NetPainter } from "./gpu";
import { follow, hide, lead, motion, requestFrame } from "./motion";
import { CAMERA, NET, buildScene, seededRandom, viewProjection, type CameraConfig, type NetConfig, type NetScene, type NetVariant } from "./scene";

// Decided once per page load and shared by every variant, so matching cells and spacing lay out the same dots
let layout: { seed: number; compact: boolean } | null = null;

export interface NetRenderer {
    /* Fits the canvas and takes over the shared motion; under reduced motion, draws one still frame instead */
    play(): void;

    /* Hands the motion back but keeps drawing it until release(), so a fade-out matches the net fading in */
    pause(): void;

    /* While paused, stops drawing and shrinks the canvas to 1 px, handing its GPU memory back until the next play() */
    release(): void;

    /* Frees every GPU resource */
    destroy(): void;
}

// null without WebGL2 or with only software rendering, leaving the plain gradient
export function createNetRenderer(canvas: HTMLCanvasElement, variant: NetVariant): NetRenderer | null {
    const net = NET[variant];
    layout ??= { seed: Math.floor(Math.random() * 2 ** 32), compact: window.innerWidth < 600 };
    const scene = buildScene(net, layout.compact, seededRandom(layout.seed));
    const painter = createNetPainter(canvas, { count: scene.dots.length, pairs: scene.pairs, maxDistance: net.maxDistance, dotRadius: net.dotRadius });

    return painter && netRenderer(canvas, painter, scene, net, CAMERA[variant]);
}

function netRenderer(canvas: HTMLCanvasElement, painter: NetPainter, scene: NetScene, net: NetConfig, camera: CameraConfig): NetRenderer {
    // xyzw per dot, uploaded every frame; y is fixed
    const positions = new Float32Array(scene.dots.length * 4);
    scene.dots.forEach((dot, i) => {
        positions[i * 4 + 1] = dot.height;
    });

    const matrix = new Float32Array(16);
    const light = new Float32Array(3);
    const resizeObserver = new ResizeObserver(resize);

    let playing = false;
    let destroyed = false;
    let pixelRatio = 1;

    function play() {
        if (playing || destroyed) return;
        playing = true;
        lead(draw, net, camera);  // First, so the very first net has a camera in place before it draws
        resize();
        resizeObserver.observe(canvas);
    }

    function pause() {
        if (!playing) return;
        playing = false;
        follow(draw);
    }

    function release() {
        if (playing || destroyed) return;
        hide(draw);
        resizeObserver.disconnect();
        canvas.width = canvas.height = 1;
    }

    function destroy() {
        pause();
        release();
        destroyed = true;
        canvas.removeEventListener("webglcontextrestored", requestFrame);
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
        draw();
    }

    // Paints the shared motion; false while the shaders are still linking, true once painted or if it never can
    function draw(): boolean {
        // Vanta's spin around the Y axis, from the shared turn instead of frame count
        scene.dots.forEach((dot, i) => {
            const angle = dot.angle + dot.spin * motion.turn;
            positions[i * 4] = dot.radius * Math.cos(angle);
            positions[i * 4 + 2] = dot.radius * Math.sin(angle);
        });

        const { width, height } = canvas;
        viewProjection(camera, motion.view, matrix, light, width / height);

        return painter.paint(positions, matrix, light, height / 2 / Math.tan(motion.view.fov / 2), (net.lineWidth / 2) * pixelRatio);
    }

    // Paints every net again once the painter has rebuilt a lost context
    canvas.addEventListener("webglcontextrestored", requestFrame);

    return { play, pause, release, destroy };
}
