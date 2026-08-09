import type { Metadata } from "next";
import Link from "next/link";
import { ParticipantRegisterForm } from "@/components/participant/register-form";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Cadastro | Desafio JM Fitness",
};

export default async function ParticipantRegisterPage() {
  const session = await getSession();
  if (session) {
    redirect(session.user.role === "admin" ? "/admin" : "/participant");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10 tech-grid-bg">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="font-orbitron text-2xl font-bold text-primary glow-gold">
            Cadastro
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pronto para o desafio? Preencha seus dados para participar.
          </p>
        </div>
        <ParticipantRegisterForm />
      </div>
      <Link href="/" className="mt-6 text-sm text-muted-foreground hover:text-foreground">
        ← Voltar para a página inicial
      </Link>
    </main>
  );
}
