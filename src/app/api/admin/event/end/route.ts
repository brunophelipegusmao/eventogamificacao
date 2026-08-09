import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { db } from "@/db";
import { authUser, event, prize, winner } from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";
import { EVENT_ID } from "@/lib/event";
import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";

/**
 * Encerra o evento e determina os vencedores com base nas colocações
 * premiáveis (prêmios ativos). Gera um snapshot imutável do ranking final.
 */
export async function POST() {
  const auth = await requireApiSession("admin");
  if (!auth.ok) return auth.response;

  const [evt] = await db
    .select()
    .from(event)
    .where(eq(event.id, EVENT_ID))
    .limit(1);

  if (!evt) {
    return NextResponse.json(
      { error: "Evento não encontrado. Rode o seed primeiro." },
      { status: 404 }
    );
  }

  if (evt.status === "closed") {
    return NextResponse.json(
      { error: "O evento já foi encerrado." },
      { status: 409 }
    );
  }

  // Ranking final (participantes ordenados por pontos desc)
  const participants = await db
    .select({
      id: authUser.id,
      name: authUser.name,
      email: authUser.email,
      totalPoints: authUser.totalPoints,
    })
    .from(authUser)
    .where(eq(authUser.role, "participant"))
    .orderBy(desc(authUser.totalPoints));

  // Prêmios ativos ordenados por colocação
  const prizes = await db
    .select()
    .from(prize)
    .where(eq(prize.active, true))
    .orderBy(asc(prize.placement));

  // Computa ranking com empates
  let rank = 0;
  let lastPoints: number | null = null;
  const ranked = participants.map((p, i) => {
    if (p.totalPoints !== lastPoints) {
      rank = i + 1;
      lastPoints = p.totalPoints;
    }
    return { ...p, rank };
  });

  // Determina o prêmio de cada colocação (o prêmio com maior placement que cobre a colocação)
  const prizeForRank = (r: number) =>
    prizes.find((p) => r <= p.placement) ?? null;

  // Snapshot dos vencedores (apenas quem tem prêmio)
  const winners = ranked
    .filter((p) => prizeForRank(p.rank) !== null)
    .map((p) => {
      const pr = prizeForRank(p.rank);
      return {
        id: randomUUID(),
        userId: p.id,
        rank: p.rank,
        totalPoints: p.totalPoints,
        prizeId: pr?.id ?? null,
        prizeName: pr?.name ?? null,
      };
    });

  // Transação: marca evento como encerrado e grava vencedores
  await db.transaction(async (tx) => {
    await tx
      .update(event)
      .set({ status: "closed", closedAt: new Date(), updatedAt: new Date() })
      .where(eq(event.id, EVENT_ID));

    await tx.delete(winner);
    if (winners.length > 0) {
      await tx.insert(winner).values(winners);
    }
  });

  return NextResponse.json({
    message: "Evento encerrado com sucesso.",
    totalParticipants: ranked.length,
    winners: winners.map((w) => ({
      rank: w.rank,
      prizeName: w.prizeName,
      totalPoints: w.totalPoints,
    })),
  });
}
