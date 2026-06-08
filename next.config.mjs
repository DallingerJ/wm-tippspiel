/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Flaggen werden von flagcdn.com geladen
    remotePatterns: [{ protocol: "https", hostname: "flagcdn.com" }],
  },
};

export default nextConfig;
