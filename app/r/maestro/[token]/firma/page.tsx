"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { InstitutionHeader } from "@/components/InstitutionHeader";
import { SignaturePad } from "@/components/SignaturePad";
import { ACK_CLASS, ACK_LABELS } from "@/lib/ack-labels";
import { Loading } from "@/components/Loading";
import { YesNo } from "@/components/YesNo";

type Review = {
  teacher: { name: string; disciplina: string; turno: string; school?: { name: string; cct: string } };
  ack: {
    agreed: boolean;
    nombreFirma: string;
    firmaDataUrl: string;
    comentario: string;
    signedAt: string;
  } | null;
  status: keyof typeof ACK_LABELS;
};

export default function PublicTeacherSignPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<Review | null>(null);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState<"si" | "no" | "">("");
  const [comentario, setComentario] = useState("");
  const [firma, setFirma] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/public/review/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      });
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch(`/api/public/review/${token}/ack`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agreed: agreed === "si",
        nombreFirma: data?.teacher.name ?? "",
        firmaDataUrl: firma,
        comentario,
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(json.error || "No se pudo guardar la firma.");
      return;
    }
    setDone(true);
    load();
  }

  if (!data && !error) return <Loading />;
  if (error && !data) return <p className="p-8 text-red-700">{error}</p>;
  if (!data) return null;

  const alreadyOk = data.status === "de_acuerdo" || data.status === "en_desacuerdo";

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <InstitutionHeader title="Constancia de enterado" />
      <p className="mb-3 text-center text-sm text-[#5a6b5e]">
        Indique si está de acuerdo con su evaluación (Sí o No) y firme.
      </p>
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

      {alreadyOk && data.ack && (
        <section className="mt-4 rounded-2xl bg-[#fffdf8] p-5 ring-1 ring-[#e6dcc8]">
          <p className="text-sm">
            Firmó el {new Date(data.ack.signedAt).toLocaleString("es-MX")}:{" "}
            {data.ack.agreed ? "Sí estoy de acuerdo" : "No estoy de acuerdo"}
          </p>
          {data.ack.comentario && <p className="mt-2 text-sm">{data.ack.comentario}</p>}
          {data.ack.firmaDataUrl && (
            <img src={data.ack.firmaDataUrl} alt="Firma" className="mt-3 max-h-24 rounded border border-[#e6dcc8]" />
          )}
        </section>
      )}

      {(!alreadyOk || data.status === "nueva_revision") && !done && (
        <form onSubmit={submit} className="mt-4 space-y-3 rounded-2xl bg-[#fffdf8] p-5 ring-1 ring-[#e6dcc8]">
          <p className="font-semibold">¿Está de acuerdo con la información proporcionada?</p>
          <YesNo name="acuerdo" value={agreed} onChange={setAgreed} />
          {agreed === "no" && (
            <label className="block text-sm">
              Motivo
              <textarea
                className="mt-1 w-full rounded-lg border border-[#d9c9a3] px-3 py-2"
                rows={3}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                required
              />
            </label>
          )}
          <div>
            <p className="mb-1 text-sm">Firme con el dedo o el mouse</p>
            <SignaturePad onChange={setFirma} />
          </div>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={saving || !agreed || !firma}
            className="cursor-pointer rounded-xl bg-[#6a0938] px-6 py-2.5 font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Enviando…" : "Enviar acuerdo y firma"}
          </button>
        </form>
      )}

      {done && (
        <p className="mt-4 rounded-xl bg-[#eef6ef] p-4 text-sm text-[#6a0938]">
          Gracias. Su respuesta quedó registrada para la supervisión de zona.
        </p>
      )}
    </main>
  );
}
