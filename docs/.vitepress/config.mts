import { defineConfig } from 'vitepress';

export default defineConfig({
    head: [
        [
            'script',
            {
                defer: '',
                src: 'https://analytics.zenceipt.com/script.js',
                'data-website-id': '2c8b452e-eab5-4f82-8ead-902d8f8b976f'
            }
        ]
    ],
    title: 'Open Archiver',
    description: 'Official documentation for the Open Archiver project.',
    themeConfig: {
        search: {
            provider: 'local'
        },
        logo: {
            src: '/logo-sq.svg'
        },
        nav: [
            { text: 'Home', link: '/' },
            { text: 'Github', link: 'https://github.com/LogicLabs-OU/OpenArchiver' },
            { text: "Website", link: 'https://openarchiver.com/' }
        ],
        sidebar: [
            {
                text: 'User Guides',
                items: [
                    { text: 'Get Started', link: '/' },
                    { text: 'Installation', link: '/user-guides/installation' },
                    {
                        text: 'Email Providers',
                        link: '/user-guides/email-providers/',
                        collapsed: true,
                        items: [
                            { text: 'Google Workspace', link: '/user-guides/email-providers/google-workspace' },
                            { text: 'Generic IMAP Server', link: '/user-guides/email-providers/imap' },
                            { text: 'Microsoft 365', link: '/user-guides/email-providers/microsoft-365' }
                        ]
                    }
                ]
            },
            {
                text: 'API Reference',
                items: [
                    { text: 'Overview', link: '/api/' },
                    { text: 'Authentication', link: '/api/authentication' },
                    { text: 'Auth', link: '/api/auth' },
                    { text: 'Archived Email', link: '/api/archived-email' },
                    { text: 'Dashboard', link: '/api/dashboard' },
                    { text: 'Ingestion', link: '/api/ingestion' },
                    { text: 'Search', link: '/api/search' },
                    { text: 'Storage', link: '/api/storage' }
                ]
            },
            {
                text: 'Services',
                items: [
                    { text: 'Overview', link: '/services/' },
                    { text: 'Storage Service', link: '/services/storage-service' }
                ]
            }
        ]
    }
});
