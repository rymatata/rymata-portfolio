import { ScrollSection } from "@/components/layout/ScrollNet";
import type { AboutSectionId } from "@/lib/data/about";

// Shared container for every About section: 100 px below it and an optional title
// A ScrollSection, so it stays hidden until the scroll first reaches it; id anchors it and its ScrollNet point
// scroll-mt-about stops a jump to it the page's top padding below the window's top, so the intro lands at the very top
// The title starts on the second column of grid-about, indenting it past the content's edge; its padding builds the 65 px title band
export function AboutSection({ id, title, className = "", children }: {
    id: AboutSectionId; title?: string; className?: string; children: React.ReactNode;
}) {
    const titleId = title && `${id}-title`;
    return (
        <ScrollSection
            id={id}
            aria-labelledby={titleId}
            className={`scroll-mt-about pb-about-section ${className}`}
        >
            {title && (
                <div className="grid-about">
                    <h2
                        id={titleId}
                        className="col-span-11 col-start-2 mb-about-title py-about-title-band font-magra text-about-title text-white drop-shadow-elevation"
                    >
                        {title}
                    </h2>
                </div>
            )}
            {children}
        </ScrollSection>
    );
}
