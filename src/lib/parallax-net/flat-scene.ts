// The About headshot's net: Vanta NET flattened to 2D behind the photo
// Each dot loops around a fixed home instead of spinning around the Y axis, so the net keeps the band's shape

// Layout and motion, in world units; the renderer scales the whole band to fit its canvas, so every size here is relative to width and height
export interface FlatNetConfig {
    width:       number;  // Band; the renderer fits exactly this into the canvas
    height:      number;
    columns:     number;  // Jittered grid; odd columns sit half a row lower and hold one dot fewer
    rows:        number;
    jitter:      number;  // Farthest a home strays from its grid spot, either way
    drift:       number;  // Radius of the loop each dot circles around its home
    driftRate:   number;  // rad/s per unit of a dot's random rate
    maxDistance: number;  // Connecting lines between points; fade out toward this distance and disconnect past it
    dotRadius:   number;
    lineWidth:   number;  // CSS px to keep weight even across screens
    shift:       number;  // Farthest the whole net glides from center, once the pointer reaches the window's edge
    ease:        number;  // How quickly the net catches up to the pointer; Vanta's per-frame camera ease
}

export const FLAT_NET = {
    width:       1500,
    height:      356.8,
    columns:     12,
    rows:        4,
    jitter:      30,
    drift:       8,
    driftRate:   0.4,
    maxDistance: 220,
    dotRadius:   6,
    lineWidth:   0.75,
    shift:       14,
    ease:        0.03,
} as const satisfies FlatNetConfig;

// Each dot circles its home, so it's stored by its loop rather than by x/y
export interface FlatDot {
    x:     number;  // Home
    y:     number;
    angle: number;  // Starting angle around its loop
    spin:  number;  // Multiple of driftRate, either direction
}

export interface FlatScene {
    dots: FlatDot[];
    pairs: Uint16Array;  // Flat [a, b, a, b, …] dot indices of every pair that can ever connect
}

export function buildFlatScene(net: FlatNetConfig, random: () => number): FlatScene {
    //* Homes stay this far inside the band, so a dot at the far side of its loop while the net glides its farthest still lands inside the canvas
    const margin = net.drift + net.shift + net.dotRadius;
    const halfWidth = net.width / 2 - margin;
    const halfHeight = net.height / 2 - margin;
    const jittered = (spot: number, limit: number) => Math.min(Math.max(spot + (random() * 2 - 1) * net.jitter, -limit), limit);
    const dots: FlatDot[] = [];

    // Triangular lattice across the band, so neighbors meet in triangles as Figma's circles do
    // Dots behind the photo stay; their lines pass under it like Figma's
    for (let i = 0; i < net.columns; i++) {
        const odd = i % 2;

        for (let j = 0; j < net.rows - odd; j++) {
            dots.push({
                x: jittered((i / (net.columns - 1)) * 2 * halfWidth - halfWidth, halfWidth),
                y: jittered(((j + odd / 2) / (net.rows - 1)) * 2 * halfHeight - halfHeight, halfHeight),
                angle: random() * 2 * Math.PI,
                spin: random() * 4 - 2,
            });
        }
    }

    //* Looping can bring two dots at most two drifts closer than their homes are
    //* Pairs that never come within maxDistance are dropped here once, instead of being measured every frame
    const pairs: number[] = [];
    dots.forEach((a, i) =>
        dots.forEach((b, j) => {
            if (j > i && Math.hypot(a.x - b.x, a.y - b.y) - 2 * net.drift < net.maxDistance) pairs.push(i, j);
        }),
    );

    return { dots, pairs: Uint16Array.from(pairs) };
}
