import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/session";
import { ParticipantTasksView } from "@/components/participant/tasks-view";
import { RankingView } from "@/components/participant/ranking-view";
import { ArrowRight, Trophy } from "lucide-react";

export const metadata: Metadata = {
  title: "Meu Desafio | JM Fitness",
};

export default async function ParticipantHomePage() {
  const session = await requireSession("participant");

  return (
    <div className="space-y-8">
      <section>
        <h1 className="font-orbitron text-2xl font-bold sm:text-3xl">
          Olá, {session.user.name.split(" ")[0]}! 💪
        </h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          Complete tarefas, acumule pontos e suba no ranking para concorrer aos
          prêmios.
        </p>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Suas tarefas</h2>
        </div>
        <ParticipantTasksView />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Ranking</h2>
          <Link
            href="/participant/ranking"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Ver completo <ArrowRight className="size-4" />
          </Link>
        </div>
        <RankingView />
      </section>
    </div>
  );
}
