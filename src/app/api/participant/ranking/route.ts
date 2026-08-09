import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { db } from "@/db";
import { authUser, prize } from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSession("participant");
  if (!auth.ok) return auth.response;

  const [participants, prizes] = await Promise.all([
    db
      .select({
        id: authUser.id,
        name: authUser.name,
        totalPoints: authUser.totalPoints,
      })
      .from(authUser)
      .where(eq(authUser.role, "participant"))
      .orderBy(desc(authUser.totalPoints)),
    db.select().from(prize).where(eq(prize.active, true)).orderBy(asc(prize.placement)),
  ]);

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

  const me = ranking.find((r) => r.id === auth.session.user.id) ?? null;

  return NextResponse.json({
    ranking,
    me,
    totalParticipants: ranking.length,
    prizes,
  });
}
