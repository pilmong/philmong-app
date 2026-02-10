import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['node-imap', 'mailparser'],
};

export default nextConfig;
