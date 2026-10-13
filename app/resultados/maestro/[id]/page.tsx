"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Bar } from "@/components/Bar";
import { ItemStatsPanel } from "@/components/ItemStatsPanel";
import { ShareActions } from "@/components/ShareActions";
import { InstitutionHeader } from "@/components/InstitutionHeader";
import { Loading } from "@/components/Loading";
import { ACK_CLASS, ACK_LABELS } from "@/lib/ack-labels";
import { FOLDER_ITEMS, folderYesPercent, type FolderPayload } from "@/lib/folder-form";
import { visitYesPercent, type VisitPayload } from "@/lib/visit-form";

type Teacher = {
  id: string;
  name: string;
  disciplina: string;
  turno: string;
  school: { name: string; shortName: string; cct: string };
};

export default function MaestroPage() {
  const { id } = useParams<{ id: string }>();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [folders, setFolders] = useState<{ id: string; createdAt: string; payload: string }[]>([]);
  const [visits, setVisits] = useState<{ id: string; createdAt: string; payload: string }[]>([]);
  const [ackRow, setAckRow] = useState<{
    status: keyof typeof ACK_LABELS;
    ack: { agreed: boolean; nombreFirma: string; firmaDataUrl: string; comentario: string; signedAt: string } | null;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/teachers/${id}`)
      .then((r) => r.json())
      .then(setTeacher);
    fetch(`/api/folder-reviews?teacherId=${id}`)
      .then((r) => r.json())
      .then(setFolders);
    fetch(`/api/class-visits?teacherId=${id}`)
      .then((r) => r.json())
      .then(setVisits);
    fetch("/api/acknowledgments")
      .then((r) => r.json())
      .then((rows) => setAckRow(rows.find((x: { teacherId: string }) => x.teacherId === id) ?? null));
  }, [id]);

  if (!teacher) return <Loading />;

  const lastFolder = folders[0] ? (JSON.parse(folders[0].payload) as FolderPayload) : null;
  const lastVisit = visits[0] ? (JSON.parse(visits[0].payload) as VisitPayload) : null;
  const folderPct = lastFolder ? folderYesPercent(lastFolder).pct : 0;
  const visitPct = lastVisit ? visitYesPercent(lastVisit).pct : 0;
  const nos =
    lastFolder
      ? FOLDER_ITEMS.filter((i) => {
          const row = lastFolder.items[i.id];
          return row && (row.p1 === "no" || row.p2 === "no" || row.p3 === "no");
        })
      : [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <InstitutionHeader title="Ficha individual del docente" />
      <div className="mb-4 rounded-2xl bg-[#fffdf8] p-5 ring-1 ring-[#e6dcc8]">
        <h2 className="text-xl font-bold">{teacher.name}</h2>
        <p className="text-sm">
          {teacher.school.name} · {teacher.school.cct}
        </p>
        <p className="text-sm text-[#5a6b5e]">
          {teacher.disciplina} · {teacher.turno}
        </p>
      </div>
      {ackRow && (
        <p className={`mb-3 inline-block rounded-full px-3 py-1 text-sm font-semibold ${ACK_CLASS[ackRow.status]}`}>
          {ACK_LABELS[ackRow.status]}
        </p>
      )}
      {ackRow?.ack && (
        <div className="mb-4 rounded-2xl bg-[#fffdf8] p-4 text-sm ring-1 ring-[#e6dcc8]">
          <p>
            El docente {ackRow.ack.nombreFirma} firmó el {new Date(ackRow.ack.signedAt).toLocaleString("es-MX")}:{" "}
            <strong>{ackRow.ack.agreed ? "Sí, de acuerdo" : "No de acuerdo"}</strong>
          </p>
          {ackRow.ack.comentario && <p className="mt-1">{ackRow.ack.comentario}</p>}
          {ackRow.ack.firmaDataUrl && (
            <img src={ackRow.ack.firmaDataUrl} alt="Firma del docente" className="mt-2 max-h-20 rounded border" />
          )}
        </div>
      )}
      <ShareActions
        sharePath={`/api/teachers/${id}/share`}
        includeAckLink
        message={`Hola ${teacher.name}. Supervisión de Zona X le comparte el resumen de su evaluación (ciclo 2026-2027).`}
      />
      <div className="no-print mb-4 flex flex-wrap gap-2">
        <Link href={`/carpetas?teacher=${id}`} className="rounded-lg bg-[#c4a35a] px-4 py-2 text-[#123f28]">
          Nueva carpeta
        </Link>
        <Link href={`/acompanamiento?teacher=${id}`} className="rounded-lg bg-[#c4a35a] px-4 py-2 text-[#123f28]">
          Nueva visita
        </Link>
      </div>
      <Bar label="Última revisión de carpetas (% Sí)" pct={folderPct} />
      <Bar label="Última observación de clase (% Sí)" pct={visitPct} />
      <ItemStatsPanel fetchUrl={`/api/item-stats?scope=maestro&id=${id}`} />

      {nos.length > 0 && (
        <section className="mt-4 rounded-2xl bg-[#fffdf8] p-4 ring-1 ring-[#e6dcc8]">
          <h3 className="font-semibold">Ítems en No (última carpeta)</h3>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {nos.map((i) => (
              <li key={i.id}>{i.label}</li>
            ))}
          </ul>
        </section>
      )}

      {lastFolder?.observacionesGenerales && (
        <p className="mt-3 text-sm">
          <strong>Observaciones de carpeta:</strong> {lastFolder.observacionesGenerales}
        </p>
      )}
      {lastVisit?.observacionesGenerales && (
        <p className="mt-3 text-sm">
          <strong>Observaciones de clase:</strong> {lastVisit.observacionesGenerales}
        </p>
      )}

      <h3 className="mt-6 font-semibold">Historial de carpetas</h3>
      <ul className="mt-2 space-y-1 text-sm">
        {folders.map((f) => (
          <li key={f.id}>
            <Link className="text-[#1b5e3b] underline" href={`/carpetas/${f.id}`}>
              {new Date(f.createdAt).toLocaleDateString("es-MX")} · {folderYesPercent(JSON.parse(f.payload) as FolderPayload).pct}% Sí
            </Link>
          </li>
        ))}
        {!folders.length && <li>Sin revisiones aún.</li>}
      </ul>
      <h3 className="mt-4 font-semibold">Historial de visitas</h3>
      <ul className="mt-2 space-y-1 text-sm">
        {visits.map((v) => (
          <li key={v.id}>
            <Link className="text-[#1b5e3b] underline" href={`/acompanamiento/${v.id}`}>
              {new Date(v.createdAt).toLocaleDateString("es-MX")} · {visitYesPercent(JSON.parse(v.payload) as VisitPayload).pct}% Sí
            </Link>
          </li>
        ))}
        {!visits.length && <li>Sin visitas aún.</li>}
      </ul>
    </main>
  );
}

