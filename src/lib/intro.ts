// First-load intro on Home, once per browser session
// The attribute on <html> switches on every intro: style (see globals.css); IntroGate removes it once the slides end
export const INTRO_ATTR = "data-intro";
const INTRO_KEY = "intro-played";

// Inlined in <head> so it runs before the body paints; set after first paint, the nav would flash in place before sliding
// Blocked storage (private mode, disabled site data) throws, which just skips the intro
export const introScript = `try {
    if (location.pathname === "/" && !sessionStorage.getItem("${INTRO_KEY}")) {
        sessionStorage.setItem("${INTRO_KEY}", "1");
        document.documentElement.setAttribute("${INTRO_ATTR}", "");
    }
} catch {}`;
