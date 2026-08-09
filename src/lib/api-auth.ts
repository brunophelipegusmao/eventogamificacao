import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function requireApiSession(role?: "admin" | "participant") {
  const session = await getSession();
  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      ),
    };
  }
  if (role && session.user.role !== role) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Sem permissão para esta ação" },
        { status: 403 }
      ),
    };
  }
  return { ok: true as const, session };
}
