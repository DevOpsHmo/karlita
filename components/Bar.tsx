export function maestrosEvaluados(n: number) {
  return n === 1 ? "1 maestro evaluado" : `${n} maestros evaluados`;
}

export function Bar({ label, pct, value }: { label: string; pct: number; value?: string }) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between gap-3 text-sm">
        <span>{label}</span>
        <span className="shrink-0 font-semibold">{value ?? `${pct}%`}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-[#e8e0d0]">
        <div className="h-full rounded-full bg-[#6a0938]" style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}
