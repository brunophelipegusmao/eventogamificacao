import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { db } from "@/db";
import { authUser, completion, task } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";

/**
 * Valida QR code de tarefa.
 * Body: { taskId, qr }
 * O segredo do QR está no config da tarefa.
 */
export async function POST(request: Request) {
  const auth = await requireApiSession("participant");
  if (!auth.ok) return auth.response;

  const { taskId, qr } = await request.json();
  if (!taskId || !qr) {
    return NextResponse.json({ error: "taskId e qr obrigatórios" }, { status: 400 });
  }

  const [taskRow] = await db
    .select()
    .from(task)
    .where(eq(task.id, taskId))
    .limit(1);

  if (!taskRow || taskRow.status !== "active") {
    return NextResponse.json({ error: "Tarefa não encontrada ou inativa" }, { status: 404 });
  }

  if (taskRow.confirmation !== "qr_code") {
    return NextResponse.json(
      { error: "Esta tarefa não usa confirmação por QR" },
      { status: 400 }
    );
  }

  const secret = (taskRow.config as { qr?: string } | null)?.qr;
  if (!secret) {
    return NextResponse.json({ error: "QR não configurado" }, { status: 500 });
  }

  // Comparação segura (tempo constante-ish)
  if (String(qr).trim() !== String(secret).trim()) {
    return NextResponse.json({ error: "QR code inválido" }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(completion)
    .where(eq(completion.taskId, taskId))
    .where(eq(completion.userId, auth.session.user.id))
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: "Você já escaneou este QR code" },
      { status: 409 }
    );
  }

  const [created] = await db
    .insert(completion)
    .values({
      id: randomUUID(),
      taskId,
      userId: auth.session.user.id,
      status: "approved",
      payload: { qr: String(qr).trim() },
      pointsAwarded: taskRow.points,
    })
    .returning();

  const [user] = await db
    .select({ id: authUser.id, totalPoints: authUser.totalPoints })
    .from(authUser)
    .where(eq(authUser.id, auth.session.user.id))
    .limit(1);

  if (user) {
    await db
      .update(authUser)
      .set({
        totalPoints: (user.totalPoints ?? 0) + taskRow.points,
        updatedAt: new Date(),
      })
      .where(eq(authUser.id, user.id));
  }

  return NextResponse.json(
    { completion: created, points: taskRow.points },
    { status: 201 }
  );
}
