import { CAMERA, NET, aimCamera, buildScene, viewProjection, type NetScene } from "./scene";
import { DOT_FRAGMENT, DOT_VERTEX, LINE_FRAGMENT, LINE_VERTEX } from "./shaders";

const MAX_PIXEL_RATIO = 2;

export interface NetRenderer {
    /* Fits the canvas and animates; under reduced motion, draws one still frame instead */
    play(): void;

    /* Stops animating and following the pointer; the last frame stays up */
    pause(): void;

    /* While paused, shrinks the canvas to 1 px, handing its GPU memory back until the next play() */
    release(): void;

    /* Frees every GPU resource */
    destroy(): void;
}

type Uniform = WebGLUniformLocation | null;

interface Uniforms {
    lineViewProjection: Uniform;
    halfViewport: Uniform;
    halfWidth: Uniform;
    dotViewProjection: Uniform;
    focal: Uniform;
    light: Uniform;
}

// Everything on the GPU; rebuilt from scratch if the browser loses and restores the context
interface Gpu {
    parallel: KHR_parallel_shader_compile | null;
    line: WebGLProgram;
    dot: WebGLProgram;
    positions: WebGLTexture;
    lineVao: WebGLVertexArrayObject;
    dotVao: WebGLVertexArrayObject;
    buffers: WebGLBuffer[];
    uniforms: Uniforms | null;  // Found once both programs finish linking
}

// null without WebGL2 or with only software rendering, leaving the plain gradient
export function createNetRenderer(canvas: HTMLCanvasElement): NetRenderer | null {
    const gl = canvas.getContext("webgl2", {
        antialias: false,                    // The shaders anti-alias lines and dots, so no MSAA buffers
        depth: false,                        // Draw order alone puts dots over lines
        powerPreference: "low-power",        // Keeps dual-GPU laptops on the integrated GPU
        failIfMajorPerformanceCaveat: true,  // Refuses software rendering; the plain gradient is the better fallback
    });

    return gl && netRenderer(canvas, gl);
}

