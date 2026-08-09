import type { Metadata } from "next";
import { requireSession } from "@/lib/session";
import { AdminConfirmationsView } from "@/components/admin/confirmations-view";

export const metadata: Metadata = {
  title: "Confirmações | Painel Admin",
};

export default async function AdminConfirmationsPage() {
  await requireSession("admin");
  return <AdminConfirmationsView />;
}
