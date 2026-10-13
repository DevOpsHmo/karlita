"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { InstitutionHeader } from "@/components/InstitutionHeader";
import { ItemStatsPanel, type ItemStatsPayload } from "@/components/ItemStatsPanel";
import { PrintOnly } from "@/components/ShareActions";
import { useAutoPrint } from "@/components/useAutoPrint";
import { ACK_CLASS, ACK_LABELS } from "@/lib/ack-labels";
import { Loading } from "@/components/Loading";

type Review = {
  teacher: { name: string; disciplina: string; turno: string; school?: { name: string; cct: string } };
  folder: { date: string; pct: number; observaciones: string } | null;
  visit: { date: string; pct: number; observaciones: string } | null;
  ack: {
    agreed: boolean;
    nombreFirma: string;
    firmaDataUrl: string;
    comentario: string;
    signedAt: string;
  } | null;
  status: keyof typeof ACK_LABELS;
  itemStats?: ItemStatsPayload;
};

export default function PublicTeacherReportPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<Review | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/public/review/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      });
  }, [token]);

  useAutoPrint(Boolean(data));

  if (!data && !error) return <Loading />;
  if (error) return <p className="p-8 text-red-700">{error}</p>;
  if (!data) return null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <InstitutionHeader title="Ficha individual del docente" />
      <PrintOnly />
      <div className="rounded-2xl bg-[#fffdf8] p-5 ring-1 ring-[#e6dcc8]">
        <p className="text-lg font-bold">{data.teacher.name}</p>
        <p className="text-sm">
          {data.teacher.school?.name} · {data.teacher.school?.cct}
        </p>
        <p className="text-sm text-[#5a6b5e]">
          {data.teacher.disciplina} · {data.teacher.turno}
        </p>
        <span className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold ${ACK_CLASS[data.status]}`}>
          {ACK_LABELS[data.status]}
        </span>
      </div>
      <section className="mt-4 rounded-2xl bg-[#fffdf8] p-5 ring-1 ring-[#e6dcc8]">
        <h2 className="font-semibold">Resumen de la evaluación</h2>
        {data.folder ? (
          <p className="mt-2 text-sm">
            Revisión de carpetas ({new Date(data.folder.date).toLocaleDateString("es-MX")}):{" "}
            <strong>{data.folder.pct}% Sí</strong>
            {data.folder.observaciones ? ` · ${data.folder.observaciones}` : ""}
          </p>
        ) : (
          <p className="mt-2 text-sm">Aún no hay revisión de carpetas.</p>
        )}
        {data.visit ? (
          <p className="mt-2 text-sm">
            Observación de clase ({new Date(data.visit.date).toLocaleDateString("es-MX")}):{" "}
            <strong>{data.visit.pct}% Sí</strong>
            {data.visit.observaciones ? ` · ${data.visit.observaciones}` : ""}
          </p>
        ) : (
          <p className="mt-2 text-sm">Aún no hay observación de clase.</p>
        )}
      </section>
      {data.itemStats && <ItemStatsPanel stats={data.itemStats} />}
    </main>
  );
}
