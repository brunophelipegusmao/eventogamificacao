import { db } from "@/db";
import { event } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

const EVENT_ID = "evento-jm-2026";

/** Garante que existe uma linha singleton do evento e retorna o status atual. */
export async function getEvent() {
  const [existing] = await db
    .select()
    .from(event)
    .where(eq(event.id, EVENT_ID))
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(event)
    .values({ id: EVENT_ID, status: "open" })
    .returning();

  return created;
}

export { EVENT_ID };
