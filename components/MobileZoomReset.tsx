"use client";

import { useEffect } from "react";

export function MobileZoomReset() {
  useEffect(() => {
    function viewport() {
      return document.querySelector('meta[name="viewport"]');
    }

    function reset() {
      const meta = viewport();
      if (!meta) return;
      const prev = meta.getAttribute("content") || "width=device-width, initial-scale=1";
      meta.setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1");
      window.setTimeout(() => {
        meta.setAttribute(
          "content",
          prev.replace(/,?\s*maximum-scale\s*=\s*[\d.]+/gi, "") + ", maximum-scale=5"
        );
      }, 50);
    }

    function onFocusOut(e: FocusEvent) {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;
      if (t.matches("input, textarea, select")) reset();
    }

    document.addEventListener("focusout", onFocusOut);
    return () => document.removeEventListener("focusout", onFocusOut);
  }, []);
  return null;
}
