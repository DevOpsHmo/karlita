import type { ChartBar, ChartCard } from "@/lib/item-stats";

const COLORS: Record<NonNullable<ChartBar["color"]>, string> = {
  yes: "bg-[#1b5e3b]",
  no: "bg-[#b4533a]",
  gold: "bg-[#c4a35a]",
  green: "bg-[#2d6a4f]",
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

export function ItemChart({ card }: { card: ChartCard }) {
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
      <h4 className="font-semibold">{card.title}</h4>
      <p className="mb-3 text-xs text-[#5a6b5e]">{card.responses} respuestas</p>
      {card.groups?.map((g) => {
        const total = g.bars.reduce((a, b) => a + b.count, 0);
        return (
          <div key={g.name} className="mb-3">
            <p className="mb-1 text-sm font-medium text-[#123f28]">{g.name}</p>
            {g.bars.map((bar) => (
              <Row key={bar.label} bar={bar} total={total} />
            ))}
          </div>
        );
      })}
      {card.bars &&
        (() => {
          const total = card.bars.reduce((a, b) => a + b.count, 0);
          return card.bars.map((bar) => <Row key={bar.label} bar={bar} total={total} />);
        })()}
    </article>
  );
}
