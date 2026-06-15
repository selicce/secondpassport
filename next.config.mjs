/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Supabase storage / future CDN hosts go here.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  // Silence the benign "Critical dependency" warning emitted by
  // @supabase/realtime-js (it uses a dynamic require internally). Applies to the
  // webpack build path (see the --webpack flag in package.json scripts).
  webpack: (config) => {
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      { module: /@supabase[\\/]realtime-js/ },
      { message: /Critical dependency: the request of a dependency is an expression/ },
    ];
    return config;
  },
};

export default nextConfig;
