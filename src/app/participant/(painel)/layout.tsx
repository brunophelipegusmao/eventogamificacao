import Link from "next/link";
import { requireSession } from "@/lib/session";
import { SignOutButton } from "@/components/common/sign-out-button";

export default async function ParticipantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession("participant");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
          <Link
            href="/participant"
            className="font-orbitron text-sm font-bold text-primary sm:text-base glow-gold"
          >
            Desafio JM Fitness
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:block">
              {session.user.name}
            </span>
            <SignOutButton redirectTo="/participant/login" />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
    </div>
  );
}
