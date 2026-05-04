/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "desirediv-storage.blr1.digitaloceanspaces.com",
      },
      {
        protocol: "https",
        hostname: "desirediv-storage.blr1.cdn.digitaloceanspaces.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "pub-801fc8ff62b2414fa6f996e8b4617c23.r2.dev",
      },
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  }
};

export default nextConfig;
