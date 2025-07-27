import { defineConfig } from 'vitepress';

export default defineConfig({
    title: 'OpenArchiver Documentation',
    description: 'Official documentation for the OpenArchiver project.',
    themeConfig: {
        nav: [
            { text: 'Home', link: '/' },
            { text: 'User Guides', link: '/user-guides/email-providers/' }
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
                    { text: 'Ingestion API', link: '/api/ingestion' }
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
