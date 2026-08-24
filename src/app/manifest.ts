import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/site-settings";

function iconMimeType(url: string): string {
  if (url.endsWith(".png")) return "image/png";
  if (url.endsWith(".webp")) return "image/webp";
  if (url.endsWith(".jpg") || url.endsWith(".jpeg")) return "image/jpeg";
  if (url.endsWith(".svg")) return "image/svg+xml";
  return "image/png";
}

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSiteSettings();
  const iconUrl = settings.pwaIconUrl || "/logos/jm_512x512.webp";
  const type = iconMimeType(iconUrl);

  return {
    name: "Desafio JM Fitness",
    short_name: "JM Fitness",
    description:
      "Participe do desafio gamificado de ativação do suplemento JM Fitness.",
    start_url: "/",
    display: "standalone",
    background_color: "#070a23",
    theme_color: "#070a23",
    icons: [
      { src: iconUrl, sizes: "192x192", type, purpose: "any" },
      { src: iconUrl, sizes: "512x512", type, purpose: "any" },
    ],
  };
}
