import { BannerText, AccentText } from "@/components/ui/BannerText";

export default function HomePage() {
    return (
        <BannerText corner="bottom-left">
            Thoughtfully crafted,<br />
            envisioned by <AccentText>you.</AccentText>
        </BannerText>
    );
}
