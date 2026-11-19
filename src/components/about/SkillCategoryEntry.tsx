"use client";

import Image from "next/image";
import { useState } from "react";
import { SplitText } from "@/components/ui/SplitText";
import { Spotlight } from "@/components/ui/Spotlight";
import type { SkillCategory } from "@/lib/data/about";

// Column of a row's first logo cell, indexed by the row's logo count: 7 − count centers its two-column cells on grid-about's 12 columns
// Static strings so Tailwind generates every class; a row holds up to six logos, and the rest of its cells auto-place after the first
const rowStart = ["", "col-start-6", "col-start-5", "col-start-4", "col-start-3", "col-start-2", "col-start-1"] as const;

// One Technical Skills category: header, centered logo row, then a name pill showing the last logo pointed at (the first until then)
// Each logo mirrors the Education monogram: a col-span-2 cell of grid-about (here at 70% width), with its drop shadow (drop-shadow-logo, or drop-shadow-logo-glow when lit) resolving its em against text-degree
// Lit logo: every logo rests dimmed except the active one, which grows, turns fully opaque, and swaps its black shadow for drop-shadow-logo-glow, easing between the two
// The same active index drives the pill, so the lit logo stays on after the pointer leaves and always names the skill the pill shows
// Name flip: each switch to a new skill flips its name in letter by letter through SplitText; first paint shows the plain name, so nothing flips on load
export function SkillCategoryEntry({ category }: { category: SkillCategory }) {
    const [active, setActive] = useState(0);
    const [switched, setSwitched] = useState(false);  // Latches on the first switch, so the flip only plays once the name has changed
    const name = category.skills[active]?.name ?? "";
    return (
        <div>
            <h3 className="text-center font-koulen text-skill-category text-white">{category.title}</h3>

            <ul className="mt-skill-logos grid-about items-center text-degree">
                {category.skills.map((skill, i) => (
                    // pointerenter fires for mouse, pen, and touch, so a tap also switches the pill and the lit logo
                    // Re-entering the lit logo changes nothing, so its name doesn't replay the flip
                    <li
                        key={skill.name}
                        className={`col-span-2 ${i === 0 ? (rowStart[category.skills.length] ?? "") : ""}`}
                        onPointerEnter={() => {
                            if (i === active) return;
                            setActive(i);
                            setSwitched(true);
                        }}
                    >
                        {/* The lit and dimmed sets each name one shadow, so the two drop-shadow utilities never compete; the lit logo needs no opacity class, since opacity defaults to fully opaque */}
                        <Image
                            src={skill.logo.src}
                            alt={skill.name}
                            width={skill.logo.width}
                            height={skill.logo.height}
                            className={`mx-auto h-auto w-7/10 transition-[opacity,scale,filter] duration-500 ease-out motion-reduce:transition-none ${i === active ? "scale-skill-logo drop-shadow-logo-glow" : "opacity-skill-logo drop-shadow-logo"}`}
                        />
                    </li>
                ))}
            </ul>

            {/* Hidden from screen readers, since each logo's alt text already names it; always rendered, so switching names never shifts the page */}
            <p
                aria-hidden
                className="relative isolate mx-auto mt-skill-name w-fit min-w-skill-name max-w-full rounded-full bg-dark-gray px-[calc(40em/64)] text-center font-koulen text-skill-name text-white drop-shadow-elevation text-shadow-skill-name"
            >
                <Spotlight />
                {switched ? <SplitText text={name} /> : name}
            </p>
        </div>
    );
}
