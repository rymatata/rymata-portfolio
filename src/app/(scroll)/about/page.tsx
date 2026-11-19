import { AboutIntro } from "@/components/about/AboutIntro";
import { Education } from "@/components/about/Education";
import { Experience } from "@/components/about/Experience";
import { TechnicalSkills } from "@/components/about/TechnicalSkills";

// Table of contents: each section is its own component, stacked in the centered About column (w-about)
// py-about pads the column equally above the headshot and below the last section, so the page ends with the same breathing room it starts with
export default function AboutPage() {
    return (
        <main className="px-4 py-about">
            <h1 className="sr-only">About</h1>
            <div className="mx-auto w-about">
                <AboutIntro />
                <Education />
                <Experience />
                <TechnicalSkills />
            </div>
        </main>
    );
}
