import { Koulen, Magra, Reddit_Sans } from "next/font/google";
import "./globals.css";

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
            <body>{children}</body>
        </html>
    );
}
