"use client";

import Image from "next/image";
import { useState } from "react";
import { Spotlight } from "@/components/ui/Spotlight";
import type { SkillCategory } from "@/lib/data/about";

// Column of a row's first logo cell, indexed by the row's logo count: 7 − count centers its two-column cells on grid-about's 12 columns
// Static strings so Tailwind generates every class; a row holds up to six logos, and the rest of its cells auto-place after the first
const rowStart = ["", "col-start-6", "col-start-5", "col-start-4", "col-start-3", "col-start-2", "col-start-1"] as const;

// One Technical Skills category: header, centered logo row, then a name pill showing the last logo pointed at (the first until then)
// Each logo mirrors the Education monogram: a col-span-2 cell of grid-about (here at 70% width), with drop-shadow-logo resolving its em against text-degree
export function SkillCategoryEntry({ category }: { category: SkillCategory }) {
    const [active, setActive] = useState(0);
    return (
        <div>
            <h3 className="text-center font-koulen text-skill-category text-white">{category.title}</h3>

            <ul className="mt-skill-logos grid-about items-center text-degree">
                {category.skills.map((skill, i) => (
                    // pointerenter fires for mouse, pen, and touch, so a tap also switches the pill
                    <li
                        key={skill.name}
                        className={`col-span-2 ${i === 0 ? (rowStart[category.skills.length] ?? "") : ""}`}
                        onPointerEnter={() => setActive(i)}
                    >
                        <Image
                            src={skill.logo.src}
                            alt={skill.name}
                            width={skill.logo.width}
                            height={skill.logo.height}
                            className="mx-auto h-auto w-7/10 drop-shadow-logo"
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
                {category.skills[active]?.name}
            </p>
        </div>
    );
}
