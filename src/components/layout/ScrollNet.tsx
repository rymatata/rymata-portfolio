"use client";
import { createContext, useContext, useEffect, useId, useRef } from "react";
import { useScrollSpy } from "@/lib/hooks/useScrollSpy";
import { SCROLL_NET, SCROLL_NET_SHADE, scrollNetLayout, type ScrollNetLayout, type ScrollNetSection } from "@/lib/scroll-net";

// The page's sections and the farthest one its scroll has reached; each ScrollSection reads it to tell whether it has been revealed yet
const ScrollNetContext = createContext<{ sections: readonly ScrollNetSection[]; reached: number } | null>(null);

// Site scrollbar for pages that scroll, standing in for the hidden native one: one column of the headshot net's dots, a point per section, each drifting in place
// Fixed at the window's left center and as tall as the headshot net (h-scroll-net); the current section's point is lit, the rest rest dimmed (opacity-scroll-point)
// Wraps the page, so each ScrollSection inside it stays hidden until the scroll first reaches it; a section's fade and its point's change share scroll-reveal's clock
// Each point links to its section: a click glides there through html's scroll-behavior and moves focus into it, leaving the URL as it is
//* sections must keep one identity across renders, like the page data it comes from
export function ScrollNet({ sections, children }: { sections: readonly ScrollNetSection[]; children: React.ReactNode }) {
    const { current, reached } = useScrollSpy(sections);
    const svgRef = useRef<SVGSVGElement>(null);
    const shadeId = useId();
    const { width, top, spacing } = scrollNetLayout(sections.length);
    const { height, dotRadius, lineWidth } = SCROLL_NET;
    const home = (i: number) => top + i * spacing;
    const share = (length: number) => `${(length / height) * 100}%`;  // A viewBox length as a share of the box's height

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;
        return trackDrift(svg, scrollNetLayout(sections.length));
    }, [sections.length]);

    return (
        <ScrollNetContext value={{ sections, reached }}>
            {/* Height from h-scroll-net and width from the column's own ratio, so the svg fills the box exactly */}
            <nav
                aria-label="Sections"
                className="fixed top-1/2 left-scroll-net z-10 h-scroll-net -translate-y-1/2"
                style={{ aspectRatio: `${width} / ${height}` }}
            >
                {/* Drawn in text-scroll-net: the lines stroke it and the shading scales it */}
                {/* overflow-visible : keeps the anti-aliased rim of a dot at the far side of its loop */}
                <svg
                    ref={svgRef}
                    aria-hidden
                    viewBox={`${-width / 2} ${-height / 2} ${width} ${height}`}
                    className="size-full overflow-visible text-scroll-net drop-shadow-scroll-net"
                >
                    <defs>
                        <radialGradient
                            id={shadeId}
                            fx={SCROLL_NET_SHADE.fx}
                            fy={SCROLL_NET_SHADE.fy}
                            cx={SCROLL_NET_SHADE.cx}
                            cy={SCROLL_NET_SHADE.cy}
                            r={SCROLL_NET_SHADE.r}
                        >
                            {/* The attribute's plain net color stands in wherever relative colors aren't supported, leaving a dot unshaded rather than black */}
                            {SCROLL_NET_SHADE.stops.map(({ offset, shade }) => (
                                <stop
                                    key={offset}
                                    offset={offset}
                                    stopColor="currentColor"
                                    style={{ stopColor: `rgb(from currentColor calc(r * ${shade}) calc(g * ${shade}) calc(b * ${shade}))` }}
                                />
                            ))}
                        </radialGradient>
                    </defs>

                    {/* Lines between neighbors run rim to rim, so a dimmed point never shows a line through it; trackDrift carries their ends with the dots */}
                    {sections.slice(1).map((section, i) => (
                        <line
                            key={section.id}
                            x1={0}
                            y1={home(i) + dotRadius}
                            x2={0}
                            y2={home(i + 1) - dotRadius}
                            stroke="currentColor"
                            strokeWidth={lineWidth}
                            vectorEffect="non-scaling-stroke"
                        />
                    ))}

                    {/* Points over the lines, as the nets paint their dots last */}
                    {sections.map((section, i) => (
                        <circle
                            key={section.id}
                            cx={0}
                            cy={home(i)}
                            r={dotRadius}
                            fill={`url(#${shadeId})`}
                            className={`scroll-reveal ${i === current ? "opacity-100" : "opacity-scroll-point"}`}
                        />
                    ))}
                </svg>

                {/* One hit target per point, a spacing tall and centered on its home, so the targets tile the column without overlapping yet cover a dot anywhere on its loop */}
                <ol className="absolute inset-0">
                    {sections.map((section, i) => (
                        <li
                            key={section.id}
                            className="absolute left-1/2 aspect-square -translate-x-1/2 -translate-y-1/2"
                            style={{ top: share(home(i) + height / 2), height: share(spacing) }}
                        >
                            <a
                                href={`#${section.id}`}
                                aria-current={i === current ? "true" : undefined}
                                onClick={(event) => jump(event, section.id)}
                                className="group flex size-full items-center justify-center outline-none"
                            >
                                <span className="sr-only">{section.label}</span>
                                {/* Focus ring drawn tight around the point instead of the whole target */}
                                <span
                                    aria-hidden
                                    className="size-1/3 rounded-full outline-white group-focus-visible:outline-2"
                                />
                            </a>
                        </li>
                    ))}
                </ol>
            </nav>
            {children}
        </ScrollNetContext>
    );
}

