import type { Route } from "next";
import { FolderCode, House, MessagesSquare, ScrollText, SquareUserRound, type LucideIcon } from "lucide-react";

// Home Page      : Name card, "/" has no button of its own
// Any other page : Collapses to become the Home button
export const navHead = {
    name: "Ryland Mata",
    role: "Full stack developer",
    label: "Home",
    icon: House,
} as const;

// Nav buttons beneath the name card; key order is the order they render in
//* satisfies Record<...> : A new page without a button, or a misspelled route, becomes a type error
export const navLinks = {
    "/about": { label: "About", icon: SquareUserRound },
    "/projects": { label: "Projects", icon: FolderCode },
    "/resume": { label: "Resume", icon: ScrollText },
    "/contact": { label: "Contact", icon: MessagesSquare },
} as const satisfies Record<Exclude<Route, "/">, { label: string; icon: LucideIcon }>;

type NavHref = keyof typeof navLinks;

// Object.entries : Widens keys to string; the cast restores the typed routes to keep <Link href> checked
export const navEntries = Object.entries(navLinks) as [NavHref, (typeof navLinks)[NavHref]][];
