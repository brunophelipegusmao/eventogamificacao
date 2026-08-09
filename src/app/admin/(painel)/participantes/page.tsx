import type { Metadata } from "next";
import { requireSession } from "@/lib/session";
import { AdminParticipantsView } from "@/components/admin/participants-view";

export const metadata: Metadata = {
  title: "Participantes | Painel Admin",
};

export default async function AdminParticipantsPage() {
  await requireSession("admin");
  return <AdminParticipantsView />;
}
