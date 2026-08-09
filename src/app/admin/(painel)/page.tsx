import Link from "next/link";
import { requireSession } from "@/lib/session";
import { db } from "@/db";
import { authUser, completion, prize, task } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import {
  Users,
  Trophy,
  CheckCircle2,
  Clock,
  TrendingUp,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await requireSession("admin");

  const [participants, completions, tasks, prizes] = await Promise.all([
    db
      .select({ id: authUser.id, totalPoints: authUser.totalPoints })
      .from(authUser)
      .where(eq(authUser.role, "participant")),
    db.select().from(completion),
    db
      .select({ id: task.id, title: task.title, status: task.status })
      .from(task),
    db.select().from(prize).where(eq(prize.active, true)),
  ]);

  const totalParticipants = participants.length;
  const approved = completions.filter((c) => c.status === "approved").length;
  const pending = completions.filter((c) => c.status === "pending").length;
  const totalPoints = participants.reduce(
    (acc, p) => acc + (p.totalPoints ?? 0),
    0
  );
  const activeTasks = tasks.filter((t) => t.status === "active").length;

  const stats = [
    {
      label: "Participantes",
      value: totalParticipants,
      icon: Users,
      href: "/admin/participantes",
    },
    {
      label: "Tarefas ativas",
      value: activeTasks,
      icon: TrendingUp,
      href: "/admin/tarefas",
    },
    {
      label: "Tarefas concluídas",
      value: approved,
      icon: CheckCircle2,
      href: "/admin/confirmacoes",
    },
    {
      label: "Aguardando confirmação",
      value: pending,
      icon: Clock,
      href: "/admin/confirmacoes",
    },
    {
      label: "Pontos totais emitidos",
      value: totalPoints,
      icon: Trophy,
      href: "/admin/ranking",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-orbitron text-xl font-bold sm:text-2xl">
          Visão geral
        </h1>
        <p className="text-sm text-muted-foreground">
          Bem-vindo(a), {session.user.name}. Acompanhe o desafio em tempo real.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              href={s.href}
              className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
            >
              <Icon className="mb-3 size-5 text-primary" />
              <p className="text-2xl font-bold sm:text-3xl">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 font-semibold">Taxa de conclusão por tarefa</h2>
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma tarefa criada.</p>
          ) : (
            <ul className="space-y-3">
              {tasks.map((t) => {
                const taskCompletions = completions.filter(
                  (c) => c.taskId === t.id
                );
                const taskApproved = taskCompletions.filter(
                  (c) => c.status === "approved"
                ).length;
                const rate =
                  taskCompletions.length > 0
                    ? Math.round((taskApproved / taskCompletions.length) * 100)
                    : 0;
                return (
                  <li key={t.id}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span>{t.title}</span>
                      <span className="text-muted-foreground">
                        {taskApproved}/{taskCompletions.length} ({rate}%)
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 font-semibold">Prêmios vigentes</h2>
          {prizes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum prêmio definido.</p>
          ) : (
            <ul className="space-y-2">
              {prizes.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm"
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="text-muted-foreground">
                    até {p.placement}º lugar
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/admin/ranking"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            Ver ranking e definir premiações →
          </Link>
        </div>
      </div>
    </div>
  );
}
