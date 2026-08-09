"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@base-ui/react/input";
import { FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Download,
  Flag,
  Trophy,
  Users,
  CheckCircle2,
  Clock,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Activity = {
  taskId: string;
  taskTitle: string;
  taskType: string | null;
  status: "approved" | "pending" | "rejected";
  pointsAwarded: number;
  payload: Record<string, unknown> | null;
  adminNote: string | null;
  createdAt: string;
};

type Participant = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  instagram: string | null;
  totalPoints: number;
  rank: number;
  activities: Activity[];
};

type Prize = {
  id: string;
  name: string;
  description: string | null;
  placement: number;
  active: boolean;
};

type Winner = {
  id: string;
  userId: string;
  rank: number;
  totalPoints: number;
  prizeName: string | null;
};

type ReportData = {
  event: { status: "open" | "closed"; closedAt: string | null } | null;
  ranking: Participant[];
  participants: Participant[];
  totalParticipants: number;
  totalPoints: number;
  approvedCount: number;
  pendingCount: number;
  tasks: { id: string; title: string; type: string; points: number; approved: number; totalAttempts: number; rate: number }[];
  prizes: Prize[];
  winners: Winner[];
};

export function ReportView() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prizeName, setPrizeName] = useState("");
  const [prizeDesc, setPrizeDesc] = useState("");
  const [prizePlacement, setPrizePlacement] = useState(1);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/report");
    const d = await res.json();
    setData(d);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function endEvent() {
    if (
      !confirm(
        "Encerrar o evento? O ranking será congelado e os vencedores determinados. Esta ação não pode ser desfeita."
      )
    )
      return;
    setEnding(true);
    setError(null);
    const res = await fetch("/api/admin/event/end", { method: "POST" });
    const d = await res.json();
    setEnding(false);
    if (!res.ok) {
      setError(d.error ?? "Erro ao encerrar evento");
      return;
    }
    load();
  }

  async function downloadPdf() {
    const res = await fetch("/api/admin/report/pdf");
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "relatorio-evento-jm.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function addPrize(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/prizes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: prizeName,
        description: prizeDesc || undefined,
        placement: prizePlacement,
      }),
    });
    setPrizeName("");
    setPrizeDesc("");
    setPrizePlacement(1);
    load();
  }

  async function togglePrize(p: Prize) {
    await fetch(`/api/admin/prizes/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !p.active }),
    });
    load();
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando relatório...</p>;
  }
  if (!data) return null;

  const isClosed = data.event?.status === "closed";

  const stats = [
    { label: "Participantes", value: data.totalParticipants, icon: Users },
    { label: "Pontos emitidos", value: data.totalPoints, icon: Trophy },
    { label: "Tarefas concluídas", value: data.approvedCount, icon: CheckCircle2 },
    { label: "Pendentes", value: data.pendingCount, icon: Clock },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-orbitron text-xl font-bold sm:text-2xl">
            Relatório do evento
          </h1>
          <p className="text-sm text-muted-foreground">
            Resultados, vencedores e exportação em PDF.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={downloadPdf}>
            <Download className="size-4" /> Baixar PDF
          </Button>
          {!isClosed ? (
            <Button
              variant="destructive"
              onClick={endEvent}
              disabled={ending}
            >
              <Flag className="size-4" />
              {ending ? "Encerrando..." : "Encerrar evento"}
            </Button>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-2 text-sm font-medium text-emerald-400">
              <Crown className="size-4" /> Evento encerrado
            </span>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* ===== Resumo ===== */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="rounded-xl border border-border bg-card p-4"
            >
              <Icon className="mb-3 size-5 text-primary" />
              <p className="text-2xl font-bold sm:text-3xl">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* ===== Vencedores ===== */}
      {isClosed && (
        <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 sm:p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <Crown className="size-5 text-primary" /> Vencedores
          </h2>
          {data.winners.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum vencedor determinado (verifique as colocações premiáveis).
            </p>
          ) : (
            <ul className="space-y-2">
              {data.winners.map((w) => {
                const user = data.ranking.find((p) => p.id === w.userId);
                return (
                  <li
                    key={w.id}
                    className="flex items-center justify-between rounded-lg bg-card px-3 py-2 text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-bold text-primary">{w.rank}º</span>
                      <span className="font-medium">{user?.name ?? "Participante"}</span>
                    </span>
                    <span className="text-muted-foreground">
                      🏆 {w.prizeName} · {w.totalPoints} pts
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* ===== Colocações premiáveis ===== */}
      <form
        onSubmit={addPrize}
        className="rounded-xl border border-border bg-card p-4 sm:p-5"
      >
        <h2 className="mb-1 font-semibold">Colocações premiáveis</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Defina até qual colocação cada prêmio cobre. Os vencedores são
          determinados ao encerrar o evento.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <FieldGroup>
            <FieldLabel htmlFor="r-name">Nome do prêmio</FieldLabel>
            <Input
              id="r-name"
              required
              value={prizeName}
              onChange={(e) => setPrizeName(e.target.value)}
              placeholder="Ex.: Kit Suplementos"
              className="h-10 w-full rounded-lg border-border bg-background px-3"
            />
          </FieldGroup>
          <FieldGroup>
            <FieldLabel htmlFor="r-desc">Descrição</FieldLabel>
            <Input
              id="r-desc"
              value={prizeDesc}
              onChange={(e) => setPrizeDesc(e.target.value)}
              placeholder="Detalhe do prêmio"
              className="h-10 w-full rounded-lg border-border bg-background px-3"
            />
          </FieldGroup>
          <FieldGroup>
            <FieldLabel htmlFor="r-place">Até a colocação</FieldLabel>
            <Input
              id="r-place"
              type="number"
              min={1}
              required
              value={prizePlacement}
              onChange={(e) => setPrizePlacement(Number(e.target.value))}
              className="h-10 w-full rounded-lg border-border bg-background px-3"
            />
          </FieldGroup>
        </div>
        <Button type="submit" className="mt-4">
          Adicionar prêmio
        </Button>

        {data.prizes.length > 0 && (
          <ul className="mt-4 space-y-2">
            {data.prizes.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm"
              >
                <span>
                  <span className="font-medium">{p.name}</span>
                  <span className="ml-2 text-muted-foreground">
                    até {p.placement}º lugar
                  </span>
                </span>
                <Button variant="ghost" size="sm" onClick={() => togglePrize(p)}>
                  {p.active ? "Desativar" : "Ativar"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </form>

      {/* ===== Ranking ===== */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 font-semibold">
          Ranking ({data.totalParticipants})
        </div>
        <ul className="divide-y divide-border">
          {data.ranking.map((p) => {
            const w = data.winners.find((x) => x.userId === p.id);
            return (
              <li
                key={p.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    p.rank <= 3
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {p.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.name}</p>
                  {w && (
                    <p className="truncate text-xs text-muted-foreground">
                      🏆 {w.prizeName}
                    </p>
                  )}
                </div>
                <span className="font-bold text-primary">{p.totalPoints} pts</span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ===== Detalhe por participante ===== */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 font-semibold">
          Atividades e respostas por participante
        </div>
        <div className="divide-y divide-border">
          {data.participants.map((p) => (
            <div key={p.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.email}
                    {p.phone ? ` · ${p.phone}` : ""}
                    {p.instagram ? ` · @${p.instagram}` : ""}
                  </p>
                </div>
                <span className="font-bold text-primary">{p.totalPoints} pts</span>
              </div>
              {p.activities.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Nenhuma atividade registrada.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {p.activities.map((a, i) => (
                    <li
                      key={i}
                      className="rounded-lg bg-muted/30 px-3 py-2 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{a.taskTitle}</span>
                        <span
                          className={cn(
                            "text-xs",
                            a.status === "approved"
                              ? "text-emerald-400"
                              : a.status === "pending"
                                ? "text-amber-400"
                                : "text-destructive"
                          )}
                        >
                          {a.status === "approved"
                            ? `Concluída (+${a.pointsAwarded} pts)`
                            : a.status === "pending"
                              ? "Pendente"
                              : "Rejeitada"}
                        </span>
                      </div>
                      {a.payload && Object.keys(a.payload).length > 0 && (
                        <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                          {Object.entries(a.payload).map(([k, v]) => (
                            <p key={k}>
                              <span className="text-foreground/70">{k}:</span>{" "}
                              {typeof v === "boolean"
                                ? v
                                  ? "Sim"
                                  : "Não"
                                : String(v)}
                            </p>
                          ))}
                        </div>
                      )}
                      {a.adminNote && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Nota: {a.adminNote}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
