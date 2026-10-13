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
    const chartPrefs = (() => {
      try {
        return JSON.parse(localStorage.getItem("zona-chart-prefs") || "null");
      } catch {
        return null;
      }
    })();
    const res = await fetch(sharePath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chartPrefs: chartPrefs ?? { defaultKind: "bars", byId: {} } }),
    });
    const json = await res.json();
    if (!res.ok || !json.path) return null;
    return {
      report: publicUrl(json.path as string),
      pdfUrl: (json.pdfUrl as string) || "",
    };
  }

  async function pdfFile(pdfUrl: string, filename: string) {
    const res = await fetch(pdfUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new File([blob], filename, { type: "application/pdf" });
  }

  function saveFile(file: File) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(file);
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function downloadPdf() {
    setBusy(true);
    const share = await resolveShare();
    setBusy(false);
    if (!share) return;
    if (share.pdfUrl) {
      const file = await pdfFile(share.pdfUrl, includeAckLink ? "ficha-maestro.pdf" : "resultados-zona-x.pdf");
      if (file) saveFile(file);
      else window.open(share.pdfUrl, "_blank");
      return;
    }
    window.open(`${share.report}?print=1`, "_blank");
  }

  async function send() {
    setBusy(true);
    const share = await resolveShare();
    if (!share) {
      setBusy(false);
      return;
    }
    const filename = includeAckLink ? "ficha-maestro.pdf" : "resultados-zona-x.pdf";
    let file: File | null = null;
    if (share.pdfUrl) file = await pdfFile(share.pdfUrl, filename);
    setBusy(false);

    const caption = includeAckLink
      ? `${message.trim()}\n\nIndique si está de acuerdo (Sí o No) y firme aquí:\n${share.report}/firma`
      : message.trim();

    if (file) {
      const payload = { files: [file], text: caption, title: filename };
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.share && nav.canShare?.(payload)) {
        try {
          await nav.share(payload);
          return;
        } catch (err) {
          if ((err as Error).name === "AbortError") return;
        }
      }
      saveFile(file);
    } else if (share.pdfUrl) {
      window.open(share.pdfUrl, "_blank");
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(caption)}`, "_blank");
  }

  return (
    <div className="no-print mb-4 flex flex-wrap gap-2">
      {showPrint && (
        <button
          type="button"
          onClick={downloadPdf}
          disabled={busy}
          className="cursor-pointer rounded-lg bg-[#6a0938] px-4 py-2 text-white disabled:cursor-wait"
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
      className="no-print mb-4 cursor-pointer rounded-lg bg-[#6a0938] px-4 py-2 text-white"
    >
      Descargar PDF
    </button>
  );
}
