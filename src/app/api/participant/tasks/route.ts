import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { completion, task } from "@/db/schema";
import { requireApiSession } from "@/lib/api-auth";
import { todayInEventTimezone } from "@/lib/date";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSession("participant");
  if (!auth.ok) return auth.response;

  const [tasks, completions] = await Promise.all([
    db
      .select()
      .from(task)
      .where(eq(task.status, "active"))
      .orderBy(asc(task.sortOrder)),
    db
      .select()
      .from(completion)
      .where(eq(completion.userId, auth.session.user.id)),
  ]);

  const todayStr = todayInEventTimezone();
  const taskById = new Map(tasks.map((t) => [t.id, t]));
  const relevantCompletions = completions.filter((c) => {
    const t = taskById.get(c.taskId);
    return t?.type === "checkin" ? c.day === todayStr : true;
  });

  const completionByTask = new Map(
    relevantCompletions.map((c) => [c.taskId, c]),
  );

  const tasksWithState = tasks.map((t) => {
    const comp = completionByTask.get(t.id);
    return {
      ...t,
      completion: comp ?? null,
    };
  });

  return NextResponse.json({
    tasks: tasksWithState,
    completions,
  });
}
