import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { db } from "@/db";
import { authUser, completion, task } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSession("participant");
  if (!auth.ok) return auth.response;

  const [tasks, completions] = await Promise.all([
    db.select().from(task).where(eq(task.status, "active")).orderBy(asc(task.sortOrder)),
    db.select().from(completion).where(eq(completion.userId, auth.session.user.id)),
  ]);

  const completionByTask = new Map(
    completions.map((c) => [c.taskId, c])
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