function netRenderer(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext): NetRenderer {
    const scene = buildScene(window.innerWidth < 600);
    const color = readColor(canvas);

    // xyzw per dot, uploaded every frame; y is fixed
    const positions = new Float32Array(scene.dots.length * 4);
    scene.dots.forEach((dot, i) => {
        positions[i * 4 + 1] = dot.height;
    });

    const matrix = new Float32Array(16);
    const light = new Float32Array(3);
    const eye = { x: CAMERA.x, y: CAMERA.y };
    const target = { ...eye };
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const resizeObserver = new ResizeObserver(resize);

    let gpu: Gpu | null = setup(gl, scene);
    let playing = false;
    let moving = false;
    let destroyed = false;
    let frameId = 0;
    let lastFrame = 0;
    let time = 0;  // Seconds of motion so far; holds still while paused
    let cssWidth = 1;
    let cssHeight = 1;
    let pixelRatio = 1;

    function play() {
        if (playing || destroyed) return;
        playing = true;
        resize();
        resizeObserver.observe(canvas);
        reducedMotion.addEventListener("change", updateMotion);
        updateMotion();
        requestFrame();
    }

    function pause() {
        if (!playing) return;
        playing = false;
        resizeObserver.disconnect();
        reducedMotion.removeEventListener("change", updateMotion);
        updateMotion();
        cancelAnimationFrame(frameId);
        frameId = 0;
    }

    function release() {
        if (playing || destroyed) return;
        canvas.width = canvas.height = 1;
    }

    function destroy() {
        pause();
        release();
        destroyed = true;
        canvas.removeEventListener("webglcontextlost", onContextLost);
        canvas.removeEventListener("webglcontextrestored", onContextRestored);
        if (gpu) teardown(gl, gpu);
        gpu = null;
    }

    // Drift and pointer parallax run only while playing without a reduced-motion preference
    function updateMotion() {
        const next = playing && !reducedMotion.matches;
        if (next === moving) return;
        moving = next;
        if (moving) {
            lastFrame = 0;
            window.addEventListener("pointermove", onPointer, { passive: true });
            window.addEventListener("pointerdown", onPointer, { passive: true });
            requestFrame();
        } else {
            window.removeEventListener("pointermove", onPointer);
            window.removeEventListener("pointerdown", onPointer);
        }
    }

    function onPointer(event: PointerEvent) {
        aimCamera(target, event.clientX / cssWidth, event.clientY / cssHeight);
    }

    function resize() {
        pixelRatio = Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO);
        cssWidth = canvas.clientWidth || 1;
        cssHeight = canvas.clientHeight || 1;
        const width = Math.round(cssWidth * pixelRatio);
        const height = Math.round(cssHeight * pixelRatio);
        if (canvas.width === width && canvas.height === height) return;
        canvas.width = width;
        canvas.height = height;

        // Resizing wipes the canvas; repaint now so the frame about to show isn't blank
        draw();
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
            const ease = 1 - (1 - CAMERA.ease) ** (delta * 60);
            eye.x += (target.x - eye.x) * ease;
            eye.y += (target.y - eye.y) * ease;
        }

        const drawn = draw();

        // Loops while moving; otherwise polls only until the shaders are ready for the one still frame
        if (gpu && (moving || !drawn)) requestFrame();
    }

    // Paints the current state; false until the shaders are ready
    function draw(): boolean {
        const current = gpu;
        const uniforms = current && (current.uniforms ?? link(current));

        if (!current || !uniforms) return false;

        // Vanta's spin around the Y axis, from elapsed time instead of frame count
        scene.dots.forEach((dot, i) => {
            const angle = dot.angle + dot.spin * time;
            positions[i * 4] = dot.radius * Math.cos(angle);
            positions[i * 4 + 2] = dot.radius * Math.sin(angle);
        });
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, scene.dots.length, 1, gl.RGBA, gl.FLOAT, positions);

        const { width, height } = canvas;
        viewProjection(matrix, light, eye.x, eye.y, width / height);
        gl.viewport(0, 0, width, height);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(current.line);
        gl.uniformMatrix4fv(uniforms.lineViewProjection, false, matrix);
        gl.uniform2f(uniforms.halfViewport, width / 2, height / 2);
        gl.uniform1f(uniforms.halfWidth, (NET.lineWidth / 2) * pixelRatio);
        gl.bindVertexArray(current.lineVao);
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, scene.pairs.length / 2);

        // Dots last, capping the line ends as Vanta's opaque spheres do
        gl.useProgram(current.dot);
        gl.uniformMatrix4fv(uniforms.dotViewProjection, false, matrix);
        gl.uniform1f(uniforms.focal, height / 2 / Math.tan(CAMERA.fov / 2));
        gl.uniform3fv(uniforms.light, light);
        gl.bindVertexArray(current.dotVao);
        gl.drawArrays(gl.POINTS, 0, scene.dots.length);

        return true;
    }

    // Finishes linking; null while the driver still compiles in the background, or if the shaders failed
    function link(current: Gpu): Uniforms | null {
        const programs = [current.line, current.dot];
        const { parallel } = current;

        if (parallel && !programs.every((program) => gl.getProgramParameter(program, parallel.COMPLETION_STATUS_KHR))) return null;

        const broken = programs.find((program) => !gl.getProgramParameter(program, gl.LINK_STATUS));

        if (broken) {
            const shaderLogs = (gl.getAttachedShaders(broken) ?? []).map((shader) => gl.getShaderInfoLog(shader));
            console.error("Parallax net shaders failed:", gl.getProgramInfoLog(broken), ...shaderLogs);
            teardown(gl, current);
            gpu = null;  // Leaves the plain gradient
            return null;
        }

        return (current.uniforms = bindUniforms(gl, current, color));
    }

    function onContextLost(event: Event) {
        event.preventDefault();  // Lets the browser restore it later
        cancelAnimationFrame(frameId);
        frameId = 0;
        gpu = null;              // Its objects died with the context
    }

    function onContextRestored() {
        gpu = setup(gl, scene);
        if (playing) requestFrame();
    }

    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);

    return { play, pause, release, destroy };
}

