import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { db } from "@/db";
import { prize } from "@/db/schema";
import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireApiSession("admin");
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const { name, description, imageUrl, placement } = body;

  if (!name || !placement) {
    return NextResponse.json(
      { error: "Campos obrigatórios: nome e colocação" },
      { status: 400 }
    );
  }

  const [created] = await db
    .insert(prize)
    .values({
      id: randomUUID(),
      name: String(name),
      description: description ? String(description) : null,
      imageUrl: imageUrl ? String(imageUrl) : null,
      placement: Number(placement),
      active: true,
    })
    .returning();

  return NextResponse.json({ prize: created }, { status: 201 });
}
