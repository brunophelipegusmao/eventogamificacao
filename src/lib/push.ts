import { inArray } from "drizzle-orm";
import webpush from "web-push";
import { db } from "@/db";
import { pushSubscription } from "@/db/schema";

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT ?? "mailto:contato@example.com";

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

/** Envia uma notificação push para todos os dispositivos inscritos (todos de participantes). */
export async function sendPushToAllParticipants(payload: PushPayload) {
  if (!publicKey || !privateKey) return;

  const subs = await db.select().from(pushSubscription);
  if (subs.length === 0) return;

  const expiredIds: string[] = [];

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          expiredIds.push(sub.id);
        }
      }
    }),
  );

  if (expiredIds.length > 0) {
    await db
      .delete(pushSubscription)
      .where(inArray(pushSubscription.id, expiredIds));
  }
}