function setup(gl: WebGL2RenderingContext, scene: NetScene): Gpu {
    // With this extension the driver compiles in the background, so frames wait instead of the page freezing
    const parallel = gl.getExtension("KHR_parallel_shader_compile");

    const gpu: Gpu = {
        parallel,
        line: buildProgram(gl, LINE_VERTEX, LINE_FRAGMENT),
        dot: buildProgram(gl, DOT_VERTEX, DOT_FRAGMENT),
        positions: gl.createTexture(),
        lineVao: gl.createVertexArray(),
        dotVao: gl.createVertexArray(),
        buffers: [],
        uniforms: null,
    };

    // One RGBA32F texel per dot, overwritten each frame
    gl.bindTexture(gl.TEXTURE_2D, gpu.positions);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, scene.dots.length, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    const upload = (data: Float32Array | Uint16Array) => {
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        gpu.buffers.push(buffer);
    };

    // Lines: a 4-corner strip, instanced once per pair
    gl.bindVertexArray(gpu.lineVao);
    upload(new Float32Array([0, -1, 0, 1, 1, -1, 1, 1]));
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    upload(scene.pairs);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribIPointer(1, 2, gl.UNSIGNED_SHORT, 0, 0);
    gl.vertexAttribDivisor(1, 1);

    // Dots: one point each, by index
    gl.bindVertexArray(gpu.dotVao);
    upload(Uint16Array.from(scene.dots, (_, i) => i));
    gl.enableVertexAttribArray(0);
    gl.vertexAttribIPointer(0, 1, gl.UNSIGNED_SHORT, 0, 0);
    gl.bindVertexArray(null);

    // Premultiplied "over", matching how the browser composites the canvas onto the page
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    return gpu;
}

// Compiles and links without checking; status queries block on the driver, so the first frames ask instead
function buildProgram(gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string): WebGLProgram {
    const program = gl.createProgram();

    for (const [type, source] of [[gl.VERTEX_SHADER, vertexSource], [gl.FRAGMENT_SHADER, fragmentSource]] as const) {
        const shader = gl.createShader(type);

        if (!shader) continue;    // Only while the context is lost
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        gl.attachShader(program, shader);
        gl.deleteShader(shader);  // Kept alive by the program until it's deleted too
    }
    gl.linkProgram(program);

    return program;
}

// Looks up the per-frame uniforms and sets the ones fixed for the net's lifetime
function bindUniforms(gl: WebGL2RenderingContext, gpu: Gpu, color: Float32Array): Uniforms {
    const line = (name: string) => gl.getUniformLocation(gpu.line, name);
    const dot = (name: string) => gl.getUniformLocation(gpu.dot, name);

    gl.useProgram(gpu.line);
    gl.uniform1f(line("uMaxDistance"), NET.maxDistance);
    gl.uniform4fv(line("uColor"), color);
    gl.useProgram(gpu.dot);
    gl.uniform1f(dot("uRadius"), NET.dotRadius);
    gl.uniform4fv(dot("uColor"), color);

    return {
        lineViewProjection: line("uViewProjection"),
        halfViewport: line("uHalfViewport"),
        halfWidth: line("uHalfWidth"),
        dotViewProjection: dot("uViewProjection"),
        focal: dot("uFocal"),
        light: dot("uLight"),
    };
}

function teardown(gl: WebGL2RenderingContext, gpu: Gpu) {
    gl.deleteProgram(gpu.line);
    gl.deleteProgram(gpu.dot);
    gl.deleteTexture(gpu.positions);
    gl.deleteVertexArray(gpu.lineVao);
    gl.deleteVertexArray(gpu.dotVao);
    gpu.buffers.forEach((buffer) => gl.deleteBuffer(buffer));
}

// The net draws in the canvas' CSS color (text-parallax-net); painting one pixel of it resolves any CSS color to sRGB
function readColor(canvas: HTMLCanvasElement): Float32Array {
    const probe = document.createElement("canvas");
    probe.width = probe.height = 1;
    const context = probe.getContext("2d", { willReadFrequently: true });

    if (!context) return new Float32Array([1, 1, 1, 1]);
    
    context.fillStyle = getComputedStyle(canvas).color;
    context.fillRect(0, 0, 1, 1);

    return Float32Array.from(context.getImageData(0, 0, 1, 1).data, (channel) => channel / 255);
}
