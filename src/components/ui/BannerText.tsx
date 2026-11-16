import { AccentStack } from "@/components/ui/AccentText";

// Full class names enables Tailwind's scanner to find them
// On the first load, the banner slides in from its own side of the screen
const corners = {
    "top-left": "top-banner left-banner intro:motion-safe:animate-intro-banner-left",
    "top-right": "top-banner right-banner text-right intro:motion-safe:animate-intro-banner-right",
    "bottom-left": "bottom-banner left-banner intro:motion-safe:animate-intro-banner-left",
    "bottom-right": "bottom-banner right-banner text-right intro:motion-safe:animate-intro-banner-right",
} as const;
export type BannerCorner = keyof typeof corners;

// Each layer's box is trimmed to the cap height and last baseline, as trimming skips the grid itself
export function BannerText({ corner, children }: { corner: BannerCorner; children: React.ReactNode }) {
    return (
        <AccentStack
            as="h1"
            glow="banner"
            className={`absolute ${corners[corner]} font-reddit-sans italic text-banner text-white drop-shadow-banner *:[text-box:trim-both_cap_alphabetic]`}
        >
            {children}
        </AccentStack>
    );
}
