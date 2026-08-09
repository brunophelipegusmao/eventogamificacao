import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { db } from "@/db";
import { task } from "@/db/schema";
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

  const allowed: Record<string, unknown> = {};
  if (typeof body.title === "string") allowed.title = body.title;
  if (typeof body.description === "string")
    allowed.description = body.description;
  if (typeof body.points === "number") allowed.points = body.points;
  if (body.status === "active" || body.status === "inactive")
    allowed.status = body.status;
  if (body.config !== undefined) allowed.config = body.config;
  if (body.sortOrder !== undefined) allowed.sortOrder = body.sortOrder;

  const [updated] = await db
    .update(task)
    .set(allowed)
    .where(and(eq(task.id, id)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 });
  }

  return NextResponse.json({ task: updated });
}
