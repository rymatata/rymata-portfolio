import "./globals.css";
import { IntroGate } from "@/components/layout/IntroGate";
import { RouteBackground } from "@/components/layout/RouteBackground";
import { SideNav } from "@/components/layout/SideNav";
import { introScript } from "@/lib/intro";
import { noScriptReveal } from "@/lib/scroll-net";
import { Koulen, Magra, Reddit_Sans } from "next/font/google";

const koulen = Koulen({
    variable: "--font-koulen-next",
    subsets: ["latin"],
    weight: "400"
});

const magra = Magra({
    variable: "--font-magra-next",
    subsets: ["latin"],
    weight: ["400", "700"]
});

const redditSans = Reddit_Sans({
    variable: "--font-reddit-sans-next",
    subsets: ["latin"],
    style: "italic"
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        // suppressHydrationWarning : introScript may add data-intro before React hydrates
        // data-scroll-behavior : globals.css smooth-scrolls in-page jumps; this has Next set that aside during route changes, so a new page starts at its top instantly
        <html
            lang="en"
            suppressHydrationWarning
            data-scroll-behavior="smooth"
            className={`${koulen.variable} ${magra.variable} ${redditSans.variable}`}
        >
            <head>
                <script dangerouslySetInnerHTML={{ __html: introScript }} />
                {/* Without JavaScript nothing ever reveals a hidden ScrollSection, so this shows it as it is; unlayered, so it outranks the utilities that hide it */}
                <noscript dangerouslySetInnerHTML={{ __html: noScriptReveal }} />
            </head>
            <body>
                {/* Components mounted here are persistent across all pages */}
                <IntroGate />
                <RouteBackground />
                <SideNav />
                {children}
            </body>
        </html>
    );
}
