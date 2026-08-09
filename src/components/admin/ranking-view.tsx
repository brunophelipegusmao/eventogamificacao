"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@base-ui/react/input";
import { FieldGroup, FieldLabel } from "@/components/ui/field";
import { Medal, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

type Participant = {
  id: string;
  name: string;
  totalPoints: number;
  rank?: number;
};

type Prize = {
  id: string;
  name: string;
  description: string | null;
  placement: number;
  active: boolean;
};

export function AdminRankingView() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [prizeName, setPrizeName] = useState("");
  const [prizeDesc, setPrizeDesc] = useState("");
  const [prizePlacement, setPrizePlacement] = useState(1);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/dashboard");
    const data = await res.json();
    // ordena por pontos desc e computa rank
    const sorted = [...(data.participants ?? [])].sort(
      (a: Participant, b: Participant) => b.totalPoints - a.totalPoints
    );
    let rank = 0;
    let last: number | null = null;
    const ranked = sorted.map((p: Participant, i: number) => {
      if (p.totalPoints !== last) {
        rank = i + 1;
        last = p.totalPoints;
      }
      return { ...p, rank };
    });
    setParticipants(ranked);
    setPrizes(data.prizes ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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

  const medalFor = (rank: number) =>
    rank === 1 ? (
      <Crown className="size-5 text-amber-400" />
    ) : rank === 2 ? (
      <Medal className="size-5 text-slate-300" />
    ) : rank === 3 ? (
      <Medal className="size-5 text-amber-700" />
    ) : null;

  const prizeForRank = (rank: number) =>
    prizes.find((p) => p.active && rank <= p.placement);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-orbitron text-xl font-bold sm:text-2xl">Ranking</h1>
        <p className="text-sm text-muted-foreground">
          Classificação em tempo real. Defina os prêmios por colocação abaixo.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 font-semibold">
          Classificação ({participants.length} participantes)
        </div>
        {loading ? (
          <p className="p-4 text-sm text-muted-foreground">Carregando...</p>
        ) : participants.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            Nenhum participante cadastrado.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {participants.map((p) => {
              const prize = prizeForRank(p.rank ?? 99);
              return (
                <li
                  key={p.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                      (p.rank ?? 0) <= 3
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {medalFor(p.rank ?? 0) ?? p.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.name}</p>
                    {prize && (
                      <p className="truncate text-xs text-muted-foreground">
                        🎁 {prize.name}
                      </p>
                    )}
                  </div>
                  <span className="font-bold text-primary">
                    {p.totalPoints} pts
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <form
        onSubmit={addPrize}
        className="rounded-xl border border-border bg-card p-4 sm:p-5"
      >
        <h2 className="mb-4 font-semibold">Definir premiação</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <FieldGroup>
            <FieldLabel htmlFor="p-name">Nome do prêmio</FieldLabel>
            <Input
              id="p-name"
              required
              value={prizeName}
              onChange={(e) => setPrizeName(e.target.value)}
              placeholder="Ex.: Kit Suplementos"
              className="h-10 w-full rounded-lg border-border bg-background px-3"
            />
          </FieldGroup>
          <FieldGroup>
            <FieldLabel htmlFor="p-desc">Descrição</FieldLabel>
            <Input
              id="p-desc"
              value={prizeDesc}
              onChange={(e) => setPrizeDesc(e.target.value)}
              placeholder="Detalhe do prêmio"
              className="h-10 w-full rounded-lg border-border bg-background px-3"
            />
          </FieldGroup>
          <FieldGroup>
            <FieldLabel htmlFor="p-place">Até a colocação</FieldLabel>
            <Input
              id="p-place"
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

        {prizes.length > 0 && (
          <div className="mt-5">
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
              Prêmios definidos
            </h3>
            <ul className="space-y-2">
              {prizes.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm"
                >
                  <div>
                    <span className="font-medium">{p.name}</span>
                    <span className="ml-2 text-muted-foreground">
                      até {p.placement}º lugar
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePrize(p)}
                  >
                    {p.active ? "Desativar" : "Ativar"}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </form>
    </div>
  );
}
