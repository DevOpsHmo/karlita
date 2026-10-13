export function Bar({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-semibold">{pct}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-[#e8e0d0]">
        <div className="h-full rounded-full bg-[#6a0938]" style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}
