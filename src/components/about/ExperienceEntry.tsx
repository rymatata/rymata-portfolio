import { accentPhase } from "@/components/ui/AccentText";
import { Spotlight } from "@/components/ui/Spotlight";
import type { Experience } from "@/lib/data/about";

// Timeline markers as inline SVG paths, so fill-light-gray and drop-shadow-elevation style them and Spotlight can light a copy of the same outline
// A downward triangle under each bar, a diamond ending the timeline
const markers = {
    next: {
        viewBox: "0 0 25 13",
        path: "M10.9187 12.3661C11.6703 13.017 12.7858 13.017 13.5373 12.3661L23.7613 3.51186C25.1611 2.29959 24.3038 0 22.452 0H2.00403C0.152257 0 -0.705092 2.29959 0.694715 3.51186L10.9187 12.3661Z",
    },
    end: {
        viewBox: "0 0 25 18",
        path: "M11.2851 17.5233C11.9569 17.9712 12.8321 17.9712 13.5039 17.5233L23.8984 10.5937C25.0858 9.80206 25.0858 8.05715 23.8984 7.26551L13.5039 0.335876C12.8321 -0.111991 11.9569 -0.111989 11.2851 0.335878L0.890682 7.26551C-0.296785 8.05715 -0.296784 9.80206 0.890683 10.5937L11.2851 17.5233Z",
    },
} as const;

// One Professional Experience row on grid-experience: heading and timeline pill, divider, then the highlights
// Sizes come from the list's text-paragraph; every em token is px over 28 px text, so the row scales with it
export function ExperienceEntry({ experience, last }: { experience: Experience; last: boolean }) {
    const marker = markers[last ? "end" : "next"];
    // An ongoing role's pill fills with the flowing accent, so a future current job gets it from its data alone
    const current = experience.timeline.endsWith("Present");
    return (
        <li className="grid-experience">
            <div className="flex flex-col items-end gap-experience-gap pt-experience-inset text-right">
                <h3 className="flex flex-col whitespace-pre-line">
                    <span className="font-koulen">{experience.title}</span>
                    <span className="font-magra text-dark-gray">{experience.organization}</span>
                </h3>
                {/* The accent pill runs its own clock, as no AccentStack wraps it; every pill's Spotlight -z-1 light paints between its fill and its shadowed white text */}
                <p
                    style={current ? accentPhase(experience.timeline) : undefined}
                    className={`relative isolate min-w-experience-timeline rounded-full text-center px-[calc(30em/38)] font-magra text-white drop-shadow-elevation text-shadow-timeline ${
                        current ? "bg-accent-gradient animate-accent motion-reduce:animate-none" : "bg-dark-gray"
                    }`}
                >
                    <Spotlight />
                    {experience.timeline}
                </p>
            </div>

            {/* Bar stretches down row 1 to the description's bottom; its marker hangs below it in row 2 */}
            <div
                aria-hidden
                className="relative isolate w-experience-bar justify-self-center rounded-full bg-dark-gray drop-shadow-elevation"
            >
                <Spotlight />
            </div>

            <ul className="flex list-disc flex-col gap-experience-gap pt-experience-inset pl-experience-bullet font-reddit-sans italic">
                {experience.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                ))}
            </ul>

            {/* Marker wrapped as the spotlight's host, since an svg can't hold its light; block drops the inline baseline gap, so the wrapper is exactly the marker's height */}
            <div
                aria-hidden
                className="relative isolate col-start-2 row-start-2 mt-experience w-experience-marker justify-self-center drop-shadow-elevation"
            >
                <svg
                    viewBox={marker.viewBox}
                    className="block w-full fill-light-gray"
                >
                    <path d={marker.path} />
                </svg>
                <Spotlight shape={marker} />
            </div>
        </li>
    );
}
