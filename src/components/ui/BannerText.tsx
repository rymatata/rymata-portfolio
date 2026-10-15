export function Text({ children }: { children: React.ReactNode }) {
    return (
        <h1 className="font-reddit-sans italic text-banner text-white drop-shadow-banner">
            {children}
        </h1>
    );
}

export function AccentText({ children }: { children: React.ReactNode }) {
    return <span className="text-banner-gradient">{children}</span>;
}