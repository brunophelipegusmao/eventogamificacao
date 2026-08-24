"use client";

import { Crown, Medal, PartyPopper, Trophy } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type RankRow = {
  id: string;
  name: string;
  totalPoints: number;
  rank: number;
};

type Prize = {
  id: string;
  name: string;
  description: string | null;
  placement: number;
};

type Winner = {
  userId: string;
  prizeName: string | null;
};

type RankingData = {
  ranking: RankRow[];
  me: RankRow | null;
  totalParticipants: number;
  prizes: Prize[];
  eventClosed: boolean;
  winners: Winner[];
};

export function RankingView() {
  const [data, setData] = useState<RankingData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/participant/ranking");
    const d = await res.json();
    setData(d);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">Carregando ranking...</p>
    );
  }

  if (!data) return null;

  const { ranking, me, prizes, eventClosed, winners } = data;
  const winnerByUser = new Map(winners.map((w) => [w.userId, w]));

  const rankIcon = (rank: number) =>
    rank === 1 ? (
      <Crown className="size-5 text-amber-400" />
    ) : rank === 2 ? (
      <Medal className="size-5 text-slate-300" />
    ) : rank === 3 ? (
      <Medal className="size-5 text-amber-700" />
    ) : (
      <span className="text-sm font-bold text-muted-foreground">{rank}º</span>
    );

  const prizeForRank = (rank: number) =>
    prizes.find((p) => rank <= p.placement);

  return (
    <div className="space-y-4">
      {eventClosed && (
        <div className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3">
          <PartyPopper className="size-5 shrink-0 text-primary" />
          <p className="text-sm font-medium">
            🏆 Evento encerrado — este é o placar final!
          </p>
        </div>
      )}

      {me && (
        <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 sm:p-5">
          <p className="text-sm text-muted-foreground">Sua colocação</p>
          <div className="mt-1 flex items-end justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="size-6 text-primary" />
              <span className="font-orbitron text-3xl font-bold text-primary glow-gold">
                {me.rank}º
              </span>
              <span className="text-sm text-muted-foreground">
                de {data.totalParticipants} participantes
              </span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{me.totalPoints} pts</p>
            </div>
          </div>
          {eventClosed
            ? winnerByUser.get(me.id) && (
                <p className="mt-2 text-sm text-muted-foreground">
                  🎁 Você ganhou:{" "}
                  <span className="font-medium text-foreground">
                    {winnerByUser.get(me.id)?.prizeName}
                  </span>
                </p>
              )
            : prizeForRank(me.rank) && (
                <p className="mt-2 text-sm text-muted-foreground">
                  🎁 Prêmio atual:{" "}
                  <span className="font-medium text-foreground">
                    {prizeForRank(me.rank)?.name}
                  </span>
                </p>
              )}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 font-semibold">
          Ranking geral
        </div>
        {ranking.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            Ainda não há participantes.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {ranking.map((p) => (
              <li
                key={p.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3",
                  me?.id === p.id && "bg-primary/5",
                )}
              >
                <span className="flex size-8 shrink-0 items-center justify-center">
                  {rankIcon(p.rank)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.name}</p>
                  {me?.id === p.id && (
                    <p className="text-xs text-primary">Você</p>
                  )}
                  {eventClosed && winnerByUser.get(p.id) && (
                    <p className="truncate text-xs text-muted-foreground">
                      🏆 {winnerByUser.get(p.id)?.prizeName}
                    </p>
                  )}
                </div>
                <span className="font-bold text-primary">
                  {p.totalPoints} pts
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
