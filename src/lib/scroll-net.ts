import type { FlatNetConfig } from "@/lib/parallax-net/flat-scene";

// One section a ScrollNet follows; id anchors the section and its point, label names the point for screen readers (and the section, when it has no title of its own)
export interface ScrollNetSection {
    id:    string;
    label: string;
}

// ScrollNet's column in the headshot net's world units: its box is the headshot band's height (h-scroll-net) over the same 356.8 units, so every size here draws at that net's scale
// Kept apart from FLAT_NET, since nothing under lib/parallax-net may load outside its renderers' dynamic imports
export const SCROLL_NET = {
    height:    356.8,  // FLAT_NET's band height
    dotRadius: 6,
    lineWidth: 0.75,   // CSS px, as the nets' lines
    drift:     8,      // Radius of the loop each dot circles through its home
    driftRate: 0.4,    // rad/s per unit of a dot's random rate
} as const satisfies Pick<FlatNetConfig, "height" | "dotRadius" | "lineWidth" | "drift" | "driftRate">;

// Point i rests on its home at y = top + i * spacing; the viewBox is centered on 0, so the column runs from -height / 2 to height / 2
export interface ScrollNetLayout {
    width:   number;  // viewBox width, centered on x = 0
    top:     number;  // The first point's home
    spacing: number;  // Between neighboring homes
}

// One column down the band: homes evenly spaced, the first and last far enough inside it that a dot on the far side of its loop still lands within
// Each loop passes through its home, so a dot strays up to two drifts from it
export function scrollNetLayout(count: number): ScrollNetLayout {
    const margin = 2 * SCROLL_NET.drift + SCROLL_NET.dotRadius;
    return {
        width: 2 * margin,
        top: margin - SCROLL_NET.height / 2,
        spacing: (SCROLL_NET.height - 2 * margin) / Math.max(count - 1, 1),
    };
}

// Every dot's shading: the dot shader's Lambert shade (DOT_FRAGMENT, lit from above as the headshot net's dots are), fit as one radial gradient over the dot's box
// The focal point sits at the dot's top and the gradient spreads down and out, so the upper half stays fully lit and only the lower rim falls to the 25% ambient;
//   the fit is off from the shader by 1.4% of full brightness on average
// Each shade scales the net color's rgb, as the shader scales uColor.rgb; past the last stop the gradient holds the ambient
export const SCROLL_NET_SHADE = {
    fx: 0.5,
    fy: 0.025,
    cx: 0.5,
    cy: 0.25,
    r:  0.75,
    stops: [
        { offset: 0,     shade: 1 },
        { offset: 0.455, shade: 1 },
        { offset: 0.55,  shade: 0.865 },
        { offset: 0.65,  shade: 0.696 },
        { offset: 0.75,  shade: 0.495 },
        { offset: 0.85,  shade: 0.25 },
    ],
} as const;

// Inlined by the root layout inside <noscript>: without JavaScript nothing reveals a hidden ScrollSection, so this shows it as it is
// Unlayered, so it outranks the Tailwind utilities that hide the section
export const noScriptReveal = "<style>[data-hidden] { opacity: 1; translate: none; }</style>";
