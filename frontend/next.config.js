/** @type {import('next').NextConfig} */

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const parsed = new URL(apiUrl);

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname:
          process.env.NEXT_PUBLIC_GOOGLE_IMAGE_HOST ||
          "lh3.googleusercontent.com", // ✅ Google Avatar host fallback
      },
      {
        protocol: parsed.protocol.replace(":", ""), // http or https
        hostname: parsed.hostname, // host (localhost / your domain)
        port: parsed.port || undefined, // যদি port থাকে (4000) নেবে
        pathname: "/uploads/**", // ✅ শুধু uploads ফোল্ডার allow
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com", // ✅ Cloudinary host allow
        pathname: "/**", // সব path allow
      },
    ],
  },
};

module.exports = nextConfig;
