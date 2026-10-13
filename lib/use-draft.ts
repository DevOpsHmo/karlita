"use client";

import { useEffect, useRef, useState } from "react";

type DraftBody<T> = {
  kind: "folder" | "visit";
  schoolId: string;
  teacherId: string;
  payload: T;
  updatedAt: string;
};

function storageKey(kind: string, teacherId: string) {
  return `draft-${kind}-${teacherId}`;
}

export function useCloudDraft<T>(opts: {
  kind: "folder" | "visit";
  enabled: boolean;
  schoolId: string;
  teacherId: string;
  payload: T;
  onRestore: (d: { schoolId: string; teacherId: string; payload: T }) => void;
  onNoDraft?: () => void;
}) {
  const [ready, setReady] = useState(false);
  const latest = useRef(opts);
  latest.current = opts;
  const loadedTeacher = useRef("");

  useEffect(() => {
    if (!opts.enabled) {
      setReady(true);
      loadedTeacher.current = opts.teacherId;
      return;
    }
    if (!opts.teacherId) {
      setReady(false);
      loadedTeacher.current = "";
      return;
    }
    let cancelled = false;
    setReady(false);
    const teacherId = opts.teacherId;
    const local = localStorage.getItem(storageKey(opts.kind, teacherId));
    fetch(`/api/drafts?kind=${opts.kind}&teacherId=${encodeURIComponent(teacherId)}`)
      .then((r) => r.json())
      .then((cloud) => {
        if (cancelled) return;
        const localData = local ? (JSON.parse(local) as DraftBody<T>) : null;
        const cloudTime = cloud?.updatedAt ? Date.parse(cloud.updatedAt) : 0;
        const localTime = localData?.updatedAt ? Date.parse(localData.updatedAt) : 0;
        const chosen = cloudTime >= localTime ? cloud : localData;
        const matches = chosen?.teacherId === teacherId && chosen?.payload;
        if (matches) latest.current.onRestore(chosen);
        else latest.current.onNoDraft?.();
        loadedTeacher.current = teacherId;
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        if (local) {
          try {
            const parsed = JSON.parse(local) as DraftBody<T>;
            if (parsed.teacherId === teacherId && parsed.payload) latest.current.onRestore(parsed);
            else latest.current.onNoDraft?.();
          } catch {
            latest.current.onNoDraft?.();
          }
        } else {
          latest.current.onNoDraft?.();
        }
        loadedTeacher.current = teacherId;
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [opts.enabled, opts.kind, opts.teacherId]);

  useEffect(() => {
    if (!opts.enabled || !ready || !opts.teacherId) return;
    if (loadedTeacher.current !== opts.teacherId) return;
    const body: DraftBody<T> = {
      kind: opts.kind,
      schoolId: opts.schoolId,
      teacherId: opts.teacherId,
      payload: opts.payload,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(storageKey(opts.kind, opts.teacherId), JSON.stringify(body));
    const t = setTimeout(() => {
      fetch("/api/drafts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        keepalive: true,
      }).catch(() => undefined);
    }, 600);
    return () => clearTimeout(t);
  }, [opts.enabled, opts.kind, opts.schoolId, opts.teacherId, opts.payload, ready]);

  useEffect(() => {
    if (!opts.enabled) return;
    function flush() {
      const c = latest.current;
      if (!c.teacherId || loadedTeacher.current !== c.teacherId) return;
      const body = JSON.stringify({
        kind: c.kind,
        schoolId: c.schoolId,
        teacherId: c.teacherId,
        payload: c.payload,
        updatedAt: new Date().toISOString(),
      });
      localStorage.setItem(storageKey(c.kind, c.teacherId), body);
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
  }, [opts.enabled]);
}

export async function clearDraft(kind: "folder" | "visit", teacherId?: string) {
  if (teacherId) localStorage.removeItem(storageKey(kind, teacherId));
  else {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(`draft-${kind}`))
      .forEach((k) => localStorage.removeItem(k));
  }
  const q = teacherId ? `?kind=${kind}&teacherId=${encodeURIComponent(teacherId)}` : `?kind=${kind}`;
  await fetch(`/api/drafts${q}`, { method: "DELETE" }).catch(() => undefined);
}
