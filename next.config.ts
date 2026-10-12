import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // TypeScript checks every <Link href> against the real routes
    // e.g. The typo "href=/porjects" becomes a type error that
    //      1. Fails command 'next build'
    //      2. Prevents a broken link from slipping past and into deployment
    typedRoutes: true,

    // Removes the "-Powered-By: Next.js" header from every response 
    poweredByHeader: false,

    // Enables browsers that support AVIF files to convert WEBP to AVIF files
    // Reduces file size and optimizes images
    images: {
        formats: ["image/avif", "image/webp"],
    },
};

export default nextConfig;