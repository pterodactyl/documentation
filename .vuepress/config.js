module.exports = {
    base: '/',
    title: 'Pterodactyl',
    description: 'The open-source server management solution.',
    ga: 'UA-87324178-1',
    configureWebpack: {
        serve: {
            hot: {
                port: 9091,
            },
        },
    },
    head: [
        ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/favicons/apple-touch-icon.png' }],
        ['link', { rel: 'icon', type: 'image/png', href: '/favicons/favicon-32x32.png', sizes: '32x32' }],
        ['link', { rel: 'icon', type: 'image/png', href: '/favicons/favicon-16x16.png', sizes: '16x16' }],
        ['link', { rel: 'mask-icon', href: '/favicons/safari-pinned-tab.svg', color: '#0e4688' }],
        ['link', { rel: 'manifest', href: '/favicons/manifest.json' }],
        ['link', { rel: 'shortcut icon', href: '/favicons/favicon.ico' }],
        ['meta', { name: 'msapplication-config', content: '/favicons/browserconfig.xml' }],
        ['meta', { name: 'theme-color', content: '#0e4688' }],
    ],
    themeConfig: {
        repo: 'pterodactyl/panel',
        docsRepo: 'pterodactyl/documentation',
        repoLabel: 'Contribute',
        editLinkText: 'Help us improve this page.',
        editLinks: true,
        logo: '/pterodactyl-flat.png',
        nav: [
            {
                text: 'Get Started',
                link: '/project/introduction.md',
            },
            {
                text: 'Community Guides',
                link: '/community/about.md',
            },
            {
                text: 'Get Help',
                link: 'https://pterodactyl.io/discord'
            }
        ],
        sidebar: {
            '/community/': [
                {
                    title: 'Community Guides',
                    collapsable: false,
                    children: [
                        '/community/about.md',
                    ]
                },
                {
                    title: 'Panel Installation',
                    collapsable: false,
                    children: [
                        '/community/installation-guides/panel/centos7.md',
                        '/community/installation-guides/panel/ubuntu1804.md',
                        '/community/installation-guides/panel/debian9.md',
                        '/community/installation-guides/panel/debian10.md',
                    ]
                },
                {
                    title: 'Daemon Installation',
                    collapsable: false,
                    children: [
                        '/community/installation-guides/daemon/centos7.md',
                        '/community/installation-guides/daemon/ubuntu1804.md',
                        '/community/installation-guides/daemon/debian9.md',
                        '/community/installation-guides/daemon/debian10.md',
                    ]
                },
                {
                    title: 'Creating Eggs',
                    collapsable: false,
                    children: [
                        '/community/config/eggs/creating_a_custom_egg.md',
                        '/community/config/eggs/creating_a_custom_image.md',
                    ],
                },
                {
                    title: 'Node Configuration',
                    collapsable: false,
                    children: [
                        '/community/config/nodes/add_node.md',
                    ],
                },
                {
                    title: 'Game Configuration',
                    collapsable: false,
                    children: [
                        '/community/games/minecraft.md',
                    ],
                },
                {
                    title: 'Tutorials',
                    collapsable: false,
                    children: [
                        '/community/tutorials/creating_ssl_certificates.md',
                        '/community/tutorials/custom_theme_setup.md',
                    ],
                },
                {
                  title: 'Advanced Usage',
                  collapsable: false,
                  children: [
                    '/community/advanced_usage/artisan.md',
                  ],
                }
            ],
            '/': [
                {
                    title: 'Project Information',
                    collapsable: false,
                    children: [
                        '/project/introduction.md',
                        '/project/about.md',
                        '/project/terms.md',
                        '/project/community.md',
                    ]
                },
                {
                    title: 'Panel',
                    collapsable: false,
                    children: [
                        '/panel/getting_started',
                        '/panel/webserver_configuration',
                        '/panel/upgrading',
                        '/panel/configuration',
                        '/panel/troubleshooting',
                    ]
                },
                {
                    title: 'Daemon',
                    collapsable: false,
                    children: [
                        '/daemon/installing',
                        '/daemon/upgrading',
                        '/daemon/configuration',
                        '/daemon/kernel_modifications',
                        '/daemon/debian_8_docker',
                        '/daemon/standalone_sftp',
                    ]
                },
                {
                    title: 'Tutorials',
                    collapsable: false,
                    children: [
                        '/tutorials/mysql_setup.md',
                        '/tutorials/creating_ssl_certificates.md',
                    ],
                },
                {
                    title: 'Development & Ops',
                    collapsable: true,
                    children: [
                        '/ops/publish_release.md',
                    ],
                },
            ],
        },
    },
    postcss: {
        plugins: [
            require('postcss-import'),
            require('tailwindcss')('./tailwind.js'),
            require('precss'),
            require('autoprefixer'),
            require('cssnano'),
        ]
    }
};
