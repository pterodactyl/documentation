module.exports = {
    base: '/docs/',
    title: 'Pterodactyl Documentation',
    description: 'Learn how to install and use Pterodactyl.',
    themeConfig: {
        repo: 'pterodactyl/panel',
        docsRepo: 'pterodactyl/documentation',
        repoLabel: 'Contribute',
        editLinkText: 'Help us improve this page.',
        editLinks: true,
        nav: [
            {
                text: 'Get Started',
                link: '/panel/server_requirements/',
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
                    '/',
                ]
            },
            {
                title: 'Panel',
                collapsable: false,
                children: [
                    '/panel/getting_started',
                    '/panel/downloading',
                    '/panel/installing',
                    '/panel/queue_listeners',
                    '/panel/webserver_configuration',
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
                title: 'API Reference',
                collapsable: true,
                children: [
                    '/',
                ]
            },
            {
                title: 'Configurations',
                collapsable: true,
                children: [
                    '/config/nginx_ssl',
                    '/config/nginx_nonssl',
                    '/config/apache_ssl',
                    '/config/apache_nonssl',
                ]
            }
        ]
    }
};
