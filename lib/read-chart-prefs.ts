import { emptyChartPrefs, isChartKind, type ChartPrefs } from "./chart-prefs";

export function prefsFromBody(body: unknown): ChartPrefs {
  const b = (body ?? {}) as { chartPrefs?: ChartPrefs };
  const p = b.chartPrefs;
  if (!p) return emptyChartPrefs();
  return {
    defaultKind: isChartKind(p.defaultKind) ? p.defaultKind : "bars",
    byId: Object.fromEntries(
      Object.entries(p.byId ?? {}).filter(([, v]) => isChartKind(v))
    ) as ChartPrefs["byId"],
  };
}
