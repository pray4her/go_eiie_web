import type { NextConfig } from "next";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/dashboard",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    if (!API_BASE) return [];
    try {
      const target = new URL(API_BASE);
      // 仅代理 /api 前缀，保持同源，避免浏览器 CORS
      return [
        {
          // 当通过 localhost:3000 访问时，代理到测试端口 8077
          source: "/api/:path*",
          has: [
            {
              type: "header",
              key: "host",
              value: "localhost:3000",
            },
          ],
          destination: `${target.protocol}//${target.hostname}:8077/api/:path*`,
        },
        {
          // 默认（包括通过 IP 访问）代理到原端口 (如 8078)
          source: "/api/:path*",
          destination: `${target.origin}/api/:path*`,
        },
      ];
    } catch {
      return [];
    }
  },
};

export default nextConfig;
