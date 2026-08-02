import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/pickyapp",
  trailingSlash: true,
};

export default nextConfig;
