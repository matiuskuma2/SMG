/** @type {import('next').NextConfig} */
const nextConfig = {
    /* config options here */
    images: {
        domains: ['images.unsplash.com', 'commmune.imgix.net', 'mgqeguervybtgabsphte.supabase.co', 'dpnlntnpyykcjztyarzf.supabase.co', 'glmlqaipnaihgqjcpsfd.supabase.co', 'localhost', '127.0.0.1'],
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '4mb',
        },
    },
};

module.exports = nextConfig;
