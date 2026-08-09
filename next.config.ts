import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: ["192.168.18.10"],
  outputFileTracingIncludes: {
    "/api/admin/report/pdf": ["./node_modules/pdfkit/js/data/**"],
  },
};

export default nextConfig;
