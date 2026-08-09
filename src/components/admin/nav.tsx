"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ListChecks,
  Inbox,
  Trophy,
  Users,
} from "lucide-react";

const items = [
  { href: "/admin", label: "Visão geral", icon: LayoutDashboard },
  { href: "/admin/tarefas", label: "Tarefas", icon: ListChecks },
  { href: "/admin/confirmacoes", label: "Confirmações", icon: Inbox },
  { href: "/admin/ranking", label: "Ranking", icon: Trophy },
  { href: "/admin/participantes", label: "Participantes", icon: Users },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/admin" && pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
