/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
  {
    protocol: "https",
    hostname: "lap.onl",
    port: "",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "raw.githubusercontent.com",
    port: "",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "firebasestorage.googleapis.com",
    port: "",
    pathname: "/**",
  },
],
  },
};

module.exports = nextConfig;
