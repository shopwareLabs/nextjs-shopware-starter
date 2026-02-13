export default {
  cacheComponents: true,
  experimental: {
    inlineCss: true,
  },
  reactStrictMode: false,
  images: {
    // also other fromats like jpg, jpeg, png are working without adding them here
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopware.store",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/password",
        destination: "/",
        permanent: true,
      },
    ];
  },
};
