import type { NextConfig } from "next";

// GitHub Pages 배포 빌드에서만 /pickyapp 서브패스를 적용 (로컬 개발 서버는 루트에서 그대로 실행)
const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isGithubPages ? "/pickyapp" : "",
  trailingSlash: true,
};

export default nextConfig;
