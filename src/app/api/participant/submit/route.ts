import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { db } from "@/db";
import { completion, task } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";

/**
 * Submete tarefa com confirmação do ADMIN (ex.: print de story).
 * Body: { taskId, payload? }
 * Cria completion com status "pending" — admin aprova depois.
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

  if (taskRow.confirmation !== "admin") {
    return NextResponse.json(
      { error: "Esta tarefa não usa confirmação manual do admin" },
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
      { error: "Você já enviou esta tarefa" },
      { status: 409 }
    );
  }

  const [created] = await db
    .insert(completion)
    .values({
      id: randomUUID(),
      taskId,
      userId: auth.session.user.id,
      status: "pending",
      payload: payload ?? {},
      pointsAwarded: 0,
    })
    .returning();

  return NextResponse.json(
    { completion: created, message: "Solicitação enviada, aguarde confirmação" },
    { status: 201 }
  );
}
