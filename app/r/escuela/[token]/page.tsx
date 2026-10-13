"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Bar } from "@/components/Bar";
import { InstitutionHeader } from "@/components/InstitutionHeader";
import { PrintOnly } from "@/components/ShareActions";

type Report = {
  school: { name: string; shortName: string; cct: string };
  folderPct: number;
  visitPct: number;
  teachers: { name: string; disciplina: string; folderPct: number; visitPct: number }[];
};

export default function PublicEscuelaPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<Report | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/public/escuela/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      });
  }, [token]);

  if (error) return <p className="p-8 text-red-700">{error}</p>;
  if (!data) return <p className="p-8">Cargando…</p>;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <InstitutionHeader title={`Resultados · ${data.school.shortName}`} />
      <p className="mb-2 text-center text-sm">{data.school.name}</p>
      <p className="mb-4 text-center text-xs">{data.school.cct}</p>
      <p className="mb-3 text-center text-sm text-[#5a6b5e]">
        Reporte de escuela: solo consulta e impresión. No se solicita firma.
      </p>
      <PrintOnly />
      <div className="mb-6 rounded-2xl bg-[#fffdf8] p-5 ring-1 ring-[#e6dcc8]">
        <Bar label="Carpetas (% Sí)" pct={data.folderPct} />
        <Bar label="Observación (% Sí)" pct={data.visitPct} />
      </div>
      <ul className="space-y-2">
        {data.teachers.map((t) => (
          <li key={t.name} className="rounded-xl bg-[#fffdf8] px-4 py-3 ring-1 ring-[#e6dcc8]">
            <p className="font-medium">{t.name}</p>
            <p className="text-xs text-[#5a6b5e]">
              {t.disciplina} · Carpetas {t.folderPct}% · Observación {t.visitPct}%
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
