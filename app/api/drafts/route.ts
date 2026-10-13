import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/supabase/route";
import { deleteDraft, getDraft, saveDraft } from "@/lib/store";

export async function GET(request: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const kind = request.nextUrl.searchParams.get("kind") || "folder";
  const teacherId = request.nextUrl.searchParams.get("teacherId") || "";
  const draft = await getDraft(user.id, kind, teacherId || undefined);
  return NextResponse.json(draft);
}

export async function PUT(request: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await request.json();
  const kind = String(body.kind || "folder");
  const teacherId = String(body.teacherId ?? "");
  if (!teacherId) return NextResponse.json({ error: "Falta maestro" }, { status: 400 });
  const draft = await saveDraft(user.id, kind, {
    schoolId: String(body.schoolId ?? ""),
    teacherId,
    payload: body.payload ?? {},
  });
  return NextResponse.json(draft);
}

export async function DELETE(request: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const kind = request.nextUrl.searchParams.get("kind") || "folder";
  const teacherId = request.nextUrl.searchParams.get("teacherId") || undefined;
  await deleteDraft(user.id, kind, teacherId);
  return NextResponse.json({ ok: true });
}
