import { AccentStack } from "@/components/ui/AccentText";

// Body text for every page; Magra at text-paragraph (24 px of the frame, floored at 1rem), spaced Figma's 22 px of 28 from whatever precedes it
// Accents are bold only here; AccentText itself keeps the weight around it
export function Paragraph({ children }: { children: React.ReactNode }) {
    return (
        <AccentStack
            as="p"
            glow="paragraph"
            className="font-magra text-paragraph text-white not-first:mt-paragraph [&_.text-accent-gradient]:font-bold"
        >
            {children}
        </AccentStack>
    );
}
