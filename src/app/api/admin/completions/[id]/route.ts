import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { db } from "@/db";
import { authUser, completion, task } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession("admin");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json();
  const decision = body.decision; // "approved" | "rejected"
  const adminNote = typeof body.adminNote === "string" ? body.adminNote : null;

  if (decision !== "approved" && decision !== "rejected") {
    return NextResponse.json(
      { error: "Decisão inválida (approved | rejected)" },
      { status: 400 }
    );
  }

  const [comp] = await db
    .select()
    .from(completion)
    .where(and(eq(completion.id, id), eq(completion.status, "pending")))
    .limit(1);

  if (!comp) {
    return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 });
  }

  const [taskRow] = await db
    .select({ points: task.points, id: task.id })
    .from(task)
    .where(eq(task.id, comp.taskId))
    .limit(1);

  const pointsAwarded = decision === "approved" ? (taskRow?.points ?? 0) : 0;

  const [updated] = await db
    .update(completion)
    .set({
      status: decision,
      adminNote,
      pointsAwarded,
      updatedAt: new Date(),
    })
    .where(eq(completion.id, id))
    .returning();

  if (decision === "approved" && pointsAwarded > 0) {
    const [user] = await db
      .select({ id: authUser.id, totalPoints: authUser.totalPoints })
      .from(authUser)
      .where(eq(authUser.id, comp.userId))
      .limit(1);

    if (user) {
      await db
        .update(authUser)
        .set({
          totalPoints: (user.totalPoints ?? 0) + pointsAwarded,
          updatedAt: new Date(),
        })
        .where(eq(authUser.id, user.id));
    }
  }

  return NextResponse.json({ completion: updated });
}
