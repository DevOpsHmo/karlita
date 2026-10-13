export type Period = "1" | "2" | "3";

export function visitPeriodFromDate(fecha?: string): Period | "" {
  if (!fecha) return "";
  const m = new Date(`${fecha}T12:00:00`).getMonth() + 1;
  if (m >= 8 && m <= 11) return "1";
  if (m === 12 || m <= 3) return "2";
  return "3";
}

export function periodLabel(p: Period | "" | "all") {
  if (p === "1") return "Periodo 1";
  if (p === "2") return "Periodo 2";
  if (p === "3") return "Periodo 3";
  return "Todos los periodos";
}
