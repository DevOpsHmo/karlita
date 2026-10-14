import { NextRequest, NextResponse } from "next/server";
import { deleteClassVisit, getClassVisit, saveClassVisit } from "@/lib/store";
import { currentUser } from "@/lib/supabase/route";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getClassVisit(id);
  if (!row) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const current = await getClassVisit(id);
  if (!current) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const payload = body.payload ?? {};
  if (!String(payload.firmaDataUrl ?? "").startsWith("data:image")) {
    return NextResponse.json({ error: "Firme la observación antes de guardar." }, { status: 400 });
  }
  const row = await saveClassVisit(String(body.teacherId ?? current.teacherId), payload, id);
  return NextResponse.json(row);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const current = await getClassVisit(id);
  if (!current) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  await deleteClassVisit(id, user.email);
  return NextResponse.json({ ok: true });
}
