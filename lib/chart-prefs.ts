export type ChartKind = "bars" | "table" | "pie" | "points";

export const CHART_KIND_LABELS: Record<ChartKind, string> = {
  bars: "Barras",
  table: "Tabla",
  pie: "Pastel",
  points: "Puntos",
};

const KEY = "zona-chart-prefs";

export type ChartPrefs = {
  defaultKind: ChartKind;
  byId: Record<string, ChartKind>;
};

export function emptyChartPrefs(): ChartPrefs {
  return { defaultKind: "bars", byId: {} };
}

export function loadChartPrefs(): ChartPrefs {
  if (typeof window === "undefined") return emptyChartPrefs();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyChartPrefs();
    const parsed = JSON.parse(raw) as ChartPrefs;
    return {
      defaultKind: parsed.defaultKind ?? "bars",
      byId: parsed.byId ?? {},
    };
  } catch {
    return emptyChartPrefs();
  }
}

export function saveChartPrefs(prefs: ChartPrefs) {
  localStorage.setItem(KEY, JSON.stringify(prefs));
  window.dispatchEvent(new Event("zona-charts"));
}

export function kindFor(prefs: ChartPrefs, id: string): ChartKind {
  return prefs.byId[id] ?? prefs.defaultKind;
}

export function isChartKind(v: unknown): v is ChartKind {
  return v === "bars" || v === "table" || v === "pie" || v === "points";
}
