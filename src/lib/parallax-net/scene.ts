// Vanta Net Animated Background (vanta.net.js) without the use of three.js
// Layout, motion, and camera as plain data for the WebGL renderer

// Based on Vanta's defaults, in world units
export const NET = {
    cells:       8,     // 2((cells + 1)^2) Points; 8 cells gives 162 points
    spacing:     15,    // Distance between points
    maxDistance: 20,    // Connecting lines between points; fade out toward this distance and disconnect past it
    dotRadius:   0.3,   // SphereGeometry()'s radius
    spinRate:    0.06,  // rad/s per unit of a dot's random rate; Vanta's 0.00025 rad per frame at 60 fps
    lineWidth:   0.75,  // CSS px to keep weight even across screens
} as const;

// User's view for the background
export const CAMERA = {
    fov:  (25 * Math.PI) / 200,  // Vertical
    near: 0.01,
    far:  10000,

    // Start position, aimed at the origin; 
    // Vanta eases x and y toward the pointer but never z
    x: 0,
    y: 110,
    z: 130,

    swing: 0.5,                  // rad the camera orbits either way as the pointer crosses the screen
    rise:  40,                   // Lifts either way as the pointer moves down
    ease:  0.04,                 // How quickly the camera catches up to the pointer
} as const;

// Each dot circles the Y axis, so it's stored by its circle rather than by x/z
export interface Dot {
    radius: number;  // Distance from the Y axis
    angle: number;   // Starting angle around it
    height: number;  // y; never changes
    spin: number;    // rad/s, either direction
}

export interface NetScene {
    dots: Dot[];
    pairs: Uint16Array;  // Flat [a, b, a, b, …] dot indices of every pair that can ever connect
}

const randomInt = (min: number, max: number) => Math.floor(min + Math.random() * (max - min + 1));

// compact : Vanta's smaller, denser net for phone-width screens
export function buildScene(compact: boolean): NetScene {
    const cells = compact ? Math.trunc(NET.cells * 0.75) : NET.cells;
    const spacing = compact ? Math.trunc(NET.spacing * 0.65) : NET.spacing;
    const dots: Dot[] = [];
    const addDot = (x: number, height: number, z: number) =>
        dots.push({ radius: Math.hypot(x, z), angle: Math.atan2(z, x), height, spin: (Math.random() * 4 - 2) * NET.spinRate });

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
            if (j > i && Math.hypot(a.radius - b.radius, a.height - b.height) < NET.maxDistance) pairs.push(i, j);
        }),
    );

    return { dots, pairs: Uint16Array.from(pairs) };
}

// The pointer moves the camera along Vanta's orbit: this radius and heading around the Y axis
const ORBIT = Math.hypot(CAMERA.x, CAMERA.z);
const HEADING = Math.atan2(CAMERA.z, CAMERA.x);

export function aimCamera(target: { x: number; y: number }, x: number, y: number) {
    target.x = ORBIT * Math.cos(HEADING + (x - 0.5) * 2 * CAMERA.swing);
    target.y = CAMERA.y + (y - 0.5) * 2 * CAMERA.rise;
}

// Writes the column-major view-projection matrix of a camera at (x, y, CAMERA.z) aimed at the origin,
// and the light's direction in view space: straight up in the world, where Vanta hangs its spotlight
export function viewProjection(matrix: Float32Array, light: Float32Array, x: number, y: number, aspect: number) {
    const z = CAMERA.z;
    const distance = Math.hypot(x, y, z);

    // Forward (toward the origin), right (forward × world up) and up (right × forward)
    const fx = -x / distance, fy = -y / distance, fz = -z / distance;
    const flat = Math.hypot(fx, fz);
    const rx = -fz / flat, rz = fx / flat;
    const ux = -rz * fy, uy = rz * fx - rx * fz, uz = rx * fy;

    const scale = 1 / Math.tan(CAMERA.fov / 2);
    const { near, far } = CAMERA;
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
