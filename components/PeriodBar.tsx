"use client";

import { useEffect, useState } from "react";
import { periodLabel, type Period } from "@/lib/periods";

export function getStoredPeriod(): Period | "all" {
  if (typeof window === "undefined") return "all";
  const v = localStorage.getItem("zona-period");
  return v === "1" || v === "2" || v === "3" ? v : "all";
}

export function PeriodBar() {
  const [period, setPeriod] = useState<Period | "all">("all");
  const [closed, setClosed] = useState<string[]>([]);
  const [role, setRole] = useState("atp");

  useEffect(() => {
    setPeriod(getStoredPeriod());
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setClosed(d.closedPeriods ?? []));
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setRole(d.role));
  }, []);

  function pick(p: Period | "all") {
    setPeriod(p);
    localStorage.setItem("zona-period", p);
    window.dispatchEvent(new Event("zona-period"));
  }

  async function toggleClose(p: Period) {
    const next = closed.includes(p) ? closed.filter((x) => x !== p) : [...closed, p];
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ closedPeriods: next }),
    });
    if (res.ok) setClosed(next);
  }

  return (
    <div className="no-print border-b border-[#d9c9a3] bg-[#fffdf8] px-4 py-2">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 text-sm">
        <span className="font-medium text-[#6a0938]">Periodo:</span>
        {(["all", "1", "2", "3"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => pick(p)}
            className={`cursor-pointer rounded-full px-3 py-1 ${
              period === p ? "bg-[#6a0938] text-white" : "bg-[#e8e0d0] text-[#6a0938]"
            }`}
          >
            {periodLabel(p)}
            {p !== "all" && closed.includes(p) ? " · cerrado" : ""}
          </button>
        ))}
        {role === "supervision" &&
          (["1", "2", "3"] as const).map((p) => (
            <button
              key={`c-${p}`}
              type="button"
              onClick={() => toggleClose(p)}
              className="cursor-pointer text-xs text-[#5a6b5e] underline"
            >
              {closed.includes(p) ? `Reabrir P${p}` : `Cerrar P${p}`}
            </button>
          ))}
      </div>
    </div>
  );
}
