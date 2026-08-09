import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { db } from "@/db";
import { task } from "@/db/schema";
import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireApiSession("admin");
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const {
    title,
    description,
    type,
    confirmation,
    points,
    status,
    config,
  } = body;

  if (!title || !description || !type || !confirmation) {
    return NextResponse.json(
      { error: "Campos obrigatórios: título, descrição, tipo e confirmação" },
      { status: 400 }
    );
  }

  const [created] = await db
    .insert(task)
    .values({
      id: randomUUID(),
      title: String(title),
      description: String(description),
      type,
      confirmation,
      points: Number(points) || 0,
      status: status === "inactive" ? "inactive" : "active",
      config: config ?? {},
    })
    .returning();

  return NextResponse.json({ task: created }, { status: 201 });
}
