import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { db } from "@/db";
import { task } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  const auth = await requireApiSession("admin");
  if (!auth.ok) return auth.response;

  const tasks = await db
    .select()
    .from(task)
    .orderBy(desc(task.createdAt));

  return NextResponse.json({ tasks });
}
