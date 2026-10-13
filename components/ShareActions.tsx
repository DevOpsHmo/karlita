"use client";

import { useState } from "react";
import { publicUrl } from "@/lib/public-origin";

export function ShareActions({
  sharePath,
  message,
  showPrint = true,
  includeAckLink = false,
}: {
  sharePath: string;
  message: string;
  showPrint?: boolean;
  includeAckLink?: boolean;
}) {
  const [busy, setBusy] = useState(false);

  async function resolveShare() {
    const res = await fetch(sharePath, { method: "POST" });
    const json = await res.json();
    if (!res.ok || !json.path) return null;
    return publicUrl(json.path as string);
  }

  async function downloadPdf() {
    setBusy(true);
    const report = await resolveShare();
    setBusy(false);
    if (!report) return;
    window.open(`${report}?print=1`, "_blank");
  }

  async function send() {
    setBusy(true);
    const report = await resolveShare();
    setBusy(false);
    if (!report) return;
    let text = `${message.trim()}\n${report}`;
    if (includeAckLink) {
      text += `\n\nIndique si está de acuerdo (Sí o No) y firme aquí:\n${report}/firma`;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <div className="no-print mb-4 flex flex-wrap gap-2">
      {showPrint && (
        <button
          type="button"
          onClick={downloadPdf}
          disabled={busy}
          className="cursor-pointer rounded-lg bg-[#1b5e3b] px-4 py-2 text-white disabled:cursor-wait"
        >
          {busy ? "Preparando…" : "Descargar PDF"}
        </button>
      )}
      <button
        type="button"
        onClick={send}
        disabled={busy}
        className="cursor-pointer rounded-lg px-4 py-2 font-medium disabled:cursor-wait"
        style={{ backgroundColor: "#25D366", color: "#ffffff" }}
      >
        {busy ? "Preparando…" : "Enviar por WhatsApp"}
      </button>
    </div>
  );
}

export function PrintOnly() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print mb-4 cursor-pointer rounded-lg bg-[#1b5e3b] px-4 py-2 text-white"
    >
      Descargar PDF
    </button>
  );
}
