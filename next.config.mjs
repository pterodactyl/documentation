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
            { source: '/api-v2/:path*', destination: '/v2/api/:path*', permanent: true },
            { source: '/v2/project/terminology', destination: '/v2/project/how-it-works#terms', permanent: true },
            { source: '/v2/api/endpoints/:path*', destination: '/v2/api/authentication/:path*', permanent: true },
            ...['project', 'panel', 'wings', 'guides'].map((section) => ({
                source: `/${section}/:path*`,
                destination: `/v1/${section}/:path*`,
                permanent: true,
            })),
            { source: '/api', destination: '/v1/api', permanent: true },
            { source: '/api/:path((?!search(?:/|$)).*)', destination: '/v1/api/:path', permanent: true },
        ];
    },
    async rewrites() {
        return [
            { source: '/:version(v1|v2).md', destination: '/llms.mdx/:version/content.md' },
            { source: '/:version(v1|v2)/:path*.md', destination: '/llms.mdx/:version/:path*/content.md' },
        ];
    },
    async headers() {
        return [{ source: '/:version(v1|v2)/:path*', headers: [{ key: 'Vary', value: 'Accept' }] }];
    },
    images: {
        unoptimized: true,
    },
};

export default withMDX(config);
