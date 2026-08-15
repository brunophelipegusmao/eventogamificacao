import type { Metadata } from "next";
import { requireSession } from "@/lib/session";
import { AdminSettingsView } from "@/components/admin/settings-view";

export const metadata: Metadata = {
  title: "Configurações | Painel Admin",
};

export default async function AdminSettingsPage() {
  await requireSession("admin");
  return <AdminSettingsView />;
}
