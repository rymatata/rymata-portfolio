import { AboutSection } from "@/components/about/AboutSection";
import { Headshot } from "@/components/about/Headshot";
import { AccentText } from "@/components/ui/AccentText";
import { Paragraph } from "@/components/ui/Paragraph";

// First About section: the headshot over its net, then the introduction
export function AboutIntro() {
    return (
        <AboutSection className="text-center">
            <Headshot />
            <Paragraph>
                Hey there! My name is Ryland Mata, and I am a <AccentText>full-stack developer</AccentText> with
                <AccentText> data analysis</AccentText> experience.
            </Paragraph>
            <Paragraph>
                My programming career began in 2020, when my high school friends and I established a
                local organization known as Digital Civics. Our goal was to support our town’s community through
                educating the youth on coding, hosting social events with other local organizations, and donating
                computers to families in need of them. I worked as the <AccentText>lead web developer</AccentText> for
                the organization’s website and taught courses on front-end development at our local library.
            </Paragraph>
            <Paragraph>
                In addition to coding, I’ve built extensive career experience as
                an <AccentText>audiovisual technician</AccentText> since 2022. This involves client coordination and
                operating on a team for large-scale operations, all while navigating the technicalities of
                programming audiovisual equipment. Working live events, ranging from corporate conferences to
                live awards ceremonies, has equipped me with dynamic social and technical skills that are integral
                towards providing solutions in professional situations.
            </Paragraph>
            <Paragraph>
                From then on, I’ve continued professional audiovisual work while going on to study both
                Computer Science and Data Science at Loyola University Maryland. It is here where I graduated with a
                <AccentText> Bachelor’s degree in Computer Science and a Minor in Data Science.</AccentText>
            </Paragraph>
        </AboutSection>
    );
}
