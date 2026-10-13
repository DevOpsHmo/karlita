"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bar } from "@/components/Bar";
import { ShareActions } from "@/components/ShareActions";
import { Loading } from "@/components/Loading";
import { ACK_CLASS, ACK_LABELS } from "@/lib/ack-labels";
import { Select } from "@/components/Select";
import { ViewSignatureButton } from "@/components/ViewSignature";

type Stats = {
  zona: { teachers: number; folderReviews: number; classVisits: number; folderPct: number; visitPct: number };
  schools: {
    id: string;
    name: string;
    shortName: string;
    cct: string;
    teachers: number;
    folderReviews: number;
    classVisits: number;
    folderPct: number;
    visitPct: number;
  }[];
};

export default function ResultadosPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [teachers, setTeachers] = useState<{ id: string; name: string; school: { shortName: string } }[]>([]);
  const [acks, setAcks] = useState<
    Record<
      string,
      {
        status: keyof typeof ACK_LABELS;
        ack: { agreed: boolean; firmaDataUrl: string; comentario: string; signedAt: string } | null;
      }
    >
  >({});
  const [alerts, setAlerts] = useState<{ text: string }[]>([]);
  const [schoolFilter, setSchoolFilter] = useState("");
  const [ackFilter, setAckFilter] = useState("");

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats);
    fetch("/api/teachers")
      .then((r) => r.json())
      .then(setTeachers);
    fetch("/api/acknowledgments")
      .then((r) => r.json())
      .then(
        (
          rows: {
            teacherId: string;
            status: keyof typeof ACK_LABELS;
            ack: { agreed: boolean; firmaDataUrl: string; comentario: string; signedAt: string } | null;
          }[]
        ) => {
          setAcks(Object.fromEntries(rows.map((r) => [r.teacherId, { status: r.status, ack: r.ack }])));
        }
      );
    fetch("/api/alerts")
      .then((r) => r.json())
      .then((d) => setAlerts(d.alerts ?? []));
  }, []);

  if (!stats) return <Loading />;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-[#6a0938]">Resultados</h1>
      <p className="mb-6 text-sm text-[#5a6b5e]">Ciclo 2026-2027 · Zona Escolar X · 3 escuelas</p>
      <ShareActions
        sharePath="/api/zona/share"
        message="Supervisión de Zona X comparte los resultados grupales de las tres escuelas (EST 6, 60 y 72), ciclo 2026-2027."
      />
      <a
        href="/api/export/csv?scope=zona"
        className="no-print mb-4 inline-block text-sm text-[#6a0938] underline"
      >
        Exportar CSV de conteos (CTE / jefatura)
      </a>
      {alerts.length > 0 && (
        <ul className="mb-4 space-y-2">
          {alerts.map((a, i) => (
            <li key={i} className="rounded-xl bg-[#fff6e8] px-4 py-2 text-sm ring-1 ring-[#e6dcc8]">
              {a.text}
            </li>
          ))}
        </ul>
      )}

      <section className="mb-6 rounded-2xl bg-[#fffdf8] p-5 ring-1 ring-[#e6dcc8]">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">Zona X</h2>
          <Link href="/resultados/zona" className="text-sm text-[#6a0938] underline">
            Ver detalle
          </Link>
        </div>
        <p className="mb-3 text-sm">
          {stats.zona.teachers} docentes · {stats.zona.folderReviews} carpetas · {stats.zona.classVisits} visitas
        </p>
        <Bar label="% Sí en carpetas" pct={stats.zona.folderPct} />
        <Bar label="% Sí en observación" pct={stats.zona.visitPct} />
      </section>

      {stats.schools.map((s) => (
        <section key={s.id} className="mb-4 rounded-2xl bg-[#fffdf8] p-5 ring-1 ring-[#e6dcc8]">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h2 className="font-bold">{s.shortName}</h2>
              <p className="text-xs text-[#5a6b5e]">{s.cct}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Link href={`/resultados/escuela/${s.id}`} className="text-sm text-[#6a0938] underline">
                Ver escuela
              </Link>
              <ShareActions
                showPrint={true}
                sharePath={`/api/schools/${s.id}/share`}
                message={`Supervisión de Zona X comparte los resultados de ${s.shortName} (${s.cct}), ciclo 2026-2027.`}
              />
            </div>
          </div>
          <p className="mb-2 text-sm">
            {s.teachers} docentes · {s.folderReviews} carpetas · {s.classVisits} visitas
          </p>
          <Bar label="Carpetas" pct={s.folderPct} />
          <Bar label="Observación" pct={s.visitPct} />
        </section>
      ))}

      <h2 className="mb-2 mt-8 font-bold print:mt-0 print:pt-10">Fichas por maestro</h2>
      <div className="no-print mb-3 flex flex-wrap gap-2">
        <Select
          className="min-w-[11.5rem] flex-1 sm:max-w-xs"
          value={schoolFilter}
          onChange={setSchoolFilter}
          options={[
            { value: "", label: "Todas las escuelas" },
            ...stats.schools.map((s) => ({ value: s.shortName, label: s.shortName })),
          ]}
        />
        <Select
          className="min-w-[13rem] flex-1 sm:max-w-xs"
          value={ackFilter}
          onChange={setAckFilter}
          options={[
            { value: "", label: "Todo estado de firma" },
            { value: "pendiente", label: "Pendiente" },
            { value: "de_acuerdo", label: "De acuerdo" },
            { value: "en_desacuerdo", label: "En desacuerdo" },
            { value: "nueva_revision", label: "Nueva revisión" },
          ]}
        />
      </div>
      <ul className="space-y-2">
        {teachers
          .filter((t) => !schoolFilter || t.school.shortName === schoolFilter)
          .filter((t) => !ackFilter || acks[t.id]?.status === ackFilter)
          .map((t) => (
          <li key={t.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-[#fffdf8] px-4 py-3 ring-1 ring-[#e6dcc8]">
            <Link href={`/resultados/maestro/${t.id}`} className="min-w-0 flex-1">
              {t.name}{" "}
              <span className="text-sm text-[#5a6b5e]">· {t.school.shortName}</span>
              {acks[t.id] && (
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${ACK_CLASS[acks[t.id].status]}`}>
                  {ACK_LABELS[acks[t.id].status]}
                </span>
              )}
            </Link>
            {acks[t.id]?.ack?.firmaDataUrl && (
              <ViewSignatureButton
                signature={{
                  image: acks[t.id].ack!.firmaDataUrl,
                  agreed: acks[t.id].ack!.agreed,
                  signedAt: acks[t.id].ack!.signedAt,
                  comment: acks[t.id].ack!.comentario,
                  teacherName: t.name,
                }}
              />
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
