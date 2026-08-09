import type { Metadata } from "next";
import { requireSession } from "@/lib/session";
import { ReportView } from "@/components/admin/report-view";

export const metadata: Metadata = {
  title: "Relatório | Painel Admin",
};

export default async function AdminReportPage() {
  await requireSession("admin");
  return <ReportView />;
}
