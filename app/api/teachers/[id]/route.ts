import { NextRequest, NextResponse } from "next/server";
import { deleteTeacher, getTeacher, updateTeacher } from "@/lib/store";
import { currentUser } from "@/lib/supabase/route";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const teacher = await getTeacher(id);
  if (!teacher) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(teacher);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const teacher = await updateTeacher(id, {
    name: body.name !== undefined ? String(body.name).trim() : undefined,
    disciplina: body.disciplina !== undefined ? String(body.disciplina).trim() : undefined,
    turno: body.turno !== undefined ? String(body.turno) : undefined,
    schoolId: body.schoolId !== undefined ? String(body.schoolId) : undefined,
  });
  if (!teacher) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(teacher);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  await deleteTeacher(id, user.email);
  return NextResponse.json({ ok: true });
}
