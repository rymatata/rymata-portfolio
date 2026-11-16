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

// One row of the About Professional Experience timeline; "\n" in title or organization keeps Figma's line breaks
export type Experience = {
    title: string;
    organization: string;
    timeline: string;
    highlights: readonly string[];
};

// Professional Experience entries in Figma's order; the last one ends the timeline with the diamond marker
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
            "Analyzed event logistics, including setup, show-flow, and being proactive team member behind the scenes",
            "Formally communicated with clients and staff to align technical execution with event goals",
        ],
    },
];
