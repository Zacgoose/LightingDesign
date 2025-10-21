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
    
    // Exclude all PDF-related libraries from server-side bundling
    // These are client-only libraries that use browser APIs
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'pdf-lib': 'pdf-lib',
        'pdfjs-dist': 'pdfjs-dist',
        'jspdf': 'jspdf',
        'jspdf-autotable': 'jspdf-autotable',
        'svg2pdf.js': 'svg2pdf.js',
        'konva': 'konva',
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
