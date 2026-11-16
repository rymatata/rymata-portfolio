import Image from "next/image";
import { AboutSection } from "@/components/about/AboutSection";
import { Paragraph } from "@/components/ui/Paragraph";
import { education } from "@/lib/data/about";

// Education section: the university row on grid-about, then the degree's story
// Row: monogram on columns 4–5 at 90% of their width, its height from the SVG's own ratio; degree from column 6
export function Education() {
    return (
        <AboutSection title="Education">
            <div className="mb-degree grid-about items-center text-degree">
                <Image
                    src={education.logo.src}
                    alt={education.logo.alt}
                    width={59}
                    height={75}
                    className="col-span-2 col-start-4 h-auto w-9/10 drop-shadow-logo"
                />

                {/* Runs to the last column, so the first line never wraps on small differences in font metrics */}
                <div className="col-start-6 col-end-13 pb-degree-offset">
                    <h3 className="flex flex-col">
                        <span className="font-koulen text-white">{education.degree}</span>
                        <span className="font-magra text-evergreen">{education.school}</span>
                    </h3>
                    <p className="mt-timeline w-fit rounded-full bg-evergreen px-[calc(35em/38)] py-[calc(4em/38)] font-magra text-white drop-shadow-elevation">
                        {education.timeline}
                    </p>
                </div>
            </div>

            <div className="text-center">
                <Paragraph>
                    While enrolled at Loyola, I took on an accelerated path to graduate early with a Bachelors in
                    Computer Science and a Minor in Data Science. While I experienced a heavier workload, it opened up
                    many learning opportunities for me and provided critical programming experience.
                </Paragraph>
                <Paragraph>
                    As a result of the dual-experience with both Computer Science and Data Science, studying both fields
                    together shaped how I approach problems. Computer Science taught me how to build software, from
                    design patterns like MVC to full-stack development. Data Science taught me how to collect, analyze,
                    and visualize data with tools like R and SAS. Together, they taught me to see an application as more
                    than code: it’s also a way to capture information and make sense of it so they may be applied
                    towards real, professional experience.
                </Paragraph>
                <Paragraph>
                    Whether it was professional projects for clients or competing in hackathons, I applied my studies
                    through various programming practices. I worked on a student developer team that built and deployed
                    a MERN-stack web application for Medicaid Compasscare, a Maryland nonprofit, to help seniors find
                    assisted living facilities that accept Medicaid and SALS. I designed the wireframes in Figma, wrote
                    user stories, and worked directly with the client through Agile iterations. Everything from
                    designing, to coding, to deployment; my academic career opened up many opportunities for me that
                    I’ve since acquired years of professional work under my belt that spans across the entire
                    development process.
                </Paragraph>
            </div>
        </AboutSection>
    );
}
