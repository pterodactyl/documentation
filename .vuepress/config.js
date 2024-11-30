module.exports = {
    base: '/',
    title: 'Pterodactyl',
    description: 'Pterodactyl is an open-source game server management panel built with PHP, React, and Go. Designed with security in mind, Pterodactyl runs all game servers in isolated Docker containers while exposing a beautiful and intuitive UI to end users.',
    plugins: [
        ['@vuepress/search', {
            searchMaxSuggestions: 10
        }],
        ['vuepress-plugin-container', {
            type: 'warning',
        }],
        ['vuepress-plugin-container', {
            type: 'tip',
        }],
        ['vuepress-plugin-container', {
            type: 'danger',
        }],
        ['tabs'],
    ],
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
        ['link', { rel: 'manifest', href: '/favicons/site.webmanifest' }],
        ['link', { rel: 'shortcut icon', href: '/favicons/favicon.ico' }],
        ['meta', { name: 'msapplication-config', content: '/favicons/browserconfig.xml' }],
        ['meta', { name: 'theme-color', content: '#0e4688' }],
    ],
    themeConfig: {
        repo: 'pterodactyl/panel',
        docsRepo: 'pterodactyl/documentation',
        repoLabel: 'GitHub',
        editLinkText: 'Help us improve this page.',
        editLinks: true,
        logo: '/logos/pterry.svg',
        nav: [
            {
                text: 'Documentation',
                link: '/project/introduction.md',
            },
            {
                text: 'Community Guides',
                link: '/community/about.md',
            },
            {
                text: 'Get Help',
                link: 'https://discord.gg/pterodactyl'
            },
            {
                text: 'API',
                link: 'https://dashflo.net/docs/api/pterodactyl/v1/'
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
                        '/community/installation-guides/panel/centos8.md',
                        '/community/installation-guides/panel/debian.md',
                    ]
                },
                {
                    title: 'Wings Installation',
                    collapsable: false,
                    children: [
                        '/community/installation-guides/wings/centos7.md',
                        '/community/installation-guides/wings/centos8.md',
                        '/community/installation-guides/wings/debian.md',
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
                        '/community/config/nodes/add_node.md',
                        '/community/tutorials/artisan.md',
                    ],
                },
                {
                    title: 'Customization',
                    collapsable: false,
                    children: [
                        '/community/customization/panel.md',
                        '/community/customization/wings.md',
                    ],
                },
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
                    path: '/panel/',
                    currentVersion: '1.0',
                    versions: [
                        {
                            title: '1.11',
                            name: '1.0',
                            status: 'stable',
                            children: [
                                '/getting_started',
                                '/webserver_configuration',
                                '/additional_configuration',
                                '/environment_variables',
                                '/updating',
                                '/troubleshooting',
                                '/legacy_upgrade',
                            ]
                        }
                    ]
                },
                {
                    title: 'Wings',
                    collapsable: false,
                    path: '/wings/',
                    currentVersion: '1.0',
                    versions: [
                        {
                            title: '1.11',
                            name: '1.0',
                            status: 'stable',
                            children: [
                                '/installing',
                                '/upgrading',
                                '/migrating',
                                '/configuration',
                            ]
                        }
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
                    title: 'Guides',
                    collapsable: false,
                    children: [
                        '/guides/mounts.md',
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
    },
};
