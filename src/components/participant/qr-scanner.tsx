"use client";

import { Html5Qrcode } from "html5-qrcode";
import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";

export function QrScanner({
  onDecode,
  onClose,
}: {
  onDecode: (text: string) => void;
  onClose: () => void;
}) {
  const elementId = `qr-scanner-${useId().replace(/[:]/g, "")}`;
  const onDecodeRef = useRef(onDecode);
  const decodedRef = useRef(false);

  useEffect(() => {
    onDecodeRef.current = onDecode;
  }, [onDecode]);

  useEffect(() => {
    const scanner = new Html5Qrcode(elementId);
    decodedRef.current = false;
    let disposed = false;

    const stopAndClear = () => {
      if (!scanner.isScanning) return;
      scanner
        .stop()
        .then(() => scanner.clear())
        .catch(() => {});
    };

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          if (decodedRef.current) return;
          decodedRef.current = true;
          onDecodeRef.current(decodedText);
        },
        () => {},
      )
      .then(() => {
        // O componente já foi desmontado antes da câmera terminar de iniciar.
        if (disposed) stopAndClear();
      })
      .catch(() => {
        // câmera indisponível/negada — o participante ainda pode digitar o código manualmente
      });

    return () => {
      disposed = true;
      stopAndClear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementId]);

  return (
    <div className="space-y-2">
      <div
        id={elementId}
        className="mx-auto w-full max-w-xs overflow-hidden rounded-lg border border-border"
      />
      <Button variant="outline" size="sm" onClick={onClose}>
        <X className="size-4" /> Cancelar
      </Button>
    </div>
  );
}
