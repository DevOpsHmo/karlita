"use client";

import { useEffect, useState } from "react";
import { Bar } from "@/components/Bar";
import { InstitutionHeader } from "@/components/InstitutionHeader";
import { ItemStatsPanel } from "@/components/ItemStatsPanel";
import { Loading } from "@/components/Loading";
import { ShareActions } from "@/components/ShareActions";

type Stats = {
  zona: { teachers: number; folderReviews: number; classVisits: number; folderPct: number; visitPct: number };
  schools: {
    id: string;
    shortName: string;
    cct: string;
    teachers: number;
    folderReviews: number;
    classVisits: number;
    folderPct: number;
    visitPct: number;
  }[];
};

export default function ZonaPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);
  if (!stats) return <Loading />;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <InstitutionHeader title="Resultados grupales de zona" />
      <ShareActions
        sharePath="/api/zona/share"
        message="Supervisión de Zona X comparte los resultados grupales de las tres escuelas (EST 6, 60 y 72), ciclo 2026-2027."
      />
      <section className="mb-6 rounded-2xl bg-[#fffdf8] p-5 ring-1 ring-[#e6dcc8]">
        <p className="mb-3 text-sm">
          {stats.zona.teachers} docentes · {stats.zona.folderReviews} revisiones de carpeta · {stats.zona.classVisits}{" "}
          observaciones
        </p>
        <Bar label="Zona · carpetas (% Sí)" pct={stats.zona.folderPct} />
        <Bar label="Zona · observación (% Sí)" pct={stats.zona.visitPct} />
      </section>
      <ItemStatsPanel fetchUrl="/api/item-stats?scope=zona" />
      {stats.schools.map((s) => (
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
