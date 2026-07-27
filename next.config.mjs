/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["bullmq", "ioredis", "pino", "bcryptjs"],
};

export default nextConfig;
