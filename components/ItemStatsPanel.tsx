"use client";

import { useEffect, useState } from "react";
import { ItemChart } from "@/components/ItemChart";
import {
  CHART_KIND_LABELS,
  kindFor,
  loadChartPrefs,
  saveChartPrefs,
  type ChartKind,
  type ChartPrefs,
} from "@/lib/chart-prefs";
import type { ChartCard } from "@/lib/item-stats";

export type ItemStatsPayload = {
  folderReviews: number;
  classVisits: number;
  empty?: boolean;
  carpetas: ChartCard[];
  acompanamiento: ChartCard[];
  textos: ChartCard[];
};

function ChartList({
  cards,
  prefs,
  onKind,
}: {
  cards: ChartCard[];
  prefs: ChartPrefs;
  onKind: (id: string, kind: ChartKind) => void;
}) {
  return (
    <div className="space-y-3">
      {cards.map((c) => (
        <ItemChart key={c.id} card={c} kind={kindFor(prefs, c.id)} onKind={c.kind === "text" ? undefined : onKind} />
      ))}
    </div>
  );
}

export function ItemStatsPanel({
  stats,
  fetchUrl,
  emptyLabel = "Aún no hay revisiones en este alcance.",
}: {
  stats?: ItemStatsPayload | null;
  fetchUrl?: string;
  emptyLabel?: string;
}) {
  const [tab, setTab] = useState<"carpetas" | "acompanamiento">("carpetas");
  const [data, setData] = useState<ItemStatsPayload | null>(stats ?? null);
  const [period, setPeriod] = useState("");
  const [prefs, setPrefs] = useState<ChartPrefs>({ defaultKind: "bars", byId: {} });

  useEffect(() => {
    const sync = () => {
      setPeriod(typeof window === "undefined" ? "" : localStorage.getItem("zona-period") || "all");
      setPrefs(loadChartPrefs());
    };
    sync();
    window.addEventListener("zona-period", sync);
    window.addEventListener("zona-charts", sync);
    return () => {
      window.removeEventListener("zona-period", sync);
      window.removeEventListener("zona-charts", sync);
    };
  }, []);

  useEffect(() => {
    if (stats) setData(stats);
  }, [stats]);

  useEffect(() => {
    if (!fetchUrl) return;
    const url = period && period !== "all" ? `${fetchUrl}${fetchUrl.includes("?") ? "&" : "?"}period=${period}` : fetchUrl;
    fetch(url)
      .then((r) => r.json())
      .then(setData);
  }, [fetchUrl, period]);

  function setDefault(kind: ChartKind) {
    saveChartPrefs({ defaultKind: kind, byId: {} });
  }

  function setOne(id: string, kind: ChartKind) {
    const next = loadChartPrefs();
    saveChartPrefs({ ...next, byId: { ...next.byId, [id]: kind } });
  }

  if (!data) return null;
  if (data.empty) {
    return <p className="mt-6 rounded-2xl bg-[#fffdf8] p-5 text-sm text-[#5a6b5e] ring-1 ring-[#e6dcc8]">{emptyLabel}</p>;
  }

  const carpetaTexts = (data.textos ?? []).filter((t) => t.id === "obsCarpeta");
  const visitaTexts = (data.textos ?? []).filter((t) => t.id !== "obsCarpeta");

  return (
    <section className="mt-6">
      <div className="no-print mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setTab("carpetas")}
          className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold ${
            tab === "carpetas" ? "bg-[#6a0938] text-white" : "bg-[#e8e0d0] text-[#6a0938]"
          }`}
        >
          Carpetas
        </button>
        <button
          type="button"
          onClick={() => setTab("acompanamiento")}
          className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold ${
            tab === "acompanamiento" ? "bg-[#6a0938] text-white" : "bg-[#e8e0d0] text-[#6a0938]"
          }`}
        >
          Acompañamiento
        </button>
        <label className="ml-auto text-sm">
          Todas las gráficas{" "}
          <select
            className="cursor-pointer rounded-lg border border-[#d9c9a3] px-2 py-1"
            value={prefs.defaultKind}
            onChange={(e) => setDefault(e.target.value as ChartKind)}
          >
            {(Object.keys(CHART_KIND_LABELS) as ChartKind[]).map((k) => (
              <option key={k} value={k}>
                {CHART_KIND_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="no-print mb-3 text-xs text-[#5a6b5e]">
        Puede cambiar todas a la vez o el tipo de cada reactivo. El PDF y WhatsApp usarán esta vista.
      </p>
      <div className={tab === "carpetas" ? "space-y-3 print-charts-all" : "hidden print-charts-all"}>
        <h3 className="mb-3 hidden font-bold print-heading">Carpetas</h3>
        <ChartList cards={[...data.carpetas, ...carpetaTexts]} prefs={prefs} onKind={setOne} />
      </div>
      <div className={tab === "acompanamiento" ? "space-y-3 print-charts-all" : "hidden print-charts-all"}>
        <h3 className="mb-3 hidden font-bold print-heading">Acompañamiento</h3>
        <ChartList cards={[...data.acompanamiento, ...visitaTexts]} prefs={prefs} onKind={setOne} />
      </div>
    </section>
  );
}
