import { AboutIntro } from "@/components/about/AboutIntro";
import { Education } from "@/components/about/Education";
import { Experience } from "@/components/about/Experience";

// Table of contents: each section is its own component, stacked in the centered About column (w-about)
export default function AboutPage() {
    return (
        <main className="px-4 pt-about">
            <h1 className="sr-only">About</h1>
            <div className="mx-auto w-about">
                <AboutIntro />
                <Education />
                <Experience />
            </div>
        </main>
    );
}
