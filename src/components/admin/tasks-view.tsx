"use client";

import { useCallback, useEffect, useState } from "react";
import { TaskForm } from "@/components/admin/task-form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TaskRow = {
  id: string;
  title: string;
  description: string;
  type: string;
  confirmation: string;
  points: number;
  status: "active" | "inactive";
  config: Record<string, unknown> | null;
  createdAt: string;
};

const CONFIRMATION_LABELS: Record<string, string> = {
  automatic: "Automática",
  qr_code: "QR Code",
  admin: "Admin",
};

const TYPE_BADGE: Record<string, string> = {
  checkin: "bg-sky-500/15 text-sky-400",
  form: "bg-violet-500/15 text-violet-400",
  qr_code: "bg-amber-500/15 text-amber-400",
  social: "bg-emerald-500/15 text-emerald-400",
};

export function AdminTasksView() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/tasks");
    const data = await res.json();
    setTasks(data.tasks ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleStatus(task: TaskRow) {
    const next = task.status === "active" ? "inactive" : "active";
    await fetch(`/api/admin/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-orbitron text-xl font-bold sm:text-2xl">Tarefas</h1>
        <p className="text-sm text-muted-foreground">
          Crie tarefas com confirmação automática, QR Code ou manual (admin).
        </p>
      </div>

      <TaskForm onCreated={load} />

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 font-semibold">
          Tarefas cadastradas ({tasks.length})
        </div>
        {loading ? (
          <p className="p-4 text-sm text-muted-foreground">Carregando...</p>
        ) : tasks.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            Nenhuma tarefa cadastrada ainda.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {tasks.map((t) => (
              <li
                key={t.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{t.title}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        TYPE_BADGE[t.type] ?? "bg-muted text-muted-foreground"
                      )}
                    >
                      {t.type}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs",
                        t.status === "active"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {t.status === "active" ? "Ativa" : "Inativa"}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {t.description}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {CONFIRMATION_LABELS[t.confirmation] ?? t.confirmation} ·{" "}
                    {t.points} pts
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleStatus(t)}
                >
                  {t.status === "active" ? "Desativar" : "Ativar"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
