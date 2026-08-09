"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@base-ui/react/input";
import { FieldGroup, FieldLabel } from "@/components/ui/field";

type ConfirmationType = "automatic" | "qr_code" | "admin";
type TaskType = "checkin" | "form" | "qr_code" | "social";

const TYPE_LABELS: Record<TaskType, string> = {
  checkin: "Check-in",
  form: "Formulário",
  qr_code: "QR Code",
  social: "Rede social",
};

export function TaskForm({
  onCreated,
}: {
  onCreated: () => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TaskType>("checkin");
  const [confirmation, setConfirmation] =
    useState<ConfirmationType>("automatic");
  const [points, setPoints] = useState(10);
  const [qrSecret, setQrSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const config: Record<string, unknown> = {};
    if (confirmation === "qr_code") {
      config.qr = qrSecret.trim();
    }

    const res = await fetch("/api/admin/tasks/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        type,
        confirmation,
        points,
        config,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Erro ao criar tarefa");
      setLoading(false);
      return;
    }

    setTitle("");
    setDescription("");
    setType("checkin");
    setConfirmation("automatic");
    setPoints(10);
    setQrSecret("");
    await onCreated();
    setLoading(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-card p-4 sm:p-5"
    >
      <h2 className="mb-4 font-semibold">Nova tarefa</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup className="sm:col-span-2">
          <FieldLabel htmlFor="t-title">Título</FieldLabel>
          <Input
            id="t-title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: Post nos stories"
            className="h-10 w-full rounded-lg border-border bg-background px-3"
          />
        </FieldGroup>

        <FieldGroup className="sm:col-span-2">
          <FieldLabel htmlFor="t-desc">Descrição</FieldLabel>
          <Input
            id="t-desc"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explique como o participante completa a tarefa"
            className="h-10 w-full rounded-lg border-border bg-background px-3"
          />
        </FieldGroup>

        <FieldGroup>
          <FieldLabel htmlFor="t-type">Tipo da tarefa</FieldLabel>
          <select
            id="t-type"
            value={type}
            onChange={(e) => setType(e.target.value as TaskType)}
            className="h-10 w-full rounded-lg border-border bg-background px-3 text-sm"
          >
            {(Object.keys(TYPE_LABELS) as TaskType[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </FieldGroup>

        <FieldGroup>
          <FieldLabel htmlFor="t-conf">Confirmação</FieldLabel>
          <select
            id="t-conf"
            value={confirmation}
            onChange={(e) =>
              setConfirmation(e.target.value as ConfirmationType)
            }
            className="h-10 w-full rounded-lg border-border bg-background px-3 text-sm"
          >
            <option value="automatic">Automática</option>
            <option value="qr_code">QR Code</option>
            <option value="admin">Confirmação do admin</option>
          </select>
        </FieldGroup>

        <FieldGroup>
          <FieldLabel htmlFor="t-points">Pontos</FieldLabel>
          <Input
            id="t-points"
            type="number"
            min={0}
            required
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            className="h-10 w-full rounded-lg border-border bg-background px-3"
          />
        </FieldGroup>

        {confirmation === "qr_code" && (
          <FieldGroup>
            <FieldLabel htmlFor="t-qr">Segredo do QR Code</FieldLabel>
            <Input
              id="t-qr"
              required
              value={qrSecret}
              onChange={(e) => setQrSecret(e.target.value)}
              placeholder="Ex.: GAMIF-2026-ABCD"
              className="h-10 w-full rounded-lg border-border bg-background px-3"
            />
            <p className="text-xs text-muted-foreground">
              Os participantes escaneiam o QR que contém este código.
            </p>
          </FieldGroup>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" disabled={loading} className="mt-4">
        {loading ? "Criando..." : "Criar tarefa"}
      </Button>
    </form>
  );
}
