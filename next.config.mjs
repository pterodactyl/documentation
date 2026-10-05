import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
    reactStrictMode: true,
    output: 'standalone',
    // Served at the root of docs.pterodactyl.io. The site used to live under
    // /docs, so every link shared before the move still has to land.
    async redirects() {
        return [
            { source: '/docs', destination: '/', permanent: true },
            { source: '/docs/:path*', destination: '/:path*', permanent: true },
        ];
    },
    images: {
        unoptimized: true,
    },
};

export default withMDX(config);
