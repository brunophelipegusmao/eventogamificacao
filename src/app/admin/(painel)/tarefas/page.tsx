import type { Metadata } from "next";
import { requireSession } from "@/lib/session";
import { AdminTasksView } from "@/components/admin/tasks-view";

export const metadata: Metadata = {
  title: "Tarefas | Painel Admin",
};

export default async function AdminTasksPage() {
  await requireSession("admin");
  return <AdminTasksView />;
}
