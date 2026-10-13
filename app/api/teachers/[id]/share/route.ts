import { NextRequest, NextResponse } from "next/server";
import { prefsFromBody } from "@/lib/read-chart-prefs";
import { shareBundle } from "@/lib/share-payload";
import { ensureShareToken } from "@/lib/store";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const teacher = await ensureShareToken(id);
  if (!teacher) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(
    await shareBundle({
      path: `/r/maestro/${teacher.shareToken}`,
      title: `Ficha · ${teacher.name}`,
      subtitle: `${teacher.school?.shortName ?? ""} · ${teacher.disciplina}`,
      teacherId: teacher.id,
      extra: { token: teacher.shareToken, teacherId: teacher.id },
      chartPrefs: prefsFromBody(body),
    })
  );
}
