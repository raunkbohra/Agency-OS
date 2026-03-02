import type { NextConfig } from "next";

const config: NextConfig = {
  serverExternalPackages: ['nodemailer', 'pg', 'pdf-lib'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '*.r2.cloudflarestorage.com' }],
  },
  poweredByHeader: false,
};

export default config;