// One section of a ScrollNet page: hidden until the scroll first reaches it, then fading in on scroll-reveal's clock as its point lights
// Hidden by opacity alone, so screen readers and find-in-page still reach it; server-rendered hidden, so it never flashes before hydration
// Never hidden under reduced motion or outside a ScrollNet; without JavaScript, the root layout's noscript style shows it
// tabIndex -1 lets a point's jump move focus into it without adding it to the tab order; outline-none, as it's a jump target, not a control
// Named by its title when aria-labelledby points to one, otherwise by its ScrollNet label
export function ScrollSection({ id, className = "", children, ...props }: React.ComponentProps<"section"> & { id: string }) {
    const context = useContext(ScrollNetContext);
    const index = context ? context.sections.findIndex((section) => section.id === id) : -1;
    const hidden = context !== null && index > context.reached;
    return (
        <section
            {...props}
            id={id}
            tabIndex={-1}
            aria-label={props["aria-label"] ?? (props["aria-labelledby"] ? undefined : context?.sections[index]?.label)}
            data-hidden={hidden ? "" : undefined}
            className={`scroll-reveal outline-none motion-safe:data-hidden:opacity-0 motion-safe:data-hidden:translate-y-(--scroll-reveal-distance) ${className}`}
        >
            {children}
        </section>
    );
}

// A plain click glides to the section and hands it focus, as a native jump to #id would, but leaves the URL and history alone
// A click with a modifier key falls through to the browser, so the link still opens in a new tab or window
function jump(event: React.MouseEvent<HTMLAnchorElement>, id: string) {
    const section = document.getElementById(id);
    if (!section || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    section.focus({ preventScroll: true });
    // A glide through html's scroll-behavior, a cut under reduced motion; the section's scroll-margin sets where it stops
    section.scrollIntoView({ block: "start" });
}

// Loops each point through its home, as the headshot net's dots loop around theirs, carrying both ends of every line with it; returns the cleanup
// Each loop passes through its home at time 0, where the server drew the point, so the drift starts without a jump
// Writes the svg's geometry directly; React's props stay on the homes, so a re-render never overwrites a frame
// Runs only while on screen without a reduced-motion preference; holding still, every point rests on its home
function trackDrift(svg: SVGSVGElement, layout: ScrollNetLayout): () => void {
    const { drift, driftRate, dotRadius } = SCROLL_NET;
    // A new loop for every point on every visit, spread as buildFlatScene spreads the headshot net's
    const dots = Array.from(svg.querySelectorAll("circle"), (element, i) => ({
        element,
        home: layout.top + i * layout.spacing,
        angle: Math.random() * 2 * Math.PI,
        spin: Math.random() * 4 - 2,
        x: 0,
        y: 0,
    }));
    const lines = Array.from(svg.querySelectorAll("line"), (element, i) => ({ element, from: dots[i], to: dots[i + 1] }));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    let time = 0;  // Seconds of drift so far
    let visible = false;
    let moving = false;
    let frameId = 0;
    let lastFrame = 0;

    const intersectionObserver = new IntersectionObserver((entries) => {
        visible = entries.at(-1)?.isIntersecting ?? visible;
        updateMotion();
    });

    function updateMotion() {
        if (reducedMotion.matches) rest();

        const next = visible && !reducedMotion.matches;
        if (next === moving) return;
        moving = next;
        cancelAnimationFrame(frameId);
        frameId = 0;
        if (moving) {
            lastFrame = 0;
            frameId = requestAnimationFrame(frame);
        }
    }

    function frame(now: number) {
        // Capped, so coming back to a background tab doesn't jump
        const delta = lastFrame ? Math.min((now - lastFrame) / 1000, 0.1) : 0;
        lastFrame = now;
        time += delta;
        draw();
        frameId = requestAnimationFrame(frame);
    }

    function rest() {
        time = 0;
        draw();
    }

    // Moves each point along its loop, then runs each line between its two points' rims
    function draw() {
        for (const dot of dots) {
            const turn = dot.angle + dot.spin * driftRate * time;
            dot.x = drift * (Math.cos(turn) - Math.cos(dot.angle));
            dot.y = dot.home + drift * (Math.sin(turn) - Math.sin(dot.angle));
            dot.element.setAttribute("cx", dot.x.toFixed(2));
            dot.element.setAttribute("cy", dot.y.toFixed(2));
        }

        for (const { element, from, to } of lines) {
            if (!from || !to) continue;
            const length = Math.hypot(to.x - from.x, to.y - from.y) || 1;
            const rimX = ((to.x - from.x) / length) * dotRadius;
            const rimY = ((to.y - from.y) / length) * dotRadius;
            element.setAttribute("x1", (from.x + rimX).toFixed(2));
            element.setAttribute("y1", (from.y + rimY).toFixed(2));
            element.setAttribute("x2", (to.x - rimX).toFixed(2));
            element.setAttribute("y2", (to.y - rimY).toFixed(2));
        }
    }

    intersectionObserver.observe(svg);  // Reports right away, starting the drift if on screen
    reducedMotion.addEventListener("change", updateMotion);

    return () => {
        intersectionObserver.disconnect();
        reducedMotion.removeEventListener("change", updateMotion);
        cancelAnimationFrame(frameId);
        rest();  // Back on the homes the props hold, so a remount (Fast Refresh, Strict Mode) starts where the server drew them
    };
}
