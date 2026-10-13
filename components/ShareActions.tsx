"use client";

import { useState } from "react";

export function ShareActions({
  sharePath,
  message,
  showPrint = true,
}: {
  sharePath: string;
  message: string;
  showPrint?: boolean;
}) {
  const [busy, setBusy] = useState(false);

  async function send() {
    setBusy(true);
    const res = await fetch(sharePath, { method: "POST" });
    const json = await res.json();
    setBusy(false);
    if (!res.ok || !json.path) return;
    const link = `${window.location.origin}${json.path}`;
    const text = `${message}\n${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <div className="no-print mb-4 flex flex-wrap gap-2">
      {showPrint && (
        <button type="button" onClick={() => window.print()} className="rounded-lg bg-[#1b5e3b] px-4 py-2 text-white">
          Imprimir / PDF
        </button>
      )}
      <button
        type="button"
        onClick={send}
        disabled={busy}
        className="rounded-lg bg-[#25D366] px-4 py-2 font-medium text-white"
      >
        {busy ? "Preparando…" : "Enviar por WhatsApp"}
      </button>
    </div>
  );
}

export function PrintOnly() {
  return (
    <button type="button" onClick={() => window.print()} className="no-print mb-4 rounded-lg bg-[#1b5e3b] px-4 py-2 text-white">
      Imprimir / PDF
    </button>
  );
}
