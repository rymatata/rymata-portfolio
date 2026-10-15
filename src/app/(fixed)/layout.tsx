export default function FixedLayout({ children }: { children: React.ReactNode }) {
    // Viewport-sized positioning context, so pages can pin content to the screen corners
    return <div className="relative h-dvh">{children}</div>;
}
