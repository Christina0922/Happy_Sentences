import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Static export 설정 (주의: API routes는 작동하지 않음!)
  // output: 'export',
  
  // 이미지 최적화 비활성화 (static export 시 필요)
  // images: {
  //   unoptimized: true,
  // },
};

export default nextConfig;
