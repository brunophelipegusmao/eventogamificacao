"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { PointAdjustmentForm } from "@/components/admin/point-adjustment-form";
import { Button } from "@/components/ui/button";

type Participant = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  instagram: string | null;
  totalPoints: number;
  createdAt: string;
};

export function AdminParticipantsView() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/dashboard");
    const data = await res.json();
    const sorted = [...(data.participants ?? [])].sort(
      (a: Participant, b: Participant) => b.totalPoints - a.totalPoints,
    );
    setParticipants(sorted);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-orbitron text-xl font-bold sm:text-2xl">
          Participantes
        </h1>
        <p className="text-sm text-muted-foreground">
          {participants.length} participantes cadastrados
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        {loading ? (
          <p className="p-4 text-sm text-muted-foreground">Carregando...</p>
        ) : participants.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            Nenhum participante cadastrado.
          </p>
        ) : (
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">WhatsApp</th>
                <th className="px-4 py-3 font-medium">Instagram</th>
                <th className="px-4 py-3 text-right font-medium">Pontos</th>
                <th className="px-4 py-3 text-right font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {participants.map((p) => (
                <Fragment key={p.id}>
                  <tr className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.email}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.phone ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.instagram ? (
                        <span className="text-primary">@{p.instagram}</span>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-primary">
                      {p.totalPoints}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setAdjustingId((prev) =>
                            prev === p.id ? null : p.id,
                          )
                        }
                      >
                        Ajustar pontos
                      </Button>
                    </td>
                  </tr>
                  {adjustingId === p.id && (
                    <tr>
                      <td colSpan={6} className="px-4 py-3">
                        <PointAdjustmentForm
                          userId={p.id}
                          onAdjusted={async () => {
                            setAdjustingId(null);
                            await load();
                          }}
                          onCancel={() => setAdjustingId(null)}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
