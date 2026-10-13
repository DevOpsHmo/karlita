"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ALUMNO_ACTIVITIES,
  CIERRE_ITEMS,
  OBSERVER_ROLES,
  QUALITY,
  emptyVisitPayload,
  type VisitPayload,
} from "@/lib/visit-form";
import { clearDraft, useCloudDraft } from "@/lib/use-draft";
import { InstitutionHeader } from "./InstitutionHeader";
import { TeacherSelect } from "./TeacherSelect";
import { Select, TURNO_OPTIONS } from "./Select";
import { YesNo } from "./YesNo";

export function VisitForm({
  initialTeacherId,
  initialSchoolId,
  initialPayload,
  visitId,
}: {
  initialTeacherId?: string;
  initialSchoolId?: string;
  initialPayload?: VisitPayload;
  visitId?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [schoolId, setSchoolId] = useState(initialSchoolId ?? "");
  const [teacherId, setTeacherId] = useState(initialTeacherId ?? params.get("teacher") ?? "");
  const [payload, setPayload] = useState<VisitPayload>(initialPayload ?? emptyVisitPayload());
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
    kind: "visit",
    enabled: !visitId,
    schoolId,
    teacherId,
    payload,
    onRestore: (d) => {
      if (d.payload) setPayload({ ...emptyVisitPayload(), ...(d.payload as VisitPayload) });
      if (d.schoolId) setSchoolId(d.schoolId);
      setDraftHint("Se recuperó el avance de este maestro. Puede continuar donde se quedó.");
    },
    onNoDraft: () => {
      setPayload((p) => ({ ...emptyVisitPayload(), asignatura: p.asignatura, turno: p.turno }));
      setDraftHint("");
    },
  });

  const onTeacherMeta = useCallback((t: { disciplina: string; turno: string } | null) => {
    if (!t) return;
    setPayload((p) => ({
      ...p,
      asignatura: p.asignatura || t.disciplina,
      turno: p.turno || t.turno,
    }));
  }, []);

  function toggle(list: string[], value: string) {
    return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!teacherId) {
      setError("Seleccione o registre un docente.");
      return;
    }
    setSaving(true);
    const url = visitId ? `/api/class-visits/${visitId}` : "/api/class-visits";
    const res = await fetch(url, {
      method: visitId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId, payload }),
    });
    setSaving(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error || "No se pudo guardar.");
      return;
    }
    const row = await res.json();
    await clearDraft("visit", teacherId);
    router.push(`/resultados/maestro/${row.teacherId}`);
  }

  const card = "rounded-2xl bg-[#fffdf8] p-4 shadow-sm ring-1 ring-[#e6dcc8]";

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-4 px-4 py-6">
      <InstitutionHeader title="Acompañamiento y observación de clase" />
      {draftHint && (
        <p className="rounded-lg bg-[#c4a35a] px-3 py-3 text-sm font-semibold text-[#6a0938]">
          Continuar donde me quedé: se recuperó el avance de esta observación.
        </p>
      )}
      <p className="text-xs text-[#5a6b5e]">El avance se guarda solo por sección, aunque se cierre la pestaña o se cambie de app.</p>
      <div className={card}>
        <TeacherSelect
          schoolId={schoolId}
          teacherId={teacherId}
          onSchool={setSchoolId}
          onTeacher={setTeacherId}
          onTeacherMeta={onTeacherMeta}
        />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(
            [
              ["asignatura", "Asignatura"],
              ["horario", "Horario"],
              ["grado", "Grado"],
              ["grupo", "Grupo"],
              ["noAlumnos", "No. alumnos"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="text-sm">
              {label}
              <input
                className="mt-1 w-full rounded-lg border border-[#d9c9a3] px-3 py-2"
                value={payload[key]}
                onChange={(e) => setPayload({ ...payload, [key]: e.target.value })}
              />
            </label>
          ))}
          <label className="text-sm">
            Turno
            <Select
              className="mt-1"
              value={payload.turno}
              onChange={(turno) => setPayload({ ...payload, turno })}
              options={TURNO_OPTIONS}
            />
          </label>
        </div>
      </div>

      <h2 className="text-lg font-bold text-[#6a0938]">A. Previo</h2>
      <div className={card}>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium">¿Está puntual en el salón de clases?</p>
            <YesNo name="puntual" value={payload.puntual} onChange={(v) => setPayload({ ...payload, puntual: v })} />
            <input
              className="mt-2 w-full rounded-lg border border-[#d9c9a3] px-3 py-2 text-sm"
              placeholder="Observaciones"
              value={payload.puntualObs}
              onChange={(e) => setPayload({ ...payload, puntualObs: e.target.value })}
            />
          </div>
          <div>
            <p className="text-sm font-medium">¿Registró la asistencia de los alumnos?</p>
            <YesNo
              name="asistencia"
              value={payload.asistencia}
              onChange={(v) => setPayload({ ...payload, asistencia: v })}
            />
            <input
              className="mt-2 w-full rounded-lg border border-[#d9c9a3] px-3 py-2 text-sm"
              placeholder="Observaciones"
              value={payload.asistenciaObs}
              onChange={(e) => setPayload({ ...payload, asistenciaObs: e.target.value })}
            />
          </div>
          <label className="block text-sm">
            Tiempo utilizado desde que ingresa al aula hasta que inicia su clase
            <input
              className="mt-1 w-full rounded-lg border border-[#d9c9a3] px-3 py-2"
              value={payload.tiempoInicio}
              onChange={(e) => setPayload({ ...payload, tiempoInicio: e.target.value })}
            />
          </label>
        </div>
      </div>

      <h2 className="text-lg font-bold text-[#6a0938]">B. Apertura</h2>
      <div className={card}>
        <p className="text-sm font-medium">Actividades que el docente realiza antes de iniciar su clase</p>
        <div className="mt-2 flex flex-col gap-2">
          {["Revisa tareas", "Da a conocer información", "Organiza algún evento"].map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-[#6a0938]"
                checked={payload.aperturaAntes.includes(opt)}
                onChange={() => setPayload({ ...payload, aperturaAntes: toggle(payload.aperturaAntes, opt) })}
              />
              {opt}
            </label>
          ))}
          <input
            className="rounded-lg border border-[#d9c9a3] px-3 py-2 text-sm"
            placeholder="Otra"
            value={payload.aperturaAntesOtra}
            onChange={(e) => setPayload({ ...payload, aperturaAntesOtra: e.target.value })}
          />
        </div>
        <p className="mt-4 text-sm font-medium">Cómo inició el tratamiento del tema o contenido</p>
        <div className="mt-2 flex flex-col gap-2">
          {[
            "Pregunta a los alumnos",
            "Lee un texto",
            "Propone una situación o problema",
            "Recuerda lo visto en la clase anterior",
            "Utiliza música o video",
            "Plantea un juego",
          ].map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-[#6a0938]"
                checked={payload.aperturaInicio.includes(opt)}
                onChange={() => setPayload({ ...payload, aperturaInicio: toggle(payload.aperturaInicio, opt) })}
              />
              {opt}
            </label>
          ))}
          <input
            className="rounded-lg border border-[#d9c9a3] px-3 py-2 text-sm"
            placeholder="Otros"
            value={payload.aperturaInicioOtra}
            onChange={(e) => setPayload({ ...payload, aperturaInicioOtra: e.target.value })}
          />
        </div>
      </div>

      <h2 className="text-lg font-bold text-[#6a0938]">C. Desarrollo</h2>
      <div className={card}>
        <label className="block text-sm font-medium">
          Estrategias didácticas (instrucciones, materiales, preguntas, equipos)
          <textarea
            className="mt-1 w-full rounded-lg border border-[#d9c9a3] px-3 py-2"
            rows={4}
            value={payload.estrategias}
            onChange={(e) => setPayload({ ...payload, estrategias: e.target.value })}
          />
        </label>
        <p className="mt-3 text-sm font-medium">
          ¿Desarrolla con los alumnos estrategias acordadas en los CTE respecto a metodologías de proyectos sugeridos?
        </p>
        <YesNo
          name="cte"
          value={payload.cteProyectos}
          onChange={(v) => setPayload({ ...payload, cteProyectos: v })}
        />
        <input
          className="mt-2 w-full rounded-lg border border-[#d9c9a3] px-3 py-2 text-sm"
          placeholder="Observaciones"
          value={payload.cteProyectosObs}
          onChange={(e) => setPayload({ ...payload, cteProyectosObs: e.target.value })}
        />
        <p className="mt-4 text-sm font-semibold">Actividades del alumno</p>
        {ALUMNO_ACTIVITIES.map((a) => (
          <div key={a.id} className="mt-3 border-t border-[#efe6d4] pt-3">
            <p className="text-sm">{a.label}</p>
            <YesNo
              name={a.id}
              value={payload.alumnos[a.id]?.valor ?? ""}
              onChange={(v) =>
                setPayload({
                  ...payload,
                  alumnos: { ...payload.alumnos, [a.id]: { ...payload.alumnos[a.id], valor: v } },
                })
              }
            />
            <input
              className="mt-1 w-full rounded-lg border border-[#d9c9a3] px-3 py-2 text-sm"
              placeholder="Notas"
              value={payload.alumnos[a.id]?.obs ?? ""}
              onChange={(e) =>
                setPayload({
                  ...payload,
                  alumnos: { ...payload.alumnos, [a.id]: { ...payload.alumnos[a.id], obs: e.target.value } },
                })
              }
            />
          </div>
        ))}
      </div>

      <h2 className="text-lg font-bold text-[#6a0938]">D. Cierre</h2>
      <div className={card}>
        {CIERRE_ITEMS.map((c) => (
          <div key={c.id} className="mt-3 border-t border-[#efe6d4] pt-3 first:mt-0 first:border-0 first:pt-0">
            <p className="text-sm">{c.label}</p>
            <YesNo
              name={c.id}
              value={payload.cierre[c.id]?.valor ?? ""}
              onChange={(v) =>
                setPayload({
                  ...payload,
                  cierre: { ...payload.cierre, [c.id]: { ...payload.cierre[c.id], valor: v } },
                })
              }
            />
            <input
              className="mt-1 w-full rounded-lg border border-[#d9c9a3] px-3 py-2 text-sm"
              placeholder="Notas"
              value={payload.cierre[c.id]?.obs ?? ""}
              onChange={(e) =>
                setPayload({
                  ...payload,
                  cierre: { ...payload.cierre, [c.id]: { ...payload.cierre[c.id], obs: e.target.value } },
                })
              }
            />
          </div>
        ))}
      </div>

      <h2 className="text-lg font-bold text-[#6a0938]">E. Aspectos generales</h2>
      <div className={card}>
        {(
          [
            ["salud", "Nivel de seguridad, higiene y seguimiento a protocolos de salud"],
            ["infraestructura", "Condiciones de infraestructura en el aula"],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="mb-3">
            <p className="text-sm font-medium">{label}</p>
            <div className="mt-1 flex flex-wrap gap-3">
              {QUALITY.map((q) => (
                <label key={q} className="flex items-center gap-1 text-sm">
                  <input
                    type="radio"
                    name={key}
                    className="accent-[#6a0938]"
                    checked={payload[key] === q}
                    onChange={() => setPayload({ ...payload, [key]: q })}
                  />
                  {q}
                </label>
              ))}
            </div>
          </div>
        ))}
        <p className="text-sm font-medium">Relación maestro-alumno</p>
        <div className="mt-1 flex flex-wrap gap-3">
          {["De respeto", "De pares", "Irrespetuosa", "Otra"].map((q) => (
            <label key={q} className="flex items-center gap-1 text-sm">
              <input
                type="radio"
                name="relacion"
                className="accent-[#6a0938]"
                checked={payload.relacion === q}
                onChange={() => setPayload({ ...payload, relacion: q })}
              />
              {q}
            </label>
          ))}
        </div>
        {payload.relacion === "Otra" && (
          <input
            className="mt-2 w-full rounded-lg border border-[#d9c9a3] px-3 py-2"
            value={payload.relacionOtra}
            onChange={(e) => setPayload({ ...payload, relacionOtra: e.target.value })}
          />
        )}
      </div>

      <h2 className="text-lg font-bold text-[#6a0938]">F. Planeación</h2>
      <div className={card}>
        {(
          [
            ["programaAnalitico", "¿Cuenta el docente con el programa analítico de su disciplina para este ciclo?"],
            ["planeacionActualizada", "¿Tiene la planeación didáctica actualizada en el salón de clases?"],
            ["plan2022", "¿Aplica el programa correspondiente al Plan de Estudios 2022?"],
            ["coincidenEnfoque", "¿Coinciden con el enfoque de la asignatura las actividades y temas planeados?"],
            [
              "correspondenPeriodos",
              "Los contenidos desarrollados ¿corresponden al programa analítico con temporalidad (periodos I, II y III)?",
            ],
            ["campoFormativo", "¿Elaboró la planeación didáctica con ayuda de los maestros de su campo formativo?"],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="mb-3">
            <p className="text-sm">{label}</p>
            <YesNo name={key} value={payload[key]} onChange={(v) => setPayload({ ...payload, [key]: v })} />
          </div>
        ))}
        <p className="text-sm font-medium">Para desarrollar el tema, el docente se basa en:</p>
        <div className="mb-3 mt-1 flex flex-col gap-1">
          {["Programa analítico del ciclo escolar", "Libro de texto gratuito", "Otros"].map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-[#6a0938]"
                checked={payload.seBasaEn.includes(opt)}
                onChange={() => setPayload({ ...payload, seBasaEn: toggle(payload.seBasaEn, opt) })}
              />
              {opt}
            </label>
          ))}
        </div>
        <p className="text-sm font-medium">Las actividades desarrolladas son:</p>
        <div className="mb-3 mt-1 flex flex-col gap-1">
          {["Nuevas", "Repaso", "Continuación del tema"].map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-[#6a0938]"
                checked={payload.actividadesTipo.includes(opt)}
                onChange={() => setPayload({ ...payload, actividadesTipo: toggle(payload.actividadesTipo, opt) })}
              />
              {opt}
            </label>
          ))}
        </div>
        <label className="block text-sm">
          ¿Qué curso, taller o capacitación consideras necesario para fortalecer el desarrollo profesional?
          <textarea
            className="mt-1 w-full rounded-lg border border-[#d9c9a3] px-3 py-2"
            rows={3}
            value={payload.capacitacion}
            onChange={(e) => setPayload({ ...payload, capacitacion: e.target.value })}
          />
        </label>
      </div>

      <div className={card}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Firma del maestro(a)
            <input
              className="mt-1 w-full rounded-lg border border-[#d9c9a3] px-3 py-2"
              value={payload.firmaMaestro}
              onChange={(e) => setPayload({ ...payload, firmaMaestro: e.target.value })}
            />
          </label>
          <label className="text-sm">
            Firma del observador(a)
            <input
              className="mt-1 w-full rounded-lg border border-[#d9c9a3] px-3 py-2"
              value={payload.firmaObservador}
              onChange={(e) => setPayload({ ...payload, firmaObservador: e.target.value })}
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Hermosillo, Sonora — fecha
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-[#d9c9a3] px-3 py-2"
              value={payload.fecha}
              onChange={(e) => setPayload({ ...payload, fecha: e.target.value })}
            />
          </label>
        </div>
        <p className="mt-3 text-sm font-semibold">Rol del observador</p>
        <div className="mt-1 flex flex-wrap gap-3">
          {OBSERVER_ROLES.map((role) => (
            <label key={role} className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                className="accent-[#6a0938]"
                checked={payload.roles.includes(role)}
                onChange={() => setPayload({ ...payload, roles: toggle(payload.roles, role) })}
              />
              {role}
            </label>
          ))}
        </div>
        <label className="mt-3 block text-sm">
          Observaciones generales
          <textarea
            className="mt-1 w-full rounded-lg border border-[#d9c9a3] px-3 py-2"
            rows={4}
            value={payload.observacionesGenerales}
            onChange={(e) => setPayload({ ...payload, observacionesGenerales: e.target.value })}
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="h-20" />
      <div className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-[#d9c9a3] bg-[#fffdf8] px-4 py-3">
        <button
          type="submit"
          disabled={saving}
          className="w-full cursor-pointer rounded-xl bg-[#6a0938] py-3 font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Guardar observación"}
        </button>
      </div>
    </form>
  );
}
