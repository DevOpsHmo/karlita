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
import { SignaturePad } from "./SignaturePad";
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
  const [signOpen, setSignOpen] = useState(false);
  const [signName, setSignName] = useState("");
  const [signPad, setSignPad] = useState("");

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
    recordId: reviewId,
    schoolId,
    teacherId,
    payload,
    onRestore: (d) => {
      if (d.payload) setPayload({ ...emptyFolderPayload(), ...(d.payload as FolderPayload) });
      if (d.schoolId) setSchoolId(d.schoolId);
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
    if (!payload.firmaDataUrl?.startsWith("data:image")) {
      setError("Firme la revisión antes de guardar.");
      return;
    }
    setSaving(true);
    const url = reviewId ? `/api/folder-reviews/${reviewId}` : "/api/folder-reviews";
    const res = await fetch(url, {
      method: reviewId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId, payload, confirmNew: (window as unknown as { __confirmFolder?: boolean }).__confirmFolder }),
    });
    setSaving(false);
    if (res.status === 409) {
      const json = await res.json();
      if (json.existing && json.lastId) {
        const ok = confirm(`${json.error}\n\nAceptar = crear otra. Cancelar = abrir la última.`);
        if (!ok) {
          router.push(`/carpetas/${json.lastId}`);
          return;
        }
        (window as unknown as { __confirmFolder?: boolean }).__confirmFolder = true;
        setSaving(true);
        const retry = await fetch("/api/folder-reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teacherId, payload, confirmNew: true }),
        });
        setSaving(false);
        if (!retry.ok) {
          setError("No se pudo guardar.");
          return;
        }
        const row = await retry.json();
        await clearDraft("folder", teacherId, reviewId);
        router.push(`/resultados/maestro/${row.teacherId}`);
        return;
      }
      setError(json.error || "Conflicto al guardar.");
      return;
    }
    if (!res.ok) {
      setError("No se pudo guardar.");
      return;
    }
    const row = await res.json();
    await clearDraft("folder", teacherId, reviewId);
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
            {showEtapa && <h2 className="mt-6 text-lg font-bold text-[#6a0938]">{item.etapa}</h2>}
            {showSub && <h3 className="mt-2 text-sm font-semibold text-[#6a0938]">{item.sub}</h3>}
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
                className="accent-[#6a0938]"
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
        <div className="mt-4">
          {payload.firmaDataUrl ? (
            <div className="rounded-xl border border-[#e6dcc8] bg-white p-3">
              <p className="text-sm font-medium text-[#6a0938]">{payload.firmaNombre || "Firmado"}</p>
              <img src={payload.firmaDataUrl} alt="Firma" className="mt-2 max-h-20 rounded border border-[#e6dcc8]" />
              <button
                type="button"
                className="mt-2 cursor-pointer text-sm text-[#6a0938] underline"
                onClick={() => {
                  setSignName(payload.verificadorNombre || payload.firmaNombre);
                  setSignPad("");
                  setSignOpen(true);
                }}
              >
                Cambiar firma
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="cursor-pointer rounded-xl bg-[#6a0938] px-6 py-2.5 font-semibold text-white"
              onClick={() => {
                setSignName(payload.verificadorNombre || payload.firmaNombre);
                setSignPad("");
                setSignOpen(true);
              }}
            >
              Firmar
            </button>
          )}
        </div>
      </div>

      {signOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSignOpen(false)}
        >
          <div
            className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-2xl bg-[#fffdf8] p-5 ring-1 ring-[#e6dcc8]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-3 font-semibold text-[#6a0938]">Firmar revisión de carpeta</p>
            <label className="block text-sm">
              Nombre
              <input
                className="mt-1 w-full rounded-lg border border-[#d9c9a3] px-3 py-2"
                value={signName}
                onChange={(e) => setSignName(e.target.value)}
                placeholder="Nombre del verificador"
                autoFocus
              />
            </label>
            <p className="mb-1 mt-3 text-sm">Firme con el dedo o el mouse</p>
            <SignaturePad key={signOpen ? "open" : "closed"} onChange={setSignPad} />
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!signName.trim() || !signPad}
                className="cursor-pointer rounded-xl bg-[#6a0938] px-5 py-2 font-semibold text-white disabled:opacity-50"
                onClick={() => {
                  setPayload({
                    ...payload,
                    firmaNombre: signName.trim(),
                    firmaDataUrl: signPad,
                    firmaDocente: signName.trim(),
                    verificadorNombre: signName.trim(),
                  });
                  setSignOpen(false);
                }}
              >
                Guardar firma
              </button>
              <button type="button" className="cursor-pointer text-sm underline" onClick={() => setSignOpen(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="h-20" />
      <div className="no-print fixed inset-x-0 bottom-0 z-30 flex flex-col items-center border-t border-[#d9c9a3] bg-[#fffdf8] px-4 py-3">
        {!payload.firmaDataUrl?.startsWith("data:image") && (
          <p className="mb-2 text-center text-xs text-[#6a0938]">Firme para poder guardar.</p>
        )}
        <button
          type="submit"
          disabled={saving || !payload.firmaDataUrl?.startsWith("data:image")}
          className="cursor-pointer rounded-xl bg-[#6a0938] px-6 py-2.5 font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Guardar revisión"}
        </button>
      </div>
    </form>
  );
}
