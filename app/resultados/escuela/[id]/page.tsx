"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Bar, maestrosEvaluados } from "@/components/Bar";
import { InstitutionHeader } from "@/components/InstitutionHeader";
import { ItemStatsPanel } from "@/components/ItemStatsPanel";
import { Loading } from "@/components/Loading";
import { Select } from "@/components/Select";
import { ShareActions } from "@/components/ShareActions";
import { ACK_CLASS, ACK_LABELS } from "@/lib/ack-labels";
import { folderYesPercent, type FolderPayload } from "@/lib/folder-form";
import { visitYesPercent, type VisitPayload } from "@/lib/visit-form";

type AckRow = {
  status: keyof typeof ACK_LABELS;
  ack: { agreed: boolean; firmaDataUrl: string; comentario: string; signedAt: string } | null;
};

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
  const [acks, setAcks] = useState<Record<string, AckRow>>({});

  useEffect(() => {
    Promise.all([
      fetch("/api/schools").then((r) => r.json()),
      fetch(`/api/teachers?schoolId=${id}`).then((r) => r.json()),
      fetch(`/api/folder-reviews?schoolId=${id}`).then((r) => r.json()),
      fetch(`/api/class-visits?schoolId=${id}`).then((r) => r.json()),
      fetch("/api/acknowledgments").then((r) => r.json()),
    ]).then(([schools, tlist, folders, visits, ackRows]) => {
      const s = schools.find((x: { id: string }) => x.id === id);
      setSchool(s);
      const merged = tlist.map((t: { id: string; name: string; disciplina: string }) => ({
        ...t,
        folderReviews: folders.filter((f: { teacherId: string }) => f.teacherId === t.id),
        classVisits: visits.filter((v: { teacherId: string }) => v.teacherId === t.id),
      }));
      setTeachers(merged);
      setAcks(
        Object.fromEntries(
          (
            ackRows as {
              teacherId: string;
              status: keyof typeof ACK_LABELS;
              ack: AckRow["ack"];
            }[]
          ).map((r) => [r.teacherId, { status: r.status, ack: r.ack }])
        )
      );
    });
  }, [id]);

  if (!school) return <Loading />;

  const avg = (a: number[]) => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <InstitutionHeader title={`Resultados · ${school.shortName}`} />
      <p className="mb-2 text-center text-sm">{school.name}</p>
      <p className="mb-4 text-center text-xs">{school.cct}</p>
      <ShareActions
        sharePath={view === "escuela" ? `/api/schools/${id}/share` : `/api/teachers/${view}/share`}
        includeAckLink={view !== "escuela"}
        signature={
          view !== "escuela" && acks[view]?.ack?.firmaDataUrl
            ? {
                image: acks[view].ack!.firmaDataUrl,
                agreed: acks[view].ack!.agreed,
                signedAt: acks[view].ack!.signedAt,
                comment: acks[view].ack!.comentario,
                teacherName: teachers.find((t) => t.id === view)?.name,
              }
            : null
        }
        message={
          view === "escuela"
            ? `Supervisión de Zona X comparte los resultados de ${school.shortName} (${school.cct}), ciclo 2026-2027.`
            : `Hola ${teachers.find((t) => t.id === view)?.name ?? ""}. Supervisión de Zona X le comparte el resumen de su evaluación (ciclo 2026-2027).`
        }
      />
      <div className="no-print mb-4">
        <label className="block text-sm font-medium">
          Ver
          <Select
            className="mt-1"
            value={view}
            onChange={setView}
            options={[
              { value: "escuela", label: "Resultados globales de la escuela" },
              ...teachers.map((t) => ({ value: t.id, label: t.name })),
            ]}
          />
        </label>
      </div>
      <div className="mb-6 rounded-2xl bg-[#fffdf8] p-5 ring-1 ring-[#e6dcc8]">
        <Bar
          label="Carpetas"
          pct={teachers.length ? Math.round((100 * teachers.filter((t) => t.folderReviews.length).length) / teachers.length) : 0}
          value={maestrosEvaluados(teachers.filter((t) => t.folderReviews.length).length)}
        />
        <Bar
          label="Acompañamiento"
          pct={teachers.length ? Math.round((100 * teachers.filter((t) => t.classVisits.length).length) / teachers.length) : 0}
          value={maestrosEvaluados(teachers.filter((t) => t.classVisits.length).length)}
        />
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
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <Link href={`/resultados/maestro/${t.id}`} className="font-medium text-[#6a0938]">
                  {t.name}
                </Link>
                {acks[t.id] && (
                  <span className={`rounded-full px-2 py-0.5 text-xs ${ACK_CLASS[acks[t.id].status]}`}>
                    {ACK_LABELS[acks[t.id].status]}
                  </span>
                )}
              </div>
              <p className="mb-2 text-xs text-[#5a6b5e]">
                {t.disciplina} · Carpetas {fp}% · Observación {vp}%
              </p>
              <ShareActions
                sharePath={`/api/teachers/${t.id}/share`}
                includeAckLink
                signature={
                  acks[t.id]?.ack?.firmaDataUrl
                    ? {
                        image: acks[t.id].ack!.firmaDataUrl,
                        agreed: acks[t.id].ack!.agreed,
                        signedAt: acks[t.id].ack!.signedAt,
                        comment: acks[t.id].ack!.comentario,
                        teacherName: t.name,
                      }
                    : null
                }
                message={`Hola ${t.name}. Supervisión de Zona X le comparte el resumen de su evaluación (ciclo 2026-2027).`}
              />
            </li>
          );
        })}
      </ul>
    </main>
  );
}
