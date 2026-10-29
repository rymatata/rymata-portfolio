import { NavFrame } from "@/components/layout/NavFrame";
import { NavLink } from "@/components/layout/NavLink";
import { navEntries, navHead } from "@/lib/data/nav";

// All possible styles/transitions for animating the side nav based on the current page AND what page the user is going to next
const tab =
    "flex overflow-clip rounded-l-full outline-offset-[calc(3em/20)] outline-white transition-[width,background-color,translate] duration-[300ms,150ms,300ms] ease-in-out delay-[200ms,0ms,0ms] group-data-collapsed:delay-0 motion-reduce:transition-none";
// Slide transition; text rides the shrinking tab, plus enough extra to clear the edge and slide off screen
const slideOut = "transition-[translate,visibility] duration-300 ease-in-out delay-250 group-data-collapsed:delay-0 motion-reduce:transition-none";

// Server Component shell
//* Comprised of Client Components: NavFrame, NavLink and the Lucide icons that ship Client JS
export function SideNav() {
    const HomeIcon = navHead.icon;

    return (
        <NavFrame aria-label="Primary" className="group fixed top-[2.6em] right-[-1.5em] z-10 flex flex-col items-end gap-[0.8em] font-koulen text-nav text-white intro:motion-safe:animate-intro-nav">
            {/* Name Card */}
            <div
                className={`${tab} relative h-[6em] w-[19.15em] flex-col justify-center bg-nav-head pl-[2.4em] drop-shadow-nav-head has-focus-visible:outline-2 group-data-collapsed:w-[5.95em] group-data-collapsed:translate-x-[-0.5em] group-data-collapsed:hover:translate-x-[-0.8em] group-data-collapsed:hover:bg-nav-head-hover`}
            >
                {/* nowrap to prevent lines from skewing as the head narrows */}
                {/* Hidden once off screen for extra insurance */}
                <span className={`${slideOut} flex flex-col whitespace-nowrap drop-shadow-nav-content group-data-collapsed:invisible group-data-collapsed:translate-x-[3.5em]`}>
                    <span aria-hidden="true" className="mb-[-0.6em] leading-[0.62]">{"</>"}</span>
                    <span className="-mb-[calc(12em/56)] text-[2.8em]">{navHead.name}</span>
                    <span className="leading-[0.62]">
                        <span aria-hidden="true">&lt;</span>
                        {navHead.role}
                        <span aria-hidden="true">/&gt;</span>
                    </span>
                </span>
                {/* Anchored to the right edge and enters only after the head collapses */}
                <HomeIcon className="absolute inset-y-0 right-[2.1em] my-auto size-[1.9em] translate-x-[calc(100%+1.65em)] drop-shadow-nav-content transition-[translate] duration-150 ease-in group-data-collapsed:translate-x-0 group-data-collapsed:delay-400 group-data-collapsed:ease-out motion-reduce:transition-none" />
                {/* Only when NOT on the Home page; covers the whole head sits on top layer. The head draws its focus ring, which its clip would cut off here */}
                <NavLink href="/" className="absolute inset-0 hidden outline-none group-data-collapsed:block">
                    <span className="sr-only">{navHead.label}</span>
                </NavLink>
            </div>

            {/* Navigation Menu */}
            <ul className="flex flex-col gap-[0.8em] drop-shadow-nav-buttons">
                {navEntries.map(([href, { label, icon: Icon }]) => (
                    <li key={href} className="group/tab">
                        <NavLink
                            href={href}
                            className={`${tab} h-[calc(47.5em/20)] w-[13em] items-center bg-nav-button pl-[1.65em] group-data-collapsed:w-[5.43em] group-data-collapsed:translate-x-[-0.5em] hover:bg-nav-button-hover group-hover/tab:translate-x-[-0.3em] group-data-collapsed:hover:translate-x-[-0.8em] focus-visible:outline-2 aria-[current=page]:bg-nav-button-current`}
                        >
                            {/* One filter shadows both the icon and the label */}
                            <span className="flex items-center gap-[0.6em] drop-shadow-nav-content">
                                <Icon className="size-[1.4em]" />
                                {/* Koulen font is uneven, so the box is trimmed to the cap height and baseline to ensure that items-center centers the visible caps */}
                                <span className={`${slideOut} [text-box:trim-both_cap_alphabetic] group-data-collapsed:translate-x-[2em]`}>{label}</span>
                            </span>
                        </NavLink>
                    </li>
                ))}
            </ul>
        </NavFrame>
    );
}
