import Image from "next/image";
import { HeadshotNet } from "@/components/about/HeadshotNet";
import { Tilt } from "@/components/ui/Tilt";
import { headshot } from "@/lib/data/about";

// Figma's About intro without its text: the photo over a band of connected dots, here a flat parallax net
// The net stays inside it, so nothing around it clips the net
//* Comprised of Client Components: HeadshotNet, Tilt
export function Headshot() {
    return (
        <div className="relative mx-auto aspect-948/225.5 w-headshot">
            <HeadshotNet className="absolute inset-0" />

            {/* As tall as the band and centered on it; object-top keeps the face in the upper half of the circle */}
            {/* preload : Likely the page's largest paint, so it's fetched with the HTML rather than when it's laid out */}
            <Tilt className="absolute top-0 left-1/2 aspect-square h-full -translate-x-1/2" falloff={18} amplitude={6}>
                <div className="relative size-full overflow-hidden rounded-full drop-shadow-headshot">
                    <Image
                        src={headshot.src}
                        alt={headshot.alt}
                        fill
                        preload
                        sizes="(max-width: 1050px) 48vw, 24vw"
                        className="object-top object-cover scale-105 translate-x-0.5"
                    />
                </div>
            </Tilt>
        </div>
    );
}
