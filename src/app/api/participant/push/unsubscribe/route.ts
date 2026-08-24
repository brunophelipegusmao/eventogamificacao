import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { pushSubscription } from "@/db/schema";
import { requireApiSession } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireApiSession("participant");
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const endpoint = typeof body.endpoint === "string" ? body.endpoint : "";

  if (!endpoint) {
    return NextResponse.json(
      { error: "endpoint obrigatório" },
      { status: 400 },
    );
  }

  await db
    .delete(pushSubscription)
    .where(eq(pushSubscription.endpoint, endpoint));

  return NextResponse.json({ ok: true });
}
