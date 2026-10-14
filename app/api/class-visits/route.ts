import { NextRequest, NextResponse } from "next/server";
import { visitPeriodFromDate } from "@/lib/periods";
import { getSettings, saveClassVisit } from "@/lib/store";
import { currentUser } from "@/lib/supabase/route";
import type { VisitPayload } from "@/lib/visit-form";

export async function GET(request: NextRequest) {
  const teacherId = request.nextUrl.searchParams.get("teacherId");
  const schoolId = request.nextUrl.searchParams.get("schoolId");
  const { listClassVisits } = await import("@/lib/store");
  return NextResponse.json(await listClassVisits({ teacherId, schoolId }));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const user = await currentUser();
  const payload = (body.payload ?? {}) as VisitPayload;
  if (!String(payload.firmaDataUrl ?? "").startsWith("data:image")) {
    return NextResponse.json({ error: "Firme la observación antes de guardar." }, { status: 400 });
  }
  const period = visitPeriodFromDate(payload.fecha);
  const settings = await getSettings();
  if (period && settings.closedPeriods.includes(period)) {
    return NextResponse.json({ error: `El periodo ${period} está cerrado. No se pueden capturar visitas.` }, { status: 403 });
  }
  const row = await saveClassVisit(String(body.teacherId), payload, undefined, { actor: user?.email });
  return NextResponse.json(row);
}
