"use client";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Client Component of SideNav that reads what page the user is currently on
// Every route is static, so the default prefetch already loads each full page once the link is in view
export function NavLink({ href, className, children }: { href: Route; className: string; children: React.ReactNode }) {
    const isActive = usePathname() === href;

    return (
        // aria-current announces the active page to screen readers AND doubles as the styling hook
        <Link href={href} className={className} aria-current={isActive ? "page" : undefined}>
            {children}
        </Link>
    );
}
