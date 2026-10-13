export type ChartKind = "bars" | "table" | "pie";

export const CHART_KIND_LABELS: Record<ChartKind, string> = {
  bars: "Barras",
  table: "Tabla",
  pie: "Pastel",
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
    const def = isChartKind(parsed.defaultKind) ? parsed.defaultKind : "bars";
    const byId: Record<string, ChartKind> = {};
    for (const [id, k] of Object.entries(parsed.byId ?? {})) {
      if (isChartKind(k)) byId[id] = k;
    }
    return { defaultKind: def, byId };
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
  return v === "bars" || v === "table" || v === "pie";
}
