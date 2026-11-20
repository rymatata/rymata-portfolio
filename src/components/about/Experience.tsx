import { AboutSection } from "@/components/about/AboutSection";
import { ExperienceEntry } from "@/components/about/ExperienceEntry";
import { experiences } from "@/lib/data/about";

// Professional Experience section: one ExperienceEntry per item in experiences, so a new job is only new data
// text-paragraph sits on the list, so every em token inside the entries resolves against it
// The list spans layout columns 2–11, leaving one empty column on each side and lining up with the title
export function Experience() {
    return (
        <AboutSection
            id="experience"
            title="Professional Experience"
        >
            <div className="grid-about">
                <ol className="col-span-10 col-start-2 flex flex-col gap-experience text-paragraph text-white">
                    {experiences.map((experience, i) => (
                        <ExperienceEntry
                            key={`${experience.title} ${experience.timeline}`}
                            experience={experience}
                            last={i === experiences.length - 1}
                        />
                    ))}
                </ol>
            </div>
        </AboutSection>
    );
}
