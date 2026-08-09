import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { db } from "@/db";
import { authUser, completion, task } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";

/**
 * Registra uma tarefa de confirmação AUTOMÁTICA (checkin, form).
 * Body: { taskId, payload? }
 */
export async function POST(request: Request) {
  const auth = await requireApiSession("participant");
  if (!auth.ok) return auth.response;

  const { taskId, payload } = await request.json();
  if (!taskId) {
    return NextResponse.json({ error: "taskId obrigatório" }, { status: 400 });
  }

  const [taskRow] = await db
    .select()
    .from(task)
    .where(eq(task.id, taskId))
    .limit(1);

  if (!taskRow || taskRow.status !== "active") {
    return NextResponse.json({ error: "Tarefa não encontrada ou inativa" }, { status: 404 });
  }

  if (taskRow.confirmation !== "automatic") {
    return NextResponse.json(
      { error: "Esta tarefa não usa confirmação automática" },
      { status: 400 }
    );
  }

  const [existing] = await db
    .select()
    .from(completion)
    .where(
      and(
        eq(completion.taskId, taskId),
        eq(completion.userId, auth.session.user.id)
      )
    )
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: "Você já concluiu esta tarefa" },
      { status: 409 }
    );
  }

  // Tarefa do tipo form: exige payload
  if (taskRow.type === "form" && !payload) {
    return NextResponse.json(
      { error: "Envie as respostas do formulário (payload)" },
      { status: 400 }
    );
  }

  const [created] = await db
    .insert(completion)
    .values({
      id: randomUUID(),
      taskId,
      userId: auth.session.user.id,
      status: "approved",
      payload: payload ?? {},
      pointsAwarded: taskRow.points,
    })
    .returning();

  // Soma os pontos automaticamente
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

  return NextResponse.json({ completion: created, points: taskRow.points }, { status: 201 });
}
