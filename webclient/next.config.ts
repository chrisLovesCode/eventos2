import type { NextConfig } from "next";

// Generate build timestamp
const getBuildTimestamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const nextConfig: NextConfig = {
  // Standalone Output für Docker
  output: "standalone",
  
  // Build-Zeit Environment Variables
  env: {
    NEXT_PUBLIC_BUILD_TIMESTAMP: getBuildTimestamp(),
  },
  // React Compiler for optimized performance
  reactCompiler: true,

  // Strikte TypeScript-Prüfung
  typescript: {
    ignoreBuildErrors: false,
  },

  // Optimierte Image-Konfiguration
  images: {
    formats: ["image/avif", "image/webp"],
    // Disable optimization for localhost (private IPs are blocked by Next.js)
    unoptimized: process.env.NODE_ENV === "development",
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/api/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: "/api/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "46.225.64.60",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "46.225.64.60",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "eventos.chrisvaupel.de",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "eventos.chrisvaupel.de",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "eventos-api.chrisvaupel.de",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "eventos-api.chrisvaupel.de",
        pathname: "/uploads/**",
      },
    ],
  },

  // Experimentelle Features
  experimental: {
    // Optimized Package Imports
    optimizePackageImports: ["lucide-react", "date-fns"],
  },

  // Security Headers
  async headers() {
    const isDev = process.env.NODE_ENV === "development";
    const isStrictCsp = process.env.CSP_STRICT === "true";
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "script-src-attr 'none'",
      "img-src 'self' data: blob: http://localhost:3000 http://localhost:3001 http://46.225.64.60 https://46.225.64.60 http://eventos.chrisvaupel.de https://eventos.chrisvaupel.de http://eventos-api.chrisvaupel.de https://eventos-api.chrisvaupel.de",
      "font-src 'self' data:",
      `style-src 'self'${isStrictCsp ? "" : " 'unsafe-inline'"}`,
      `script-src 'self'${isStrictCsp ? "" : " 'unsafe-inline'"}${!isStrictCsp && isDev ? " 'unsafe-eval'" : ""}`,
      "connect-src 'self' http://localhost:3000 http://localhost:3001 http://api:3000 http://webclient:3001 http://46.225.64.60 https://46.225.64.60 http://eventos.chrisvaupel.de https://eventos.chrisvaupel.de http://eventos-api.chrisvaupel.de https://eventos-api.chrisvaupel.de",
      "upgrade-insecure-requests",
      "block-all-mixed-content",
    ].join("; ");
    const cspReportOnly = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "script-src-attr 'none'",
      "img-src 'self' data: blob: http://localhost:3000 http://localhost:3001 http://46.225.64.60 https://46.225.64.60 http://eventos.chrisvaupel.de https://eventos.chrisvaupel.de http://eventos-api.chrisvaupel.de https://eventos-api.chrisvaupel.de",
      "font-src 'self' data:",
      "style-src 'self'",
      "script-src 'self'",
      "connect-src 'self' http://localhost:3000 http://localhost:3001 http://api:3000 http://webclient:3001 http://46.225.64.60 https://46.225.64.60 http://eventos.chrisvaupel.de https://eventos.chrisvaupel.de http://eventos-api.chrisvaupel.de https://eventos-api.chrisvaupel.de",
      "upgrade-insecure-requests",
      "block-all-mixed-content",
    ].join("; ");
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: csp,
          },
          {
            key: "Content-Security-Policy-Report-Only",
            value: cspReportOnly,
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
