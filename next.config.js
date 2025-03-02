/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",  // Ensures Next.js works on Netlify
  experimental: {
    appDir: true, // If using the App Router
},
};

module.exports = nextConfig
