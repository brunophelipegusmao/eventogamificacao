import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import type { PromoMedia, SponsorProduct } from "@/db/schema";
import {
  DEFAULT_PROMO_MEDIA,
  DEFAULT_SPONSOR_LOGOS,
  getSiteSettings,
  updateProducts,
  updatePromoMedia,
  updateSponsorLogos,
} from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSession("admin");
  if (!auth.ok) return auth.response;

  const settings = await getSiteSettings();
  return NextResponse.json({ settings });
}

function cleanProduct(raw: unknown): SponsorProduct | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const name = typeof r.name === "string" ? r.name.trim() : "";
  if (!name) return null;

  return {
    name,
    description: typeof r.description === "string" ? r.description.trim() : "",
    tag: typeof r.tag === "string" ? r.tag.trim() : "",
    imageUrl: typeof r.imageUrl === "string" ? r.imageUrl.trim() : "",
    link: typeof r.link === "string" ? r.link.trim() : "",
  };
}

export async function PUT(request: Request) {
  const auth = await requireApiSession("admin");
  if (!auth.ok) return auth.response;

  const body = await request.json();
  let settings = await getSiteSettings();

  if ("sponsorLogos" in body) {
    const logos = body.sponsorLogos;

    if (!Array.isArray(logos)) {
      return NextResponse.json(
        { error: "sponsorLogos deve ser uma lista de URLs" },
        { status: 400 }
      );
    }

    const cleaned = logos
      .map((url) => (typeof url === "string" ? url.trim() : ""))
      .filter((url) => url.length > 0);

    // Sempre deve haver ao menos uma imagem; se nenhuma URL válida foi
    // informada, usa a imagem padrão.
    if (cleaned.length === 0) {
      cleaned.push(...DEFAULT_SPONSOR_LOGOS);
    }

    if (cleaned.length > 6) {
      return NextResponse.json(
        { error: "No máximo 6 imagens são permitidas" },
        { status: 400 }
      );
    }

    settings = await updateSponsorLogos(cleaned);
  }

  if ("products" in body) {
    const products = body.products;

    if (!Array.isArray(products)) {
      return NextResponse.json(
        { error: "products deve ser uma lista de produtos" },
        { status: 400 }
      );
    }

    const cleaned = products
      .map(cleanProduct)
      .filter((p): p is SponsorProduct => p !== null);

    if (cleaned.length === 0) {
      return NextResponse.json(
        { error: "Informe ao menos um produto." },
        { status: 400 }
      );
    }

    if (cleaned.length > 6) {
      return NextResponse.json(
        { error: "No máximo 6 produtos são permitidos." },
        { status: 400 }
      );
    }

    settings = await updateProducts(cleaned);
  }

  if ("promoMedia" in body) {
    const raw = body.promoMedia;

    if (!raw || typeof raw !== "object") {
      return NextResponse.json(
        { error: "promoMedia inválido" },
        { status: 400 }
      );
    }

    const r = raw as Record<string, unknown>;
    const type = r.type === "video" ? "video" : r.type === "image" ? "image" : null;

    if (!type) {
      return NextResponse.json(
        { error: "promoMedia.type deve ser 'image' ou 'video'" },
        { status: 400 }
      );
    }

    const url = typeof r.url === "string" ? r.url.trim() : "";

    const media: PromoMedia = url
      ? { type, url }
      : { ...DEFAULT_PROMO_MEDIA };

    settings = await updatePromoMedia(media);
  }

  return NextResponse.json({ settings });
}
