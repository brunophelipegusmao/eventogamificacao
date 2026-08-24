import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  authUser,
  completion,
  event,
  pointAdjustment,
  prize,
  task,
  winner,
} from "@/db/schema";
import { requireApiSession } from "@/lib/api-auth";
import { EVENT_ID } from "@/lib/event";

export const dynamic = "force-dynamic";

const CONFIRM_PHRASE = "APAGAR TUDO";

/**
 * Limpa completamente o banco para um novo evento: apaga participantes,
 * conclusões, ajustes de pontos, vencedores, tarefas e prêmios. Contas de
 * admin e configurações do site são preservadas. Só pode ser chamada com o
 * evento já encerrado e com a frase de confirmação exata.
 */
export async function POST(request: Request) {
  const auth = await requireApiSession("admin");
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const confirmPhrase =
    typeof body.confirmPhrase === "string"
      ? body.confirmPhrase.trim().toUpperCase()
      : "";

  if (confirmPhrase !== CONFIRM_PHRASE) {
    return NextResponse.json(
      { error: `Digite exatamente "${CONFIRM_PHRASE}" para confirmar` },
      { status: 400 },
    );
  }

  const [evt] = await db
    .select()
    .from(event)
    .where(eq(event.id, EVENT_ID))
    .limit(1);

  if (!evt || evt.status !== "closed") {
    return NextResponse.json(
      { error: "Encerre o evento antes de limpar o banco" },
      { status: 400 },
    );
  }

  const result = await db.transaction(async (tx) => {
    await tx.delete(winner);
    await tx.delete(completion);
    await tx.delete(pointAdjustment);
    const deletedParticipants = await tx
      .delete(authUser)
      .where(eq(authUser.role, "participant"))
      .returning({ id: authUser.id });
    const deletedTasks = await tx.delete(task).returning({ id: task.id });
    const deletedPrizes = await tx.delete(prize).returning({ id: prize.id });

    await tx
      .update(event)
      .set({ status: "open", closedAt: null, updatedAt: new Date() })
      .where(eq(event.id, EVENT_ID));

    return {
      participants: deletedParticipants.length,
      tasks: deletedTasks.length,
      prizes: deletedPrizes.length,
    };
  });

  return NextResponse.json({
    message: "Banco de dados limpo com sucesso.",
    ...result,
  });
}
