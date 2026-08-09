"use client";

import { Input } from "@base-ui/react/input";
import { CheckCircle2, Clock, QrCode, Send, Trophy } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type Completion = {
  id: string;
  status: "pending" | "approved" | "rejected";
  payload: Record<string, unknown> | null;
  pointsAwarded: number;
};

type FormField = {
  key: string;
  label: string;
  type: "text" | "checkbox";
  required?: boolean;
};

type TaskItem = {
  id: string;
  title: string;
  description: string;
  type: "checkin" | "form" | "qr_code" | "social";
  confirmation: "automatic" | "qr_code" | "admin";
  points: number;
  config: { fields?: FormField[] } | null;
  completion: Completion | null;
};

const TYPE_ICON: Record<string, typeof QrCode> = {
  checkin: CheckCircle2,
  form: Send,
  qr_code: QrCode,
  social: Trophy,
};

export function ParticipantTasksView() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [formData, setFormData] = useState<
    Record<string, Record<string, string | boolean>>
  >({});
  const [qrInput, setQrInput] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{
    id: string;
    text: string;
    error?: boolean;
  } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/participant/tasks");
    const data = await res.json();
    setTasks(data.tasks ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function completeAutomatic(task: TaskItem) {
    setBusyId(task.id);
    setMessage(null);
    const payload = task.type === "form" ? (formData[task.id] ?? {}) : {};
    const res = await fetch("/api/participant/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: task.id, payload }),
    });
    const data = await res.json();
    setBusyId(null);
    setMessage({
      id: task.id,
      text: data.error ?? `+${data.points} pontos!`,
      error: !!data.error,
    });
    if (res.ok) load();
  }

  async function submitForAdmin(task: TaskItem) {
    setBusyId(task.id);
    setMessage(null);
    const res = await fetch("/api/participant/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: task.id,
        payload: { print: formData[task.id] ?? {} },
      }),
    });
    const data = await res.json();
    setBusyId(null);
    setMessage({
      id: task.id,
      text: data.error ?? data.message ?? "Enviado!",
      error: !!data.error,
    });
    if (res.ok) load();
  }

  async function submitQr(task: TaskItem) {
    setBusyId(task.id);
    setMessage(null);
    const res = await fetch("/api/participant/qr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: task.id, qr: qrInput[task.id] ?? "" }),
    });
    const data = await res.json();
    setBusyId(null);
    setMessage({
      id: task.id,
      text: data.error ?? `+${data.points} pontos!`,
      error: !!data.error,
    });
    if (res.ok) load();
  }

  function renderAction(task: TaskItem) {
    if (task.completion) {
      const c = task.completion;
      if (c.status === "approved") {
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-medium text-emerald-400">
            <CheckCircle2 className="size-4" /> Concluída (+{c.pointsAwarded}{" "}
            pts)
          </span>
        );
      }
      if (c.status === "pending") {
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-sm font-medium text-amber-400">
            <Clock className="size-4" /> Aguardando confirmação
          </span>
        );
      }
      return (
        <span className="rounded-full bg-destructive/15 px-3 py-1 text-sm font-medium text-destructive">
          Rejeitada
        </span>
      );
    }

    if (task.confirmation === "automatic") {
      return (
        <div className="space-y-3">
          {task.type === "form" && (
            <div className="space-y-3">
              {(task.config?.fields ?? []).map((f) => (
                <div key={f.key}>
                  {f.type === "checkbox" ? (
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean(formData[task.id]?.[f.key])}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            [task.id]: {
                              ...(prev[task.id] ?? {}),
                              [f.key]: e.target.checked,
                            },
                          }))
                        }
                        className="size-4 accent-primary"
                      />
                      {f.label}
                      {f.required && (
                        <span className="text-destructive">*</span>
                      )}
                    </label>
                  ) : (
                    <div>
                      <FieldLabel
                        htmlFor={`f-${task.id}-${f.key}`}
                        className="text-xs"
                      >
                        {f.label}
                        {f.required && (
                          <span className="text-destructive"> *</span>
                        )}
                      </FieldLabel>
                      <Input
                        id={`f-${task.id}-${f.key}`}
                        required={f.required}
                        value={String(formData[task.id]?.[f.key] ?? "")}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            [task.id]: {
                              ...(prev[task.id] ?? {}),
                              [f.key]: e.target.value,
                            },
                          }))
                        }
                        className="mt-1 h-10 w-full rounded-lg border-border bg-background px-3"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <Button
            size="sm"
            disabled={busyId === task.id}
            onClick={() => completeAutomatic(task)}
          >
            {task.type === "checkin" ? "Fazer check-in" : "Enviar"}
          </Button>
        </div>
      );
    }

    if (task.confirmation === "qr_code") {
      return (
        <div className="space-y-3">
          <Input
            placeholder="Digite ou escaneie o código do QR"
            value={qrInput[task.id] ?? ""}
            onChange={(e) =>
              setQrInput((prev) => ({ ...prev, [task.id]: e.target.value }))
            }
            className="h-10 w-full max-w-xs rounded-lg border-border bg-background px-3"
          />
          <Button
            size="sm"
            disabled={busyId === task.id || !qrInput[task.id]}
            onClick={() => submitQr(task)}
          >
            <QrCode className="size-4" /> Validar QR
          </Button>
        </div>
      );
    }

    // admin
    return (
      <div className="space-y-3">
        <Input
          placeholder="Cole o link/print do comprovante"
          value={formData[task.id] ?? ""}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, [task.id]: e.target.value }))
          }
          className="h-10 w-full max-w-xs rounded-lg border-border bg-background px-3"
        />
        <Button
          size="sm"
          disabled={busyId === task.id || !formData[task.id]}
          onClick={() => submitForAdmin(task)}
        >
          <Send className="size-4" /> Enviar para confirmação
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando tarefas...</p>
      ) : (
        tasks.map((task) => {
          const Icon = TYPE_ICON[task.type] ?? CheckCircle2;
          return (
            <div
              key={task.id}
              className="rounded-xl border border-border bg-card p-4 sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-lg",
                      task.completion?.status === "approved"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{task.title}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {task.description}
                    </p>
                    <p className="mt-1 text-xs font-medium text-primary">
                      +{task.points} pts
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                {renderAction(task)}
                {message?.id === task.id && (
                  <p
                    className={cn(
                      "text-sm",
                      message.error ? "text-destructive" : "text-emerald-400",
                    )}
                  >
                    {message.text}
                  </p>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
