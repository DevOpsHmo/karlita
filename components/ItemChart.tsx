"use client";

import type { ChartBar, ChartCard } from "@/lib/item-stats";
import { CHART_KIND_LABELS, type ChartKind } from "@/lib/chart-prefs";
import { Select } from "@/components/Select";

const HEX: Record<NonNullable<ChartBar["color"]>, string> = {
  yes: "#6a0938",
  no: "#b4533a",
  gold: "#c4a35a",
  green: "#6a0938",
};

const COLORS: Record<NonNullable<ChartBar["color"]>, string> = {
  yes: "bg-[#6a0938]",
  no: "bg-[#b4533a]",
  gold: "bg-[#c4a35a]",
  green: "bg-[#6a0938]",
};

function Row({ bar, total }: { bar: ChartBar; total: number }) {
  const pct = total ? Math.round((bar.count / total) * 100) : 0;
  return (
    <div className="mb-2">
      <div className="mb-0.5 flex justify-between text-sm">
        <span>{bar.label}</span>
        <span className="font-semibold">
          {bar.count} · {pct}%
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-[#e8e0d0]">
        <div
          className={`h-full rounded-full ${COLORS[bar.color ?? "green"]}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}

function TableView({ bars }: { bars: ChartBar[] }) {
  const total = bars.reduce((a, b) => a + b.count, 0) || 1;
  return (
    <table className="mb-2 w-full text-sm">
      <thead>
        <tr className="border-b border-[#e6dcc8] text-left">
          <th className="py-1">Opción</th>
          <th className="py-1">Conteo</th>
          <th className="py-1">%</th>
        </tr>
      </thead>
      <tbody>
        {bars.map((b) => (
          <tr key={b.label} className="border-b border-[#f0e6d4]">
            <td className="py-1">{b.label}</td>
            <td>{b.count}</td>
            <td>{Math.round((b.count / total) * 100)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PieView({ bars }: { bars: ChartBar[] }) {
  const total = bars.reduce((a, b) => a + b.count, 0);
  if (!total) return <p className="text-sm text-[#5a6b5e]">Sin datos.</p>;
  let acc = 0;
  const stops = bars.map((b) => {
    const start = acc;
    acc += (b.count / total) * 100;
    return `${HEX[b.color ?? "green"]} ${start}% ${acc}%`;
  });
  return (
    <div className="mb-3 flex flex-wrap items-center gap-4">
      <div
        className="h-28 w-28 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${stops.join(", ")})` }}
      />
      <ul className="text-sm">
        {bars.map((b) => (
          <li key={b.label} className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: HEX[b.color ?? "green"] }} />
            {b.label}: {b.count} · {Math.round((b.count / total) * 100)}%
          </li>
        ))}
      </ul>
    </div>
  );
}

function Block({ bars, kind, title }: { bars: ChartBar[]; kind: ChartKind; title?: string }) {
  return (
    <div className="mb-3 print-keep">
      {title && <p className="mb-1 text-sm font-medium text-[#6a0938]">{title}</p>}
      {kind === "table" && <TableView bars={bars} />}
      {kind === "pie" && <PieView bars={bars} />}
      {kind === "bars" &&
        bars.map((bar) => <Row key={bar.label} bar={bar} total={bars.reduce((a, b) => a + b.count, 0)} />)}
    </div>
  );
}

export function ItemChart({
  card,
  kind = "bars",
  onKind,
}: {
  card: ChartCard;
  kind?: ChartKind;
  onKind?: (id: string, kind: ChartKind) => void;
}) {
  if (card.kind === "text") {
    return (
      <article className="item-chart rounded-2xl bg-[#fffdf8] p-4 ring-1 ring-[#e6dcc8]">
        <h4 className="font-semibold">{card.title}</h4>
        <p className="mb-2 text-xs text-[#5a6b5e]">{card.responses} respuestas de texto</p>
        {card.texts?.length ? (
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {card.texts.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#5a6b5e]">Sin respuestas aún.</p>
        )}
      </article>
    );
  }

  return (
    <article className="item-chart rounded-2xl bg-[#fffdf8] p-4 ring-1 ring-[#e6dcc8]">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold">{card.title}</h4>
          <p className="text-xs text-[#5a6b5e]">
            {card.responses} respuestas
            {card.dates?.length
              ? ` · ${card.dates.map((d) => new Date(d + "T12:00:00").toLocaleDateString("es-MX")).join(", ")}`
              : ""}
          </p>
        </div>
        {onKind && (
          <label className="no-print w-36 text-xs">
            Gráfica
            <Select
              className="mt-1"
              value={kind}
              onChange={(v) => onKind(card.id, v as ChartKind)}
              options={(Object.keys(CHART_KIND_LABELS) as ChartKind[]).map((k) => ({
                value: k,
                label: CHART_KIND_LABELS[k],
              }))}
            />
          </label>
        )}
      </div>
      {card.groups?.map((g) => (
        <Block key={g.name} bars={g.bars} kind={kind} title={g.name} />
      ))}
      {card.bars && <Block bars={card.bars} kind={kind} />}
      {!!card.schoolBreakdown?.length && (
        <div className="mt-3 border-t border-[#e6dcc8] pt-3">
          <p className="mb-2 text-xs font-semibold text-[#6a0938]">Por escuela</p>
          {card.schoolBreakdown.map((s) => (
            <Block key={s.name} bars={s.bars} kind={kind} title={s.name} />
          ))}
        </div>
      )}
      {!!card.texts?.length && (
        <div className="mt-3 border-t border-[#e6dcc8] pt-3">
          <p className="mb-1 text-xs font-semibold text-[#6a0938]">Notas y observaciones</p>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {card.texts.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
