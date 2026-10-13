import { NextRequest, NextResponse } from "next/server";
import { computeItemStats } from "@/lib/item-stats";
import type { Period } from "@/lib/periods";

export async function GET(request: NextRequest) {
  const scope = request.nextUrl.searchParams.get("scope") ?? "zona";
  const id = request.nextUrl.searchParams.get("id");
  const period = (request.nextUrl.searchParams.get("period") as Period | null) || null;
  const stats = await computeItemStats({
    teacherId: scope === "maestro" ? id : undefined,
    schoolId: scope === "escuela" ? id : undefined,
    period,
  });
  const lines = ["seccion,reactivo,opcion,conteo,respuestas"];
  const dump = (seccion: string, cards: typeof stats.carpetas) => {
    for (const c of cards) {
      const rows = [...(c.groups?.flatMap((g) => g.bars.map((b) => [`${g.name} ${b.label}`, b.count])) ?? []), ...(c.bars?.map((b) => [b.label, b.count]) ?? [])];
      for (const [opt, count] of rows) {
        lines.push(`"${seccion}","${c.title.replace(/"/g, "'")}","${opt}",${count},${c.responses}`);
      }
    }
  };
  dump("Carpetas", stats.carpetas);
  dump("Acompanamiento", stats.acompanamiento);
  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=conteos-zona-x.csv",
    },
  });
}
