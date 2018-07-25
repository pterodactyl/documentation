module.exports = {
    base: '/docs/',
    title: 'Pterodactyl',
    description: 'The open-source server management solution.',
    configureWebpack: {
        serve: {
            hot: {
                port: 9091,
            },
        },
    },
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
                text: 'API Reference',
                link: '/api/'
            },
            {
                text: 'Get Help',
                link: 'https://pterodactyl.io/discord'
            }
        ],
        sidebar: [
            {
                title: 'Project Information',
                collapsable: false,
                children: [
                    '/project/introduction.md',
                    '/project/about.md',
                    '/project/terms.md',
                ]
            },
            {
                title: 'Panel',
                collapsable: false,
                children: [
                    '/panel/getting_started',
                    '/panel/webserver_configuration',
                    '/panel/upgrading',
                ]
            },
            {
                title: 'Daemon',
                collapsable: true,
                children: [
                    '/',
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
                title: 'API Reference',
                collapsable: true,
                children: [
                    '/',
                ]
            }
        ]
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
