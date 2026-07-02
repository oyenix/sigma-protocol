/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // 1. Handle server-side heavy libraries
  serverExternalPackages: [
    "pino",
    "thread-stream",
    "pino-worker",
    "utf-8-validate",
    "bufferutil"
  ],
  // 2. Handle client-side bundling issues for Web3 libs
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
}

export default nextConfig; // Use 'module.exports = nextConfig' if using .js and commonjs