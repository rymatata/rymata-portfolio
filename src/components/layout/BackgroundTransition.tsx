// The file needs "use client" at the top, 
// because usePathname() only works in Client Components.

// It does three things:
// 1. Reads usePathname() and looks up the variant in the map from step 3.
// 2. / Renders one <div aria-hidden> with fixed inset-0 -z-10 
// and transition-colors duration-500.
// 3. Swaps a class or data-bg attribute on that div. 
// The browser animates the color change.
// It doesn't need framer-motion, and it doesn't need useEffect or state. 
// Because every route is static, the pathname is known at build time, 
// so the first paint already has the right color.