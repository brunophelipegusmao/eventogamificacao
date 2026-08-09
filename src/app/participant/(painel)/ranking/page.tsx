import type { Metadata } from "next";
import { requireSession } from "@/lib/session";
import { RankingView } from "@/components/participant/ranking-view";

export const metadata: Metadata = {
  title: "Ranking | Desafio JM Fitness",
};

export default async function ParticipantRankingPage() {
  await requireSession("participant");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-orbitron text-2xl font-bold">Ranking</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe sua posição e os prêmios por colocação.
        </p>
      </div>
      <RankingView />
    </div>
  );
}
