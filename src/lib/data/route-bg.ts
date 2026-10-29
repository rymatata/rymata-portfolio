import type { Route } from "next";
import type { NetVariant } from "@/lib/parallax-net/scene";

// Background layer states to be rendered by RouteBackground
/*
*   gradient: The full-screen gradient
*       default  (Home and Contact):    Base radial gradient only
*       dark     (Projects and Resume): Opaque pre-darkened gradient over the base
*       about    (About):               Opaque About layer over the base
*   net: 3D net of dots and lines over the gradient that shifts with the pointer; null shows none
*       default  (Home):                Its own NET, CAMERA, and color
*       dark     (Projects and Resume): Its own NET, CAMERA, and a fainter color
*/
export type BackgroundGradient = "default" | "dark" | "about";

export interface Background {
    gradient: BackgroundGradient;
    net: NetVariant | null;
}

// Routing a background to every path
//* "satisfies Record<Route, ...>": Turns a missing or misspelled route into a type error
export const routeBackgrounds = {
    "/":         { gradient: "default", net: "default" },
    "/about":    { gradient: "about",   net: null },
    "/projects": { gradient: "dark",    net: "dark" },
    "/resume":   { gradient: "dark",    net: "dark" },
    "/contact":  { gradient: "default", net: null },
} as const satisfies Record<Route, Background>;

const fallbackBackground: Background = { gradient: "default", net: null };

// Unknown paths fall back to the default background
export function getBackground(pathname: string): Background {
    return (routeBackgrounds as Record<string, Background>)[pathname] ?? fallbackBackground;
}
