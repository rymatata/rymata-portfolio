"use client";
import { usePathname } from "next/navigation";

// Client Component that wraps around the whole nav; used to store all page routes
// data-collapsed=false : Only used for Home page to display nav icons AND text
// data-collapsed=true  : Used for every other page to only show nav icons, no text (server-rendered tabs that are inside style with group-data-collapsed)
export function NavFrame({ children, ...props }: React.ComponentProps<"nav">) {
    const isHome = usePathname() === "/";

    return (
        <nav {...props} data-collapsed={isHome ? undefined : ""}>
            {children}
        </nav>
    );
}
