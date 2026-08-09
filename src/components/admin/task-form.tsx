"use client";

import { Input } from "@base-ui/react/input";
import { CheckSquare, Plus, Trash2, Type } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldGroup, FieldLabel } from "@/components/ui/field";

type ConfirmationType = "automatic" | "qr_code" | "admin";
type TaskType = "checkin" | "form" | "qr_code" | "social";
type FieldType = "text" | "checkbox";

const TYPE_LABELS: Record<TaskType, string> = {
  checkin: "Check-in",
  form: "Formulário",
  qr_code: "QR Code",
  social: "Rede social",
};

type FormField = {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
};

export function TaskForm({ onCreated }: { onCreated: () => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TaskType>("checkin");
  const [confirmation, setConfirmation] =
    useState<ConfirmationType>("automatic");
  const [points, setPoints] = useState(10);
  const [qrSecret, setQrSecret] = useState("");
  const [fields, setFields] = useState<FormField[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function addField() {
    setFields((prev) => [
      ...prev,
      {
        key: `campo_${Date.now()}_${prev.length}`,
        label: "",
        type: "text",
        required: false,
      },
    ]);
  }

  function updateField(index: number, patch: Partial<FormField>) {
    setFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...patch } : f)),
    );
  }

  function removeField(index: number) {
    setFields((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (type === "form") {
      const validFields = fields.filter((f) => f.label.trim() !== "");
      if (validFields.length === 0) {
        setError("Adicione ao menos um campo ao formulário.");
        return;
      }
    }

    setLoading(true);

    const config: Record<string, unknown> = {};
    if (confirmation === "qr_code") {
      config.qr = qrSecret.trim();
    }
    if (type === "form") {
      config.fields = fields
        .filter((f) => f.label.trim() !== "")
        .map((f) => ({
          key: f.key,
          label: f.label.trim(),
          type: f.type,
          required: f.required,
        }));
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
    setFields([]);
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

      {/* ===== Editor de campos do formulário ===== */}
      {type === "form" && (
        <div className="mt-5 rounded-lg border border-border bg-muted/20 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Campos do formulário</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addField}
            >
              <Plus className="size-4" /> Adicionar campo
            </Button>
          </div>

          {fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum campo adicionado. Clique em "Adicionar campo" para criar
              perguntas de texto ou checkbox.
            </p>
          ) : (
            <ul className="space-y-3">
              {fields.map((field, index) => (
                <li
                  key={field.key}
                  className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center"
                >
                  <Input
                    value={field.label}
                    onChange={(e) =>
                      updateField(index, { label: e.target.value })
                    }
                    placeholder="Pergunta / rótulo do campo"
                    className="h-9 flex-1 rounded-lg border-border bg-background px-3"
                  />

                  <div className="flex items-center gap-2">
                    <select
                      value={field.type}
                      onChange={(e) =>
                        updateField(index, {
                          type: e.target.value as FieldType,
                        })
                      }
                      className="h-9 rounded-lg border-border bg-background px-2 text-sm"
                    >
                      <option value="text">Texto</option>
                      <option value="checkbox">Checkbox</option>
                    </select>

                    <label className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) =>
                          updateField(index, { required: e.target.checked })
                        }
                        className="size-4 accent-primary"
                      />
                      Obrigatório
                    </label>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeField(index)}
                      aria-label="Remover campo"
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Type className="size-3.5" /> Texto: resposta livre digitada
            </span>
            <span className="inline-flex items-center gap-1">
              <CheckSquare className="size-3.5" /> Checkbox: marcar sim/não
            </span>
          </div>
        </div>
      )}

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
