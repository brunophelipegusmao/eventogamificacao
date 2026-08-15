import Image from "next/image";
import Link from "next/link";
import { PixelImage } from "@/components/ui/pixel-image";
import { getSiteSettings } from "@/lib/site-settings";
import {
  QrCode,
  Trophy,
  Zap,
  Users,
  ArrowRight,
  Dumbbell,
  Timer,
} from "lucide-react";

const BENEFICIOS = [
  {
    icon: QrCode,
    titulo: "Check-in com QR Code",
    desc: "Escaneie, complete tarefas e ganhe pontos na hora.",
  },
  {
    icon: Trophy,
    titulo: "Ranking ao vivo",
    desc: "Acompanhe sua posição em tempo real e suba no pódio.",
  },
  {
    icon: Zap,
    titulo: "Pontos por tarefas",
    desc: "Check-ins, formulários e posts sociais valem pontos.",
  },
  {
    icon: Users,
    titulo: "Prêmios por colocação",
    desc: "Os melhores colocados levam kits exclusivos JM.",
  },
];

export const dynamic = "force-dynamic";

export default async function Home() {
  const { sponsorLogos, products, promoMedia } = await getSiteSettings();

  return (
    <main className="flex min-h-screen flex-col items-center">
      {/* ===== HERO ===== */}
      <section className="tech-grid-bg relative w-full overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(60,113,200,0.18),transparent_60%)]" />
        <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 py-14 text-center sm:py-20 md:py-24">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary uppercase tracking-widest">
            <Dumbbell className="size-3.5" />
            Ativação de Suplementos · Edição 2026
          </span>
          <h1 className="font-goldman text-4xl font-bold tracking-tight text-primary uppercase glow-gold sm:text-5xl md:text-6xl">
            Desafio
            <br className="sm:hidden" />
            <span className="text-foreground"> JM Fitness</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Participe do desafio gamificado de ativação do novo suplemento.
            Complete tarefas, acumule pontos, dispute o ranking e concorra a
            prêmios exclusivos.
          </p>

          <div className="mt-8 flex w-full flex-col gap-3 px-4 sm:w-auto sm:flex-row sm:gap-4">
            <Link
              href="/participant/cadastro"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-center text-lg font-bold text-primary-foreground uppercase shadow-[0_0_24px_rgba(188,156,37,0.35)] transition-all hover:bg-primary/90"
            >
              Inscreva-se
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/participant/login"
              className="inline-flex items-center justify-center rounded-xl border-2 border-foreground/20 px-8 py-4 text-center text-lg font-bold text-foreground uppercase transition-colors hover:border-primary hover:text-primary"
            >
              Entrar
            </Link>
          </div>

          <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground sm:gap-10">
            <span className="flex items-center gap-1.5">
              <Zap className="size-4 text-primary" /> +180 pontos possíveis
            </span>
            <span className="flex items-center gap-1.5">
              <Trophy className="size-4 text-primary" /> Prêmios reais
            </span>
            <span className="flex items-center gap-1.5">
              <Timer className="size-4 text-primary" /> Tempo real
            </span>
          </div>
        </div>
      </section>

      {/* ===== LOGOS PARCEIROS ===== */}
      <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
        <p className="mb-6 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Realização e apoio
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {sponsorLogos.map((logo) => (
            <div
              key={logo}
              className="relative aspect-square w-[calc(50%-0.5rem)] overflow-hidden rounded-xl border border-border bg-card p-6 lg:w-[calc(25%-0.75rem)]"
            >
              <Image
                src={logo}
                fill
                alt="Logo de realização/apoio"
                className="object-contain"
              />
            </div>
          ))}
        </div>
      </section>

      {/* ===== MÍDIA PROMO ===== */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-10 sm:pb-14">
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border shadow-[0_0_40px_rgba(60,113,200,0.15)]">
          {promoMedia.type === "video" ? (
            <video
              src={promoMedia.url}
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            <PixelImage
              src={promoMedia.url}
              customGrid={{ rows: 4, cols: 6 }}
              grayscaleAnimation
              className="absolute inset-0 h-full w-full"
            />
          )}
        </div>
      </section>

      {/* ===== SOBRE ===== */}
      <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3 text-center">
          <span className="h-1.5 w-16 rounded-full bg-primary" />
          <p className="font-heading text-sm font-bold tracking-widest text-primary uppercase">
            Sobre o desafio
          </p>
          <p className="text-center text-sm leading-relaxed text-foreground/80 sm:text-base">
            Um evento de ativação do novo suplemento da JM Fitness: quanto mais
            tarefas você completa — check-in, formulário de perfil, escaneamento
            de QR codes nos estandes e posts nas redes sociais — mais pontos
            acumula. No final, os participantes mais bem colocados no ranking
            levam kits, camisetas e brindes exclusivos.
          </p>
        </div>
      </section>

      {/* ===== COMO FUNCIONA ===== */}
      <section className="w-full border-y border-border bg-card/40">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 py-12 sm:grid-cols-2 sm:py-16 lg:grid-cols-4">
          {BENEFICIOS.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.titulo}
                className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
              >
                <div className="mb-3 flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <h3 className="font-semibold">{b.titulo}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{b.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== PRODUTOS ===== */}
      <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:py-16">
        <div className="mb-8 text-center">
          <span className="mb-3 inline-block h-1.5 w-16 rounded-full bg-primary" />
          <h2 className="font-goldman text-2xl font-bold uppercase text-primary glow-gold sm:text-3xl">
            Conheça a linha
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Placeholders de produtos — os campeões levam esses kits.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {products.map((p, index) => {
            const cardClassName =
              "group overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/50";

            const content = (
              <>
                <div className="relative flex aspect-square items-center justify-center bg-gradient-to-br from-[#070a23] to-[#101740]">
                  {p.imageUrl ? (
                    <Image
                      src={p.imageUrl}
                      fill
                      alt={p.name}
                      className="object-cover"
                    />
                  ) : (
                    <>
                      <Dumbbell className="size-12 text-accent/60 transition-transform group-hover:scale-110" />
                      <div className="absolute bottom-2 right-2 rounded bg-background/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        imagem
                      </div>
                    </>
                  )}
                  {p.tag && (
                    <span className="absolute left-2 top-2 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                      {p.tag}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-semibold">{p.name}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {p.description}
                  </p>
                </div>
              </>
            );

            if (p.link) {
              return (
                <Link
                  key={`${p.name}-${index}`}
                  href={p.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cardClassName}
                >
                  {content}
                </Link>
              );
            }

            return (
              <div key={`${p.name}-${index}`} className={cardClassName}>
                {content}
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="w-full border-t border-border bg-gradient-to-b from-card/60 to-transparent">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-14 text-center sm:py-16">
          <h2 className="font-goldman text-3xl font-bold uppercase text-primary glow-gold sm:text-4xl">
            Pronto para o desafio?
          </h2>
          <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
            Inscreva-se agora e comece a acumular pontos. O ranking já está
            aberto!
          </p>
          <div className="mt-4 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
            <Link
              href="/participant/cadastro"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-center text-lg font-bold text-primary-foreground uppercase shadow-[0_0_24px_rgba(188,156,37,0.35)] transition-colors hover:bg-primary/90"
            >
              Quero participar
            </Link>
            <Link
              href="/admin/login"
              className="inline-flex items-center justify-center rounded-xl border border-border px-8 py-4 text-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Área do administrador
            </Link>
          </div>
        </div>
      </section>

      <footer className="w-full border-t border-border py-6">
        <p className="text-center text-xs text-muted-foreground">
          © 2026 JM Fitness Studio · Desafio de ativação de suplementos
        </p>
      </footer>
    </main>
  );
}
