import { NextRequest, NextResponse } from "next/server";
import { isSupervision } from "@/lib/roles";
import { getSettings, saveSettings } from "@/lib/store";
import { currentUser } from "@/lib/supabase/route";

export async function GET() {
  return NextResponse.json(await getSettings());
}

export async function PATCH(request: NextRequest) {
  const user = await currentUser();
  if (!isSupervision(user?.email)) {
    return NextResponse.json({ error: "Solo supervisión puede cerrar periodos" }, { status: 403 });
  }
  const body = await request.json();
  const closedPeriods = Array.isArray(body.closedPeriods) ? body.closedPeriods : [];
  return NextResponse.json(
    await saveSettings({ closedPeriods, updatedAt: new Date().toISOString() }, user?.email)
  );
}
