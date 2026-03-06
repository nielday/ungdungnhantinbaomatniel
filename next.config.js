const withNextIntl = require('next-intl/plugin')();

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    return config;
  },
  async headers() {
    const isDev = process.env.NODE_ENV !== 'production';

    // Khai báo chính sách bảo mật nội dung (CSP)
    // - default-src: Mặc định chỉ cho phép tải tài nguyên từ chính trang web ('self').
    // - script-src: Đánh giá kịch bản JS. Ở chế độ Dev cần 'unsafe-eval' cho Hot Reload.
    // - connect-src: Cho phép Next.js kết nối đến Backend Railway và Socket.io.
    // - img-src: Cho phép dán ảnh từ nguồn ngoài (Backblaze B2, Google, Facebook avatar).
    // - style-src: Cho phép CSS inline.
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' blob: data: https://*.backblazeb2.com https://*.googleusercontent.com https://*.facebook.com https://*.licdn.com https://ungdungnhantinbaomatniel-production.up.railway.app;
      font-src 'self' data: https://fonts.gstatic.com;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      connect-src 'self' ws: wss: ${isDev ? 'http://localhost:* ws://localhost:*' : 'https://ungdungnhantinbaomatniel-production.up.railway.app wss://ungdungnhantinbaomatniel-production.up.railway.app'};
    `;

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\n/g, ''),
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
}

module.exports = withNextIntl(nextConfig);
