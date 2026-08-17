"use client";

import { QRCodeSVG } from "qrcode.react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminQrDisplay({
  title,
  points,
  secret,
}: {
  title: string;
  points: number;
  secret: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 overflow-y-auto bg-background p-6 text-center print:static">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Check-in por QR Code
        </p>
        <h1 className="mt-1 font-goldman text-2xl font-bold uppercase text-primary sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">+{points} pontos</p>
      </div>

      <div className="rounded-2xl border border-border bg-white p-6 shadow-[0_0_40px_rgba(60,113,200,0.15)]">
        <QRCodeSVG value={secret} size={320} level="H" />
      </div>

      <p className="font-mono text-lg tracking-widest text-foreground">
        {secret}
      </p>

      <Button
        variant="outline"
        onClick={() => window.print()}
        className="print:hidden"
      >
        <Printer className="size-4" /> Imprimir
      </Button>
    </div>
  );
}
