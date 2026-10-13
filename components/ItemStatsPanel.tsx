"use client";

import { useEffect, useState } from "react";
import { ItemChart } from "@/components/ItemChart";
import type { ChartCard } from "@/lib/item-stats";

export type ItemStatsPayload = {
  folderReviews: number;
  classVisits: number;
  carpetas: ChartCard[];
  acompanamiento: ChartCard[];
  textos: ChartCard[];
};

function ChartList({ cards }: { cards: ChartCard[] }) {
  return (
    <div className="space-y-3">
      {cards.map((c) => (
        <ItemChart key={c.id} card={c} />
      ))}
    </div>
  );
}

export function ItemStatsPanel({
  stats,
  fetchUrl,
}: {
  stats?: ItemStatsPayload | null;
  fetchUrl?: string;
}) {
  const [tab, setTab] = useState<"carpetas" | "acompanamiento">("carpetas");
  const [data, setData] = useState<ItemStatsPayload | null>(stats ?? null);

  useEffect(() => {
    if (stats) setData(stats);
  }, [stats]);

  useEffect(() => {
    if (!fetchUrl) return;
    fetch(fetchUrl)
      .then((r) => r.json())
      .then(setData);
  }, [fetchUrl]);

  if (!data) return null;

  const carpetaTexts = data.textos.filter((t) => t.id === "obsCarpeta");
  const visitaTexts = data.textos.filter((t) => t.id !== "obsCarpeta");

  return (
    <section className="mt-6">
      <div className="no-print mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("carpetas")}
          className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold ${
            tab === "carpetas" ? "bg-[#1b5e3b] text-white" : "bg-[#e8e0d0] text-[#123f28]"
          }`}
        >
          Carpetas
        </button>
        <button
          type="button"
          onClick={() => setTab("acompanamiento")}
          className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold ${
            tab === "acompanamiento" ? "bg-[#1b5e3b] text-white" : "bg-[#e8e0d0] text-[#123f28]"
          }`}
        >
          Acompañamiento
        </button>
      </div>
      <div className={tab === "carpetas" ? "space-y-3 print-charts-all" : "hidden print-charts-all"}>
        <h3 className="mb-3 hidden font-bold print-heading">Carpetas</h3>
        <ChartList cards={[...data.carpetas, ...carpetaTexts]} />
      </div>
      <div className={tab === "acompanamiento" ? "space-y-3 print-charts-all" : "hidden print-charts-all"}>
        <h3 className="mb-3 hidden font-bold print-heading">Acompañamiento</h3>
        <ChartList cards={[...data.acompanamiento, ...visitaTexts]} />
      </div>
    </section>
  );
}
