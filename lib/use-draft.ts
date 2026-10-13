"use client";

import { useEffect, useRef, useState } from "react";

export function useCloudDraft<T>(opts: {
  kind: "folder" | "visit";
  enabled: boolean;
  schoolId: string;
  teacherId: string;
  payload: T;
  onRestore: (d: { schoolId: string; teacherId: string; payload: T }) => void;
}) {
  const [ready, setReady] = useState(!opts.enabled);
  const latest = useRef(opts);
  latest.current = opts;

  useEffect(() => {
    if (!opts.enabled) {
      setReady(true);
      return;
    }
    let cancelled = false;
    const local = localStorage.getItem(`draft-${opts.kind}`);
    fetch(`/api/drafts?kind=${opts.kind}`)
      .then((r) => r.json())
      .then((cloud) => {
        if (cancelled) return;
        const localData = local ? JSON.parse(local) : null;
        const cloudTime = cloud?.updatedAt ? Date.parse(cloud.updatedAt) : 0;
        const localTime = localData?.updatedAt ? Date.parse(localData.updatedAt) : 0;
        const chosen = cloudTime >= localTime ? cloud : localData;
        if (chosen?.payload) latest.current.onRestore(chosen);
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        if (local) {
          try {
            latest.current.onRestore(JSON.parse(local));
          } catch {
            /* ignore */
          }
        }
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [opts.enabled, opts.kind]);

  useEffect(() => {
    if (!opts.enabled || !ready) return;
    const body = {
      kind: opts.kind,
      schoolId: opts.schoolId,
      teacherId: opts.teacherId,
      payload: opts.payload,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(`draft-${opts.kind}`, JSON.stringify(body));
    const t = setTimeout(() => {
      fetch("/api/drafts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        keepalive: true,
      }).catch(() => undefined);
    }, 800);
    return () => clearTimeout(t);
  }, [opts.enabled, opts.kind, opts.schoolId, opts.teacherId, opts.payload, ready]);

  useEffect(() => {
    if (!opts.enabled) return;
    function flush() {
      if (!ready) return;
      const c = latest.current;
      const body = JSON.stringify({
        kind: c.kind,
        schoolId: c.schoolId,
        teacherId: c.teacherId,
        payload: c.payload,
        updatedAt: new Date().toISOString(),
      });
      localStorage.setItem(`draft-${c.kind}`, body);
      fetch("/api/drafts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => undefined);
    }
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [opts.enabled, ready]);
}

export async function clearDraft(kind: "folder" | "visit") {
  localStorage.removeItem(`draft-${kind}`);
  await fetch(`/api/drafts?kind=${kind}`, { method: "DELETE" }).catch(() => undefined);
}
