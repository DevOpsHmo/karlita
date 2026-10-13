"use client";

import { useEffect } from "react";

export function useAutoPrint(ready: boolean) {
  useEffect(() => {
    if (!ready) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("print") !== "1") return;
    const timer = window.setTimeout(() => window.print(), 500);
    return () => window.clearTimeout(timer);
  }, [ready]);
}
