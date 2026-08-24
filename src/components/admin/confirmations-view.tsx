"use client";

import { Check, ExternalLink, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type PendingCompletion = {
  id: string;
  taskId: string;
  userId: string;
  status: "pending";
  payload: Record<string, unknown> | null;
  createdAt: string;
};

type TaskInfo = { id: string; title: string; points: number };
type UserInfo = {
  id: string;
  name: string;
  email: string;
  instagram: string | null;
};

export function AdminConfirmationsView() {
  const [completions, setCompletions] = useState<PendingCompletion[]>([]);
  const [tasks, setTasks] = useState<Record<string, TaskInfo>>({});
  const [users, setUsers] = useState<Record<string, UserInfo>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [cRes, tRes, uRes] = await Promise.all([
      fetch("/api/admin/completions"),
      fetch("/api/admin/tasks"),
      fetch("/api/admin/dashboard"),
    ]);
    const cData = await cRes.json();
    const tData = await tRes.json();
    const dData = await uRes.json();

    setCompletions(cData.completions ?? []);
    setTasks(
      Object.fromEntries((tData.tasks ?? []).map((t: TaskInfo) => [t.id, t])),
    );
    setUsers(
      Object.fromEntries(
        (dData.participants ?? []).map((u: UserInfo) => [u.id, u]),
      ),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 20_000);
    return () => clearInterval(id);
  }, [load]);

  async function decide(id: string, decision: "approved" | "rejected") {
    setBusyId(id);
    await fetch(`/api/admin/completions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    setBusyId(null);
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-orbitron text-xl font-bold sm:text-2xl">
          Confirmações
        </h1>
        <p className="text-sm text-muted-foreground">
          Aprove ou rejeite os pontos solicitados pelos participantes.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 font-semibold">
          Pendentes ({completions.length})
        </div>
        {loading ? (
          <p className="p-4 text-sm text-muted-foreground">Carregando...</p>
        ) : completions.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            Nenhuma confirmação pendente. 🎉
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {completions.map((c) => {
              const task = tasks[c.taskId];
              const user = users[c.userId];
              const payloadUrl =
                c.payload && typeof c.payload.print === "string"
                  ? c.payload.print
                  : null;
              return (
                <li
                  key={c.id}
                  className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {user?.name ?? "Participante"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {user?.email ?? ""}
                      {user?.instagram ? ` · @${user.instagram}` : ""}
                    </p>
                    <p className="mt-2 text-sm">
                      <span className="font-medium">
                        {task?.title ?? "Tarefa"}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        · {task?.points ?? 0} pts
                      </span>
                    </p>
                    {payloadUrl && (
                      <a
                        href={payloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="size-3.5" />
                        Ver comprovante
                      </a>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      disabled={busyId === c.id}
                      onClick={() => decide(c.id, "approved")}
                    >
                      <Check className="size-4" /> Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === c.id}
                      onClick={() => decide(c.id, "rejected")}
                    >
                      <X className="size-4" /> Rejeitar
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
