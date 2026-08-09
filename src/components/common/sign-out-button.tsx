"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function SignOutButton({
  redirectTo,
  className,
}: {
  redirectTo: string;
  className?: string;
}) {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSignOut}
      className={className}
    >
      <LogOut className="size-4" />
      <span className="hidden sm:inline">Sair</span>
    </Button>
  );
}
