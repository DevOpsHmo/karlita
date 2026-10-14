"use client";

import { useEffect, useRef } from "react";

type DraftBody<T> = {
  kind: "folder" | "visit";
  schoolId: string;
  teacherId: string;
  recordId: string;
  payload: T;
  updatedAt: string;
};

function storageKey(kind: string, teacherId: string, recordId: string) {
  return `zona-draft-${kind}-${teacherId || "nuevo"}-${recordId || "new"}`;
}

function readLocal<T>(kind: string, teacherId: string, recordId: string): DraftBody<T> | null {
  try {
    const raw =
      localStorage.getItem(storageKey(kind, teacherId, recordId)) ||
      (teacherId ? localStorage.getItem(`draft-${kind}-${teacherId}`) : null);
    if (!raw) return null;
    return JSON.parse(raw) as DraftBody<T>;
  } catch {
    return null;
  }
}

function writeLocal(kind: string, teacherId: string, recordId: string, body: unknown) {
  const key = storageKey(kind, teacherId, recordId);
  try {
    localStorage.setItem(key, JSON.stringify(body));
    return;
  } catch {
    /* quota: drop signature image and retry */
  }
  try {
    const slim = JSON.parse(JSON.stringify(body)) as { payload?: Record<string, unknown> };
    if (slim.payload && typeof slim.payload.firmaDataUrl === "string") slim.payload.firmaDataUrl = "";
    localStorage.setItem(key, JSON.stringify(slim));
  } catch {
    /* ignore */
  }
}

function putCloud(body: object) {
  fetch("/api/drafts", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => undefined);
}

export function useCloudDraft<T>(opts: {
  kind: "folder" | "visit";
  enabled?: boolean;
  recordId?: string;
  schoolId: string;
  teacherId: string;
  payload: T;
  onRestore: (d: { schoolId: string; teacherId: string; payload: T }) => void;
}) {
  const enabled = opts.enabled !== false;
  const recordId = opts.recordId || "new";
  const latest = useRef(opts);
  latest.current = opts;
  const slot = `${opts.kind}:${opts.teacherId}:${recordId}`;
  const skipNextSave = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const teacherId = opts.teacherId;
    const local = readLocal<T>(opts.kind, teacherId, recordId);
    if (local?.payload) {
      skipNextSave.current = true;
      opts.onRestore(local);
    }

    if (!teacherId) return;

    fetch(`/api/drafts?kind=${opts.kind}&teacherId=${encodeURIComponent(teacherId)}`)
      .then((r) => r.json())
      .then((cloud) => {
        if (cancelled || !cloud?.payload) return;
        const cloudTime = cloud.updatedAt ? Date.parse(cloud.updatedAt) : 0;
        const localTime = local?.updatedAt ? Date.parse(local.updatedAt) : 0;
        if (cloudTime > localTime) {
          skipNextSave.current = true;
          latest.current.onRestore(cloud);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [enabled, opts.kind, opts.teacherId, recordId]);

  useEffect(() => {
    if (!enabled) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    const body: DraftBody<T> = {
      kind: opts.kind,
      schoolId: opts.schoolId,
      teacherId: opts.teacherId,
      recordId,
      payload: opts.payload,
      updatedAt: new Date().toISOString(),
    };
    writeLocal(opts.kind, opts.teacherId, recordId, body);
    if (!opts.teacherId) return;
    const t = setTimeout(() => putCloud(body), 500);
    return () => clearTimeout(t);
  }, [enabled, opts.kind, opts.schoolId, opts.teacherId, opts.payload, recordId, slot]);

  useEffect(() => {
    if (!enabled) return;
    function flush() {
      const c = latest.current;
      const id = c.recordId || "new";
      const body = {
        kind: c.kind,
        schoolId: c.schoolId,
        teacherId: c.teacherId,
        recordId: id,
        payload: c.payload,
        updatedAt: new Date().toISOString(),
      };
      writeLocal(c.kind, c.teacherId, id, body);
      if (c.teacherId) putCloud(body);
    }
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
    window.addEventListener("freeze", flush);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", flush);
      window.removeEventListener("freeze", flush);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [enabled]);
}

export async function clearDraft(kind: "folder" | "visit", teacherId?: string, recordId = "new") {
  try {
    if (teacherId) {
      localStorage.removeItem(storageKey(kind, teacherId, recordId));
      localStorage.removeItem(storageKey(kind, teacherId, "new"));
    } else {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(`zona-draft-${kind}-`) || k.startsWith(`draft-${kind}`))
        .forEach((k) => localStorage.removeItem(k));
    }
  } catch {
    /* ignore */
  }
  const q = teacherId ? `?kind=${kind}&teacherId=${encodeURIComponent(teacherId)}` : `?kind=${kind}`;
  await fetch(`/api/drafts${q}`, { method: "DELETE" }).catch(() => undefined);
}
