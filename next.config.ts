import type { NextConfig } from "next";

// GitHub Pages 배포 빌드에서만 /pickyapp 서브패스를 적용 (로컬 개발 서버는 루트에서 그대로 실행)
const isGithubPages = process.env.GITHUB_PAGES === "true";
const basePath = isGithubPages ? "/pickyapp" : "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  env: {
    // public/ 정적 파일(예: AudioWorklet 모듈)을 코드에서 절대경로로 참조할 때 필요
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
