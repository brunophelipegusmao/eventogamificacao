import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";

export const getSession = cache(async () => {
  return auth.api.getSession({
    headers: await headers(),
  });
});

export type SessionUser = NonNullable<
  Awaited<ReturnType<typeof getSession>>
>["user"];

/** Retorna a sessão ou redireciona para o login da rota correta */
export async function requireSession(role: "admin" | "participant") {
  const session = await getSession();
  if (!session) {
    redirect(role === "admin" ? "/admin/login" : "/participant/login");
  }
  if (session.user.role !== role) {
    redirect(
      session.user.role === "admin" ? "/admin" : "/participant"
    );
  }
  return session;
}
