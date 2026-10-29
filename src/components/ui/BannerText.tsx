// Full class names enables Tailwind's scanner to find them
// On the first load, the banner slides in from its own side of the screen
const corners = {
    "top-left": "top-banner left-banner intro:motion-safe:animate-intro-banner-left",
    "top-right": "top-banner right-banner text-right intro:motion-safe:animate-intro-banner-right",
    "bottom-left": "bottom-banner left-banner intro:motion-safe:animate-intro-banner-left",
    "bottom-right": "bottom-banner right-banner text-right intro:motion-safe:animate-intro-banner-right",
} as const;
export type BannerCorner = keyof typeof corners;

// Box is trimmed to the cap height and last baseline
export function BannerText({ corner, children }: { corner: BannerCorner; children: React.ReactNode }) {
    return (
        <h1 className={`absolute ${corners[corner]} font-reddit-sans italic text-banner text-white drop-shadow-banner [text-box:trim-both_cap_alphabetic]`}>
            {children}
        </h1>
    );
}

// Wrapper runs the clock that both layers inherit
// One grid cell stacks the text over its glow; z-1 keeps the text on top, as opacity and filter would lift the glow above it
export function AccentText({ children }: { children: React.ReactNode }) {
    return (
        <span className="isolate inline-grid animate-banner-accent motion-reduce:animate-none *:[grid-area:1/1]">
            <span className="z-1 text-banner-gradient">{children}</span>
            <span aria-hidden="true" className="text-banner-gradient opacity-30 blur-[0.1em] saturate-140 select-none">
                {children}
            </span>
        </span>
    );
}
