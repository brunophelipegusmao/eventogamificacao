import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { db } from "@/db";
import { completion } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSession("admin");
  if (!auth.ok) return auth.response;

  const completions = await db
    .select()
    .from(completion)
    .where(eq(completion.status, "pending"))
    .orderBy(completion.createdAt);

  return NextResponse.json({ completions });
}
