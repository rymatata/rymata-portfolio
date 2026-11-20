import { useEffect, useState } from "react";

// Which section the page has scrolled to, for ScrollNet
//   current: the last section whose top has risen to the trigger line (--scroll-reveal-line down the window); the last one too once the page can't scroll any further, so a short final section still counts
//   reached: the farthest current so far, so a section revealed once stays revealed for the visit
// Measured at most once a frame: on scroll, on resize, and whenever the page's height changes, as late fonts and images push the sections down
// State is only set inside those frames, never during the effect itself
//* sections must keep one identity across renders, like the page data it comes from; a new array every render would restart the spy
export function useScrollSpy(sections: readonly { id: string }[]): { current: number; reached: number } {
    const [current, setCurrent] = useState(0);
    const [reached, setReached] = useState(0);

    useEffect(() => {
        const root = document.documentElement;
        const elements = sections.map(({ id }) => document.getElementById(id));
        let frameId = 0;

        function measure() {
            frameId = 0;
            // Read on every measure, so retuning the line in globals.css applies from the next scroll; registered, so it always reads back as a percentage
            const line = (parseFloat(getComputedStyle(root).getPropertyValue("--scroll-reveal-line")) / 100) * window.innerHeight;
            const atEnd = window.scrollY + window.innerHeight >= root.scrollHeight - 1;

            let next = 0;
            elements.forEach((element, i) => {
                if (element && element.getBoundingClientRect().top <= line) next = i;
            });
            if (atEnd) next = elements.length - 1;

            setCurrent(next);
            setReached((farthest) => Math.max(farthest, next));
        }

        function requestMeasure() {
            frameId ||= requestAnimationFrame(measure);
        }

        const resizeObserver = new ResizeObserver(requestMeasure);
        resizeObserver.observe(root);  // Reports right away, so the first measure lands on the first frame
        window.addEventListener("scroll", requestMeasure, { passive: true });
        window.addEventListener("resize", requestMeasure, { passive: true });

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener("scroll", requestMeasure);
            window.removeEventListener("resize", requestMeasure);
            cancelAnimationFrame(frameId);
        };
    }, [sections]);

    return { current, reached };
}
