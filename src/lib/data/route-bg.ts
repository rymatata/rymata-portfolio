import type { Route } from "next";

// Background layer states to be rendered by RouteBackground
/*
*   default  (Home and Contact):     Base radial gradient only
*   dark     (Projects and Resume):  Opaque pre-darkened gradient over the base
*   about    (About):                Opaque About layer over the base
*/
export type Background = "default" | "dark" | "about";

// Routing a background to every path
//* "satisfies Record<Route, ...>": Turns a missing or misspelled route into a type error
export const routeBackgrounds = {
    "/": "default",
    "/about": "about",
    "/projects": "dark",
    "/resume": "dark",
    "/contact": "default",
} as const satisfies Record<Route, Background>;

// Unknown paths fall back to the default background
export function getBackground(pathname: string): Background {
    return (routeBackgrounds as Record<string, Background>)[pathname] ?? "default";
}
