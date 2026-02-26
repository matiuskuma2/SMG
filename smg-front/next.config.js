/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    domains: [
      "images.unsplash.com",
      "example.com",
      "commmune.imgix.net",
      "mgqeguervybtgabsphte.supabase.co",
      "dpnlntnpyykcjztyarzf.supabase.co",
      "localhost",
    ],
  },
  experimental: {
    optimizePackageImports: ["@ark-ui/react"],
    serverComponentsExternalPackages: ["pdfkit", "subset-font"],
  },
};

module.exports = nextConfig;
