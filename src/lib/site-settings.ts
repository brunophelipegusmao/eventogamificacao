import { db } from "@/db";
import { siteSettings, type PromoMedia, type SponsorProduct } from "@/db/schema";
import { eq } from "drizzle-orm";

const SITE_SETTINGS_ID = "site-settings";
const DEFAULT_SPONSOR_LOGOS = ["/logos/jm_512x512.webp"];

const DEFAULT_PRODUCTS: SponsorProduct[] = [
  {
    name: "Whey Protein",
    description: "Recuperação muscular pós-treino",
    tag: "Proteína",
    imageUrl: "",
    link: "",
  },
  {
    name: "Creatina",
    description: "Força e performance nos treinos",
    tag: "Força",
    imageUrl: "",
    link: "",
  },
  {
    name: "Pré-Treino",
    description: "Energia para treinar mais pesado",
    tag: "Energia",
    imageUrl: "",
    link: "",
  },
  {
    name: "BCAA",
    description: "Suporte durante o treino",
    tag: "Recuperação",
    imageUrl: "",
    link: "",
  },
];

const DEFAULT_PROMO_MEDIA: PromoMedia = {
  type: "image",
  url: "/images/promo-event.jpeg",
};

/** Garante que existe uma linha singleton de configurações e a retorna. */
export async function getSiteSettings() {
  const [existing] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, SITE_SETTINGS_ID))
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(siteSettings)
    .values({
      id: SITE_SETTINGS_ID,
      sponsorLogos: DEFAULT_SPONSOR_LOGOS,
      products: DEFAULT_PRODUCTS,
      promoMedia: DEFAULT_PROMO_MEDIA,
    })
    .returning();

  return created;
}

export async function updateSponsorLogos(logos: string[]) {
  await getSiteSettings();

  const [updated] = await db
    .update(siteSettings)
    .set({ sponsorLogos: logos, updatedAt: new Date() })
    .where(eq(siteSettings.id, SITE_SETTINGS_ID))
    .returning();

  return updated;
}

export async function updateProducts(products: SponsorProduct[]) {
  await getSiteSettings();

  const [updated] = await db
    .update(siteSettings)
    .set({ products, updatedAt: new Date() })
    .where(eq(siteSettings.id, SITE_SETTINGS_ID))
    .returning();

  return updated;
}

export async function updatePromoMedia(media: PromoMedia) {
  await getSiteSettings();

  const [updated] = await db
    .update(siteSettings)
    .set({ promoMedia: media, updatedAt: new Date() })
    .where(eq(siteSettings.id, SITE_SETTINGS_ID))
    .returning();

  return updated;
}

export {
  SITE_SETTINGS_ID,
  DEFAULT_SPONSOR_LOGOS,
  DEFAULT_PRODUCTS,
  DEFAULT_PROMO_MEDIA,
};
