"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@base-ui/react/input";
import {
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
      callbackURL: "/admin",
    });

    if (signInError) {
      setError(
        signInError.message ?? "E-mail ou senha inválidos"
      );
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5">
      <FieldGroup>
        <FieldLabel htmlFor="email">E-mail</FieldLabel>
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          placeholder="admin@julianamartinsfitness.store"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 w-full rounded-lg border-border bg-background px-3 text-foreground"
        />
      </FieldGroup>

      <FieldGroup>
        <FieldLabel htmlFor="password">Senha</FieldLabel>
        <Input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-11 w-full rounded-lg border-border bg-background px-3 text-foreground"
        />
      </FieldGroup>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" disabled={loading} className="h-11 w-full text-base">
        {loading ? "Entrando..." : "Entrar no painel"}
      </Button>

      <FieldDescription className="text-center text-sm">
        Acesso restrito aos administradores do evento.
      </FieldDescription>
    </form>
  );
}
