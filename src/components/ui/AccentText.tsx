// FNV-1a; deterministic, so server and client agree
function hash(text: string) {
    let h = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) {
        h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
    }
    return h >>> 0;
}

// Offset into the shared accent clock, hashed from the text, so each bg-accent-gradient flows uniquely yet the same on server and client
export function accentPhase(text: string): React.CSSProperties {
    return { "--accent-phase": `${(hash(text) % 10000) / 100}turn` } as React.CSSProperties;
}

// Different glow-styles based on the accent text type
const glows = {
    banner:    "text-transparent opacity-35  blur-[0.1em]  saturate-140",
    paragraph: "text-transparent opacity-80  blur-[0.075em]  saturate-100 brightness-30",
} as const;
export type AccentGlow = keyof typeof glows;

// Inline, so a long accent wraps with its sentence; its gradient flows across the break
// Phase comes from the text, so each accent flows uniquely and both stack layers still match
//* Glows only inside an AccentStack
export function AccentText({ children }: { children: React.ReactNode }) {
    return (
        <span
            style={typeof children === "string" ? accentPhase(children) : undefined}
            className="bg-accent-gradient text-accent-gradient"
        >
            {children}
        </span>
    );
}

// Wrapper runs the clock that both layers inherit
// One grid cell stacks the text over its glow; z-1 keeps the text on top, as opacity and filter would lift the glow above it
// The glow is a full copy whose plain text is transparent, so only accents glow; equal widths wrap both copies alike
// inert keeps the copy out of screen readers, selection, and find-in-page
export function AccentStack({ as: Tag, className, glow, children }: {
    as: "h1" | "p"; className: string; glow?: AccentGlow; children: React.ReactNode;
}) {
    return (
        <Tag className={`isolate grid animate-accent motion-reduce:animate-none *:[grid-area:1/1] ${className}`}>
            <span className="z-1">{children}</span>
            {glow && (
                <span
                    inert
                    className={glows[glow]}
                >
                    {children}
                </span>
            )}
        </Tag>
    );
}
