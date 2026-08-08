import Image from "next/image";
import Link from "next/link";
import { PixelImage } from "@/components/ui/pixel-image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-8 sm:gap-10">
      <section className="w-full bg-primary px-4 py-12 text-center sm:px-8 sm:py-20 md:py-28">
        <h1 className="font-goldman text-4xl font-bold tracking-tight text-primary-foreground uppercase sm:text-5xl md:text-6xl">
          Titulo do evento
        </h1>
        <p className="mt-3 text-base text-primary-foreground/80 sm:text-lg">
          Breve descrição do evento
        </p>
      </section>

      <div className="flex w-full max-w-md items-center justify-center gap-8 px-4 sm:w-[60%] sm:justify-between">
        <Image
          src="/logos/jm_512x512.webp"
          width={200}
          height={200}
          alt={"JM Juliana Martins Fitness Studio Logo"}
          className="h-20 w-20 object-contain sm:h-32 sm:w-32 md:h-50 md:w-50"
        />
        <Image
          src="/logos/logo-alphabox.jpeg"
          width={200}
          height={200}
          alt={"Alphabox Logo"}
          className="h-20 w-20 object-contain sm:h-32 sm:w-32 md:h-50 md:w-50"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border-4 border-primary">
        <PixelImage
          src="/images/promo-event.jpeg"
          customGrid={{ rows: 4, cols: 6 }}
          grayscaleAnimation
        />
      </div>

      <div className="flex w-full max-w-2xl flex-col items-center gap-3 px-4 sm:w-[80%] md:w-[65%]">
        <span className="h-1.5 w-16 rounded-full bg-primary" />
        <p className="font-heading text-sm font-bold tracking-widest text-primary uppercase">
          Descrição detalhada do evento...
        </p>
        <p className="text-center text-sm leading-relaxed text-foreground/80 sm:text-base">
          lorem ipsum dolor sit amet Lorem ipsum dolor sit amet consectetur
          adipisicing elit. Nemo itaque, quisquam excepturi veniam dignissimos
          sit. Earum a, praesentium maxime aliquam adipisci cumque facere
          facilis accusamus necessitatibus, laudantium iste dignissimos
          reiciendis. Quia quis ea quidem facere neque architecto inventore quos
          ad explicabo nemo! Repellendus nesciunt, incidunt sunt eveniet iste
          impedit dolores natus non quia, ab, doloremque nam placeat ad
          consequatur exercitationem. Alias non, pariatur ipsum reiciendis sequi
          corrupti omnis enim magni laudantium. Quos tempore eaque modi
          assumenda, quaerat nihil blanditiis, nesciunt sed saepe porro
          perferendis atque, commodi eveniet et repudiandae aliquam? Quaerat
          maiores iure at similique necessitatibus suscipit, eius quod dolor,
          cumque pariatur sint tempora. Officiis ut quas odit, dolores obcaecati
          ex nisi, ipsam qui quidem officia vel facilis cupiditate similique?
          Sapiente similique, deleniti accusantium id, facilis expedita enim
          omnis error ipsam quam repudiandae, odit praesentium cumque velit
          molestias fugit assumenda perferendis corrupti voluptas voluptate
          reiciendis magni optio. Officiis, debitis nam.
        </p>
      </div>

      <div className="flex w-full flex-col gap-3 px-4 pb-12 sm:w-auto sm:flex-row sm:gap-4">
        <Link
          href="/cadastro"
          className="w-full rounded-xl bg-primary px-6 py-4 text-center text-lg font-bold text-primary-foreground uppercase shadow-[4px_4px_0_0_#000] transition-colors hover:bg-primary/90 sm:w-auto sm:px-10 sm:py-6 sm:text-2xl"
        >
          Inscreva-se
        </Link>
        <Link
          href="/login"
          className="w-full rounded-xl border-2 border-foreground px-6 py-4 text-center text-lg font-bold text-foreground uppercase transition-colors hover:bg-foreground hover:text-background sm:w-auto sm:px-10 sm:py-6 sm:text-2xl"
        >
          Entrar
        </Link>
      </div>
      <div className="flex w-full max-w-2xl flex-col items-center gap-3 px-4 sm:w-[80%] md:w-[65%]">
        <span className="h-1.5 w-16 rounded-full bg-primary" />
        <p className="font-heading text-sm font-bold tracking-widest text-primary uppercase">
          Descrição detalhada do evento...
        </p>
        <p className="text-center text-sm leading-relaxed text-foreground/80 sm:text-base">
          lorem ipsum dolor sit amet Lorem ipsum dolor sit amet consectetur
          adipisicing elit. Nemo itaque, quisquam excepturi veniam dignissimos
          sit. Earum a, praesentium maxime aliquam adipisci cumque facere
          facilis accusamus necessitatibus, laudantium iste dignissimos
          reiciendis. Quia quis ea quidem facere neque architecto inventore quos
          ad explicabo nemo! Repellendus nesciunt, incidunt sunt eveniet iste
          impedit dolores natus non quia, ab, doloremque nam placeat ad
          consequatur exercitationem. Alias non, pariatur ipsum reiciendis sequi
          corrupti omnis enim magni laudantium. Quos tempore eaque modi
          assumenda, quaerat nihil blanditiis, nesciunt sed saepe porro
          perferendis atque, commodi eveniet et repudiandae aliquam? Quaerat
          maiores iure at similique necessitatibus suscipit, eius quod dolor,
          cumque pariatur sint tempora. Officiis ut quas odit, dolores obcaecati
          ex nisi, ipsam qui quidem officia vel facilis cupiditate similique?
          Sapiente similique, deleniti accusantium id, facilis expedita enim
          omnis error ipsam quam repudiandae, odit praesentium cumque velit
          molestias fugit assumenda perferendis corrupti voluptas voluptate
          reiciendis magni optio. Officiis, debitis nam.
        </p>
      </div>
    </main>
  );
}
