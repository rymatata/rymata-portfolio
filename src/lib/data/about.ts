import { navHead } from "@/lib/data/nav";

// Photo at the top of the About page, over its flat parallax net
export const headshot = {
    src: "/images/personal-headshot.jpg",
    alt: `Portrait of ${navHead.name}`,
} as const;

// University row of the About Education section
export const education = {
    degree: "Bachelors in Computer Science",
    school: "Loyola University Maryland",
    timeline: "Sep 2022 - May 2025",
    logo: {
        src: "/logos/loyola/loyola-monogram-cmyk-green.svg",
        alt: "Loyola University Maryland monogram",
    },
} as const;

// One row of the About Professional Experience timeline; "\n" in title or organization forces a line break (ExperienceEntry renders with whitespace-pre-line)
export type Experience = {
    title: string;
    organization: string;
    timeline: string;
    highlights: readonly string[];
};

// Professional Experience entries, rendered top to bottom in this order; the last one ends the timeline with the diamond marker
export const experiences: readonly Experience[] = [
    {
        title: "Executive Board Member /\nLead Web Developer",
        organization: "Digital Civics",
        timeline: "Sep 2020 - May 2022",
        highlights: [
            "Led design and development of the organization’s official website to centralize projects, resources, and outreach",
            "Instructed web development classes for youth (K-8th)",
            "Organized community and charity events to provide families with computers and technology access",
            "Collaborated with local and international groups to deliver websites and technology for charitable initiatives",
        ],
    },
    {
        title: "Logistical Staff",
        organization: "Loyola University Maryland\nEvents Services",
        timeline: "Sep 2023 - May 2025",
        highlights: [
            "Operated complex audiovisual systems to support campus-wide events",
            "Diagnosed and resolved technical issues as they occur during live events; actively solving problems and contributing as a proactive team member",
            "Formally collaborated with team members and clients to plan, coordinate, and deliver seamless event experiences",
        ],
    },
    {
        title: "Student Software Developer",
        organization: "Senior Computer Science\nCapstone Project",
        timeline: "Dec 2024 - May 2025",
        highlights: [
            "Built a MERN full-stack web application, enabling real-time data management and assisted living facility information access",
            "Designed user-friendly UI/UX wireframes tailored to elderly users, incorporating client branding and accessibility considerations",
            "Integrated Google Maps API for location display and directions to assisted living facilities across Maryland",
            "Collaborated with a nonprofit client, managing iterations, user stories, and project timelines to deliver a functional, client-driven solution",
        ],
    },
    {
        title: "Audiovisual Technician",
        organization: "Event Technology Solutions",
        timeline: "May 2022 - Present",
        highlights: [
            "Operated and maintained complex audiovisual systems to deliver professional event experiences",
            "Diagnosed and resolved unexpected technical issues to ensure smooth show operations",
            "Analyzed event logistics, including setup, show-flow, and being a proactive team member behind the scenes",
            "Formally communicated with clients and staff to align technical execution with event goals",
        ],
    },
];

// One logo of the About Technical Skills section; name is its alt text and the label its name pill shows
// width and height only carry the file's aspect ratio for next/image (h-auto keeps it); raster files use a ~240 px base so the optimizer serves a small variant
export type Skill = {
    name: string;
    logo: { src: string; width: number; height: number };
};

// One Technical Skills category: its header, then one logo per skill in a single centered row of up to six
export type SkillCategory = {
    title: string;
    skills: readonly Skill[];
};

// Technical Skills categories, rendered top to bottom in this order; each row's pill starts on its first skill
export const skillCategories: readonly SkillCategory[] = [
    {
        title: "Programming Languages",
        skills: [
            { name: "JavaScript", logo: { src: "/logos/programming-langs/javascript-logo.svg", width: 630, height: 630 } },
            { name: "Python", logo: { src: "/logos/programming-langs/python-logo.svg", width: 110, height: 110 } },
            { name: "Java", logo: { src: "/logos/programming-langs/java-logo.svg", width: 32, height: 32 } },
            { name: "C", logo: { src: "/logos/programming-langs/c-logo.svg", width: 2113, height: 2500 } },
        ],
    },
    {
        title: "Frameworks / Libraries",
        skills: [
            { name: "NumPy", logo: { src: "/logos/frameworks-libs/numpy-logo.svg", width: 32, height: 32 } },
            { name: "pandas", logo: { src: "/logos/frameworks-libs/pandas-logo.svg", width: 210, height: 280 } },
            { name: "Vue", logo: { src: "/logos/frameworks-libs/vue-logo.svg", width: 32, height: 32 } },
            { name: "Tailwind CSS", logo: { src: "/logos/frameworks-libs/tailwind-logo.svg", width: 32, height: 32 } },
            { name: "React", logo: { src: "/logos/frameworks-libs/react-logo.svg", width: 32, height: 32 } },
            { name: "Vite", logo: { src: "/logos/frameworks-libs/vite-logo.svg", width: 32, height: 32 } },
        ],
    },
    {
        title: "Markup / Formatting Languages",
        skills: [
            { name: "LaTeX", logo: { src: "/logos/markup-format/latex-project-logo.svg", width: 288, height: 222 } },
            { name: "HTML", logo: { src: "/logos/markup-format/html-logo.svg", width: 32, height: 32 } },
            { name: "CSS", logo: { src: "/logos/markup-format/css-logo.svg", width: 32, height: 32 } },
        ],
    },
    {
        title: "Software",
        skills: [
            { name: "Final Cut Pro", logo: { src: "/logos/software/fcpx-logo.webp", width: 240, height: 240 } },
            { name: "Jupyter Notebook", logo: { src: "/logos/software/jupyter-logo.svg", width: 32, height: 32 } },
            { name: "Adobe Premiere Pro", logo: { src: "/logos/software/adobe-pr-logo.svg", width: 32, height: 32 } },
            { name: "Adobe Photoshop", logo: { src: "/logos/software/adobe-ps-logo.svg", width: 32, height: 32 } },
            { name: "Figma", logo: { src: "/logos/software/figma-logo.svg", width: 32, height: 32 } },
        ],
    },
    {
        title: "Database Management",
        skills: [
            { name: "Microsoft Access", logo: { src: "/logos/data-tools/ms-access-logo.svg", width: 1993, height: 1947 } },
            { name: "Microsoft Excel", logo: { src: "/logos/data-tools/ms-excel-logo.png", width: 240, height: 224 } },
            { name: "R", logo: { src: "/logos/data-tools/r-logo.svg", width: 724, height: 561 } },
            { name: "SAS", logo: { src: "/logos/data-tools/sas-logo.svg", width: 64, height: 64 } },
            { name: "Firebase", logo: { src: "/logos/data-tools/firebase-logo.svg", width: 32, height: 32 } },
            { name: "MongoDB", logo: { src: "/logos/data-tools/mongo-logo.svg", width: 32, height: 32 } },
        ],
    },
];
