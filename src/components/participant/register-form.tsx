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

export function ParticipantRegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signUpError } = await authClient.signUp.email({
      name,
      email,
      password,
      phone,
      instagram: instagram.trim() === "" ? undefined : instagram.trim(),
      callbackURL: "/participant",
    });

    if (signUpError) {
      setError(signUpError.message ?? "Erro ao criar conta");
      setLoading(false);
      return;
    }

    router.push("/participant");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5">
      <FieldGroup>
        <FieldLabel htmlFor="name">Nome completo</FieldLabel>
        <Input
          id="name"
          type="text"
          required
          placeholder="Seu nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11 w-full rounded-lg border-border bg-background px-3 text-foreground"
        />
      </FieldGroup>

      <FieldGroup>
        <FieldLabel htmlFor="email">E-mail</FieldLabel>
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 w-full rounded-lg border-border bg-background px-3 text-foreground"
        />
      </FieldGroup>

      <FieldGroup>
        <FieldLabel htmlFor="password">Senha (mín. 8 caracteres)</FieldLabel>
        <Input
          id="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-11 w-full rounded-lg border-border bg-background px-3 text-foreground"
        />
      </FieldGroup>

      <FieldGroup>
        <FieldLabel htmlFor="phone">WhatsApp</FieldLabel>
        <Input
          id="phone"
          type="tel"
          required
          placeholder="(11) 99999-9999"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="h-11 w-full rounded-lg border-border bg-background px-3 text-foreground"
        />
      </FieldGroup>

      <FieldGroup>
        <FieldLabel htmlFor="instagram">Instagram (opcional)</FieldLabel>
        <Input
          id="instagram"
          type="text"
          placeholder="@seuperfil"
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
          className="h-11 w-full rounded-lg border-border bg-background px-3 text-foreground"
        />
        <FieldDescription className="text-xs">
          ⚠️ Sem um Instagram cadastrado, você não poderá pontuar em tarefas
          sociais (ex.: postar stories marcando a JM Fitness).
        </FieldDescription>
      </FieldGroup>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" disabled={loading} className="h-11 w-full text-base">
        {loading ? "Criando conta..." : "Criar conta e participar"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <a
          href="/participant/login"
          className="font-medium text-primary hover:underline"
        >
          Entrar
        </a>
      </p>
    </form>
  );
}
