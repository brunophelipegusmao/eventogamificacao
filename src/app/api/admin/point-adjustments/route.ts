import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { authUser, pointAdjustment } from "@/db/schema";
import { requireApiSession } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

/**
 * Ajuste manual de pontos feito por um admin, com justificativa.
 * Body: { userId, points, reason }
 * `points` é um delta (positivo ou negativo) somado a totalPoints.
 */
export async function POST(request: Request) {
  const auth = await requireApiSession("admin");
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const userId = typeof body.userId === "string" ? body.userId : "";
  const points = Number(body.points);
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";

  if (!userId) {
    return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });
  }
  if (!Number.isFinite(points) || !Number.isInteger(points) || points === 0) {
    return NextResponse.json(
      { error: "points deve ser um número inteiro diferente de zero" },
      { status: 400 },
    );
  }
  if (!reason) {
    return NextResponse.json(
      { error: "Justificativa obrigatória" },
      { status: 400 },
    );
  }

  const [user] = await db
    .select({ id: authUser.id, role: authUser.role })
    .from(authUser)
    .where(eq(authUser.id, userId))
    .limit(1);

  if (!user || user.role !== "participant") {
    return NextResponse.json(
      { error: "Participante não encontrado" },
      { status: 404 },
    );
  }

  const { adjustment, totalPoints } = await db.transaction(async (tx) => {
    const [adjustment] = await tx
      .insert(pointAdjustment)
      .values({
        id: randomUUID(),
        userId,
        adminId: auth.session.user.id,
        points,
        reason,
      })
      .returning();

    const [updated] = await tx
      .update(authUser)
      .set({
        totalPoints: sql`${authUser.totalPoints} + ${points}`,
        updatedAt: new Date(),
      })
      .where(eq(authUser.id, userId))
      .returning({ totalPoints: authUser.totalPoints });

    return { adjustment, totalPoints: updated?.totalPoints ?? 0 };
  });

  return NextResponse.json({ adjustment, totalPoints }, { status: 201 });
}
