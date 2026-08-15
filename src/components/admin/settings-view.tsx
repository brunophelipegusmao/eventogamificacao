"use client";

import { Input } from "@base-ui/react/input";
import Image from "next/image";
import { Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldGroup, FieldLabel } from "@/components/ui/field";
import type { PromoMedia, SponsorProduct } from "@/db/schema";

const MAX_LOGOS = 6;
const DEFAULT_LOGO = "/logos/jm_512x512.webp";
const MAX_PRODUCTS = 6;
const EMPTY_PRODUCT: SponsorProduct = {
  name: "",
  description: "",
  tag: "",
  imageUrl: "",
  link: "",
};
const DEFAULT_PROMO_MEDIA: PromoMedia = {
  type: "image",
  url: "/images/promo-event.jpeg",
};

export function AdminSettingsView() {
  const [logos, setLogos] = useState<string[]>([DEFAULT_LOGO]);
  const [products, setProducts] = useState<SponsorProduct[]>([
    EMPTY_PRODUCT,
  ]);
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [productsSaving, setProductsSaving] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [productsSuccess, setProductsSuccess] = useState(false);

  const [promoMedia, setPromoMedia] = useState<PromoMedia>(DEFAULT_PROMO_MEDIA);
  const [promoSaving, setPromoSaving] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/settings");
    const data = await res.json();
    setLogos(
      data.settings?.sponsorLogos?.length
        ? data.settings.sponsorLogos
        : [DEFAULT_LOGO]
    );
    setProducts(
      data.settings?.products?.length ? data.settings.products : [EMPTY_PRODUCT]
    );
    setPromoMedia(data.settings?.promoMedia ?? DEFAULT_PROMO_MEDIA);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function addLogo() {
    setLogos((prev) =>
      prev.length >= MAX_LOGOS ? prev : [...prev, ""]
    );
  }

  function updateLogo(index: number, value: string) {
    setLogos((prev) => prev.map((url, i) => (i === index ? value : url)));
  }

  function removeLogo(index: number) {
    setLogos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const cleaned = logos.map((url) => url.trim()).filter(Boolean);

    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sponsorLogos: cleaned }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Erro ao salvar configurações");
      setSaving(false);
      return;
    }

    setLogos(data.settings.sponsorLogos);
    setSuccess(true);
    setSaving(false);
  }

  function addProduct() {
    setProducts((prev) =>
      prev.length >= MAX_PRODUCTS ? prev : [...prev, { ...EMPTY_PRODUCT }]
    );
  }

  function updateProductField(
    index: number,
    patch: Partial<SponsorProduct>
  ) {
    setProducts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...patch } : p))
    );
  }

  function removeProduct(index: number) {
    setProducts((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleProductsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProductsError(null);
    setProductsSuccess(false);

    const cleaned = products
      .map((p) => ({
        name: p.name.trim(),
        description: p.description.trim(),
        tag: p.tag.trim(),
        imageUrl: p.imageUrl.trim(),
        link: p.link.trim(),
      }))
      .filter((p) => p.name.length > 0);

    setProductsSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products: cleaned }),
    });

    const data = await res.json();
    if (!res.ok) {
      setProductsError(data.error ?? "Erro ao salvar produtos");
      setProductsSaving(false);
      return;
    }

    setProducts(data.settings.products);
    setProductsSuccess(true);
    setProductsSaving(false);
  }

  async function handlePromoSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPromoError(null);
    setPromoSuccess(false);

    setPromoSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        promoMedia: { type: promoMedia.type, url: promoMedia.url.trim() },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setPromoError(data.error ?? "Erro ao salvar mídia de destaque");
      setPromoSaving(false);
      return;
    }

    setPromoMedia(data.settings.promoMedia);
    setPromoSuccess(true);
    setPromoSaving(false);
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie o conteúdo exibido na página inicial.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-border bg-card p-4 sm:p-5"
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-semibold">Realização e apoio</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addLogo}
            disabled={logos.length >= MAX_LOGOS}
          >
            <Plus className="size-4" /> Adicionar imagem
          </Button>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          De 1 a {MAX_LOGOS} imagens de produtores/apoiadores.
        </p>

        <ul className="space-y-3">
          {logos.map((url, index) => (
            <li
              key={index}
              className="flex flex-col gap-2 rounded-lg border border-border bg-muted/20 p-3 sm:flex-row sm:items-center"
            >
              <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
                {url ? (
                  <Image
                    src={url}
                    width={48}
                    height={48}
                    alt=""
                    className="size-12 object-contain"
                  />
                ) : null}
              </div>

              <FieldGroup className="flex-1">
                <FieldLabel htmlFor={`logo-${index}`}>
                  URL da imagem {index + 1}
                </FieldLabel>
                <Input
                  id={`logo-${index}`}
                  value={url}
                  onChange={(e) => updateLogo(index, e.target.value)}
                  placeholder="/logos/exemplo.webp"
                  className="h-10 w-full rounded-lg border-border bg-background px-3"
                />
              </FieldGroup>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeLogo(index)}
                disabled={logos.length <= 1}
                aria-label="Remover imagem"
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>

        <p className="mt-3 text-xs text-muted-foreground">
          É necessário manter ao menos uma imagem. Se nenhuma URL válida for
          informada, a imagem padrão ({DEFAULT_LOGO}) será usada.
        </p>

        {error && (
          <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {success && (
          <p className="mt-3 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
            Configurações salvas com sucesso.
          </p>
        )}

        <Button type="submit" disabled={saving} className="mt-4">
          {saving ? "Salvando..." : "Salvar configurações"}
        </Button>
      </form>

      <form
        onSubmit={handleProductsSubmit}
        className="rounded-xl border border-border bg-card p-4 sm:p-5"
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-semibold">Conheça a linha (produtos)</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addProduct}
            disabled={products.length >= MAX_PRODUCTS}
          >
            <Plus className="size-4" /> Adicionar produto
          </Button>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          De 1 a {MAX_PRODUCTS} produtos. Ao clicar no produto na home, o
          participante é levado para o link informado (nova aba).
        </p>

        <ul className="space-y-4">
          {products.map((product, index) => (
            <li
              key={index}
              className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-3 sm:flex-row"
            >
              <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    width={64}
                    height={64}
                    alt=""
                    className="size-16 object-contain"
                  />
                ) : null}
              </div>

              <div className="grid flex-1 gap-3 sm:grid-cols-2">
                <FieldGroup>
                  <FieldLabel htmlFor={`p-name-${index}`}>Nome</FieldLabel>
                  <Input
                    id={`p-name-${index}`}
                    value={product.name}
                    onChange={(e) =>
                      updateProductField(index, { name: e.target.value })
                    }
                    placeholder="Ex.: Whey Protein"
                    className="h-10 w-full rounded-lg border-border bg-background px-3"
                  />
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel htmlFor={`p-tag-${index}`}>Tag</FieldLabel>
                  <Input
                    id={`p-tag-${index}`}
                    value={product.tag}
                    onChange={(e) =>
                      updateProductField(index, { tag: e.target.value })
                    }
                    placeholder="Ex.: Proteína"
                    className="h-10 w-full rounded-lg border-border bg-background px-3"
                  />
                </FieldGroup>

                <FieldGroup className="sm:col-span-2">
                  <FieldLabel htmlFor={`p-desc-${index}`}>
                    Descrição
                  </FieldLabel>
                  <Input
                    id={`p-desc-${index}`}
                    value={product.description}
                    onChange={(e) =>
                      updateProductField(index, {
                        description: e.target.value,
                      })
                    }
                    placeholder="Ex.: Recuperação muscular pós-treino"
                    className="h-10 w-full rounded-lg border-border bg-background px-3"
                  />
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel htmlFor={`p-image-${index}`}>
                    URL da imagem
                  </FieldLabel>
                  <Input
                    id={`p-image-${index}`}
                    value={product.imageUrl}
                    onChange={(e) =>
                      updateProductField(index, { imageUrl: e.target.value })
                    }
                    placeholder="/images/produto.webp"
                    className="h-10 w-full rounded-lg border-border bg-background px-3"
                  />
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel htmlFor={`p-link-${index}`}>
                    Link do produto
                  </FieldLabel>
                  <Input
                    id={`p-link-${index}`}
                    value={product.link}
                    onChange={(e) =>
                      updateProductField(index, { link: e.target.value })
                    }
                    placeholder="https://loja.com/produto"
                    className="h-10 w-full rounded-lg border-border bg-background px-3"
                  />
                </FieldGroup>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeProduct(index)}
                disabled={products.length <= 1}
                aria-label="Remover produto"
                className="self-start"
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>

        <p className="mt-3 text-xs text-muted-foreground">
          É necessário manter ao menos um produto com nome preenchido.
        </p>

        {productsError && (
          <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {productsError}
          </p>
        )}

        {productsSuccess && (
          <p className="mt-3 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
            Produtos salvos com sucesso.
          </p>
        )}

        <Button type="submit" disabled={productsSaving} className="mt-4">
          {productsSaving ? "Salvando..." : "Salvar produtos"}
        </Button>
      </form>

      <form
        onSubmit={handlePromoSubmit}
        className="rounded-xl border border-border bg-card p-4 sm:p-5"
      >
        <h2 className="mb-1 font-semibold">Imagem/vídeo de destaque</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Escolha uma imagem ou um vídeo para o banner de destaque da home.
          Prepare a mídia em formato paisagem (16:9), ex.: 1920×1080 — ela
          preenche todo o quadro reservado.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <FieldGroup>
            <FieldLabel htmlFor="promo-type">Tipo</FieldLabel>
            <select
              id="promo-type"
              value={promoMedia.type}
              onChange={(e) =>
                setPromoMedia((prev) => ({
                  ...prev,
                  type: e.target.value === "video" ? "video" : "image",
                }))
              }
              className="h-10 w-full rounded-lg border-border bg-background px-3 text-sm"
            >
              <option value="image">Imagem</option>
              <option value="video">Vídeo</option>
            </select>
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="promo-url">
              URL {promoMedia.type === "video" ? "do vídeo" : "da imagem"}
            </FieldLabel>
            <Input
              id="promo-url"
              value={promoMedia.url}
              onChange={(e) =>
                setPromoMedia((prev) => ({ ...prev, url: e.target.value }))
              }
              placeholder={
                promoMedia.type === "video"
                  ? "/videos/promo-event.mp4"
                  : "/images/promo-event.jpeg"
              }
              className="h-10 w-full rounded-lg border-border bg-background px-3"
            />
          </FieldGroup>
        </div>

        {promoMedia.url && (
          <div className="mt-4 aspect-video w-full max-w-md overflow-hidden rounded-lg border border-border bg-muted/20">
            {promoMedia.type === "video" ? (
              <video
                key={promoMedia.url}
                src={promoMedia.url}
                controls
                muted
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="relative h-full w-full">
                <Image
                  src={promoMedia.url}
                  fill
                  alt=""
                  className="object-cover"
                />
              </div>
            )}
          </div>
        )}

        <p className="mt-3 text-xs text-muted-foreground">
          Se a URL ficar vazia, a mídia padrão ({DEFAULT_PROMO_MEDIA.url})
          será usada.
        </p>

        {promoError && (
          <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {promoError}
          </p>
        )}

        {promoSuccess && (
          <p className="mt-3 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
            Mídia de destaque salva com sucesso.
          </p>
        )}

        <Button type="submit" disabled={promoSaving} className="mt-4">
          {promoSaving ? "Salvando..." : "Salvar mídia de destaque"}
        </Button>
      </form>
    </div>
  );
}
