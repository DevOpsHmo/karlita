"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bar } from "@/components/Bar";
import { ShareActions } from "@/components/ShareActions";
import { Loading } from "@/components/Loading";
import { ACK_CLASS, ACK_LABELS } from "@/lib/ack-labels";

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
  const [acks, setAcks] = useState<Record<string, keyof typeof ACK_LABELS>>({});
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
      .then((rows: { teacherId: string; status: keyof typeof ACK_LABELS }[]) => {
        setAcks(Object.fromEntries(rows.map((r) => [r.teacherId, r.status])));
      });
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
      <div className="no-print mb-3 flex flex-wrap gap-2 text-sm">
        <select
          className="rounded-lg border border-[#d9c9a3] px-2 py-1"
          value={schoolFilter}
          onChange={(e) => setSchoolFilter(e.target.value)}
        >
          <option value="">Todas las escuelas</option>
          {stats.schools.map((s) => (
            <option key={s.id} value={s.shortName}>
              {s.shortName}
            </option>
          ))}
        </select>
        <select
          className="rounded-lg border border-[#d9c9a3] px-2 py-1"
          value={ackFilter}
          onChange={(e) => setAckFilter(e.target.value)}
        >
          <option value="">Todo estado de firma</option>
          <option value="pendiente">Pendiente</option>
          <option value="de_acuerdo">De acuerdo</option>
          <option value="en_desacuerdo">En desacuerdo</option>
          <option value="nueva_revision">Nueva revisión</option>
        </select>
      </div>
      <ul className="space-y-2">
        {teachers
          .filter((t) => !schoolFilter || t.school.shortName === schoolFilter)
          .filter((t) => !ackFilter || acks[t.id] === ackFilter)
          .map((t) => (
          <li key={t.id}>
            <Link
              href={`/resultados/maestro/${t.id}`}
              className="block rounded-xl bg-[#fffdf8] px-4 py-3 ring-1 ring-[#e6dcc8]"
            >
              {t.name}{" "}
              <span className="text-sm text-[#5a6b5e]">· {t.school.shortName}</span>
              {acks[t.id] && (
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${ACK_CLASS[acks[t.id]]}`}>
                  {ACK_LABELS[acks[t.id]]}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
