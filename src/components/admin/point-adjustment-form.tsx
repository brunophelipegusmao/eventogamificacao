"use client";

import { Input } from "@base-ui/react/input";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldGroup, FieldLabel } from "@/components/ui/field";

export function PointAdjustmentForm({
  userId,
  onAdjusted,
  onCancel,
}: {
  userId: string;
  onAdjusted: () => Promise<void>;
  onCancel: () => void;
}) {
  const [points, setPoints] = useState(0);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!points) {
      setError("Informe um valor de pontos diferente de zero.");
      return;
    }
    if (!reason.trim()) {
      setError("Informe uma justificativa.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/admin/point-adjustments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, points, reason: reason.trim() }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Erro ao ajustar pontos");
      setLoading(false);
      return;
    }

    setPoints(0);
    setReason("");
    await onAdjusted();
    setLoading(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-3 sm:flex-row sm:items-end"
    >
      <FieldGroup className="sm:w-32">
        <FieldLabel htmlFor={`pa-points-${userId}`}>Pontos (+/-)</FieldLabel>
        <Input
          id={`pa-points-${userId}`}
          type="number"
          required
          value={points}
          onChange={(e) => setPoints(Number(e.target.value))}
          className="h-9 w-full rounded-lg border-border bg-background px-3"
        />
      </FieldGroup>

      <FieldGroup className="sm:flex-1">
        <FieldLabel htmlFor={`pa-reason-${userId}`}>Justificativa</FieldLabel>
        <Input
          id={`pa-reason-${userId}`}
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ex.: check-in do dia 2 não computou os pontos"
          className="h-9 w-full rounded-lg border-border bg-background px-3"
        />
      </FieldGroup>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? "Salvando..." : "Confirmar"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={onCancel}
        >
          Cancelar
        </Button>
      </div>

      {error && (
        <p className="w-full rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive sm:basis-full">
          {error}
        </p>
      )}
    </form>
  );
}
