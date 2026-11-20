import { AboutSection } from "@/components/about/AboutSection";
import { SkillCategoryEntry } from "@/components/about/SkillCategoryEntry";
import { skillCategories } from "@/lib/data/about";

// Technical Skills section: one SkillCategoryEntry per item in skillCategories, so a new category or logo is only new data
// Stays a Server Component; only each SkillCategoryEntry, with its lit logo row and name pill, runs on the client
export function TechnicalSkills() {
    return (
        <AboutSection
            id="skills"
            title="Technical Skills"
        >
            <div className="flex flex-col gap-skill-category">
                {skillCategories.map((category) => (
                    <SkillCategoryEntry
                        key={category.title}
                        category={category}
                    />
                ))}
            </div>
        </AboutSection>
    );
}
