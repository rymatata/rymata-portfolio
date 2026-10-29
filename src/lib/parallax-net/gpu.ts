import { DOT_FRAGMENT, DOT_VERTEX, LINE_FRAGMENT, LINE_VERTEX } from "./shaders";

// WebGL2 plumbing every net paints through: programs, buffers, the dot texture, and context loss
// Each renderer decides where its dots are and how they're viewed; the painter only draws that

export const MAX_PIXEL_RATIO = 2;

// What a net draws, fixed for its lifetime
export interface NetShape {
    count:       number;       // Dots
    pairs:       Uint16Array;  // Flat [a, b, a, b, …] dot indices of every pair that can ever connect
    maxDistance: number;       // Lines fade out toward this distance and disconnect past it
    dotRadius:   number;       // World units
}

export interface NetPainter {
    /* Paints one frame; false while the shaders are still linking, true once painted or if it never can
    *   positions: xyzw per dot, world units
    *   matrix:    Column-major view-projection
    *   light:     Toward the light, view space
    *   focal:     px per world unit at a depth of 1
    *   halfWidth: Half the line width, px
    */
    paint(positions: Float32Array, matrix: Float32Array, light: Float32Array, focal: number, halfWidth: number): boolean;

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

// null without WebGL2 or with only software rendering, leaving whatever sits behind the canvas
//* Renderers ask for a frame on webglcontextrestored themselves; the painter's own listener, added first, has rebuilt the GPU by then
export function createNetPainter(canvas: HTMLCanvasElement, shape: NetShape): NetPainter | null {
    const gl = canvas.getContext("webgl2", {
        antialias: false,                    // The shaders anti-alias lines and dots, so no MSAA buffers
        depth: false,                        // Draw order alone puts dots over lines
        powerPreference: "low-power",        // Keeps dual-GPU laptops on the integrated GPU
        failIfMajorPerformanceCaveat: true,  // Refuses software rendering; the fallback behind the canvas is the better choice
    });

    return gl && netPainter(canvas, gl, shape);
}

function netPainter(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext, shape: NetShape): NetPainter {
    const color = readColor(canvas);
    let gpu: Gpu | null = setup(gl, shape);

    function paint(positions: Float32Array, matrix: Float32Array, light: Float32Array, focal: number, halfWidth: number): boolean {
        const current = gpu;

        if (!current) return true;  // Context lost, or the shaders failed

        const uniforms = current.uniforms ?? link(current);

        if (!uniforms) return !gpu;  // Still linking, unless link() just gave up

        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, shape.count, 1, gl.RGBA, gl.FLOAT, positions);

        const { width, height } = canvas;
        gl.viewport(0, 0, width, height);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(current.line);
        gl.uniformMatrix4fv(uniforms.lineViewProjection, false, matrix);
        gl.uniform2f(uniforms.halfViewport, width / 2, height / 2);
        gl.uniform1f(uniforms.halfWidth, halfWidth);
        gl.bindVertexArray(current.lineVao);
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, shape.pairs.length / 2);

        // Dots last, capping the line ends as Vanta's opaque spheres do
        gl.useProgram(current.dot);
        gl.uniformMatrix4fv(uniforms.dotViewProjection, false, matrix);
        gl.uniform1f(uniforms.focal, focal);
        gl.uniform3fv(uniforms.light, light);
        gl.bindVertexArray(current.dotVao);
        gl.drawArrays(gl.POINTS, 0, shape.count);

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
            gpu = null;  // Leaves whatever sits behind the canvas
            return null;
        }

        return (current.uniforms = bindUniforms(gl, current, shape, color));
    }

    function destroy() {
        canvas.removeEventListener("webglcontextlost", onContextLost);
        canvas.removeEventListener("webglcontextrestored", onContextRestored);
        if (gpu) teardown(gl, gpu);
        gpu = null;
    }

    function onContextLost(event: Event) {
        event.preventDefault();  // Lets the browser restore it later
        gpu = null;              // Its objects died with the context; paint() skips this net until then
    }

    function onContextRestored() {
        gpu = setup(gl, shape);
    }

    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);

    return { paint, destroy };
}

function setup(gl: WebGL2RenderingContext, shape: NetShape): Gpu {
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
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, shape.count, 1);
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
    upload(shape.pairs);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribIPointer(1, 2, gl.UNSIGNED_SHORT, 0, 0);
    gl.vertexAttribDivisor(1, 1);

    // Dots: one point each, by index
    gl.bindVertexArray(gpu.dotVao);
    upload(Uint16Array.from({ length: shape.count }, (_, i) => i));
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
function bindUniforms(gl: WebGL2RenderingContext, gpu: Gpu, shape: NetShape, color: Float32Array): Uniforms {
    const line = (name: string) => gl.getUniformLocation(gpu.line, name);
    const dot = (name: string) => gl.getUniformLocation(gpu.dot, name);

    gl.useProgram(gpu.line);
    gl.uniform1f(line("uMaxDistance"), shape.maxDistance);
    gl.uniform4fv(line("uColor"), color);
    gl.useProgram(gpu.dot);
    gl.uniform1f(dot("uRadius"), shape.dotRadius);
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

// The net draws in the canvas' CSS color (e.g. text-parallax-net); painting one pixel of it resolves any CSS color to sRGB
function readColor(canvas: HTMLCanvasElement): Float32Array {
    const probe = document.createElement("canvas");
    probe.width = probe.height = 1;
    const context = probe.getContext("2d", { willReadFrequently: true });

    if (!context) return new Float32Array([1, 1, 1, 1]);

    context.fillStyle = getComputedStyle(canvas).color;
    context.fillRect(0, 0, 1, 1);

    return Float32Array.from(context.getImageData(0, 0, 1, 1).data, (channel) => channel / 255);
}
