import type { Metadata } from "next";
import { requireSession } from "@/lib/session";
import { db } from "@/db";
import { task } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AdminQrDisplay } from "@/components/admin/qr-display";

export const metadata: Metadata = {
  title: "QR Code | Painel Admin",
};

export default async function AdminTaskQrPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession("admin");
  const { id } = await params;

  const [taskRow] = await db.select().from(task).where(eq(task.id, id)).limit(1);

  const secret =
    taskRow && taskRow.confirmation === "qr_code"
      ? ((taskRow.config as { qr?: string } | null)?.qr ?? "")
      : "";

  if (!taskRow || taskRow.confirmation !== "qr_code" || !secret) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="font-semibold">QR Code indisponível</p>
        <p className="text-sm text-muted-foreground">
          Esta tarefa não existe ou não tem confirmação por QR Code
          configurada.
        </p>
      </div>
    );
  }

  return (
    <AdminQrDisplay title={taskRow.title} points={taskRow.points} secret={secret} />
  );
}
