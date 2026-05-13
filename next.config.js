/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: false,
  },
  async redirects() {
    return [
      {
        source: "/&",
        destination: "/",
        permanent: true,
      },
      {
        source: "/posts/:title/opengraph-image",
        destination: "/og-image.png",
        permanent: true,
      },
    ];
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
