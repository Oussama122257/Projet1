/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" }, // Product images come from Uploadthing/S3/Cloudinary
    ],
  },
  // facebook-nodejs-business-sdk is CommonJS-heavy; keep it server-side only.
  serverExternalPackages: ["facebook-nodejs-business-sdk"],
};

export default nextConfig;
