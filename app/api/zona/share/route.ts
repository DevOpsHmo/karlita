import { NextRequest, NextResponse } from "next/server";
import { prefsFromBody } from "@/lib/read-chart-prefs";
import { shareBundle } from "@/lib/share-payload";
import { ensureZonaShareToken } from "@/lib/store";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const token = await ensureZonaShareToken();
  return NextResponse.json(
    await shareBundle({
      path: `/r/zona/${token}`,
      title: "Resultados grupales de zona",
      subtitle: "EST 6, 60 y 72",
      chartPrefs: prefsFromBody(body),
    })
  );
}
