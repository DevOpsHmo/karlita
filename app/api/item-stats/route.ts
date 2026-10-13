import { NextRequest, NextResponse } from "next/server";
import { computeItemStats } from "@/lib/item-stats";

export async function GET(request: NextRequest) {
  const scope = request.nextUrl.searchParams.get("scope") ?? "zona";
  const id = request.nextUrl.searchParams.get("id");
  if (scope === "maestro") {
    if (!id) return NextResponse.json({ error: "Falta id del maestro" }, { status: 400 });
    return NextResponse.json(await computeItemStats({ teacherId: id }));
  }
  if (scope === "escuela") {
    if (!id) return NextResponse.json({ error: "Falta id de la escuela" }, { status: 400 });
    return NextResponse.json(await computeItemStats({ schoolId: id }));
  }
  return NextResponse.json(await computeItemStats({}));
}
