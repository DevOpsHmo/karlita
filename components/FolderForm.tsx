"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FOLDER_ITEMS,
  VERIFIER_ROLES,
  emptyFolderPayload,
  type FolderPayload,
} from "@/lib/folder-form";
import { clearDraft, useCloudDraft } from "@/lib/use-draft";
import { InstitutionHeader } from "./InstitutionHeader";
import { TeacherSelect } from "./TeacherSelect";
import { Select, TURNO_OPTIONS } from "./Select";
import { YesNo } from "./YesNo";

export function FolderForm({
  initialTeacherId,
  initialSchoolId,
  initialPayload,
  reviewId,
}: {
  initialTeacherId?: string;
  initialSchoolId?: string;
  initialPayload?: FolderPayload;
  reviewId?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [schoolId, setSchoolId] = useState(initialSchoolId ?? "");
  const [teacherId, setTeacherId] = useState(initialTeacherId ?? params.get("teacher") ?? "");
  const [payload, setPayload] = useState<FolderPayload>(initialPayload ?? emptyFolderPayload());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [draftHint, setDraftHint] = useState("");

  useEffect(() => {
    if (!teacherId || schoolId) return;
    fetch(`/api/teachers/${teacherId}`)
      .then((r) => r.json())
      .then((t) => {
        if (t.schoolId) setSchoolId(t.schoolId);
      });
  }, [teacherId, schoolId]);

  useCloudDraft({
    kind: "folder",
    enabled: !reviewId,
    schoolId,
    teacherId,
    payload,
    onRestore: (d) => {
      if (d.payload) setPayload({ ...emptyFolderPayload(), ...(d.payload as FolderPayload) });
      if (d.schoolId) setSchoolId(d.schoolId);
      if (d.teacherId) setTeacherId(d.teacherId);
      setDraftHint("Se recuperó el avance guardado de esta revisión.");
    },
  });

  const onTeacherMeta = useCallback(
    (t: { disciplina: string; turno: string } | null) => {
      if (!t) return;
      setPayload((p) => ({
        ...p,
        disciplina: p.disciplina || t.disciplina,
        turno: p.turno || t.turno,
      }));
    },
    []
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!teacherId) {
      setError("Seleccione o registre un docente.");
      return;
    }
    setSaving(true);
    const url = reviewId ? `/api/folder-reviews/${reviewId}` : "/api/folder-reviews";
    const res = await fetch(url, {
      method: reviewId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId, payload }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("No se pudo guardar.");
      return;
    }
    const row = await res.json();
    await clearDraft("folder");
    router.push(`/resultados/maestro/${row.teacherId}`);
  }

  function setItem(id: string, patch: Partial<FolderPayload["items"][string]>) {
    setPayload((p) => ({
      ...p,
      items: { ...p.items, [id]: { ...p.items[id], ...patch } },
    }));
  }

  let lastEtapa = "";
  let lastSub = "";

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-4 px-4 py-6">
      <InstitutionHeader title="Revisión de carpetas" />
      {draftHint && <p className="rounded-lg bg-[#eef6ef] px-3 py-2 text-sm text-[#1b5e3b]">{draftHint}</p>}
      <p className="text-xs text-[#5a6b5e]">El avance se guarda solo, aunque se cierre la pestaña o se cambie de app.</p>
      <div className="rounded-2xl bg-[#fffdf8] p-4 shadow-sm ring-1 ring-[#e6dcc8]">
        <TeacherSelect
          schoolId={schoolId}
          teacherId={teacherId}
          onSchool={setSchoolId}
          onTeacher={setTeacherId}
          onTeacherMeta={onTeacherMeta}
        />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Disciplina
            <input
              className="mt-1 w-full rounded-lg border border-[#d9c9a3] px-3 py-2"
              value={payload.disciplina}
              onChange={(e) => setPayload({ ...payload, disciplina: e.target.value })}
            />
          </label>
          <label className="text-sm">
            Turno
            <Select
              className="mt-1"
              value={payload.turno}
              onChange={(turno) => setPayload({ ...payload, turno })}
              options={TURNO_OPTIONS}
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Nombre del verificador
            <input
              className="mt-1 w-full rounded-lg border border-[#d9c9a3] px-3 py-2"
              value={payload.verificadorNombre}
              onChange={(e) => setPayload({ ...payload, verificadorNombre: e.target.value })}
            />
          </label>
        </div>
      </div>

      {FOLDER_ITEMS.map((item) => {
        const showEtapa = item.etapa !== lastEtapa;
        const showSub = item.sub && item.sub !== lastSub;
        lastEtapa = item.etapa;
        lastSub = item.sub;
        const row = payload.items[item.id];
        return (
          <div key={item.id}>
            {showEtapa && <h2 className="mt-6 text-lg font-bold text-[#123f28]">{item.etapa}</h2>}
            {showSub && <h3 className="mt-2 text-sm font-semibold text-[#1b5e3b]">{item.sub}</h3>}
            <div className="mt-2 rounded-2xl bg-[#fffdf8] p-4 shadow-sm ring-1 ring-[#e6dcc8]">
              <p className="mb-3 text-sm font-medium">{item.label}</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {(
                  [
                    ["p1", 1],
                    ["p2", 2],
                    ["p3", 3],
                  ] as const
                ).map(([key, n]) => (
                  <div key={key} className="rounded-lg bg-[#f4f1ea] p-2">
                    <p className="mb-1 text-xs font-semibold">Periodo {n}</p>
                    <YesNo
                      name={`${item.id}-${key}`}
                      value={row[key]}
                      onChange={(v) => setItem(item.id, { [key]: v })}
                    />
                  </div>
                ))}
              </div>
              <label className="mt-3 block text-sm">
                Observaciones
                <textarea
                  className="mt-1 w-full rounded-lg border border-[#d9c9a3] px-3 py-2"
                  rows={2}
                  value={row.observaciones}
                  onChange={(e) => setItem(item.id, { observaciones: e.target.value })}
                />
              </label>
            </div>
          </div>
        );
      })}

      <div className="rounded-2xl bg-[#fffdf8] p-4 shadow-sm ring-1 ring-[#e6dcc8]">
        <label className="block text-sm font-medium">
          Observaciones y sugerencias generales
          <textarea
            className="mt-1 w-full rounded-lg border border-[#d9c9a3] px-3 py-2"
            rows={4}
            value={payload.observacionesGenerales}
            onChange={(e) => setPayload({ ...payload, observacionesGenerales: e.target.value })}
          />
        </label>
        <p className="mt-4 text-sm font-semibold">Seguimiento a observaciones</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          {(
            [
              ["verificacion1", 1],
              ["verificacion2", 2],
              ["verificacion3", 3],
            ] as const
          ).map(([key, n]) => (
            <label key={key} className="text-sm">
              Verificación No. {n} (fecha)
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-[#d9c9a3] px-3 py-2"
                value={payload[key]}
                onChange={(e) => setPayload({ ...payload, [key]: e.target.value })}
              />
            </label>
          ))}
        </div>
        <p className="mt-4 text-sm font-semibold">Verificadores</p>
        <div className="mt-2 flex flex-wrap gap-3">
          {VERIFIER_ROLES.map((role) => (
            <label key={role} className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                className="accent-[#1b5e3b]"
                checked={payload.roles.includes(role)}
                onChange={(e) => {
                  const roles = e.target.checked
                    ? [...payload.roles, role]
                    : payload.roles.filter((r) => r !== role);
                  setPayload({ ...payload, roles });
                }}
              />
              {role}
            </label>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Nombre y firma del docente
            <input
              className="mt-1 w-full rounded-lg border border-[#d9c9a3] px-3 py-2"
              value={payload.firmaDocente}
              onChange={(e) => setPayload({ ...payload, firmaDocente: e.target.value })}
            />
          </label>
          <label className="text-sm">
            Nombre y firma del director
            <input
              className="mt-1 w-full rounded-lg border border-[#d9c9a3] px-3 py-2"
              value={payload.firmaDirector}
              onChange={(e) => setPayload({ ...payload, firmaDirector: e.target.value })}
            />
          </label>
        </div>
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="no-print w-full rounded-xl bg-[#1b5e3b] py-3 font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Guardando…" : "Guardar revisión"}
      </button>
    </form>
  );
}
