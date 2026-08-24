import { asc, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { authUser, event, prize, winner } from "@/db/schema";
import { requireApiSession } from "@/lib/api-auth";
import { EVENT_ID } from "@/lib/event";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSession("participant");
  if (!auth.ok) return auth.response;

  const [participants, prizes, evt, winners] = await Promise.all([
    db
      .select({
        id: authUser.id,
        name: authUser.name,
        totalPoints: authUser.totalPoints,
      })
      .from(authUser)
      .where(eq(authUser.role, "participant"))
      .orderBy(desc(authUser.totalPoints)),
    db
      .select()
      .from(prize)
      .where(eq(prize.active, true))
      .orderBy(asc(prize.placement)),
    db.select().from(event).where(eq(event.id, EVENT_ID)).limit(1),
    db.select().from(winner).orderBy(asc(winner.rank)),
  ]);

  const eventClosed = evt[0]?.status === "closed";

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
    eventClosed,
    winners: eventClosed
      ? winners.map((w) => ({ userId: w.userId, prizeName: w.prizeName }))
      : [],
  });
}
