import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { db } from "@/db";
import {
  authUser,
  completion,
  event,
  prize,
  task,
  winner,
} from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";
import { EVENT_ID } from "@/lib/event";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSession("admin");
  if (!auth.ok) return auth.response;

  const [evt, participants, completions, tasks, prizes, winners] =
    await Promise.all([
      db.select().from(event).where(eq(event.id, EVENT_ID)).limit(1),
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
      db.select().from(task),
      db.select().from(prize).where(eq(prize.active, true)).orderBy(asc(prize.placement)),
      db.select().from(winner).orderBy(asc(winner.rank)),
    ]);

  const eventRow = evt[0] ?? null;

  // Ranking com empates
  let rank = 0;
  let lastPoints: number | null = null;
  const ranking = participants.map((p, i) => {
    if (p.totalPoints !== lastPoints) {
      rank = i + 1;
      lastPoints = p.totalPoints;
    }
    return { ...p, rank };
  });

  // Métricas
  const approved = completions.filter((c) => c.status === "approved");
  const pending = completions.filter((c) => c.status === "pending");
  const totalPoints = participants.reduce(
    (acc, p) => acc + (p.totalPoints ?? 0),
    0
  );

  // Atividades por participante (com respostas de formulário)
  const activitiesByUser = new Map<string, typeof completions>();
  for (const c of completions) {
    const list = activitiesByUser.get(c.userId) ?? [];
    list.push(c);
    activitiesByUser.set(c.userId, list);
  }

  const taskById = new Map(tasks.map((t) => [t.id, t]));

  const participantsDetail = ranking.map((p) => {
    const acts = (activitiesByUser.get(p.id) ?? []).map((c) => {
      const t = taskById.get(c.taskId);
      return {
        taskId: c.taskId,
        taskTitle: t?.title ?? "Tarefa removida",
        taskType: t?.type ?? null,
        status: c.status,
        pointsAwarded: c.pointsAwarded,
        payload: c.payload,
        adminNote: c.adminNote,
        createdAt: c.createdAt,
      };
    });
    return { ...p, activities: acts };
  });

  // Estatísticas por tarefa
  const taskStats = tasks.map((t) => {
    const all = completions.filter((c) => c.taskId === t.id);
    const appr = all.filter((c) => c.status === "approved");
    return {
      id: t.id,
      title: t.title,
      type: t.type,
      confirmation: t.confirmation,
      points: t.points,
      status: t.status,
      totalAttempts: all.length,
      approved: appr.length,
      pending: all.filter((c) => c.status === "pending").length,
      rate: all.length > 0 ? Math.round((appr.length / all.length) * 100) : 0,
    };
  });

  return NextResponse.json({
    event: eventRow,
    ranking,
    participants: participantsDetail,
    totalParticipants: participants.length,
    totalPoints,
    approvedCount: approved.length,
    pendingCount: pending.length,
    tasks: taskStats,
    prizes,
    winners,
  });
}
