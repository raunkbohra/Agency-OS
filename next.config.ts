import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const withMDX = createMDX();

const config: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  serverExternalPackages: ['nodemailer', 'pg', 'pdf-lib'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '*.r2.cloudflarestorage.com' }],
  },
  poweredByHeader: false,
};

export default withMDX(config);
