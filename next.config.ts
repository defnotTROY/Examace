import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude pdfjs-dist from server-side rendering
  serverExternalPackages: ['pdfjs-dist', 'canvas'],
  
  webpack: (config, { isServer }) => {
    // Exclude pdfjs-dist from server-side bundle
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('canvas');
      config.externals.push('pdfjs-dist');
    }
    
    // Ignore canvas module in client bundle
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
    };

    return config;
  },
};

export default nextConfig;
