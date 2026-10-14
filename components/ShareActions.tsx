"use client";

import { useState } from "react";
import { publicUrl } from "@/lib/public-origin";
import { ViewSignatureButton, type SignaturePreview } from "@/components/ViewSignature";

export function ShareActions({
  sharePath,
  message,
  showPrint = true,
  includeAckLink = false,
  signature,
  className = "",
}: {
  sharePath: string;
  message: string;
  showPrint?: boolean;
  includeAckLink?: boolean;
  signature?: SignaturePreview | null;
  className?: string;
}) {
  const [busy, setBusy] = useState<"pdf" | "wa" | null>(null);

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
      pdfName: sanitizePdfName((json.pdfName as string) || ""),
    };
  }

  function sanitizePdfName(name: string) {
    const cleaned = name.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim();
    return cleaned.toLowerCase().endsWith(".pdf") ? cleaned : cleaned ? `${cleaned}.pdf` : "";
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
    setBusy("pdf");
    const share = await resolveShare();
    setBusy(null);
    if (!share) return;
    if (share.pdfUrl) {
      const file = await pdfFile(
        share.pdfUrl,
        share.pdfName || (includeAckLink ? "ficha-maestro.pdf" : "resultados-zona-x.pdf")
      );
      if (file) saveFile(file);
      else window.open(share.pdfUrl, "_blank");
      return;
    }
    window.open(`${share.report}?print=1`, "_blank");
  }

  async function send() {
    setBusy("wa");
    const share = await resolveShare();
    if (!share) {
      setBusy(null);
      return;
    }
    const filename = share.pdfName || (includeAckLink ? "ficha-maestro.pdf" : "resultados-zona-x.pdf");
    let file: File | null = null;
    if (share.pdfUrl) file = await pdfFile(share.pdfUrl, filename);
    setBusy(null);

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
    <div
      className={`no-print flex flex-wrap items-center gap-1.5 sm:gap-2 ${className || "mb-3 sm:mb-4"}`}
    >
      {showPrint && (
        <button
          type="button"
          onClick={downloadPdf}
          disabled={busy === "pdf"}
          className="cursor-pointer rounded-md bg-[#6a0938] px-2.5 py-1 text-[11px] leading-tight text-white disabled:cursor-wait sm:rounded-lg sm:px-4 sm:py-2 sm:text-sm"
        >
          {busy === "pdf" ? "Preparando…" : "Descargar PDF"}
        </button>
      )}
      <button
        type="button"
        onClick={send}
        disabled={busy === "wa"}
        className="cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-medium leading-tight disabled:cursor-wait sm:rounded-lg sm:px-4 sm:py-2 sm:text-sm"
        style={{ backgroundColor: "#25D366", color: "#ffffff" }}
      >
        {busy === "wa" ? "Preparando…" : "Enviar por WhatsApp"}
      </button>
      {includeAckLink && <ViewSignatureButton signature={signature} />}
    </div>
  );
}

export function PrintOnly() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print mb-4 cursor-pointer rounded-md bg-[#6a0938] px-2.5 py-1 text-[11px] text-white sm:rounded-lg sm:px-4 sm:py-2 sm:text-sm"
    >
      Descargar PDF
    </button>
  );
}
