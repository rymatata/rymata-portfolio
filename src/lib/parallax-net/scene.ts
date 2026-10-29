// Vanta Net Animated Background (vanta.net.js) without the use of three.js
// Layout, motion, and camera as plain data for the WebGL renderer

// Each variant is its own net, named after the gradient it sits over
/*
*   default: Home
*   dark:    Projects and Resume
*/
export type NetVariant = "default" | "dark";

// Layout and motion, in world units
export interface NetConfig {
    cells:       number;  // 2((cells + 1)^2) Points; 8 cells gives 162 points
    spacing:     number;  // Distance between points
    maxDistance: number;  // Connecting lines between points; fade out toward this distance and disconnect past it
    dotRadius:   number;  // SphereGeometry()'s radius
    spinRate:    number;  // rad/s per unit of a dot's random rate; Vanta's 0.00025 rad per frame at 60 fps
    lineWidth:   number;  // CSS px to keep weight even across screens
}

// User's view for the background
export interface CameraConfig {
    fov:  number;  // Vertical
    near: number;
    far:  number;

    // Rest position, aimed at the origin;
    // Vanta eases x and y toward the pointer but never z; z and fov only ease when another variant's camera takes over
    x: number;
    y: number;
    z: number;

    swing: number;  // rad the camera orbits either way as the pointer crosses the screen
    rise:  number;  // Lifts either way as the pointer moves down
    ease:  number;  // How quickly the camera catches up to the pointer
}

// Both variants start from Vanta's defaults
//* Matching cells and spacing give both variants the same dots, so Home <-> Projects/Resume hands one net over seamlessly
export const NET = {
    default: {
        cells:       8,
        spacing:     15,
        maxDistance: 20,
        dotRadius:   0.3,
        spinRate:    0.06,
        lineWidth:   0.75,
    },
    dark: {
        cells:       8,
        spacing:     15,
        maxDistance: 20,
        dotRadius:   0.3,
        spinRate:    0.03,
        lineWidth:   0.75,
    },
} as const satisfies Record<NetVariant, NetConfig>;

export const CAMERA = {
    default: {
        fov:   (25 * Math.PI) / 200,
        near:  0.01,
        far:   10000,
        x:     0,
        y:     120,
        z:     120,
        swing: 0.5,
        rise:  40,
        ease:  0.03,
    },
    dark: {
        fov:   (25 * Math.PI) / 200,
        near:  0.01,
        far:   10000,
        x:     0,
        y:     140,
        z:     200,
        swing: 0.1,
        rise:  10,
        ease:  0.02,
    },
} as const satisfies Record<NetVariant, CameraConfig>;

// Where the camera sits and how wide it sees; the one every net draws from eases toward the leading variant's
export interface CameraView {
    x:   number;
    y:   number;
    z:   number;
    fov: number;
}

// Each dot circles the Y axis, so it's stored by its circle rather than by x/z
export interface Dot {
    radius: number;  // Distance from the Y axis
    angle:  number;  // Starting angle around it
    height: number;  // y; never changes
    spin:   number;  // Multiple of spinRate, either direction
}

export interface NetScene {
    dots: Dot[];
    pairs: Uint16Array;  // Flat [a, b, a, b, …] dot indices of every pair that can ever connect
}

// Mulberry32 : Replays the same "random" sequence for the same seed, so every variant can lay out the same dots
export function seededRandom(seed: number): () => number {
    return () => {
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32;
    };
}

// compact : Vanta's smaller, denser net for phone-width screens
export function buildScene(net: NetConfig, compact: boolean, random: () => number): NetScene {
    const randomInt = (min: number, max: number) => Math.floor(min + random() * (max - min + 1));
    const cells = compact ? Math.trunc(net.cells * 0.75) : net.cells;
    const spacing = compact ? Math.trunc(net.spacing * 0.65) : net.spacing;
    const dots: Dot[] = [];
    const addDot = (x: number, height: number, z: number) =>
        dots.push({ radius: Math.hypot(x, z), angle: Math.atan2(z, x), height, spin: random() * 4 - 2 });

    // Jittered grid, odd rows offset by half a cell; each cell drops one dot below and raises one above
    for (let i = 0; i <= cells; i++) {
        for (let j = 0; j <= cells; j++) {
            const y = randomInt(-3, 3);
            const x = (i - cells / 2) * spacing + randomInt(-5, 5);
            const z = (j - cells / 2) * spacing + randomInt(-5, 5) + (i % 2) * spacing * 0.5;
            addDot(x, y - randomInt(5, 15), z);
            addDot(x + randomInt(-5, 5), y + randomInt(5, 15), z + randomInt(-5, 5));
        }
    }

    //* Spinning around Y never changes a dot's radius or height, so two dots can't get closer than those gaps allow
    //* Pairs that never come within maxDistance are dropped here once, instead of being measured every frame
    const pairs: number[] = [];
    dots.forEach((a, i) =>
        dots.forEach((b, j) => {
            if (j > i && Math.hypot(a.radius - b.radius, a.height - b.height) < net.maxDistance) pairs.push(i, j);
        }),
    );

    return { dots, pairs: Uint16Array.from(pairs) };
}

// The pointer moves the camera along Vanta's orbit: the rest position's radius and heading around the Y axis
// x and y : The pointer as a fraction of the screen; the center aims at the rest position
export function aimCamera(camera: CameraConfig, target: CameraView, x: number, y: number) {
    const orbit = Math.hypot(camera.x, camera.z);
    const heading = Math.atan2(camera.z, camera.x);
    target.x = orbit * Math.cos(heading + (x - 0.5) * 2 * camera.swing);
    target.y = camera.y + (y - 0.5) * 2 * camera.rise;
    target.z = camera.z;
    target.fov = camera.fov;
}

// Writes the column-major view-projection matrix of a camera at the view's position aimed at the origin,
// and the light's direction in view space: straight up in the world, where Vanta hangs its spotlight
export function viewProjection(camera: CameraConfig, view: CameraView, matrix: Float32Array, light: Float32Array, aspect: number) {
    const { x, y, z } = view;
    const distance = Math.hypot(x, y, z);

    // Forward (toward the origin), right (forward × world up) and up (right × forward)
    const fx = -x / distance, fy = -y / distance, fz = -z / distance;
    const flat = Math.hypot(fx, fz);
    const rx = -fz / flat, rz = fx / flat;
    const ux = -rz * fy, uy = rz * fx - rx * fz, uz = rx * fy;

    const scale = 1 / Math.tan(view.fov / 2);
    const { near, far } = camera;
    const depth = (far + near) / (near - far);
    const offset = (2 * far * near) / (near - far);

    //* The origin sits on the camera's axis, so translation only adds depth
    matrix.set([
        (scale / aspect) * rx, scale * ux, -depth * fx,               fx,
        0,                     scale * uy, -depth * fy,               fy,
        (scale / aspect) * rz, scale * uz, -depth * fz,               fz,
        0,                     0,          offset - depth * distance, distance,
    ]);
    light.set([0, uy, -fy]);
}
