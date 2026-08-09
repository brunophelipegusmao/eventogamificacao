import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { db } from "@/db";
import { authUser, completion, prize, task } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSession("admin");
  if (!auth.ok) return auth.response;

  const [participants, completions, tasks, prizes, totalPoints] =
    await Promise.all([
      db
        .select({
          id: authUser.id,
          name: authUser.name,
          email: authUser.email,
          phone: authUser.phone,
          instagram: authUser.instagram,
          totalPoints: authUser.totalPoints,
          createdAt: authUser.createdAt,
        })
        .from(authUser)
        .where(eq(authUser.role, "participant"))
        .orderBy(desc(authUser.totalPoints)),
      db.select().from(completion),
      db
        .select({
          id: task.id,
          title: task.title,
          points: task.points,
          type: task.type,
          confirmation: task.confirmation,
          status: task.status,
        })
        .from(task)
        .where(eq(task.status, "active")),
      db.select().from(prize).where(eq(prize.active, true)),
      db
        .select({ total: sql<number>`coalesce(sum(${authUser.totalPoints}), 0)` })
        .from(authUser)
        .where(eq(authUser.role, "participant")),
    ]);

  const approvedCount = completions.filter(
    (c) => c.status === "approved"
  ).length;
  const pendingCount = completions.filter((c) => c.status === "pending").length;

  // Métricas de conclusão por tarefa
  const taskStats = tasks.map((t) => {
    const all = completions.filter((c) => c.taskId === t.id);
    const approved = all.filter((c) => c.status === "approved");
    return {
      ...t,
      totalAttempts: all.length,
      approved: approved.length,
      pending: all.filter((c) => c.status === "pending").length,
      rate: all.length > 0 ? Math.round((approved.length / all.length) * 100) : 0,
    };
  });

  return NextResponse.json({
    participants,
    totalParticipants: participants.length,
    completions,
    tasks: taskStats,
    prizes,
    totalPoints: totalPoints[0]?.total ?? 0,
    approvedCount,
    pendingCount,
  });
}
