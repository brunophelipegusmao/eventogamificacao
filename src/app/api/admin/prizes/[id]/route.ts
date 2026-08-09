import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { db } from "@/db";
import { prize } from "@/db/schema";
import { eq } from "drizzle-orm";

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
  if (typeof body.name === "string") allowed.name = body.name;
  if (typeof body.description === "string")
    allowed.description = body.description;
  if (typeof body.imageUrl === "string") allowed.imageUrl = body.imageUrl;
  if (typeof body.placement === "number") allowed.placement = body.placement;
  if (typeof body.active === "boolean") allowed.active = body.active;

  const [updated] = await db
    .update(prize)
    .set({ ...allowed, updatedAt: new Date() })
    .where(eq(prize.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Prêmio não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ prize: updated });
}
