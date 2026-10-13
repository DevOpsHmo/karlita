"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Bar } from "@/components/Bar";
import { InstitutionHeader } from "@/components/InstitutionHeader";
import { PrintOnly } from "@/components/ShareActions";

type Report = {
  zona: { teachers: number; folderPct: number; visitPct: number };
  schools: { id: string; shortName: string; cct: string; teachers: number; folderPct: number; visitPct: number }[];
};

export default function PublicZonaPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<Report | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/public/zona/${token}`)
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
      <InstitutionHeader title="Resultados grupales de zona" />
      <p className="mb-3 text-center text-sm text-[#5a6b5e]">
        Reporte de zona: solo consulta e impresión. No se solicita firma.
      </p>
      <PrintOnly />
      <section className="mb-6 rounded-2xl bg-[#fffdf8] p-5 ring-1 ring-[#e6dcc8]">
        <p className="mb-3 text-sm">{data.zona.teachers} docentes en las tres escuelas</p>
        <Bar label="Zona · carpetas (% Sí)" pct={data.zona.folderPct} />
        <Bar label="Zona · observación (% Sí)" pct={data.zona.visitPct} />
      </section>
      {data.schools.map((s) => (
        <section key={s.id} className="mb-4 rounded-2xl bg-[#fffdf8] p-5 ring-1 ring-[#e6dcc8]">
          <h2 className="font-bold">
            {s.shortName} <span className="text-sm font-normal">{s.cct}</span>
          </h2>
          <Bar label="Carpetas" pct={s.folderPct} />
          <Bar label="Observación" pct={s.visitPct} />
        </section>
      ))}
    </main>
  );
}
