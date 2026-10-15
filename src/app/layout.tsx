import "./globals.css";
import { RouteBackground } from "@/components/layout/RouteBackground";
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
        <html lang="en" className={`${koulen.variable} ${magra.variable} ${redditSans.variable}`}>
            <body>
                {/* Mounted once here, not in (fixed)/(scroll), so it persists and fades across route groups */}
                <RouteBackground />
                {children}
            </body>
        </html>
    );
}
