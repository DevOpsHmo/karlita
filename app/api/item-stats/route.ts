import { NextRequest, NextResponse } from "next/server";
import { computeItemStats } from "@/lib/item-stats";
import type { Period } from "@/lib/periods";

export async function GET(request: NextRequest) {
  const scope = request.nextUrl.searchParams.get("scope") ?? "zona";
  const id = request.nextUrl.searchParams.get("id");
  const p = request.nextUrl.searchParams.get("period");
  const period = p === "1" || p === "2" || p === "3" ? (p as Period) : null;
  if (scope === "maestro") {
    if (!id) return NextResponse.json({ error: "Falta id del maestro" }, { status: 400 });
    return NextResponse.json(await computeItemStats({ teacherId: id, period }));
  }
  if (scope === "escuela") {
    if (!id) return NextResponse.json({ error: "Falta id de la escuela" }, { status: 400 });
    return NextResponse.json(await computeItemStats({ schoolId: id, period }));
  }
  return NextResponse.json(await computeItemStats({ period }));
}
