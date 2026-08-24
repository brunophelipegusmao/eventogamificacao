import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { pushSubscription } from "@/db/schema";
import { requireApiSession } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

/**
 * Registra a inscrição push do navegador/dispositivo atual.
 * Body: { endpoint, keys: { p256dh, auth } } (PushSubscription.toJSON())
 */
export async function POST(request: Request) {
  const auth = await requireApiSession("participant");
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const endpoint = typeof body.endpoint === "string" ? body.endpoint : "";
  const p256dh = typeof body.keys?.p256dh === "string" ? body.keys.p256dh : "";
  const authKey = typeof body.keys?.auth === "string" ? body.keys.auth : "";

  if (!endpoint || !p256dh || !authKey) {
    return NextResponse.json(
      { error: "Inscrição push inválida" },
      { status: 400 },
    );
  }

  await db
    .insert(pushSubscription)
    .values({
      id: randomUUID(),
      userId: auth.session.user.id,
      endpoint,
      p256dh,
      auth: authKey,
    })
    .onConflictDoUpdate({
      target: pushSubscription.endpoint,
      set: { userId: auth.session.user.id, p256dh, auth: authKey },
    });

  return NextResponse.json({ ok: true }, { status: 201 });
}
