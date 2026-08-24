"use client";

import { Download, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/use-install-prompt";

export function InstallAppButton() {
  const { platform, canInstall, promptInstall } = useInstallPrompt();
  const [showIosSteps, setShowIosSteps] = useState(false);

  if (platform === "installed" || platform === "unsupported") return null;

  if (platform === "ios") {
    return (
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowIosSteps((prev) => !prev)}
        >
          <Download className="size-4" />
          <span className="hidden sm:inline">Instalar app</span>
        </Button>

        {showIosSteps && (
          <div className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-border bg-card p-3 text-sm shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold">Instalar no iPhone</span>
              <button
                type="button"
                onClick={() => setShowIosSteps(false)}
                aria-label="Fechar"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="text-muted-foreground">
              Toque em{" "}
              <span className="font-medium text-foreground">Compartilhar</span>{" "}
              (ícone de quadrado com seta ↑) e depois em{" "}
              <span className="font-medium text-foreground">
                "Adicionar à Tela de Início"
              </span>
              .
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={promptInstall}
      disabled={!canInstall}
    >
      <Download className="size-4" />
      <span className="hidden sm:inline">Instalar app</span>
    </Button>
  );
}
