import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
    reactStrictMode: true,
    output: 'standalone',
    images: {
        unoptimized: true,
    },
    basePath: '/docs',
    redirects: async () => {
        return [
            {
                source: '/',
                destination: '/panel/getting-started',
                permanent: false,
            },
        ];
    }
};

export default withMDX(config);
