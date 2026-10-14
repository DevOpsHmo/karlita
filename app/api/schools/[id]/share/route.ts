import { NextRequest, NextResponse } from "next/server";
import { prefsFromBody } from "@/lib/read-chart-prefs";
import { shareBundle } from "@/lib/share-payload";
import { ensureSchoolShareToken } from "@/lib/store";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const school = await ensureSchoolShareToken(id);
  if (!school?.shareToken) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(
    await shareBundle({
      path: `/r/escuela/${school.shareToken}`,
      title: `Resultados · ${school.shortName}`,
      subtitle: school.cct,
      schoolId: id,
      extra: { pdfName: `Resultados ${school.shortName}.pdf` },
      chartPrefs: prefsFromBody(body),
    })
  );
}
