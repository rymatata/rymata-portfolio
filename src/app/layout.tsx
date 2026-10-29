import "./globals.css";
import { IntroGate } from "@/components/layout/IntroGate";
import { RouteBackground } from "@/components/layout/RouteBackground";
import { SideNav } from "@/components/layout/SideNav";
import { introScript } from "@/lib/intro";
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
        <html lang="en" className={`${koulen.variable} ${magra.variable} ${redditSans.variable}`} suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: introScript }} />
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
