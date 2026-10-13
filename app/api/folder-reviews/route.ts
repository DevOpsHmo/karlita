import { NextRequest, NextResponse } from "next/server";
import { getSettings, listFolderReviews, saveFolderReview } from "@/lib/store";
import { currentUser } from "@/lib/supabase/route";

export async function GET(request: NextRequest) {
  const teacherId = request.nextUrl.searchParams.get("teacherId");
  const schoolId = request.nextUrl.searchParams.get("schoolId");
  return NextResponse.json(await listFolderReviews({ teacherId, schoolId }));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const teacherId = String(body.teacherId);
  const user = await currentUser();
  const existing = await listFolderReviews({ teacherId });
  if (existing.length && !body.confirmNew) {
    return NextResponse.json(
      {
        error: "Ya hay una revisión de carpeta de este maestro. Confirme para crear otra o edite la última.",
        existing: true,
        lastId: existing[0].id,
      },
      { status: 409 }
    );
  }
  const settings = await getSettings();
  if (settings.closedPeriods.length === 3) {
    return NextResponse.json({ error: "Los tres periodos están cerrados." }, { status: 403 });
  }
  try {
    const row = await saveFolderReview(teacherId, body.payload ?? {}, undefined, { actor: user?.email });
    return NextResponse.json(row);
  } catch (e) {
    if ((e as Error).message === "CONFLICT") {
      return NextResponse.json({ error: "Otro usuario actualizó este registro. Recargue e intente de nuevo." }, { status: 409 });
    }
    throw e;
  }
}
