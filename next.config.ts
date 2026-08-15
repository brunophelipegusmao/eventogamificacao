import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  // Evita que o Next infira a raiz do workspace subindo diretórios em busca de
  // lockfiles (pode "vazar" pra fora do projeto, ex.: um pnpm-lock.yaml solto
  // no $HOME), o que quebraria o layout de .next/standalone.
  outputFileTracingRoot: path.join(process.cwd()),
  reactCompiler: true,
  allowedDevOrigins: ["192.168.18.10"],
  images: {
    // Logos de apoiadores/realizadores são cadastrados por admins com URL
    // livre, podendo apontar para hosts externos.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  outputFileTracingIncludes: {
    "/api/admin/report/pdf": ["./node_modules/pdfkit/js/data/**"],
  },
};

export default nextConfig;
