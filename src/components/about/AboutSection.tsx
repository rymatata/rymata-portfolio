// Shared container for every About section: 56 px below it and an optional title
// The title starts on the second column of grid-about, indenting it past the content's edge; its padding builds the 65 px title band
export function AboutSection({ title, className = "", children }: {
    title?: string; className?: string; children: React.ReactNode;
}) {
    // Spaces become hyphens; aria-labelledby splits on whitespace, so a multi-word id would never resolve
    const titleId = title && `${title.toLowerCase().replace(/\s+/g, "-")}-title`;
    return (
        <section
            aria-labelledby={titleId}
            className={`pb-about-section ${className}`}
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
        </section>
    );
}
