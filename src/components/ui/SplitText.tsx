import { Fragment } from "react";

// Letter-by-letter flip-in, ported from React Bits' SplitText with only its flip effect, chars split, expo-out ease, and center stagger
// Without gsap, its other effects, triggers, loop, hover effects, mask, or callbacks; animate-split-flip in globals.css runs the flip in CSS
// Each letter is an inline-block span, since a transform needs a box; its --split-step is its distance in letters from the text's center,
//   which animate-split-flip multiplies into its delay, so the flip ripples outward from the middle
// Words stay whitespace-nowrap, so long text wraps only at its spaces; spaces aren't letters, so they neither flip nor count toward the stagger
// Letters inherit the surrounding color, so the host sets it, like the name pill's text-white
// Keyed by its text, so new text remounts every letter and restarts the flip, even mid-flip
//* Plays once on mount; a host that wants no flip on first paint renders its plain text until the text changes
export function SplitText({ text }: { text: string }) {
    const words = text.split(" ").map((word) => Array.from(word));
    const center = (words.flat().length - 1) / 2;
    return (
        <span key={text}>
            {words.map((letters, w) => {
                const start = words.slice(0, w).flat().length;  // Letters in the words before this one
                return (
                    <Fragment key={w}>
                        {w > 0 && " "}
                        <span className="whitespace-nowrap">
                            {letters.map((letter, l) => (
                                <span
                                    key={l}
                                    className="inline-block origin-bottom motion-safe:animate-split-flip"
                                    style={{ "--split-step": Math.abs(start + l - center) } as React.CSSProperties}
                                >
                                    {letter}
                                </span>
                            ))}
                        </span>
                    </Fragment>
                );
            })}
        </span>
    );
}
