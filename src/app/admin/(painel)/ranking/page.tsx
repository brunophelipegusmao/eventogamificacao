import type { Metadata } from "next";
import { requireSession } from "@/lib/session";
import { AdminRankingView } from "@/components/admin/ranking-view";

export const metadata: Metadata = {
  title: "Ranking | Painel Admin",
};

export default async function AdminRankingPage() {
  await requireSession("admin");
  return <AdminRankingView />;
}
