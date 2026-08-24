import Link from "next/link";
import { AdminNav } from "@/components/admin/nav";
import { SignOutButton } from "@/components/common/sign-out-button";
import { InstallAppButton } from "@/components/pwa/install-app-button";
import { requireSession } from "@/lib/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession("admin");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4">
          <Link
            href="/admin"
            className="font-orbitron text-sm font-bold text-primary sm:text-base glow-gold"
          >
            JM Painel Admin
          </Link>
          <div className="flex items-center gap-3">
            <InstallAppButton />
            <span className="hidden text-sm text-muted-foreground sm:block">
              {session.user.name}
            </span>
            <SignOutButton redirectTo="/admin/login" />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row">
        <aside className="shrink-0 md:w-56">
          <AdminNav />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
