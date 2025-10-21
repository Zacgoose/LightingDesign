/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
  webpack(config, { isServer }) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    
    // Exclude pdf-lib and pdfjs-dist from server-side bundling
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'pdf-lib': 'pdf-lib',
        'pdfjs-dist': 'pdfjs-dist',
      });
    }
    
    return config;
  },
  async redirects() {
    return [];
  },
  output: "export",
  distDir: "./out",
};

module.exports = config;
