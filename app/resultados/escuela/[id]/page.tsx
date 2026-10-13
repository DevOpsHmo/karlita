"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Bar } from "@/components/Bar";
import { InstitutionHeader } from "@/components/InstitutionHeader";
import { ItemStatsPanel } from "@/components/ItemStatsPanel";
import { Loading } from "@/components/Loading";
import { ShareActions } from "@/components/ShareActions";
import { folderYesPercent, type FolderPayload } from "@/lib/folder-form";
import { visitYesPercent, type VisitPayload } from "@/lib/visit-form";

export default function EscuelaPage() {
  const { id } = useParams<{ id: string }>();
  const [school, setSchool] = useState<{ name: string; shortName: string; cct: string } | null>(null);
  const [view, setView] = useState<"escuela" | string>("escuela");
  const [teachers, setTeachers] = useState<
    {
      id: string;
      name: string;
      disciplina: string;
      folderReviews: { payload: string }[];
      classVisits: { payload: string }[];
    }[]
  >([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/schools").then((r) => r.json()),
      fetch(`/api/teachers?schoolId=${id}`).then((r) => r.json()),
      fetch(`/api/folder-reviews?schoolId=${id}`).then((r) => r.json()),
      fetch(`/api/class-visits?schoolId=${id}`).then((r) => r.json()),
    ]).then(([schools, tlist, folders, visits]) => {
      const s = schools.find((x: { id: string }) => x.id === id);
      setSchool(s);
      const merged = tlist.map((t: { id: string; name: string; disciplina: string }) => ({
        ...t,
        folderReviews: folders.filter((f: { teacherId: string }) => f.teacherId === t.id),
        classVisits: visits.filter((v: { teacherId: string }) => v.teacherId === t.id),
      }));
      setTeachers(merged);
    });
  }, [id]);

  if (!school) return <Loading />;

  const folderPcts = teachers.flatMap((t) =>
    t.folderReviews.map((r) => folderYesPercent(JSON.parse(r.payload) as FolderPayload).pct)
  );
  const visitPcts = teachers.flatMap((t) =>
    t.classVisits.map((r) => visitYesPercent(JSON.parse(r.payload) as VisitPayload).pct)
  );
  const avg = (a: number[]) => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <InstitutionHeader title={`Resultados · ${school.shortName}`} />
      <p className="mb-2 text-center text-sm">{school.name}</p>
      <p className="mb-4 text-center text-xs">{school.cct}</p>
      <ShareActions
        sharePath={view === "escuela" ? `/api/schools/${id}/share` : `/api/teachers/${view}/share`}
        includeAckLink={view !== "escuela"}
        message={
          view === "escuela"
            ? `Supervisión de Zona X comparte los resultados de ${school.shortName} (${school.cct}), ciclo 2026-2027.`
            : `Hola ${teachers.find((t) => t.id === view)?.name ?? ""}. Supervisión de Zona X le comparte el resumen de su evaluación (ciclo 2026-2027).`
        }
      />
      <div className="no-print mb-4">
        <label className="text-sm font-medium">Ver{" "}
          <select
            className="ml-2 rounded-lg border border-[#d9c9a3] px-2 py-1"
            value={view}
            onChange={(e) => setView(e.target.value)}
          >
            <option value="escuela">Resultados globales de la escuela</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mb-6 rounded-2xl bg-[#fffdf8] p-5 ring-1 ring-[#e6dcc8]">
        <Bar label="Carpetas (% Sí)" pct={avg(folderPcts)} />
        <Bar label="Observación (% Sí)" pct={avg(visitPcts)} />
      </div>
      <ItemStatsPanel
        emptyLabel={`Aún no hay revisiones en ${school.shortName}.`}
        fetchUrl={
          view === "escuela"
            ? `/api/item-stats?scope=escuela&id=${id}`
            : `/api/item-stats?scope=maestro&id=${view}`
        }
      />
      <ul className="space-y-2">
        {teachers.map((t) => {
          const fp = avg(t.folderReviews.map((r) => folderYesPercent(JSON.parse(r.payload) as FolderPayload).pct));
          const vp = avg(t.classVisits.map((r) => visitYesPercent(JSON.parse(r.payload) as VisitPayload).pct));
          return (
            <li key={t.id} className="rounded-xl bg-[#fffdf8] px-4 py-3 ring-1 ring-[#e6dcc8]">
              <Link href={`/resultados/maestro/${t.id}`} className="font-medium text-[#6a0938]">
                {t.name}
              </Link>
              <p className="mb-2 text-xs text-[#5a6b5e]">
                {t.disciplina} · Carpetas {fp}% · Observación {vp}%
              </p>
              <ShareActions
                sharePath={`/api/teachers/${t.id}/share`}
                includeAckLink
                message={`Hola ${t.name}. Supervisión de Zona X le comparte el resumen de su evaluación (ciclo 2026-2027).`}
              />
            </li>
          );
        })}
      </ul>
    </main>
  );
}
