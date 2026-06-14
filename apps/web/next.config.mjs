/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@geopin/ui", "@geopin/types", "@geopin/config"],
  experimental: {
    // react-leaflet ships untranspiled ESM; Next transpiles it via the list below
  },
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4000",
    NEXT_PUBLIC_GOOGLE_MAPS_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "",
    NEXT_PUBLIC_MAPILLARY_TOKEN: process.env.NEXT_PUBLIC_MAPILLARY_TOKEN ?? "",
  },
};

export default nextConfig;
