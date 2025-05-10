/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
      return [
        {
          source: "/api/:path*", // Apply CORS headers to all API routes
          headers: [
            { key: "Access-Control-Allow-Origin", value: "*" }, // Allow all origins (change to specific domain in production)
            { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" }, // Allowed methods
            { key: "Access-Control-Allow-Headers", value: "X-Requested-With, Content-Type, Authorization" }, // Allowed headers
          ],
        },
      ];
    },
  };
  
  export default nextConfig;
  